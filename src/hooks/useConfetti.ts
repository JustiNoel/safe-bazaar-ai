import confetti from 'canvas-confetti';

export const useConfetti = () => {
  const triggerConfetti = () => {
    // First burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#006600', '#FF6600', '#000000', '#FFFFFF'], // Kenya colors
    });

    // Side bursts
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#006600', '#FF6600'],
      });
    }, 150);

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#006600', '#FF6600'],
      });
    }, 300);
  };

  const triggerSuccess = () => {
    const duration = 2000;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#006600', '#00CC00'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#006600', '#00CC00'],
      });
    }, 100);
  };

  return { triggerConfetti, triggerSuccess };
};
