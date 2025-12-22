import { useState } from "react";
import { Upload, Link as LinkIcon, Camera, AlertCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RiskAssessment from "@/components/RiskAssessment";
import PremiumUpgradeModal from "@/components/PremiumUpgradeModal";
import ScanningAnimation from "@/components/ScanningAnimation";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useConfetti } from "@/hooks/useConfetti";

const Scan = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { triggerConfetti, triggerSuccess } = useConfetti();
  const [imageUrl, setImageUrl] = useState<string>("");
  const [productUrl, setProductUrl] = useState<string>("");
  const [productInfo, setProductInfo] = useState({ name: "", vendor: "", price: "", platform: "" });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [assessmentData, setAssessmentData] = useState<any>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      toast.success("Image loaded successfully");
    }
  };

  const handleAnalyze = async () => {
    if (!imageUrl && !productUrl) {
      toast.error("Please upload an image or enter a product URL");
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('assess-risk', {
        body: { 
          imageUrl: imageUrl || productUrl, 
          productInfo: productInfo.name ? productInfo : undefined 
        }
      });

      if (error) {
        if (error.message.includes("Scan limit reached")) {
          setShowUpgradeModal(true);
          toast.error("Daily scan limit reached!");
          return;
        }
        throw error;
      }

      setAssessmentData(data.assessment);
      setShowResults(true);
      toast.success("Analysis complete!");
      
      // Trigger confetti for safe products
      const score = data.assessment?.overall_score || 0;
      const verdict = data.assessment?.verdict || (score >= 70 ? "safe" : score >= 40 ? "caution" : "unsafe");
      if (verdict === "safe") {
        setTimeout(() => {
          triggerConfetti();
          triggerSuccess();
        }, 300);
      }
      
      if (data.scansRemaining !== null && data.scansRemaining <= 2) {
        toast.warning(`Only ${data.scansRemaining} scans remaining today!`);
      }
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast.error(error.message || "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetScan = () => {
    setImageUrl("");
    setProductUrl("");
    setProductInfo({ name: "", vendor: "", price: "", platform: "" });
    setUploadedFile(null);
    setShowResults(false);
    setAssessmentData(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-muted/20 to-background">
      <ScanningAnimation isScanning={isAnalyzing} />
      <Navigation />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {!showResults ? (
            <div className="animate-fade-in">
              <div className="text-center mb-12">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">Scan Your Product</h1>
                <p className="text-lg text-muted-foreground">Upload an image or paste a product URL to get instant AI-powered risk assessment</p>
                {!isAuthenticated && (
                  <Alert className="mt-4 max-w-2xl mx-auto">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Guest mode: Basic scan only. <button onClick={() => navigate('/auth')} className="underline font-medium">Sign up</button> for full reports!
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Card className="p-6 md:p-8 shadow-medium">
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="upload"><Upload className="w-4 h-4 mr-2" />Upload Image</TabsTrigger>
                    <TabsTrigger value="url"><LinkIcon className="w-4 h-4 mr-2" />Product URL</TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="space-y-6">
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors">
                      <input type="file" id="file-upload" className="hidden" accept="image/*" capture="environment" onChange={handleFileUpload} />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Camera className="w-8 h-8 text-primary" />
                          </div>
                          <div><p className="text-lg font-medium">Take or upload a photo</p><p className="text-sm text-muted-foreground mt-1">Maximum file size: 10MB</p></div>
                        </div>
                      </label>
                    </div>
                    {imageUrl && <div className="rounded-lg overflow-hidden border border-border"><img src={imageUrl} alt="Preview" className="w-full h-64 object-cover" /></div>}
                    <div className="space-y-4">
                      <Label>Optional: Add Product Details</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input placeholder="Product Name" value={productInfo.name} onChange={(e) => setProductInfo({...productInfo, name: e.target.value})} />
                        <Input placeholder="Vendor Name" value={productInfo.vendor} onChange={(e) => setProductInfo({...productInfo, vendor: e.target.value})} />
                        <Input placeholder="Price (KSh)" type="number" value={productInfo.price} onChange={(e) => setProductInfo({...productInfo, price: e.target.value})} />
                        <Input placeholder="Platform" value={productInfo.platform} onChange={(e) => setProductInfo({...productInfo, platform: e.target.value})} />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="url" className="space-y-6">
                    <div><Label htmlFor="product-url" className="mb-2 block">Product URL from Jumia, Kilimall, or other marketplaces</Label>
                    <Input id="product-url" type="url" placeholder="https://www.jumia.co.ke/..." value={productUrl} onChange={(e) => setProductUrl(e.target.value)} /></div>
                  </TabsContent>
                </Tabs>

                <Button onClick={handleAnalyze} disabled={isAnalyzing || (!imageUrl && !productUrl)} className="w-full mt-6" size="lg">
                  {isAnalyzing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Analyzing with AI...</> : "Analyze Product"}
                </Button>
              </Card>
            </div>
          ) : (
            <RiskAssessment onNewScan={resetScan} productImage={imageUrl} assessmentData={assessmentData} />
          )}
        </div>
      </main>

      <Footer />
      <PremiumUpgradeModal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
};

export default Scan;
