import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  type: 'shield' | 'check' | 'circle';
}

const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particles: Particle[] = [];
    const particleCount = 30;

    // Kenya theme colors (green, red/orange, black)
    const colors = [
      'hsla(120, 100%, 20%, 0.3)', // Green
      'hsla(24, 100%, 50%, 0.25)', // Orange
      'hsla(0, 0%, 20%, 0.15)',    // Dark
    ];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 20 + 10,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.3 + 0.1,
        type: ['shield', 'check', 'circle'][Math.floor(Math.random() * 3)] as Particle['type'],
      });
    }

    const drawShield = (x: number, y: number, size: number, color: string) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.bezierCurveTo(size * 0.8, -size * 0.8, size, 0, 0, size);
      ctx.bezierCurveTo(-size, 0, -size * 0.8, -size * 0.8, 0, -size);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    };

    const drawCheck = (x: number, y: number, size: number, color: string) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      ctx.moveTo(-size * 0.5, 0);
      ctx.lineTo(-size * 0.1, size * 0.4);
      ctx.lineTo(size * 0.5, -size * 0.4);
      ctx.strokeStyle = color;
      ctx.lineWidth = size * 0.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    };

    const drawCircle = (x: number, y: number, size: number, color: string) => {
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, index) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Wrap around screen
        if (particle.x < -50) particle.x = canvas.width + 50;
        if (particle.x > canvas.width + 50) particle.x = -50;
        if (particle.y < -50) particle.y = canvas.height + 50;
        if (particle.y > canvas.height + 50) particle.y = -50;

        const color = colors[index % colors.length].replace('0.3', String(particle.opacity));

        switch (particle.type) {
          case 'shield':
            drawShield(particle.x, particle.y, particle.size, color);
            break;
          case 'check':
            drawCheck(particle.x, particle.y, particle.size, color);
            break;
          case 'circle':
            drawCircle(particle.x, particle.y, particle.size * 0.5, color);
            break;
        }
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
};

export default ParticleBackground;
