import { motion } from "framer-motion";
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, Image as ImageIcon, Copy, Camera, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ImageAnalysis {
  verdict: "legitimate" | "suspicious" | "cloned" | "fake";
  confidence: number;
  analysis: string;
  threats: string[];
  recommendations: string[];
  source_check: {
    is_stock_image: boolean;
    possible_sources: string[];
    manipulation_detected: boolean;
  };
  kenyan_context?: string;
}

interface ImageAnalysisResultProps {
  analysis: ImageAnalysis;
  onNewScan: () => void;
  imagePreview?: string;
}

const ImageAnalysisResult = ({ analysis, onNewScan, imagePreview }: ImageAnalysisResultProps) => {
  const getVerdictConfig = (verdict: string) => {
    switch (verdict) {
      case "legitimate":
        return {
          color: "text-success",
          bgColor: "bg-success/10",
          borderColor: "border-success/30",
          icon: CheckCircle,
          label: "Legitimate Image",
          description: "This image appears to be authentic and original"
        };
      case "suspicious":
        return {
          color: "text-warning",
          bgColor: "bg-warning/10",
          borderColor: "border-warning/30",
          icon: AlertTriangle,
          label: "Suspicious Image",
          description: "Some concerns detected - proceed with caution"
        };
      case "cloned":
        return {
          color: "text-orange-500",
          bgColor: "bg-orange-500/10",
          borderColor: "border-orange-500/30",
          icon: Copy,
          label: "Cloned/Copied Image",
          description: "This image appears to be copied from another source"
        };
      case "fake":
        return {
          color: "text-destructive",
          bgColor: "bg-destructive/10",
          borderColor: "border-destructive/30",
          icon: XCircle,
          label: "Fake/Manipulated Image",
          description: "This image shows signs of manipulation or is AI-generated"
        };
      default:
        return {
          color: "text-muted-foreground",
          bgColor: "bg-muted",
          borderColor: "border-border",
          icon: ImageIcon,
          label: "Unknown",
          description: "Unable to determine authenticity"
        };
    }
  };

  const verdictConfig = getVerdictConfig(analysis.verdict);
  const VerdictIcon = verdictConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onNewScan} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          New Analysis
        </Button>
      </div>

      {/* Main Result Card */}
      <Card className={`p-6 md:p-8 ${verdictConfig.borderColor} border-2`}>
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          {/* Image Preview */}
          {imagePreview && (
            <div className="w-48 h-48 rounded-lg overflow-hidden border border-border flex-shrink-0">
              <img src={imagePreview} alt="Analyzed" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Verdict */}
          <div className="flex-1 text-center md:text-left">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${verdictConfig.bgColor} ${verdictConfig.color} mb-4`}>
              <VerdictIcon className="w-5 h-5" />
              <span className="font-semibold">{verdictConfig.label}</span>
            </div>
            
            <p className="text-muted-foreground mb-4">{verdictConfig.description}</p>

            {/* Confidence Score */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Confidence Level</span>
                <span className="font-medium">{analysis.confidence}%</span>
              </div>
              <Progress value={analysis.confidence} className="h-2" />
            </div>
          </div>
        </div>
      </Card>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Analysis */}
        <Card className="p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            AI Analysis
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {analysis.analysis}
          </p>
        </Card>

        {/* Source Check */}
        <Card className="p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Camera className="w-5 h-5 text-primary" />
            Source Check
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Stock Image</span>
              <Badge variant={analysis.source_check.is_stock_image ? "destructive" : "secondary"}>
                {analysis.source_check.is_stock_image ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Manipulation Detected</span>
              <Badge variant={analysis.source_check.manipulation_detected ? "destructive" : "secondary"}>
                {analysis.source_check.manipulation_detected ? "Yes" : "No"}
              </Badge>
            </div>
            {analysis.source_check.possible_sources.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground block mb-2">Possible Sources:</span>
                <div className="flex flex-wrap gap-1">
                  {analysis.source_check.possible_sources.map((source, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">{source}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Threats */}
      {analysis.threats.length > 0 && (
        <Card className="p-6 border-destructive/30">
          <h3 className="font-semibold flex items-center gap-2 mb-4 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Concerns Detected ({analysis.threats.length})
          </h3>
          <ul className="space-y-2">
            {analysis.threats.map((threat, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-destructive">•</span>
                <span>{threat}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <Card className="p-6 border-success/30">
          <h3 className="font-semibold flex items-center gap-2 mb-4 text-success">
            <CheckCircle className="w-5 h-5" />
            Recommendations
          </h3>
          <ul className="space-y-2">
            {analysis.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-success">✓</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Kenyan Context */}
      {analysis.kenyan_context && (
        <Card className="p-6 bg-primary/5 border-primary/20">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            🇰🇪 Kenyan Market Context
          </h3>
          <p className="text-sm text-muted-foreground">{analysis.kenyan_context}</p>
        </Card>
      )}

      {/* Action Button */}
      <div className="flex justify-center">
        <Button onClick={onNewScan} size="lg" className="gap-2">
          <ImageIcon className="w-5 h-5" />
          Analyze Another Image
        </Button>
      </div>
    </motion.div>
  );
};

export default ImageAnalysisResult;
