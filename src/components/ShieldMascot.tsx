import { motion } from "framer-motion";

interface ShieldMascotProps {
  isPasswordFocused: boolean;
  className?: string;
}

const ShieldMascot = ({ isPasswordFocused, className = "" }: ShieldMascotProps) => {
  return (
    <div className={`flex justify-center ${className}`}>
      <motion.div
        className="relative w-32 h-32"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
      >
        {/* Shield Body */}
        <motion.svg
          viewBox="0 0 100 120"
          className="w-full h-full"
          animate={{ 
            y: [0, -3, 0],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          {/* Shield Shape with Gradient */}
          <defs>
            <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--accent))" />
            </linearGradient>
            <linearGradient id="shieldHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          
          {/* Main Shield */}
          <motion.path
            d="M50 5 L90 20 L90 55 C90 85 50 110 50 110 C50 110 10 85 10 55 L10 20 Z"
            fill="url(#shieldGradient)"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            animate={{
              scale: isPasswordFocused ? [1, 1.02, 1] : 1,
            }}
            transition={{ duration: 0.3 }}
          />
          
          {/* Shield Highlight */}
          <path
            d="M50 8 L85 21 L85 54 C85 80 50 103 50 103 C50 103 15 80 15 54 L15 21 Z"
            fill="url(#shieldHighlight)"
            opacity="0.3"
          />
          
          {/* Face Container */}
          <g transform="translate(50, 55)">
            {/* Left Eye */}
            <motion.g
              animate={{
                scaleY: isPasswordFocused ? 0.1 : 1,
              }}
              transition={{ duration: 0.3 }}
              style={{ originY: "50%" }}
            >
              <ellipse
                cx="-15"
                cy="0"
                rx="8"
                ry="10"
                fill="white"
              />
              <motion.ellipse
                cx="-15"
                cy="2"
                rx="4"
                ry="5"
                fill="hsl(var(--foreground))"
                animate={{
                  cy: isPasswordFocused ? 0 : 2,
                }}
              />
              {/* Eye shine */}
              <circle cx="-17" cy="-2" r="2" fill="white" opacity="0.8" />
            </motion.g>
            
            {/* Right Eye */}
            <motion.g
              animate={{
                scaleY: isPasswordFocused ? 0.1 : 1,
              }}
              transition={{ duration: 0.3 }}
              style={{ originY: "50%" }}
            >
              <ellipse
                cx="15"
                cy="0"
                rx="8"
                ry="10"
                fill="white"
              />
              <motion.ellipse
                cx="15"
                cy="2"
                rx="4"
                ry="5"
                fill="hsl(var(--foreground))"
                animate={{
                  cy: isPasswordFocused ? 0 : 2,
                }}
              />
              {/* Eye shine */}
              <circle cx="13" cy="-2" r="2" fill="white" opacity="0.8" />
            </motion.g>
            
            {/* Eyebrows when covering eyes */}
            <motion.g
              animate={{
                opacity: isPasswordFocused ? 1 : 0,
                y: isPasswordFocused ? -5 : -15,
              }}
              transition={{ duration: 0.3 }}
            >
              {/* Hands covering eyes */}
              <ellipse cx="-15" cy="0" rx="12" ry="8" fill="hsl(var(--primary))" opacity="0.9" />
              <ellipse cx="15" cy="0" rx="12" ry="8" fill="hsl(var(--primary))" opacity="0.9" />
              {/* Finger details */}
              <ellipse cx="-20" cy="-2" rx="4" ry="6" fill="hsl(var(--primary))" />
              <ellipse cx="-10" cy="-2" rx="4" ry="6" fill="hsl(var(--primary))" />
              <ellipse cx="10" cy="-2" rx="4" ry="6" fill="hsl(var(--primary))" />
              <ellipse cx="20" cy="-2" rx="4" ry="6" fill="hsl(var(--primary))" />
            </motion.g>
            
            {/* Mouth */}
            <motion.path
              d="M-10 20 Q0 28 10 20"
              fill="none"
              stroke="hsl(var(--foreground))"
              strokeWidth="3"
              strokeLinecap="round"
              animate={{
                d: isPasswordFocused 
                  ? "M-8 22 Q0 22 8 22" 
                  : "M-10 20 Q0 28 10 20",
              }}
              transition={{ duration: 0.3 }}
            />
          </g>
          
          {/* Checkmark Badge */}
          <motion.g
            transform="translate(70, 80)"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            <circle cx="0" cy="0" r="12" fill="hsl(var(--success))" />
            <path
              d="M-5 0 L-2 3 L5 -4"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.g>
        </motion.svg>
        
        {/* Sparkles */}
        <motion.div
          className="absolute -top-2 -left-2"
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{ duration: 2, repeat: Infinity, delay: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path
              d="M8 0 L9 6 L16 8 L9 10 L8 16 L7 10 L0 8 L7 6 Z"
              fill="hsl(var(--accent))"
            />
          </svg>
        </motion.div>
        
        <motion.div
          className="absolute -top-1 -right-3"
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16">
            <path
              d="M8 0 L9 6 L16 8 L9 10 L8 16 L7 10 L0 8 L7 6 Z"
              fill="hsl(var(--primary))"
            />
          </svg>
        </motion.div>
        
        <motion.div
          className="absolute bottom-4 -left-4"
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        >
          <svg width="10" height="10" viewBox="0 0 16 16">
            <path
              d="M8 0 L9 6 L16 8 L9 10 L8 16 L7 10 L0 8 L7 6 Z"
              fill="hsl(var(--success))"
            />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ShieldMascot;