import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Shield, FileText } from "lucide-react";
import { motion } from "framer-motion";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Terms of Service</h1>
              <p className="text-muted-foreground">Last updated: January 2026</p>
            </div>
          </div>

          <Card className="p-8 space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                1. Acceptance of Terms
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using Safe Bazaar AI ("the Service"), you accept and agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our Service. The Service is designed specifically for 
                Kenyan e-commerce users to detect potential fraud and unsafe products.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Safe Bazaar AI provides AI-powered product scanning and risk assessment services to help users identify 
                potentially fraudulent or unsafe products when shopping online in Kenya. Our services include:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Product image and URL scanning</li>
                <li>AI-generated risk assessments and safety scores</li>
                <li>Vendor trust analysis</li>
                <li>Price comparison and market analysis</li>
                <li>Safer alternative recommendations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">3. User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed">
                To access certain features, you must create an account. You are responsible for maintaining the confidentiality 
                of your account credentials and for all activities under your account. Free users receive 3 scans per day, 
                which reset at midnight East African Time (EAT). Premium subscribers enjoy unlimited scans and additional features.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">4. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Important:</strong> Safe Bazaar AI provides risk assessments based on AI analysis and available data. 
                Our assessments are advisory in nature and should not be considered as guarantees of product safety or vendor trustworthiness. 
                Users should exercise their own judgment when making purchase decisions. We are not liable for any losses arising from 
                reliance on our assessments.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">5. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                Safe Bazaar AI, its creators, and affiliates shall not be liable for any indirect, incidental, special, 
                consequential, or punitive damages resulting from your use of the Service. Our total liability shall not 
                exceed the amount paid by you for the Service in the twelve months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">6. Prohibited Uses</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">You agree not to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Use the Service for any unlawful purpose</li>
                <li>Attempt to circumvent daily scan limits through multiple accounts</li>
                <li>Reverse engineer or attempt to extract the AI models</li>
                <li>Submit malicious content or attempt to exploit vulnerabilities</li>
                <li>Resell or redistribute our assessments without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">7. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. Continued use of the Service after changes 
                constitutes acceptance of the modified terms. We will notify users of significant changes via email 
                or in-app notifications.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">8. Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these Terms of Service, please contact us at{" "}
                <a href="mailto:justinoel254@gmail.com" className="text-primary hover:underline">
                  justinoel254@gmail.com
                </a>
              </p>
            </section>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
