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
  ArrowLeft,
  Ban,
  RotateCcw,
  Sparkles,
  MoreHorizontal
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";
import KenyaHeatmap from "@/components/KenyaHeatmap";

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
  scan_limit: number;
  created_at: string;
  banned: boolean;
  banned_reason: string | null;
  premium_expires_at: string | null;
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
  
  // Dialog states
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [premiumDialogOpen, setPremiumDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [banReason, setBanReason] = useState("");
  const [premiumDays, setPremiumDays] = useState("30");
  const [actionLoading, setActionLoading] = useState(false);

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
      const [usersResult, scansResult, premiumResult] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact" }),
        supabase.from("scans").select("*", { count: "exact" }),
        supabase.from("profiles").select("*", { count: "exact" }).eq("premium", true),
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: scansToday } = await supabase
        .from("scans")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());

      const { count: highRiskCount } = await supabase
        .from("scans")
        .select("*", { count: "exact", head: true })
        .lt("overall_score", 50);

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

      const { data: recentScansData } = await supabase
        .from("scans")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      setRecentScans(recentScansData || []);

      const { data: usersData } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      setUsers((usersData as UserRecord[]) || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser || !user) return;
    
    setActionLoading(true);
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          banned: true,
          banned_at: new Date().toISOString(),
          banned_reason: banReason || "No reason provided",
        })
        .eq("user_id", selectedUser.user_id);

      if (updateError) throw updateError;

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        action_type: "ban_user",
        target_user_id: selectedUser.user_id,
        details: { reason: banReason },
      });

      toast.success("User has been banned");
      setBanDialogOpen(false);
      setBanReason("");
      fetchDashboardData();
    } catch (error) {
      console.error("Error banning user:", error);
      toast.error("Failed to ban user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnbanUser = async (userRecord: UserRecord) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          banned: false,
          banned_at: null,
          banned_reason: null,
        })
        .eq("user_id", userRecord.user_id);

      if (error) throw error;

      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        action_type: "unban_user",
        target_user_id: userRecord.user_id,
        details: {},
      });

      toast.success("User has been unbanned");
      fetchDashboardData();
    } catch (error) {
      console.error("Error unbanning user:", error);
      toast.error("Failed to unban user");
    }
  };

  const handleResetScans = async (userRecord: UserRecord) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ scans_today: 0 })
        .eq("user_id", userRecord.user_id);

      if (error) throw error;

      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        action_type: "reset_scans",
        target_user_id: userRecord.user_id,
        details: {},
      });

      toast.success("User's daily scans have been reset");
      fetchDashboardData();
    } catch (error) {
      console.error("Error resetting scans:", error);
      toast.error("Failed to reset scans");
    }
  };

  const handleUpgradePremium = async () => {
    if (!selectedUser || !user) return;
    
    setActionLoading(true);
    try {
      const days = parseInt(premiumDays) || 30;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);

      const { error } = await supabase
        .from("profiles")
        .update({
          premium: true,
          scan_limit: 999,
          premium_expires_at: expiresAt.toISOString(),
        })
        .eq("user_id", selectedUser.user_id);

      if (error) throw error;

      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        action_type: "upgrade_premium",
        target_user_id: selectedUser.user_id,
        details: { days, expires_at: expiresAt.toISOString() },
      });

      toast.success(`User upgraded to Premium for ${days} days`);
      setPremiumDialogOpen(false);
      setPremiumDays("30");
      fetchDashboardData();
    } catch (error) {
      console.error("Error upgrading user:", error);
      toast.error("Failed to upgrade user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokePremium = async (userRecord: UserRecord) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          premium: false,
          scan_limit: 3,
          premium_expires_at: null,
        })
        .eq("user_id", userRecord.user_id);

      if (error) throw error;

      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        action_type: "revoke_premium",
        target_user_id: userRecord.user_id,
        details: {},
      });

      toast.success("Premium status has been revoked");
      fetchDashboardData();
    } catch (error) {
      console.error("Error revoking premium:", error);
      toast.error("Failed to revoke premium");
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

        {/* Kenya Heatmap */}
        <div className="mb-8">
          <KenyaHeatmap />
        </div>

        {/* Tabs for detailed views */}
        <Tabs defaultValue="scans" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="scans">Recent Scans</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="regions">Regions</TabsTrigger>
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
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage users, subscriptions, and access control
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Scans</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((userRecord) => (
                      <TableRow key={userRecord.id} className={userRecord.banned ? "opacity-60" : ""}>
                        <TableCell className="font-mono text-xs">
                          {userRecord.user_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {userRecord.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {userRecord.banned ? (
                              <Badge variant="destructive" className="w-fit">
                                <Ban className="h-3 w-3 mr-1" />
                                Banned
                              </Badge>
                            ) : userRecord.premium ? (
                              <Badge className="bg-accent text-accent-foreground w-fit">
                                <Crown className="h-3 w-3 mr-1" />
                                Premium
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="w-fit">Free</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {userRecord.scans_today} / {userRecord.scan_limit === 999 ? '∞' : userRecord.scan_limit}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(userRecord.created_at).toLocaleDateString('en-KE', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleResetScans(userRecord)}
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Reset Daily Scans
                              </DropdownMenuItem>
                              {userRecord.premium ? (
                                <DropdownMenuItem
                                  onClick={() => handleRevokePremium(userRecord)}
                                  className="text-destructive"
                                >
                                  <Crown className="h-4 w-4 mr-2" />
                                  Revoke Premium
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(userRecord);
                                    setPremiumDialogOpen(true);
                                  }}
                                >
                                  <Sparkles className="h-4 w-4 mr-2" />
                                  Upgrade to Premium
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {userRecord.banned ? (
                                <DropdownMenuItem
                                  onClick={() => handleUnbanUser(userRecord)}
                                  className="text-success"
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  Unban User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(userRecord);
                                    setBanDialogOpen(true);
                                  }}
                                  className="text-destructive"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Ban User
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="regions">
            <Card>
              <CardHeader>
                <CardTitle>Regional Statistics</CardTitle>
                <CardDescription>
                  Detailed breakdown of scam reports by region
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Click on regions in the heatmap above to view detailed statistics.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Ban User Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              This will prevent the user from accessing the platform. You can unban them later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="ban-reason">Reason for ban</Label>
              <Textarea
                id="ban-reason"
                placeholder="Enter the reason for banning this user..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBanUser}
              disabled={actionLoading}
            >
              {actionLoading ? "Banning..." : "Ban User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Premium Dialog */}
      <Dialog open={premiumDialogOpen} onOpenChange={setPremiumDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to Premium</DialogTitle>
            <DialogDescription>
              Manually grant premium access to this user for a specified duration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="premium-days">Duration (days)</Label>
              <Input
                id="premium-days"
                type="number"
                min="1"
                max="365"
                value={premiumDays}
                onChange={(e) => setPremiumDays(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPremiumDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpgradePremium}
              disabled={actionLoading}
            >
              {actionLoading ? "Upgrading..." : "Upgrade to Premium"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}