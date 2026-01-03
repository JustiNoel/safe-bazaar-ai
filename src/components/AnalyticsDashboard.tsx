import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";

interface ScanRecord {
  id: string;
  created_at: string;
  overall_score: number;
  verdict: string;
  is_guest: boolean;
  user_id: string | null;
  risk_breakdown?: {
    vendorTrust?: number;
    productAuthenticity?: number;
    supplyChainRisk?: number;
    priceAnomaly?: number;
  };
}

interface AnalyticsDashboardProps {
  scans: ScanRecord[];
}

const COLORS = {
  safe: "#22c55e",
  caution: "#f59e0b",
  risky: "#ef4444",
  primary: "#006600",
  secondary: "#16a34a",
  accent: "#f59e0b",
};

const AnalyticsDashboard = ({ scans }: AnalyticsDashboardProps) => {
  // Process scan trends by day (last 30 days)
  const scanTrends = useMemo(() => {
    const last30Days: { [key: string]: { date: string; scans: number; avgScore: number; scores: number[] } } = {};
    
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      last30Days[key] = { date: key, scans: 0, avgScore: 0, scores: [] };
    }

    scans.forEach(scan => {
      const date = scan.created_at.split('T')[0];
      if (last30Days[date]) {
        last30Days[date].scans++;
        last30Days[date].scores.push(scan.overall_score);
      }
    });

    return Object.values(last30Days).map(day => ({
      date: new Date(day.date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }),
      scans: day.scans,
      avgScore: day.scores.length > 0 
        ? Math.round(day.scores.reduce((a, b) => a + b, 0) / day.scores.length)
        : 0
    }));
  }, [scans]);

  // Risk score distribution
  const scoreDistribution = useMemo(() => {
    const distribution = {
      safe: 0,
      caution: 0,
      risky: 0,
      highRisk: 0,
    };

    scans.forEach(scan => {
      if (scan.overall_score >= 70) distribution.safe++;
      else if (scan.overall_score >= 50) distribution.caution++;
      else if (scan.overall_score >= 30) distribution.risky++;
      else distribution.highRisk++;
    });

    return [
      { name: "Safe (70+)", value: distribution.safe, color: COLORS.safe },
      { name: "Caution (50-69)", value: distribution.caution, color: COLORS.caution },
      { name: "Risky (30-49)", value: distribution.risky, color: "#f97316" },
      { name: "High Risk (<30)", value: distribution.highRisk, color: COLORS.risky },
    ].filter(item => item.value > 0);
  }, [scans]);

  // Hourly distribution
  const hourlyDistribution = useMemo(() => {
    const hours: { [key: number]: number } = {};
    for (let i = 0; i < 24; i++) hours[i] = 0;

    scans.forEach(scan => {
      const hour = new Date(scan.created_at).getHours();
      hours[hour]++;
    });

    return Object.entries(hours).map(([hour, count]) => ({
      hour: `${hour}:00`,
      scans: count,
    }));
  }, [scans]);

  // Weekly breakdown
  const weeklyBreakdown = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const breakdown: { [key: number]: { safe: number; risky: number } } = {};
    for (let i = 0; i < 7; i++) breakdown[i] = { safe: 0, risky: 0 };

    scans.forEach(scan => {
      const day = new Date(scan.created_at).getDay();
      if (scan.overall_score >= 60) breakdown[day].safe++;
      else breakdown[day].risky++;
    });

    return Object.entries(breakdown).map(([day, data]) => ({
      day: days[parseInt(day)],
      safe: data.safe,
      risky: data.risky,
    }));
  }, [scans]);

  // User vs Guest scans
  const userVsGuest = useMemo(() => {
    const authenticated = scans.filter(s => !s.is_guest && s.user_id).length;
    const guest = scans.filter(s => s.is_guest || !s.user_id).length;
    
    return [
      { name: "Authenticated Users", value: authenticated, color: COLORS.primary },
      { name: "Guest Users", value: guest, color: COLORS.accent },
    ];
  }, [scans]);

  // Average score trend
  const scoreTrend = useMemo(() => {
    const weeks: { [key: string]: number[] } = {};
    
    scans.forEach(scan => {
      const date = new Date(scan.created_at);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const key = weekStart.toISOString().split('T')[0];
      
      if (!weeks[key]) weeks[key] = [];
      weeks[key].push(scan.overall_score);
    });

    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([week, scores]) => ({
        week: new Date(week).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }),
        avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        count: scores.length,
      }));
  }, [scans]);

  return (
    <div className="space-y-6">
      {/* Scan Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scan Volume (Last 30 Days)</CardTitle>
            <CardDescription>Daily number of product scans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scanTrends}>
                  <defs>
                    <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="scans" 
                    stroke={COLORS.primary} 
                    fill="url(#scanGradient)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Risk Score Distribution</CardTitle>
            <CardDescription>Breakdown of scan results by safety level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={scoreDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {scoreDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly and Hourly Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Pattern</CardTitle>
            <CardDescription>Safe vs risky scans by day of week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="safe" name="Safe" fill={COLORS.safe} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="risky" name="Risky" fill={COLORS.risky} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hourly Activity</CardTitle>
            <CardDescription>Scan volume by hour (EAT)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="scans" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Engagement and Score Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Engagement</CardTitle>
            <CardDescription>Authenticated vs guest users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userVsGuest}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {userVsGuest.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Average Score Trend</CardTitle>
            <CardDescription>Weekly average safety scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreTrend}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.safe} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.safe} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'avgScore' ? `${value}/100` : value,
                      name === 'avgScore' ? 'Avg Score' : 'Scans'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="avgScore" 
                    stroke={COLORS.safe} 
                    fill="url(#scoreGradient)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
