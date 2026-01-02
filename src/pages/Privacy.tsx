import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Shield, Lock, Eye, Database, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

const Privacy = () => {
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
              <Lock className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
              <p className="text-muted-foreground">Last updated: January 2026</p>
            </div>
          </div>

          <Card className="p-8 space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Our Commitment to Privacy
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                At Safe Bazaar AI, we take your privacy seriously. This policy explains how we collect, use, 
                and protect your personal information when you use our AI-powered fraud detection service. 
                We are committed to transparency and giving you control over your data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Information We Collect
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Account Information</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Email address (for account creation and communication)</li>
                    <li>Phone number (optional, for M-Pesa payments)</li>
                    <li>Profile preferences and settings</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Scan Data</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Product images you upload for scanning</li>
                    <li>Product URLs you submit for analysis</li>
                    <li>Scan results and risk assessments</li>
                    <li>Scan history (for registered users)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Usage Data</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Device type and browser information</li>
                    <li>IP address and approximate location</li>
                    <li>Feature usage and interaction patterns</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                How We Use Your Information
              </h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Provide and improve our AI-powered fraud detection service</li>
                <li>Generate risk assessments and safety recommendations</li>
                <li>Maintain your scan history and account preferences</li>
                <li>Process payments and manage subscriptions</li>
                <li>Send important service updates and security alerts</li>
                <li>Analyze usage patterns to improve our AI models (anonymized data only)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Data Storage & Security</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Your data is stored securely using industry-standard encryption. We use Supabase for our database 
                infrastructure, which provides enterprise-grade security including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>End-to-end encryption for data in transit</li>
                <li>Encryption at rest for stored data</li>
                <li>Row-level security policies for data access</li>
                <li>Regular security audits and updates</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Data Sharing</h2>
              <p className="text-muted-foreground leading-relaxed">
                We do <strong className="text-foreground">not</strong> sell your personal information. We may share 
                anonymized, aggregated data for research purposes. We only share personal data with third parties 
                when required by law or with your explicit consent.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-primary" />
                Your Rights
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">You have the right to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Access your personal data stored in our systems</li>
                <li>Request correction of inaccurate information</li>
                <li>Delete your account and associated data</li>
                <li>Export your scan history</li>
                <li>Opt out of non-essential communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Cookies & Tracking</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use essential cookies to maintain your session and preferences. We use analytics to understand 
                how users interact with our service, but this data is anonymized and not linked to your personal identity.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                For privacy-related inquiries or to exercise your data rights, please contact our team at{" "}
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

export default Privacy;
