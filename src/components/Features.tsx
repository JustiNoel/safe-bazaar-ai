import { Shield, Zap, Award, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import GlassmorphismCard from "./GlassmorphismCard";
import iconScan from "@/assets/icon-scan-optimized.jpg";
import iconAi from "@/assets/icon-ai-optimized.jpg";
import iconTrust from "@/assets/icon-trust-optimized.jpg";

const Features = () => {
  const features = [
    {
      icon: iconScan,
      title: "Quick Product Scan",
      description: "Upload an image or paste a URL. Our AI analyzes in under 5 seconds.",
      color: "text-primary",
    },
    {
      icon: iconAi,
      title: "AI Risk Assessment",
      description: "Multi-factor analysis: vendor trust, product authenticity, M-Pesa safety, and price anomalies.",
      color: "text-secondary",
    },
    {
      icon: iconTrust,
      title: "Safer Alternatives",
      description: "Get 3-5 verified vendor recommendations if a product seems risky.",
      color: "text-success",
    },
  ];

  const riskFactors = [
    {
      icon: Shield,
      title: "Vendor Trust Score",
      weight: "40%",
      description: "Reviews, account age, and reported scams",
    },
    {
      icon: Award,
      title: "Product Authenticity",
      weight: "30%",
      description: "Image analysis and brand verification",
    },
    {
      icon: Zap,
      title: "M-Pesa Safety",
      weight: "20%",
      description: "Payment patterns and geo-location flags",
    },
    {
      icon: TrendingUp,
      title: "Price Analysis",
      weight: "10%",
      description: "Market comparison and anomaly detection",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-muted/30 relative overflow-hidden">
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 opacity-20"
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, hsla(120, 100%, 20%, 0.15) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 50%, hsla(24, 100%, 50%, 0.15) 0%, transparent 50%)",
            "radial-gradient(circle at 50% 80%, hsla(120, 100%, 20%, 0.15) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 50%, hsla(120, 100%, 20%, 0.15) 0%, transparent 50%)",
          ],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* How It Works */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How <span className="bg-gradient-primary bg-clip-text text-transparent">Safe Bazaar AI</span> Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to protect your online shopping in Kenya
          </p>
        </motion.div>

        {/* Features Grid with Glassmorphism */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <GlassmorphismCard key={index} index={index}>
              <div className="mb-4">
                <motion.img 
                  src={feature.icon} 
                  alt={feature.title}
                  width={128}
                  height={128}
                  className="w-16 h-16 rounded-lg object-cover"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${feature.color}`}>
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </GlassmorphismCard>
          ))}
        </div>

        {/* Risk Assessment Breakdown */}
        <motion.div 
          className="bg-card/70 backdrop-blur-xl rounded-2xl p-8 md:p-12 shadow-medium border border-border/50"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Our AI Risk Assessment Model
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Multi-factor analysis powered by machine learning to give you comprehensive protection
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {riskFactors.map((factor, index) => (
              <motion.div 
                key={index}
                className="flex gap-4 p-6 bg-muted/50 rounded-xl hover:bg-muted transition-all duration-300 hover:shadow-soft group"
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex-shrink-0">
                  <motion.div 
                    className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <factor.icon className="w-6 h-6 text-primary" />
                  </motion.div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{factor.title}</h4>
                    <motion.span 
                      className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded-full"
                      whileHover={{ scale: 1.1 }}
                    >
                      {factor.weight}
                    </motion.span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {factor.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
