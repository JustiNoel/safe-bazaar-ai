import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, TrendingUp, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [trustScore, setTrustScore] = useState(72);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.profile?.role !== 'seller')) {
      toast.error("Access denied. Seller account required.");
      navigate('/');
    }
  }, [isAuthenticated, isLoading, user, navigate]);

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
    },
    {
      tip: "Upload product certificates",
      impact: "+15% trust score",
      action: "Upload",
    },
    {
      tip: "Complete vendor profile",
      impact: "+10% trust score",
      action: "Complete",
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
                    <Button variant="outline" size="sm">{item.action}</Button>
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
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SellerDashboard;
