import { motion } from "framer-motion";
import { 
  Shield, 
  AlertTriangle, 
  XCircle, 
  CheckCircle, 
  Globe, 
  Link2, 
  ExternalLink,
  Copy,
  Flag,
  Info
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import CircularGauge from "./CircularGauge";

interface LinkAnalysis {
  url: string;
  overall_score: number;
  verdict: "safe" | "caution" | "dangerous";
  risk_level: "low" | "medium" | "high" | "critical";
  link_type: string;
  domain_info: {
    domain: string;
    is_trusted: boolean;
    is_shortened: boolean;
    suspicious_tld: boolean;
    age_indicator: string;
  };
  threats_detected: string[];
  ai_analysis: string;
  recommendations: string[];
  kenyan_context: string[];
}

interface LinkAnalysisResultProps {
  analysis: LinkAnalysis;
  onNewScan: () => void;
}

export default function LinkAnalysisResult({ analysis, onNewScan }: LinkAnalysisResultProps) {
  const getVerdictConfig = () => {
    switch (analysis.verdict) {
      case "safe":
        return {
          icon: CheckCircle,
          color: "text-success",
          bg: "bg-success/10",
          border: "border-success/30",
          label: "Safe Link",
          description: "This link appears to be legitimate and safe to visit.",
        };
      case "caution":
        return {
          icon: AlertTriangle,
          color: "text-warning",
          bg: "bg-warning/10",
          border: "border-warning/30",
          label: "Proceed with Caution",
          description: "Some risk factors detected. Verify before proceeding.",
        };
      case "dangerous":
        return {
          icon: XCircle,
          color: "text-destructive",
          bg: "bg-destructive/10",
          border: "border-destructive/30",
          label: "Dangerous Link",
          description: "High risk detected. Do NOT click or share this link!",
        };
    }
  };

  const verdictConfig = getVerdictConfig();
  const VerdictIcon = verdictConfig.icon;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(analysis.url);
    toast.success("URL copied to clipboard");
  };

  const reportLink = () => {
    toast.success("Thank you for reporting. Our team will investigate.");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Main Verdict Card */}
      <Card className={`${verdictConfig.bg} ${verdictConfig.border} border-2`}>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <CircularGauge score={analysis.overall_score} size={140} />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <VerdictIcon className={`h-6 w-6 ${verdictConfig.color}`} />
                <h2 className={`text-2xl font-bold ${verdictConfig.color}`}>
                  {verdictConfig.label}
                </h2>
              </div>
              <p className="text-muted-foreground mb-4">{verdictConfig.description}</p>
              
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  <Globe className="h-3 w-3 mr-1" />
                  {analysis.link_type}
                </Badge>
                <Badge 
                  variant={
                    analysis.risk_level === "critical" ? "destructive" :
                    analysis.risk_level === "high" ? "destructive" :
                    analysis.risk_level === "medium" ? "secondary" : "outline"
                  }
                  className="capitalize"
                >
                  {analysis.risk_level} Risk
                </Badge>
                {analysis.domain_info.is_trusted && (
                  <Badge className="bg-success/20 text-success border-success/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Trusted Domain
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* URL Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Analyzed URL
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
            <code className="flex-1 text-sm break-all font-mono">
              {analysis.url}
            </code>
            <Button variant="ghost" size="icon" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">Domain</p>
              <p className="font-medium text-sm truncate">{analysis.domain_info.domain}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">Trust Status</p>
              <p className={`font-medium text-sm ${analysis.domain_info.is_trusted ? "text-success" : "text-warning"}`}>
                {analysis.domain_info.is_trusted ? "Verified" : "Unverified"}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">URL Type</p>
              <p className={`font-medium text-sm ${analysis.domain_info.is_shortened ? "text-warning" : "text-foreground"}`}>
                {analysis.domain_info.is_shortened ? "Shortened" : "Direct"}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">Domain Age</p>
              <p className="font-medium text-sm">{analysis.domain_info.age_indicator}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Threats Detected */}
      {analysis.threats_detected.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Threats Detected ({analysis.threats_detected.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.threats_detected.map((threat, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                >
                  <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <span className="text-sm">{threat}</span>
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Kenya-Specific Context */}
      {analysis.kenyan_context.length > 0 && (
        <Card className="border-warning/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Flag className="h-5 w-5 text-warning" />
              Kenya-Specific Insights
            </CardTitle>
            <CardDescription>
              Contextual analysis for Kenyan users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.kenyan_context.map((insight, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 p-3 rounded-lg bg-warning/5 border border-warning/20"
                >
                  <Info className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <span className="text-sm">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* AI Analysis */}
      {analysis.ai_analysis && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {analysis.ai_analysis}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {analysis.recommendations.map((rec, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm"
              >
                <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                  {index + 1}
                </span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={onNewScan} className="flex-1">
          <Link2 className="h-4 w-4 mr-2" />
          Analyze Another Link
        </Button>
        {analysis.verdict !== "safe" && (
          <Button variant="outline" onClick={reportLink} className="flex-1">
            <Flag className="h-4 w-4 mr-2" />
            Report This Link
          </Button>
        )}
      </div>
    </motion.div>
  );
}
