import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { toast } from 'sonner';

interface VoiceReadoutProps {
  text: string;
  autoPlay?: boolean;
}

export const VoiceReadout: React.FC<VoiceReadoutProps> = ({ text, autoPlay = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const { hasVoiceReadout, isPremium } = usePremiumFeatures();

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      return;
    }

    const newUtterance = new SpeechSynthesisUtterance(text);
    newUtterance.lang = 'en-KE';
    newUtterance.rate = 0.9;
    newUtterance.pitch = 1;
    
    newUtterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    newUtterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    setUtterance(newUtterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [text]);

  useEffect(() => {
    if (autoPlay && utterance && hasVoiceReadout) {
      handlePlay();
    }
  }, [autoPlay, utterance, hasVoiceReadout]);

  const handlePlay = useCallback(() => {
    if (!utterance) return;

    if (!isPremium) {
      toast.error('Voice readout is a premium feature. Upgrade to unlock!');
      return;
    }

    if (!hasVoiceReadout) {
      toast.info('Enable voice readout in your profile settings');
      return;
    }

    if (!('speechSynthesis' in window)) {
      toast.error('Your browser does not support voice readout');
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
    setIsPlaying(true);
  }, [utterance, isPaused, isPremium, hasVoiceReadout]);

  const handlePause = useCallback(() => {
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, []);

  const handleStop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  if (!('speechSynthesis' in window)) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {isPlaying ? (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={isPaused ? handlePlay : handlePause}
            className="gap-2"
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleStop}
            className="gap-2"
          >
            <VolumeX className="h-4 w-4" />
            Stop
          </Button>
        </>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handlePlay}
          className="gap-2"
          disabled={!isPremium}
        >
          <Volume2 className="h-4 w-4" />
          {isPremium ? 'Read Aloud' : 'Premium Feature'}
        </Button>
      )}
    </div>
  );
};

export default VoiceReadout;
