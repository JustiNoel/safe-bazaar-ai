import { useState } from "react";
import { Upload, Link as LinkIcon, Camera, AlertCircle, Loader2, Shield } from "lucide-react";
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
import ScanLimitModal from "@/components/ScanLimitModal";
import ScanningAnimation from "@/components/ScanningAnimation";
import ReferralCard from "@/components/ReferralCard";
import AIAssistant from "@/components/AIAssistant";
import LinkAnalysisResult from "@/components/LinkAnalysisResult";
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
  const [showScanLimitModal, setShowScanLimitModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [linkAnalysisData, setLinkAnalysisData] = useState<any>(null);
  const [scanMode, setScanMode] = useState<"product" | "link">("product");
  const [linkUrl, setLinkUrl] = useState("");
  const [scanStats, setScanStats] = useState({ scansUsed: 0, scanLimit: 3, nextResetTime: "12:00 AM EAT", isLimitReached: false });

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
    if (scanMode === "link") {
      await handleLinkAnalysis();
      return;
    }
    
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
        try {
          const errorData = JSON.parse(error.message);
          if (errorData.limitReached) {
            setScanStats({ scansUsed: errorData.scansUsed, scanLimit: errorData.scanLimit, nextResetTime: errorData.nextResetTime || "12:00 AM EAT", isLimitReached: true });
            setShowScanLimitModal(true);
            return;
          }
        } catch {
          if (error.message.includes("Scan limit reached")) {
            setScanStats(prev => ({ ...prev, isLimitReached: true }));
            setShowScanLimitModal(true);
            return;
          }
        }
        throw error;
      }

      setAssessmentData(data.assessment);
      setShowResults(true);
      toast.success("Analysis complete!");
      
      if (!data.isPremium && data.scansUsed !== null) {
        setScanStats({ scansUsed: data.scansUsed, scanLimit: data.scanLimit, nextResetTime: data.nextResetTime || "12:00 AM EAT", isLimitReached: data.scansRemaining === 0 });
        setShowScanLimitModal(true);
      }
      
      const score = data.assessment?.overall_score || 0;
      if (score >= 70) {
        setTimeout(() => { triggerConfetti(); triggerSuccess(); }, 300);
      }
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast.error(error.message || "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLinkAnalysis = async () => {
    if (!linkUrl) {
      toast.error("Please enter a URL to analyze");
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-link', {
        body: { url: linkUrl }
      });

      if (error) {
        if (error.message.includes("limit")) {
          setScanStats(prev => ({ ...prev, isLimitReached: true }));
          setShowScanLimitModal(true);
          return;
        }
        throw error;
      }

      setLinkAnalysisData(data.analysis);
      setShowResults(true);
      toast.success("Link analysis complete!");
      
      if (data.analysis.verdict === "safe") {
        setTimeout(() => { triggerConfetti(); triggerSuccess(); }, 300);
      }
    } catch (error: any) {
      console.error("Link analysis error:", error);
      toast.error(error.message || "Link analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetScan = () => {
    setImageUrl("");
    setProductUrl("");
    setLinkUrl("");
    setProductInfo({ name: "", vendor: "", price: "", platform: "" });
    setUploadedFile(null);
    setShowResults(false);
    setAssessmentData(null);
    setLinkAnalysisData(null);
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
                <h1 className="text-3xl md:text-4xl font-bold mb-4">Scan Products & Links</h1>
                <p className="text-lg text-muted-foreground">Upload product images, paste URLs, or analyze any link for scams and phishing</p>
                
                {/* Mode Toggle */}
                <div className="flex justify-center gap-2 mt-6">
                  <Button variant={scanMode === "product" ? "default" : "outline"} onClick={() => setScanMode("product")}>
                    <Camera className="w-4 h-4 mr-2" />Product Scan
                  </Button>
                  <Button variant={scanMode === "link" ? "default" : "outline"} onClick={() => setScanMode("link")}>
                    <Shield className="w-4 h-4 mr-2" />Link Analysis
                  </Button>
                </div>
                
                {!isAuthenticated && (
                  <Alert className="mt-4 max-w-2xl mx-auto">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Guest mode: Basic scan only. <button onClick={() => navigate('/auth')} className="underline font-medium">Sign up</button> for full reports!
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {scanMode === "link" ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <Card className="p-6 md:p-8 shadow-medium">
                      <div className="space-y-6">
                        <div className="text-center">
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-8 h-8 text-primary" />
                          </div>
                          <h2 className="text-xl font-semibold mb-2">Link Safety Scanner</h2>
                          <p className="text-muted-foreground text-sm">Paste any URL to check for phishing, scams, and malicious content</p>
                        </div>
                        <div>
                          <Label htmlFor="link-url" className="mb-2 block">Enter URL to analyze</Label>
                          <Input id="link-url" type="url" placeholder="https://example.com/suspicious-link..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="text-base" />
                        </div>
                        <Button onClick={handleAnalyze} disabled={isAnalyzing || !linkUrl} className="w-full" size="lg">
                          {isAnalyzing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Analyzing Link...</> : "Analyze Link Safety"}
                        </Button>
                      </div>
                    </Card>
                  </div>
                  {isAuthenticated && <div className="lg:col-span-1"><ReferralCard /></div>}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
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

                  {isAuthenticated && (
                    <div className="lg:col-span-1">
                      <ReferralCard />
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <RiskAssessment onNewScan={resetScan} productImage={imageUrl} assessmentData={assessmentData} />
          )}
        </div>
      </main>

      <Footer />
      <PremiumUpgradeModal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
      <ScanLimitModal 
        open={showScanLimitModal} 
        onClose={() => setShowScanLimitModal(false)}
        scansUsed={scanStats.scansUsed}
        scansLimit={scanStats.scanLimit}
        nextResetTime={scanStats.nextResetTime}
        isLimitReached={scanStats.isLimitReached}
      />
      <AIAssistant />
    </div>
  );
};

export default Scan;
