import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { History, Shield, AlertTriangle, XCircle, Calendar, ChevronRight, Loader2, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import NotificationPreferences from "@/components/NotificationPreferences";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

interface ScanRecord {
  id: string;
  overall_score: number;
  verdict: string;
  created_at: string;
  products: {
    product_name: string | null;
    vendor_name: string | null;
    image_url: string | null;
    source_platform: string | null;
    price: number | null;
  } | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function ScanHistory() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (user?.id) {
      fetchScans();
    }
  }, [user?.id]);

  const fetchScans = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("scans")
      .select(`
        id,
        overall_score,
        verdict,
        created_at,
        products (
          product_name,
          vendor_name,
          image_url,
          source_platform,
          price
        )
      `)
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching scans:", error);
    } else {
      setScans(data as ScanRecord[]);
    }
    setIsLoading(false);
  };

  const getVerdictConfig = (verdict: string) => {
    switch (verdict) {
      case "safe":
        return {
          icon: Shield,
          color: "text-green-500",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/30",
          label: "Safe",
        };
      case "caution":
        return {
          icon: AlertTriangle,
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/10",
          borderColor: "border-yellow-500/30",
          label: "Caution",
        };
      default:
        return {
          icon: XCircle,
          color: "text-red-500",
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/30",
          label: "Unsafe",
        };
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <History className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">Account</h1>
            </div>
            <p className="text-muted-foreground">
              Manage your scan history and notification preferences
            </p>
          </motion.div>

          <Tabs defaultValue="history" className="mb-8">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Scan History
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="mt-6">
              <NotificationPreferences />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              {/* Premium Benefits Banner */}
              {user?.profile && !user.profile.premium && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6"
                >
                  <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">Upgrade to Premium</p>
                        <p className="text-sm text-muted-foreground">
                          Get unlimited scans, full breakdowns, and more!
                        </p>
                      </div>
                      <Button onClick={() => navigate("/#pricing")}>
                        View Plans
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : scans.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <History className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No scans yet</h2>
                  <p className="text-muted-foreground mb-6">
                    Start scanning products to see your history here
                  </p>
                  <Button onClick={() => navigate("/scan")}>
                    Scan Your First Product
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  {scans.map((scan) => {
                    const config = getVerdictConfig(scan.verdict);
                    const VerdictIcon = config.icon;

                    return (
                      <motion.div key={scan.id} variants={itemVariants}>
                        <Card className={`overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 border ${config.borderColor}`}>
                          <CardContent className="p-0">
                            <div className="flex items-stretch">
                              {/* Image */}
                              <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-muted">
                                {scan.products?.image_url ? (
                                  <img
                                    src={scan.products.image_url}
                                    alt={scan.products.product_name || "Product"}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Shield className="h-8 w-8 text-muted-foreground/50" />
                                  </div>
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 p-4 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <h3 className="font-semibold line-clamp-1">
                                      {scan.products?.product_name || "Scanned Product"}
                                    </h3>
                                    <Badge className={`${config.bgColor} ${config.color} border-0 flex-shrink-0`}>
                                      <VerdictIcon className="h-3 w-3 mr-1" />
                                      {config.label}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {scan.products?.vendor_name || "Unknown vendor"} 
                                    {scan.products?.source_platform && ` • ${scan.products.source_platform}`}
                                  </p>
                                </div>
                                
                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="font-medium text-foreground">
                                      Score: {scan.overall_score}/100
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3.5 w-3.5" />
                                      {format(new Date(scan.created_at), "MMM d, yyyy")}
                                    </span>
                                  </div>
                                  {scan.products?.price && (
                                    <span className="text-sm font-medium">
                                      KES {scan.products.price.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
