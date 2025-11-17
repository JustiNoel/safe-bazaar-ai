import { Shield, Github, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">
                Safe<span className="text-primary">Bazaar AI</span>
              </span>
            </div>
            <p className="text-muted-foreground mb-4">
              Empowering safe online shopping in Kenya through AI-powered fraud detection. 
              Protecting 10M+ shoppers from scams, counterfeits, and risky vendors.
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a 
                href="mailto:support@safebazaar.ai"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="/#how-it-works" className="text-muted-foreground hover:text-primary transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="/scan" className="text-muted-foreground hover:text-primary transition-colors">
                  Scan Product
                </a>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-semibold mb-4">Project Info</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>AI Hackathon 2025</li>
              <li>Kenya Edition</li>
              <li>Theme: AI for National Prosperity</li>
              <li>Focus: Cybersecurity & Data Protection</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© 2025 Safe Bazaar AI. Built for AI Hackathon 2025 Kenya. Open Source Project.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
