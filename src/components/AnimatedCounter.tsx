import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

interface AnimatedCounterProps {
  value: number | string;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

const AnimatedCounter = ({ 
  value, 
  suffix = "", 
  prefix = "",
  duration = 2,
  className = ""
}: AnimatedCounterProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;

  useEffect(() => {
    if (!isInView) return;
    
    const startTime = Date.now();
    const endTime = startTime + duration * 1000;
    
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      
      // Easing function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(numericValue * easeOut);
      
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(numericValue);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isInView, numericValue, duration]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, type: "spring" }}
      className={className}
    >
      {prefix}{displayValue}{suffix}
    </motion.div>
  );
};

export default AnimatedCounter;
