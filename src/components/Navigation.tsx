import { Shield, Menu, X, History, User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, memo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "./ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const Navigation = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/");
  }, [logout, navigate]);

  const closeMenu = useCallback(() => setIsOpen(false), []);

  return (
    <motion.nav 
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-soft"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.button 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div 
              className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center"
              whileHover={{ rotate: 10 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Shield className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            <span className="text-xl font-bold">
              Safe<span className="text-primary">Bazaar</span>
            </span>
          </motion.button>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              to="/#how-it-works" 
              className="text-foreground hover:text-primary transition-colors"
            >
              How It Works
            </Link>
            <Button variant="ghost" asChild>
              <Link to="/scan">Scan Product</Link>
            </Button>
            {isAuthenticated && (
              <Button variant="ghost" asChild>
                <Link to="/history">
                  <History className="h-4 w-4 mr-2" />
                  History
                </Link>
              </Button>
            )}
            <ThemeToggle />
            
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user?.email?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    {user?.profile?.premium && (
                      <Badge className="absolute -top-1 -right-1 h-5 px-1 text-[10px] bg-gradient-primary">
                        PRO
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {user?.profile?.role || "Buyer"} 
                      {user?.profile?.premium && " • Premium"}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/history">
                      <History className="h-4 w-4 mr-2" />
                      Scan History
                    </Link>
                  </DropdownMenuItem>
                  {user?.profile?.role === "seller" && (
                    <DropdownMenuItem asChild>
                      <Link to="/seller">
                        <User className="h-4 w-4 mr-2" />
                        Seller Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {(user?.profile?.is_admin || user?.email === "justinoel254@gmail.com") && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">
                        <Settings className="h-4 w-4 mr-2" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="hero" asChild>
                <Link to="/auth">Get Started</Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button & Theme Toggle */}
          <div className="md:hidden flex items-center gap-3">
            <ThemeToggle />
            <motion.button
              className="p-2"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
              whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              className="md:hidden py-4 overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <motion.div 
                className="flex flex-col gap-4"
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Link 
                  to="/#how-it-works" 
                  className="text-foreground hover:text-primary transition-colors py-2"
                  onClick={closeMenu}
                >
                  How It Works
                </Link>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link to="/scan" onClick={closeMenu}>
                    Scan Product
                  </Link>
                </Button>
                {isAuthenticated && (
                  <>
                    <Button variant="ghost" className="justify-start" asChild>
                      <Link to="/history" onClick={closeMenu}>
                        <History className="h-4 w-4 mr-2" />
                        Scan History
                      </Link>
                    </Button>
                    {user?.profile?.role === "seller" && (
                      <Button variant="ghost" className="justify-start" asChild>
                        <Link to="/seller" onClick={closeMenu}>
                          Seller Dashboard
                        </Link>
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      className="justify-start text-destructive"
                      onClick={() => {
                        handleLogout();
                        closeMenu();
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </>
                )}
                {!isAuthenticated && (
                  <Button variant="hero" asChild>
                    <Link to="/auth" onClick={closeMenu}>
                      Get Started
                    </Link>
                  </Button>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
});

Navigation.displayName = "Navigation";

export default Navigation;
