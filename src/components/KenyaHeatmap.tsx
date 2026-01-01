import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, AlertTriangle } from "lucide-react";

interface RegionData {
  name: string;
  scamCount: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  coordinates: { x: number; y: number };
}

// Kenya regions with mock scam data
const kenyaRegions: RegionData[] = [
  { name: "Nairobi", scamCount: 342, riskLevel: "critical", coordinates: { x: 58, y: 62 } },
  { name: "Mombasa", scamCount: 187, riskLevel: "high", coordinates: { x: 72, y: 78 } },
  { name: "Kisumu", scamCount: 98, riskLevel: "medium", coordinates: { x: 32, y: 52 } },
  { name: "Nakuru", scamCount: 76, riskLevel: "medium", coordinates: { x: 48, y: 50 } },
  { name: "Eldoret", scamCount: 54, riskLevel: "low", coordinates: { x: 40, y: 38 } },
  { name: "Nyeri", scamCount: 43, riskLevel: "low", coordinates: { x: 55, y: 48 } },
  { name: "Machakos", scamCount: 89, riskLevel: "medium", coordinates: { x: 62, y: 66 } },
  { name: "Meru", scamCount: 37, riskLevel: "low", coordinates: { x: 65, y: 45 } },
  { name: "Kisii", scamCount: 62, riskLevel: "medium", coordinates: { x: 30, y: 58 } },
  { name: "Kakamega", scamCount: 48, riskLevel: "low", coordinates: { x: 30, y: 42 } },
  { name: "Malindi", scamCount: 72, riskLevel: "medium", coordinates: { x: 78, y: 68 } },
  { name: "Garissa", scamCount: 28, riskLevel: "low", coordinates: { x: 80, y: 48 } },
  { name: "Turkana", scamCount: 15, riskLevel: "low", coordinates: { x: 40, y: 18 } },
  { name: "Mandera", scamCount: 12, riskLevel: "low", coordinates: { x: 88, y: 18 } },
];

const getRiskColor = (level: RegionData["riskLevel"]) => {
  switch (level) {
    case "critical": return "hsl(var(--destructive))";
    case "high": return "hsl(348, 83%, 47%)";
    case "medium": return "hsl(38, 92%, 50%)";
    case "low": return "hsl(142, 71%, 45%)";
  }
};

const getRiskBadgeVariant = (level: RegionData["riskLevel"]) => {
  switch (level) {
    case "critical": return "destructive";
    case "high": return "destructive";
    case "medium": return "secondary";
    case "low": return "outline";
  }
};

export default function KenyaHeatmap() {
  const [hoveredRegion, setHoveredRegion] = useState<RegionData | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null);

  const totalScams = kenyaRegions.reduce((sum, r) => sum + r.scamCount, 0);
  const criticalRegions = kenyaRegions.filter(r => r.riskLevel === "critical" || r.riskLevel === "high").length;

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Regional Scam Heatmap
            </CardTitle>
            <CardDescription>
              Fraud hotspots across Kenya based on scan data
            </CardDescription>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-muted-foreground">{criticalRegions} high-risk regions</span>
            </div>
            <Badge variant="outline">{totalScams} total scams</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SVG Map of Kenya */}
          <div className="lg:col-span-2 relative aspect-[4/5] bg-muted/30 rounded-lg overflow-hidden border border-border">
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
              
              {/* Region hotspots */}
              {kenyaRegions.map((region, index) => {
                const isHovered = hoveredRegion?.name === region.name;
                const isSelected = selectedRegion?.name === region.name;
                const baseRadius = Math.min(3 + (region.scamCount / 50), 8);
                const radius = isHovered || isSelected ? baseRadius * 1.3 : baseRadius;
                
                return (
                  <g key={region.name}>
                    {/* Pulse animation for critical/high risk */}
                    {(region.riskLevel === "critical" || region.riskLevel === "high") && (
                      <motion.circle
                        cx={region.coordinates.x}
                        cy={region.coordinates.y}
                        r={baseRadius}
                        fill="none"
                        stroke={getRiskColor(region.riskLevel)}
                        strokeWidth="0.5"
                        initial={{ r: baseRadius, opacity: 0.8 }}
                        animate={{ r: baseRadius * 2, opacity: 0 }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: index * 0.2,
                        }}
                      />
                    )}
                    
                    {/* Main hotspot circle */}
                    <motion.circle
                      cx={region.coordinates.x}
                      cy={region.coordinates.y}
                      r={radius}
                      fill={getRiskColor(region.riskLevel)}
                      fillOpacity={isHovered || isSelected ? 0.9 : 0.7}
                      stroke="hsl(var(--background))"
                      strokeWidth="0.5"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredRegion(region)}
                      onMouseLeave={() => setHoveredRegion(null)}
                      onClick={() => setSelectedRegion(selectedRegion?.name === region.name ? null : region)}
                      whileHover={{ scale: 1.2 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    />
                    
                    {/* Region label (show on hover/select) */}
                    {(isHovered || isSelected) && (
                      <motion.text
                        x={region.coordinates.x}
                        y={region.coordinates.y - radius - 2}
                        textAnchor="middle"
                        fontSize="3"
                        fill="hsl(var(--foreground))"
                        initial={{ opacity: 0, y: 2 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {region.name}
                      </motion.text>
                    )}
                  </g>
                );
              })}
            </svg>
            
            {/* Tooltip */}
            {hoveredRegion && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-4 left-4 bg-card border border-border rounded-lg p-3 shadow-lg"
              >
                <p className="font-semibold">{hoveredRegion.name}</p>
                <p className="text-sm text-muted-foreground">{hoveredRegion.scamCount} reported scams</p>
                <Badge variant={getRiskBadgeVariant(hoveredRegion.riskLevel) as any} className="mt-1 capitalize">
                  {hoveredRegion.riskLevel} risk
                </Badge>
              </motion.div>
            )}
          </div>

          {/* Region List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            <h4 className="font-semibold text-sm text-muted-foreground mb-3">All Regions</h4>
            {kenyaRegions
              .sort((a, b) => b.scamCount - a.scamCount)
              .map((region) => (
                <motion.div
                  key={region.name}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedRegion?.name === region.name
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedRegion(selectedRegion?.name === region.name ? null : region)}
                  whileHover={{ x: 2 }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getRiskColor(region.riskLevel) }}
                    />
                    <span className="text-sm font-medium">{region.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{region.scamCount}</span>
                    <Badge
                      variant={getRiskBadgeVariant(region.riskLevel) as any}
                      className="text-xs capitalize"
                    >
                      {region.riskLevel}
                    </Badge>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-border">
          <span className="text-sm text-muted-foreground">Risk Level:</span>
          {["low", "medium", "high", "critical"].map((level) => (
            <div key={level} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getRiskColor(level as RegionData["riskLevel"]) }}
              />
              <span className="text-xs capitalize">{level}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
