import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft, ShoppingBag } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        {/* Animated Lost Shopper Illustration */}
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-8xl mb-6"
        >
          🛒💨
        </motion.div>

        <motion.h1 
          className="text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent"
          animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          404
        </motion.h1>
        
        <h2 className="text-2xl font-semibold mb-2">
          Pole! Page Not Found
        </h2>
        
        <p className="text-muted-foreground mb-8">
          This page went to the market and got lost! 🇰🇪<br />
          <span className="text-sm italic">
            (Like looking for parking in Nairobi CBD)
          </span>
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link to="/">
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link to="/scan">
              <Search className="w-4 h-4" />
              Scan a Product
            </Link>
          </Button>
        </div>

        <motion.div 
          className="mt-12 p-4 rounded-xl bg-muted/50 border border-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Looking for something specific? Try scanning a product URL!
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;
