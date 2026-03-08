import { useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Target, Users, Globe, Award, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";

const stats = [
  { label: "Scans Performed", value: "50K+", icon: Shield },
  { label: "Scams Detected", value: "12K+", icon: Target },
  { label: "Active Users", value: "10K+", icon: Users },
  { label: "Counties Covered", value: "47", icon: Globe },
];

const values = [
  {
    icon: Shield,
    title: "Safety First",
    description: "Every Kenyan deserves to shop online without fear of fraud. We use AI to make that possible.",
  },
  {
    icon: Award,
    title: "Trust & Transparency",
    description: "We verify sellers, score products, and provide honest risk assessments—no hidden agendas.",
  },
  {
    icon: TrendingUp,
    title: "Empowering Commerce",
    description: "By building trust, we help legitimate sellers grow and buyers shop confidently across Kenya.",
  },
];

const About = () => {
  useEffect(() => {
    document.title = "About Us | SafeBazaar AI";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <PageHeader
          title="About SafeBazaar AI"
          description="Protecting Kenyan shoppers through AI-powered fraud detection"
          breadcrumbs={[{ label: "About" }]}
        />

        {/* Mission */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mb-16"
        >
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Kenya's e-commerce market is booming, but so are online scams. From counterfeit products on Jumia 
            to fake M-Pesa payment links, Kenyan shoppers lose billions each year to fraud. SafeBazaar AI was 
            built to change that—using artificial intelligence to scan products, verify sellers, and protect 
            every transaction across Kenya's 47 counties.
          </p>
        </motion.section>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="text-center p-6">
                <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </section>

        {/* Values */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">What We Stand For</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <value.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="mb-16 max-w-3xl">
          <h2 className="text-2xl font-bold mb-4">Built in Kenya, for Kenya</h2>
          <p className="text-muted-foreground leading-relaxed">
            SafeBazaar AI is built by a passionate team led by <strong>Justin Noel</strong>, a Kenyan developer 
            committed to solving real problems in the local digital economy. We work closely with sellers, 
            buyers, and cybersecurity experts to continuously improve our platform.
          </p>
        </section>

        {/* Partners placeholder */}
        <section className="text-center py-12 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">Trusted by sellers and buyers across Kenya</p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-40">
            {["Jumia", "Jiji", "Kilimall", "M-Pesa"].map((name) => (
              <span key={name} className="text-lg font-bold">{name}</span>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default About;
