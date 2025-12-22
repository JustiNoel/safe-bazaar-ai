import { Button } from "@/components/ui/button";
import { Shield, Scan, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-shopping-optimized.jpg";
import ParticleBackground from "./ParticleBackground";
import AnimatedCounter from "./AnimatedCounter";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Animated Particle Background */}
      <ParticleBackground />
      
      {/* Animated Gradient Overlay */}
      <motion.div 
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            "linear-gradient(45deg, hsla(120, 100%, 20%, 0.1) 0%, hsla(24, 100%, 50%, 0.05) 100%)",
            "linear-gradient(90deg, hsla(24, 100%, 50%, 0.1) 0%, hsla(120, 100%, 20%, 0.05) 100%)",
            "linear-gradient(135deg, hsla(120, 100%, 20%, 0.1) 0%, hsla(0, 0%, 0%, 0.05) 100%)",
            "linear-gradient(45deg, hsla(120, 100%, 20%, 0.1) 0%, hsla(24, 100%, 50%, 0.05) 100%)",
          ]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

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
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div 
              className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Shield className="w-4 h-4" />
              <span>AI-Powered Protection</span>
            </motion.div>

            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Shop Safe in Kenya –{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                AI Scans Scams in Seconds
              </span>
            </motion.h1>

            <motion.p 
              className="text-lg md:text-xl text-muted-foreground leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Protect yourself from fraud, counterfeits, and risky vendors. Our AI analyzes products instantly, 
              giving you confidence in every purchase on Jumia, Kilimall, and beyond.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
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
            </motion.div>

            {/* Animated Stats */}
            <motion.div 
              className="grid grid-cols-3 gap-6 pt-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <div className="text-center">
                <AnimatedCounter 
                  value={70} 
                  suffix="%" 
                  className="text-3xl md:text-4xl font-bold text-primary"
                />
                <div className="text-sm text-muted-foreground mt-1">Scam Reduction</div>
              </div>
              <div className="text-center">
                <AnimatedCounter 
                  value={5} 
                  suffix="s" 
                  className="text-3xl md:text-4xl font-bold text-secondary"
                />
                <div className="text-sm text-muted-foreground mt-1">Scan Time</div>
              </div>
              <div className="text-center">
                <AnimatedCounter 
                  value={10} 
                  suffix="M+" 
                  className="text-3xl md:text-4xl font-bold text-success"
                />
                <div className="text-sm text-muted-foreground mt-1">Protected Users</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Image */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-strong">
              <img 
                src={heroImage}
                alt="Safe shopping with AI"
                width={1280}
                height={725}
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Floating Badge - AI Protected */}
            <motion.div 
              className="absolute -top-4 -right-4 bg-success text-success-foreground px-6 py-3 rounded-full shadow-strong"
              animate={{ 
                y: [0, -8, 0],
                boxShadow: [
                  "0 8px 32px hsla(120, 60%, 35%, 0.3)",
                  "0 12px 40px hsla(120, 60%, 35%, 0.5)",
                  "0 8px 32px hsla(120, 60%, 35%, 0.3)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span className="font-semibold">AI Protected</span>
              </div>
            </motion.div>

            {/* Floating Badge - Real-time Analysis */}
            <motion.div 
              className="absolute -bottom-4 -left-4 bg-card border-2 border-primary px-6 py-3 rounded-xl shadow-strong"
              animate={{ 
                y: [0, 6, 0],
                boxShadow: [
                  "0 8px 32px hsla(120, 100%, 20%, 0.2)",
                  "0 12px 40px hsla(120, 100%, 20%, 0.4)",
                  "0 8px 32px hsla(120, 100%, 20%, 0.2)"
                ]
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-semibold">Real-time Analysis</div>
                  <div className="text-xs text-muted-foreground">Instant Results</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
