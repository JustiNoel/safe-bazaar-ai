import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface CircularGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

const CircularGauge = ({ score, size = 200, strokeWidth = 12 }: CircularGaugeProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedScore / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 70) return "hsl(var(--success))";
    if (score >= 40) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  };

  const getVerdict = (score: number) => {
    if (score >= 70) return { text: "SAFE", emoji: "✓" };
    if (score >= 40) return { text: "CAUTION", emoji: "!" };
    return { text: "RISKY", emoji: "✗" };
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 300);
    return () => clearTimeout(timer);
  }, [score]);

  const verdict = getVerdict(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
          style={{
            filter: `drop-shadow(0 0 10px ${getColor(score)})`,
          }}
        />
      </svg>

      {/* Center content */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <motion.span
          className="text-4xl font-bold"
          style={{ color: getColor(score) }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {animatedScore}
        </motion.span>
        <motion.span
          className="text-sm font-semibold mt-1"
          style={{ color: getColor(score) }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          {verdict.text}
        </motion.span>
      </motion.div>

      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
        style={{
          background: `radial-gradient(circle, ${getColor(score)}20 0%, transparent 70%)`,
        }}
      />
    </div>
  );
};

export default CircularGauge;
