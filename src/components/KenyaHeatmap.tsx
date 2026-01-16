import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CountyData {
  county_name: string;
  total_scams: number;
  scam_types: string[];
  risk_level: "low" | "medium" | "high" | "critical";
  top_scam_type: string;
  data_sources: string[];
}

interface ScamRecord {
  id: string;
  county_name: string;
  scam_type: string;
  scam_count: number;
  risk_level: string;
  data_source: string;
  last_reported_at: string;
}

// Kenya county coordinates (approximate center points)
const countyCoordinates: Record<string, { x: number; y: number }> = {
  "Nairobi": { x: 58, y: 62 },
  "Mombasa": { x: 72, y: 82 },
  "Kisumu": { x: 32, y: 52 },
  "Nakuru": { x: 48, y: 50 },
  "Uasin Gishu": { x: 40, y: 38 },
  "Kiambu": { x: 55, y: 58 },
  "Machakos": { x: 62, y: 66 },
  "Kajiado": { x: 54, y: 72 },
  "Meru": { x: 65, y: 45 },
  "Nyeri": { x: 55, y: 48 },
  "Kilifi": { x: 75, y: 75 },
  "Kakamega": { x: 30, y: 42 },
  "Bungoma": { x: 28, y: 38 },
  "Kisii": { x: 30, y: 58 },
  "Narok": { x: 42, y: 62 },
  "Migori": { x: 28, y: 62 },
  "Homa Bay": { x: 30, y: 56 },
  "Siaya": { x: 30, y: 50 },
  "Kericho": { x: 38, y: 52 },
  "Bomet": { x: 40, y: 56 },
  "Trans Nzoia": { x: 32, y: 32 },
  "Nandi": { x: 36, y: 42 },
  "Baringo": { x: 44, y: 38 },
  "Laikipia": { x: 52, y: 42 },
  "Turkana": { x: 40, y: 18 },
  "Marsabit": { x: 70, y: 28 },
  "Garissa": { x: 78, y: 52 },
  "Wajir": { x: 82, y: 35 },
  "Mandera": { x: 88, y: 22 },
  "Isiolo": { x: 65, y: 38 },
  "Samburu": { x: 55, y: 32 },
  "West Pokot": { x: 35, y: 28 },
  "Elgeyo Marakwet": { x: 40, y: 35 },
  "Tharaka Nithi": { x: 62, y: 48 },
  "Embu": { x: 60, y: 52 },
  "Kirinyaga": { x: 58, y: 52 },
  "Muranga": { x: 56, y: 55 },
  "Nyandarua": { x: 50, y: 48 },
  "Lamu": { x: 82, y: 68 },
  "Taita Taveta": { x: 65, y: 78 },
  "Kwale": { x: 68, y: 82 },
  "Tana River": { x: 75, y: 62 },
  "Kitui": { x: 68, y: 58 },
  "Makueni": { x: 62, y: 70 },
  "Vihiga": { x: 32, y: 46 },
  "Busia": { x: 28, y: 48 },
  "Nyamira": { x: 32, y: 55 },
};

const getRiskColor = (level: string) => {
  switch (level) {
    case "critical": return "hsl(var(--destructive))";
    case "high": return "hsl(348, 83%, 47%)";
    case "medium": return "hsl(38, 92%, 50%)";
    case "low": return "hsl(142, 71%, 45%)";
    default: return "hsl(var(--muted-foreground))";
  }
};

const getRiskBadgeVariant = (level: string) => {
  switch (level) {
    case "critical": return "destructive";
    case "high": return "destructive";
    case "medium": return "secondary";
    case "low": return "outline";
    default: return "outline";
  }
};

