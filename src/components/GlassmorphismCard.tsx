import { motion } from "framer-motion";
import { ReactNode, useRef, useState } from "react";

interface GlassmorphismCardProps {
  children: ReactNode;
  className?: string;
  index?: number;
}

const GlassmorphismCard = ({ children, className = "", index = 0 }: GlassmorphismCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    const rotateXValue = (mouseY / (rect.height / 2)) * -8;
    const rotateYValue = (mouseX / (rect.width / 2)) * 8;
    
    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.15,
        type: "spring",
        stiffness: 100
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transformStyle: 'preserve-3d',
      }}
      className={`
        relative p-6 rounded-xl
        bg-card/70 backdrop-blur-xl
        border border-border/50
        shadow-medium
        transition-all duration-300 ease-out
        hover:shadow-strong
        hover:border-primary/30
        before:absolute before:inset-0 before:rounded-xl
        before:bg-gradient-to-br before:from-primary/5 before:to-secondary/5
        before:opacity-0 before:transition-opacity before:duration-300
        hover:before:opacity-100
        overflow-hidden
        ${className}
      `}
    >
      {/* Gradient border glow effect */}
      <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-[-1px] rounded-xl bg-gradient-to-br from-primary/20 via-transparent to-secondary/20" />
      </div>
      
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default GlassmorphismCard;
