import { motion } from "framer-motion";
import { Star, Shield, Award, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

const testimonials = [
  {
    name: "Grace Wanjiku",
    role: "Online Shopper, Nairobi",
    avatar: "GW",
    rating: 5,
    text: "Safe Bazaar saved me from buying a fake iPhone! The AI detected suspicious pricing and vendor history. Highly recommend!",
  },
  {
    name: "James Ochieng",
    role: "Small Business Owner",
    avatar: "JO",
    rating: 5,
    text: "As a seller, this tool helps me verify products before listing. My customers trust me more knowing I use AI verification.",
  },
  {
    name: "Amina Hassan",
    role: "Fashion Enthusiast, Mombasa",
    avatar: "AH",
    rating: 5,
    text: "I've avoided 3 scam sellers so far! The risk breakdown is so detailed. This should be mandatory for all online shopping.",
  },
  {
    name: "Peter Kimani",
    role: "Tech Reviewer",
    avatar: "PK",
    rating: 5,
    text: "The scanning animation is cool, but the accuracy is even cooler. Detected counterfeit electronics with 95% accuracy in my tests.",
  },
];

const trustBadges = [
  { icon: Shield, label: "AI Protected", value: "100K+ Scans" },
  { icon: Award, label: "Trusted By", value: "50K+ Users" },
  { icon: CheckCircle, label: "Accuracy Rate", value: "95%+" },
];

const Testimonials = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4">
        {/* Trust Badges */}
        <motion.div
          className="flex flex-wrap justify-center gap-6 mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {trustBadges.map((badge, index) => (
            <motion.div
              key={badge.label}
              className="flex items-center gap-3 px-6 py-3 rounded-full bg-primary/10 border border-primary/20"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <badge.icon className="w-5 h-5 text-primary" />
              <div className="text-left">
                <div className="text-xs text-muted-foreground">{badge.label}</div>
                <div className="font-bold text-foreground">{badge.value}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Trusted by <span className="text-primary">Kenyans</span> Nationwide
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of smart shoppers who use Safe Bazaar AI to protect their purchases
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                  "{testimonial.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 mt-auto">
                  <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-muted-foreground">
            <span className="text-primary font-semibold">★ 4.9/5</span> rating from over 10,000 reviews
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;