export default function KenyaHeatmap() {
  const [countyData, setCountyData] = useState<CountyData[]>([]);
  const [rawScams, setRawScams] = useState<ScamRecord[]>([]);
  const [hoveredRegion, setHoveredRegion] = useState<CountyData | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<CountyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchScamData = async () => {
    setLoading(true);
    try {
      // Fetch directly from the database for real-time updates
      const { data: scamData, error } = await supabase
        .from("county_scams")
        .select("*")
        .order("scam_count", { ascending: false });

      if (error) throw error;

      // Type-safe casting
      const typedScamData = (scamData || []) as ScamRecord[];
      setRawScams(typedScamData);

      // Aggregate by county
      const countyAggregates = new Map<string, CountyData>();

      for (const scam of typedScamData) {
        const existing = countyAggregates.get(scam.county_name);
        if (existing) {
          existing.total_scams += scam.scam_count;
          if (!existing.scam_types.includes(scam.scam_type)) {
            existing.scam_types.push(scam.scam_type);
          }
          if (!existing.data_sources.includes(scam.data_source)) {
            existing.data_sources.push(scam.data_source);
          }
          // Update risk level if higher
          const riskOrder: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
          if ((riskOrder[scam.risk_level] || 0) > (riskOrder[existing.risk_level] || 0)) {
            existing.risk_level = scam.risk_level as CountyData["risk_level"];
          }
        } else {
          countyAggregates.set(scam.county_name, {
            county_name: scam.county_name,
            total_scams: scam.scam_count,
            scam_types: [scam.scam_type],
            risk_level: scam.risk_level as CountyData["risk_level"],
            top_scam_type: scam.scam_type,
            data_sources: [scam.data_source],
          });
        }
      }

      const aggregated = Array.from(countyAggregates.values())
        .sort((a, b) => b.total_scams - a.total_scams);

      setCountyData(aggregated);
      setLastUpdated(new Date().toLocaleString("en-KE"));
    } catch (error) {
      console.error("Error fetching scam data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScamData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("county_scams_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "county_scams" },
        () => {
          fetchScamData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const totalScams = countyData.reduce((sum, r) => sum + r.total_scams, 0);
  const criticalRegions = countyData.filter(r => r.risk_level === "critical" || r.risk_level === "high").length;

  const selectedCountyScams = selectedRegion 
    ? rawScams.filter(s => s.county_name === selectedRegion.county_name)
    : [];

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Regional Scam Heatmap - Live
            </CardTitle>
            <CardDescription>
              Real-time fraud hotspots across Kenya's 47 counties
            </CardDescription>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-muted-foreground">{criticalRegions} high-risk counties</span>
            </div>
            <Badge variant="outline">{totalScams.toLocaleString()} total scams</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchScamData}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground mt-2">
            Last updated: {lastUpdated}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SVG Map of Kenya */}
          <div className="lg:col-span-2 relative aspect-[4/5] bg-muted/30 rounded-lg overflow-hidden border border-border">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Simplified Kenya outline */}
                <path
                  d="M25,5 L85,5 L95,25 L90,50 L85,85 L65,95 L35,80 L25,60 L15,45 L20,25 Z"
                  fill="hsl(var(--muted))"
                  stroke="hsl(var(--border))"
                  strokeWidth="0.5"
                />
                
                {/* County hotspots */}
                {countyData.map((county, index) => {
                  const coords = countyCoordinates[county.county_name];
                  if (!coords) return null;

                  const isHovered = hoveredRegion?.county_name === county.county_name;
                  const isSelected = selectedRegion?.county_name === county.county_name;
                  const baseRadius = Math.min(2 + (county.total_scams / 80), 6);
                  const radius = isHovered || isSelected ? baseRadius * 1.3 : baseRadius;
                  
                  return (
                    <g key={county.county_name}>
                      {/* Pulse animation for critical/high risk */}
                      {(county.risk_level === "critical" || county.risk_level === "high") && (
                        <motion.circle
                          cx={coords.x}
                          cy={coords.y}
                          r={baseRadius}
                          fill="none"
                          stroke={getRiskColor(county.risk_level)}
                          strokeWidth="0.5"
                          initial={{ r: baseRadius, opacity: 0.8 }}
                          animate={{ r: baseRadius * 2, opacity: 0 }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: index * 0.1,
                          }}
                        />
                      )}
                      
                      {/* Main hotspot circle */}
                      <motion.circle
                        cx={coords.x}
                        cy={coords.y}
                        r={radius}
                        fill={getRiskColor(county.risk_level)}
                        fillOpacity={isHovered || isSelected ? 0.9 : 0.7}
                        stroke="hsl(var(--background))"
                        strokeWidth="0.5"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredRegion(county)}
                        onMouseLeave={() => setHoveredRegion(null)}
                        onClick={() => setSelectedRegion(selectedRegion?.county_name === county.county_name ? null : county)}
                        whileHover={{ scale: 1.2 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      />
                      
                      {/* County label (show on hover/select) */}
                      {(isHovered || isSelected) && (
                        <motion.text
                          x={coords.x}
                          y={coords.y - radius - 2}
                          textAnchor="middle"
                          fontSize="2.5"
                          fill="hsl(var(--foreground))"
                          initial={{ opacity: 0, y: 2 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          {county.county_name}
                        </motion.text>
                      )}
                    </g>
                  );
                })}
              </svg>
            )}
            
            {/* Tooltip */}
            {hoveredRegion && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-4 left-4 bg-card border border-border rounded-lg p-3 shadow-lg max-w-[200px]"
              >
                <p className="font-semibold">{hoveredRegion.county_name}</p>
                <p className="text-sm text-muted-foreground">{hoveredRegion.total_scams.toLocaleString()} reported scams</p>
                <p className="text-xs text-muted-foreground mt-1">Top: {hoveredRegion.top_scam_type}</p>
                <Badge variant={getRiskBadgeVariant(hoveredRegion.risk_level) as any} className="mt-2 capitalize">
                  {hoveredRegion.risk_level} risk
                </Badge>
              </motion.div>
            )}
          </div>

          {/* County List / Detail View */}
          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
            {selectedRegion ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{selectedRegion.county_name}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRegion(null)}
                  >
                    ← Back
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Scams</span>
                    <span className="font-medium">{selectedRegion.total_scams.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Risk Level</span>
                    <Badge variant={getRiskBadgeVariant(selectedRegion.risk_level) as any} className="capitalize">
                      {selectedRegion.risk_level}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Scam Types</h5>
                  {selectedCountyScams.map((scam) => (
                    <div key={scam.id} className="p-2 rounded-lg bg-muted/50 text-sm">
                      <div className="flex justify-between items-center">
                        <span>{scam.scam_type}</span>
                        <span className="font-medium">{scam.scam_count}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Source: {scam.data_source}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <h4 className="font-semibold text-sm text-muted-foreground mb-3">All Counties (by reports)</h4>
                {countyData.slice(0, 20).map((county) => (
                  <motion.div
                    key={county.county_name}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedRegion?.county_name === county.county_name
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedRegion(county)}
                    whileHover={{ x: 2 }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: getRiskColor(county.risk_level) }}
                      />
                      <div>
                        <span className="text-sm font-medium">{county.county_name}</span>
                        <p className="text-xs text-muted-foreground">{county.top_scam_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{county.total_scams.toLocaleString()}</span>
                      <Badge
                        variant={getRiskBadgeVariant(county.risk_level) as any}
                        className="text-xs capitalize"
                      >
                        {county.risk_level}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
                {countyData.length > 20 && (
                  <p className="text-xs text-center text-muted-foreground pt-2">
                    +{countyData.length - 20} more counties
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-border">
          <span className="text-sm text-muted-foreground">Risk Level:</span>
          {["low", "medium", "high", "critical"].map((level) => (
            <div key={level} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getRiskColor(level) }}
              />
              <span className="text-xs capitalize">{level}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
