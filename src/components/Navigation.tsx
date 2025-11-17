import { Shield, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">
              Safe<span className="text-primary">Bazaar</span>
            </span>
          </button>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <a href="/#how-it-works" className="text-foreground hover:text-primary transition-colors">
              How It Works
            </a>
            <Button variant="ghost" onClick={() => navigate("/scan")}>
              Scan Product
            </Button>
            <Button variant="hero" onClick={() => navigate("/scan")}>
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 animate-fade-in">
            <div className="flex flex-col gap-4">
              <a 
                href="/#how-it-works" 
                className="text-foreground hover:text-primary transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                How It Works
              </a>
              <Button 
                variant="ghost" 
                className="justify-start"
                onClick={() => {
                  navigate("/scan");
                  setIsOpen(false);
                }}
              >
                Scan Product
              </Button>
              <Button 
                variant="hero"
                onClick={() => {
                  navigate("/scan");
                  setIsOpen(false);
                }}
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
