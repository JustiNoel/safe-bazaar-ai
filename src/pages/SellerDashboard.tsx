import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, TrendingUp, Upload, CheckCircle, AlertCircle, Settings, Phone, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SellerProfileForm from "@/components/SellerProfileForm";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, refreshProfile } = useAuth();
  const [trustScore, setTrustScore] = useState(72);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Dialog states
  const [mpesaDialogOpen, setMpesaDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.profile?.role !== 'seller')) {
      toast.error("Access denied. Seller account required.");
      navigate('/');
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  // Calculate trust score from profile completeness
  useEffect(() => {
    if (user?.profile) {
      let score = 50; // Base score
      if (user.profile.seller_product_name) score += 10;
      if (user.profile.seller_product_image) score += 15;
      if (user.profile.seller_location) score += 10;
      if (user.profile.phone) score += 10;
      if (user.profile.seller_national_id) score += 5;
      setTrustScore(Math.min(score, 100));
    }
  }, [user?.profile]);

  const handleVerifyMpesa = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter your M-Pesa phone number");
      return;
    }
    
    setVerifying(true);
    try {
      // Simulate M-Pesa verification (in production, this would call an actual API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update profile with phone number
      const { error } = await supabase
        .from("profiles")
        .update({ phone: phoneNumber })
        .eq("user_id", user?.id);

      if (error) throw error;

      toast.success("M-Pesa verification initiated! Check your phone for confirmation.");
      setMpesaDialogOpen(false);
      setPhoneNumber("");
      await refreshProfile();
    } catch (error) {
      console.error("Error verifying M-Pesa:", error);
      toast.error("Failed to verify M-Pesa. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleUploadCertificate = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be less than 10MB");
      return;
    }

    setUploading(true);
    try {
      // Convert to base64 for storage (in production, use proper file storage)
      const reader = new FileReader();
      reader.onloadend = async () => {
        // For now, we'll just show success - in production this would upload to storage
        toast.success("Certificate uploaded successfully! Our team will review it within 24 hours.");
        setUploadDialogOpen(false);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading certificate:", error);
      toast.error("Failed to upload certificate. Please try again.");
      setUploading(false);
    }
  };

  const handleCompleteProfile = () => {
    setActiveTab("profile");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const recentProducts = [
    {
      name: "Samsung Galaxy A54",
      image: "/placeholder.svg",
      trust_score: 85,
      status: "Verified",
      uploaded: "2 days ago",
    },
    {
      name: "HP Laptop 15s",
      image: "/placeholder.svg",
      trust_score: 78,
      status: "Under Review",
      uploaded: "5 days ago",
    },
    {
      name: "Sony Headphones",
      image: "/placeholder.svg",
      trust_score: 92,
      status: "Verified",
      uploaded: "1 week ago",
    },
  ];

  const improvementTips = [
    {
      tip: "Add M-Pesa verified badge",
      impact: "+20% trust score",
      action: "Verify Now",
      onClick: () => setMpesaDialogOpen(true),
    },
    {
      tip: "Upload product certificates",
      impact: "+15% trust score",
      action: "Upload",
      onClick: () => setUploadDialogOpen(true),
    },
    {
      tip: "Complete vendor profile",
      impact: "+10% trust score",
      action: "Complete",
      onClick: handleCompleteProfile,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-muted/20 to-background">
      <Navigation />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="animate-fade-in space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  Seller Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Build trust with your customers
                </p>
              </div>
              {!user?.profile?.premium && (
                <Button className="bg-gradient-primary text-primary-foreground">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Premium Seller
                </Button>
              )}
            </div>

            {/* Trust Score Card */}
            <Card className="p-8 shadow-medium">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 rounded-full bg-success/20 flex items-center justify-center animate-pulse-glow">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-success">{trustScore}</div>
                      <div className="text-sm text-muted-foreground">/ 100</div>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <CheckCircle className="w-6 h-6 text-success inline-block" />
                    <div className="font-bold mt-2">Good Standing</div>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Your Trust Score</h3>
                    <p className="text-muted-foreground">
                      Customers trust vendors with higher scores. Keep improving your rating by following our recommendations.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">24</div>
                      <div className="text-sm text-muted-foreground">Total Products</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-success">156</div>
                      <div className="text-sm text-muted-foreground">Verified Sales</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-warning">4.6</div>
                      <div className="text-sm text-muted-foreground">Avg. Rating</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Tabs for Dashboard and Profile */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="dashboard">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="profile">
                  <Settings className="w-4 h-4 mr-2" />
                  Update Profile
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="space-y-8">
                {/* Recent Products */}
                <Card className="p-6 shadow-medium">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Recent Products</h2>
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload New Product
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recentProducts.map((product, index) => (
                      <Card key={index} className="p-4 hover:shadow-medium transition-shadow">
                        <div className="space-y-3">
                          <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                            <img src={product.image} alt={product.name} className="max-h-full max-w-full object-cover" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{product.name}</h3>
                            <p className="text-sm text-muted-foreground">{product.uploaded}</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Trust Score</span>
                              <span className="font-medium">{product.trust_score}/100</span>
                            </div>
                            <Progress value={product.trust_score} />
                          </div>
                          <div className="flex items-center gap-2">
                            {product.status === "Verified" ? (
                              <CheckCircle className="w-4 h-4 text-success" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-warning" />
                            )}
                            <span className="text-sm">{product.status}</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </Card>

                {/* Improvement Tips */}
                <Card className="p-6 shadow-medium">
                  <h2 className="text-2xl font-bold mb-6">
                    <TrendingUp className="inline-block w-6 h-6 mr-2 text-primary" />
                    Boost Your Trust Score
                  </h2>
                  <div className="space-y-4">
                    {improvementTips.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <div className="font-semibold">{item.tip}</div>
                          <div className="text-sm text-success">{item.impact}</div>
                        </div>
                        <Button variant="outline" size="sm" onClick={item.onClick}>
                          {item.action}
                        </Button>
                      </div>
                    ))}
                  </div>
                  {!user?.profile?.premium && (
                    <div className="mt-6 p-4 bg-gradient-primary rounded-lg text-primary-foreground">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold mb-1">Premium Seller: KES 500/month</div>
                          <div className="text-sm opacity-90">Get auto-optimizations, priority support & advanced analytics</div>
                        </div>
                        <Button variant="secondary" size="sm">
                          <Crown className="w-4 h-4 mr-2" />
                          Upgrade
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="profile">
                <SellerProfileForm />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* M-Pesa Verification Dialog */}
      <Dialog open={mpesaDialogOpen} onOpenChange={setMpesaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-success" />
              M-Pesa Verification
            </DialogTitle>
            <DialogDescription>
              Enter your M-Pesa registered phone number to verify your seller account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mpesa-phone">M-Pesa Phone Number</Label>
              <Input
                id="mpesa-phone"
                type="tel"
                placeholder="+254 7XX XXX XXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                We'll send a small verification amount that you'll need to confirm.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMpesaDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerifyMpesa} disabled={verifying}>
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Now"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Certificate Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload Certificates
            </DialogTitle>
            <DialogDescription>
              Upload product authenticity certificates, business licenses, or other verification documents.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleUploadCertificate}
              />
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                PDF, JPG, or PNG files up to 10MB
              </p>
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Select File"
                )}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default SellerDashboard;
