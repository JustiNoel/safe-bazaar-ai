import { motion } from "framer-motion";

interface ScanningAnimationProps {
  isScanning: boolean;
}

const ScanningAnimation = ({ isScanning }: ScanningAnimationProps) => {
  if (!isScanning) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative w-64 h-64">
        {/* Outer pulsing rings */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2 border-primary/30"
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ 
              scale: [0.5, 1.5 + i * 0.3], 
              opacity: [0.8, 0] 
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeOut"
            }}
          />
        ))}

        {/* Rotating scanner line */}
        <motion.div
          className="absolute inset-4"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute top-1/2 left-1/2 w-1/2 h-0.5 bg-gradient-to-r from-primary to-transparent origin-left -translate-y-1/2" />
        </motion.div>

        {/* Center icon */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center shadow-strong">
            <motion.svg
              className="w-10 h-10 text-primary-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              animate={{ scale: [1, 0.9, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </motion.svg>
          </div>
        </motion.div>

        {/* Scanning text */}
        <motion.div
          className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <p className="text-lg font-semibold text-primary">Analyzing Product...</p>
          <p className="text-sm text-muted-foreground">AI scanning for risks</p>
        </motion.div>
      </div>
    </div>
  );
};

export default ScanningAnimation;
