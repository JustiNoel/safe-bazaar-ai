import { useState } from "react";
import { Upload, Link as LinkIcon, Camera, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RiskAssessment from "@/components/RiskAssessment";
import { toast } from "sonner";

const Scan = () => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [productUrl, setProductUrl] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

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
      toast.success("Image uploaded successfully");
    }
  };

  const handleAnalyze = () => {
    if (!imageUrl && !productUrl) {
      toast.error("Please upload an image or enter a product URL");
      return;
    }

    setIsAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResults(true);
      toast.success("Analysis complete!");
    }, 3000);
  };

  const resetScan = () => {
    setImageUrl("");
    setProductUrl("");
    setUploadedFile(null);
    setShowResults(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-muted/20 to-background">
      <Navigation />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {!showResults ? (
            <div className="animate-fade-in">
              {/* Header */}
              <div className="text-center mb-12">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  Scan Your Product
                </h1>
                <p className="text-lg text-muted-foreground">
                  Upload an image or paste a product URL to get instant AI-powered risk assessment
                </p>
              </div>

              {/* Scan Interface */}
              <Card className="p-6 md:p-8 shadow-medium">
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="upload">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </TabsTrigger>
                    <TabsTrigger value="url">
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Product URL
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="space-y-6">
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors">
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileUpload}
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Camera className="w-8 h-8 text-primary" />
                          </div>
                          <div>
                            <p className="text-lg font-medium mb-2">
                              Take a Photo or Upload Image
                            </p>
                            <p className="text-sm text-muted-foreground">
                              PNG, JPG up to 10MB
                            </p>
                          </div>
                        </div>
                      </label>
                    </div>

                    {imageUrl && (
                      <div className="relative rounded-lg overflow-hidden">
                        <img 
                          src={imageUrl} 
                          alt="Uploaded product" 
                          className="w-full h-64 object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={resetScan}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="url" className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="product-url">Product URL</Label>
                      <Input
                        id="product-url"
                        type="url"
                        placeholder="https://www.jumia.co.ke/product/..."
                        value={productUrl}
                        onChange={(e) => setProductUrl(e.target.value)}
                        className="h-12"
                      />
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Paste link from Jumia, Kilimall, or other Kenyan e-commerce sites
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                <Button
                  variant="hero"
                  size="xl"
                  className="w-full mt-6"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || (!imageUrl && !productUrl)}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      Analyzing with AI...
                    </>
                  ) : (
                    "Scan & Analyze Now"
                  )}
                </Button>
              </Card>

              {/* Info Cards */}
              <div className="grid md:grid-cols-3 gap-4 mt-8">
                <Card className="p-4 bg-success/10 border-success">
                  <p className="text-sm font-medium text-success">✓ Fast Analysis</p>
                  <p className="text-xs text-muted-foreground mt-1">Results in under 5 seconds</p>
                </Card>
                <Card className="p-4 bg-primary/10 border-primary">
                  <p className="text-sm font-medium text-primary">✓ Multi-Factor Check</p>
                  <p className="text-xs text-muted-foreground mt-1">4 risk factors analyzed</p>
                </Card>
                <Card className="p-4 bg-secondary/10 border-secondary">
                  <p className="text-sm font-medium text-secondary">✓ Safer Alternatives</p>
                  <p className="text-xs text-muted-foreground mt-1">Get verified recommendations</p>
                </Card>
              </div>
            </div>
          ) : (
            <RiskAssessment onNewScan={resetScan} productImage={imageUrl} />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Scan;
