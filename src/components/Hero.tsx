import { Button } from "@/components/ui/button";
import { Shield, Scan, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-shopping.jpg";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)`,
          backgroundSize: '48px 48px'
        }} />
      </div>

      <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <Shield className="w-4 h-4" />
              <span>AI-Powered Protection</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Shop Safe in Kenya –{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                AI Scans Scams in Seconds
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Protect yourself from fraud, counterfeits, and risky vendors. Our AI analyzes products instantly, 
              giving you confidence in every purchase on Jumia, Kilimall, and beyond.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="hero" 
                size="xl"
                onClick={() => navigate("/scan")}
                className="group"
              >
                <Scan className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Scan Product Now
              </Button>
              <Button 
                variant="outline" 
                size="xl"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              >
                How It Works
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">70%</div>
                <div className="text-sm text-muted-foreground mt-1">Scam Reduction</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-secondary">5s</div>
                <div className="text-sm text-muted-foreground mt-1">Scan Time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-success">10M+</div>
                <div className="text-sm text-muted-foreground mt-1">Protected Users</div>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="relative rounded-2xl overflow-hidden shadow-strong">
              <img 
                src={heroImage}
                alt="Safe shopping with AI"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Floating Badges */}
            <div className="absolute -top-4 -right-4 bg-success text-success-foreground px-6 py-3 rounded-full shadow-strong animate-pulse-glow">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span className="font-semibold">AI Protected</span>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 bg-card border-2 border-primary px-6 py-3 rounded-xl shadow-strong">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-semibold">Real-time Analysis</div>
                  <div className="text-xs text-muted-foreground">Instant Results</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
