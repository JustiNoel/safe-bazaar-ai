import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Package, Shield, Star, Key, Copy, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const SellerAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasAnalyticsDashboard, isPremiumSeller, hasApiAccess, hasSellerBadge, daysRemaining } = usePremiumFeatures();
  const [showApiKey, setShowApiKey] = React.useState(false);

  // Redirect if not premium seller
  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else if (!isPremiumSeller) {
      toast.error('Analytics dashboard requires Premium Seller subscription');
      navigate('/premium');
    }
  }, [user, isPremiumSeller, navigate]);

  // Fetch scan data
  const { data: scans } = useQuery({
    queryKey: ['seller-scans', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const copyApiKey = () => {
    if (user?.profile?.api_key) {
      navigator.clipboard.writeText(user.profile.api_key);
      toast.success('API key copied to clipboard');
    }
  };

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (!scans?.length) return null;

    const totalScans = scans.length;
    const avgScore = Math.round(scans.reduce((acc, s) => acc + s.overall_score, 0) / totalScans);
    const safeCount = scans.filter(s => s.verdict === 'SAFE').length;
    const cautionCount = scans.filter(s => s.verdict === 'CAUTION').length;
    const dangerCount = scans.filter(s => s.verdict === 'DANGER').length;

    // Weekly trend data
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayScans = scans.filter(s => {
        const scanDate = new Date(s.created_at);
        return scanDate.toDateString() === date.toDateString();
      });
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        scans: dayScans.length,
        avgScore: dayScans.length 
          ? Math.round(dayScans.reduce((acc, s) => acc + s.overall_score, 0) / dayScans.length)
          : 0,
      };
    });

    return {
      totalScans,
      avgScore,
      safeCount,
      cautionCount,
      dangerCount,
      weeklyData,
      verdictData: [
        { name: 'Safe', value: safeCount, color: '#22c55e' },
        { name: 'Caution', value: cautionCount, color: '#eab308' },
        { name: 'Danger', value: dangerCount, color: '#ef4444' },
      ],
    };
  }, [scans]);

  if (!hasAnalyticsDashboard) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">Seller Analytics</h1>
                {hasSellerBadge && (
                  <Badge className="bg-primary text-primary-foreground">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified Seller
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1">
                Premium Seller • {daysRemaining} days remaining
              </p>
            </div>
            <Button onClick={() => navigate('/bulk-scan')}>
              <Package className="mr-2 h-4 w-4" />
              Bulk Scan
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Scans</CardDescription>
                <CardTitle className="text-3xl">{stats?.totalScans || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Average Score</CardDescription>
                <CardTitle className="text-3xl">{stats?.avgScore || 0}%</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Safe Products</CardDescription>
                <CardTitle className="text-3xl text-green-500">{stats?.safeCount || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>At Risk</CardDescription>
                <CardTitle className="text-3xl text-red-500">{(stats?.cautionCount || 0) + (stats?.dangerCount || 0)}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Weekly Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Weekly Scan Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={stats?.weeklyData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="scans" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Verdict Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Verdict Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={stats?.verdictData || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats?.verdictData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  {stats?.verdictData?.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* API Access */}
          {hasApiAccess && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Access
                </CardTitle>
                <CardDescription>
                  Use your API key to integrate Safe Bazaar scanning into your systems
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 font-mono text-sm bg-muted p-3 rounded-lg">
                    {showApiKey 
                      ? user?.profile?.api_key || 'No API key generated'
                      : '••••••••••••••••••••••••••••••••'}
                  </div>
                  <Button variant="outline" size="icon" onClick={() => setShowApiKey(!showApiKey)}>
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="icon" onClick={copyApiKey}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">API Endpoints:</p>
                  <ul className="space-y-1">
                    <li><code>POST /seller-api/scan</code> - Scan a product</li>
                    <li><code>GET /seller-api/stats</code> - Get your statistics</li>
                    <li><code>GET /seller-api/usage</code> - Check API usage</li>
                  </ul>
                  <p className="mt-2">Rate limit: 100 calls per day</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dedicated Manager */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Dedicated Account Manager
              </CardTitle>
              <CardDescription>
                As a Premium Seller, you have access to priority support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Support Team</p>
                  <p className="text-sm text-muted-foreground">seller-support@safebazaar.ai</p>
                </div>
                <Button onClick={() => navigate('/contact')}>
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default SellerAnalytics;
