import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, MessageCircle, Twitter, Facebook, Link, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareResultsProps {
  score: number;
  verdict: string;
  productName?: string;
}

const ShareResults = ({ score, verdict, productName }: ShareResultsProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareUrl = window.location.origin;
  const shareText = `I just scanned a product with Safe Bazaar AI and got a ${score}/100 safety score (${verdict === "safe" ? "✅ Safe" : verdict === "caution" ? "⚠️ Caution" : "🚨 Unsafe"})! Shop safely in Kenya 🇰🇪`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(shareUrl);

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      toast({
        title: "Link Copied! 📋",
        description: "Share it with your friends and family",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    const url = shareLinks[platform];
    // Use window.location for mobile compatibility to avoid popup blockers
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.location.href = url;
    } else {
      window.open(url, "_blank", "noopener,noreferrer,width=600,height=400");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="w-4 h-4" />
          Share Results
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleShare("whatsapp")} className="gap-3 cursor-pointer">
          <MessageCircle className="w-4 h-4 text-green-500" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare("twitter")} className="gap-3 cursor-pointer">
          <Twitter className="w-4 h-4 text-blue-400" />
          Twitter / X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare("facebook")} className="gap-3 cursor-pointer">
          <Facebook className="w-4 h-4 text-blue-600" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyToClipboard} className="gap-3 cursor-pointer">
          {copied ? (
            <Check className="w-4 h-4 text-success" />
          ) : (
            <Link className="w-4 h-4" />
          )}
          {copied ? "Copied!" : "Copy Link"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareResults;
