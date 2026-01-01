import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Users, 
  ScanLine, 
  TrendingUp, 
  Shield, 
  AlertTriangle,
  Crown,
  BarChart3,
  RefreshCw,
  ArrowLeft
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";

interface DashboardStats {
  totalUsers: number;
  premiumUsers: number;
  totalScans: number;
  scansToday: number;
  highRiskScans: number;
  averageScore: number;
}

interface ScanRecord {
  id: string;
  created_at: string;
  overall_score: number;
  verdict: string;
  is_guest: boolean;
  user_id: string | null;
}

interface UserRecord {
  id: string;
  user_id: string;
  role: string;
  premium: boolean;
  scans_today: number;
  created_at: string;
}

export default function Admin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    premiumUsers: 0,
    totalScans: 0,
    scansToday: 0,
    highRiskScans: 0,
    averageScore: 0,
  });
  const [recentScans, setRecentScans] = useState<ScanRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
      return;
    }

    if (user) {
      checkAdminAccess();
    }
  }, [user, isAuthenticated, isLoading, navigate]);

  const checkAdminAccess = async () => {
    if (!user) return;

    try {
      // Check if user has admin role
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin access:", error);
        toast.error("Failed to verify admin access");
        navigate("/");
        return;
      }

      if (!data) {
        toast.error("Access denied. Admin privileges required.");
        navigate("/");
        return;
      }

      setIsAdmin(true);
      fetchDashboardData();
    } catch (error) {
      console.error("Admin check error:", error);
      navigate("/");
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all stats in parallel
      const [usersResult, scansResult, premiumResult] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact" }),
        supabase.from("scans").select("*", { count: "exact" }),
        supabase.from("profiles").select("*", { count: "exact" }).eq("premium", true),
      ]);

      // Get today's scans
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: scansToday } = await supabase
        .from("scans")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());

      // Calculate high risk scans
      const { count: highRiskCount } = await supabase
        .from("scans")
        .select("*", { count: "exact", head: true })
        .lt("overall_score", 50);

      // Calculate average score
      const allScans = scansResult.data || [];
      const avgScore = allScans.length > 0
        ? Math.round(allScans.reduce((sum, scan) => sum + (scan.overall_score || 0), 0) / allScans.length)
        : 0;

      setStats({
        totalUsers: usersResult.count || 0,
        premiumUsers: premiumResult.count || 0,
        totalScans: scansResult.count || 0,
        scansToday: scansToday || 0,
        highRiskScans: highRiskCount || 0,
        averageScore: avgScore,
      });

      // Fetch recent scans
      const { data: recentScansData } = await supabase
        .from("scans")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      setRecentScans(recentScansData || []);

      // Fetch users
      const { data: usersData } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      setUsers(usersData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getVerdictBadge = (verdict: string, score: number) => {
    if (score >= 80) {
      return <Badge className="bg-success text-success-foreground">Safe</Badge>;
    } else if (score >= 60) {
      return <Badge className="bg-warning text-warning-foreground">Caution</Badge>;
    } else if (score >= 40) {
      return <Badge className="bg-secondary text-secondary-foreground">Risky</Badge>;
    } else {
      return <Badge variant="destructive">High Risk</Badge>;
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboardData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="bg-gradient-to-br from-accent/10 to-accent/5">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  Premium Users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.premiumUsers}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <ScanLine className="h-4 w-4" />
                  Total Scans
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.totalScans}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Scans Today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.scansToday}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  High Risk Scans
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.highRiskScans}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="bg-gradient-to-br from-success/10 to-success/5">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Avg. Score
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.averageScore}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs for detailed views */}
        <Tabs defaultValue="scans" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="scans">Recent Scans</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="scans">
            <Card>
              <CardHeader>
                <CardTitle>Recent Scans</CardTitle>
                <CardDescription>
                  Latest product scans across the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Verdict</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>User ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentScans.map((scan) => (
                      <TableRow key={scan.id}>
                        <TableCell>
                          {new Date(scan.created_at).toLocaleDateString('en-KE', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${
                            scan.overall_score >= 80 ? 'text-success' :
                            scan.overall_score >= 60 ? 'text-warning' :
                            scan.overall_score >= 40 ? 'text-secondary' :
                            'text-destructive'
                          }`}>
                            {scan.overall_score}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getVerdictBadge(scan.verdict, scan.overall_score)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {scan.is_guest ? 'Guest' : 'User'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {scan.user_id ? scan.user_id.slice(0, 8) + '...' : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>
                  Registered users and their subscription status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Premium</TableHead>
                      <TableHead>Scans Today</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((userRecord) => (
                      <TableRow key={userRecord.id}>
                        <TableCell className="font-mono text-xs">
                          {userRecord.user_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {userRecord.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {userRecord.premium ? (
                            <Badge className="bg-accent text-accent-foreground">
                              <Crown className="h-3 w-3 mr-1" />
                              Premium
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Free</Badge>
                          )}
                        </TableCell>
                        <TableCell>{userRecord.scans_today}</TableCell>
                        <TableCell>
                          {new Date(userRecord.created_at).toLocaleDateString('en-KE', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
