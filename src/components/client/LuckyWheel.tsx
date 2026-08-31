import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Sparkles } from 'lucide-react';
import type { Reward } from '../../lib/types';

interface LuckyWheelProps {
  rewards: Reward[];
  onRewardWon: (reward: Reward) => void;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  restaurantName?: string;
}

export const LuckyWheel: React.FC<LuckyWheelProps> = ({
  rewards,
  onRewardWon,
  primaryColor = '#7C3AED',
  secondaryColor = '#A855F7',
}) => {

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [hasSpun, setHasSpun] = useState(false);
  const [winningReward, setWinningReward] = useState<Reward | null>(null);

  // Cache d'images PNG des lots
  const imagesCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [imagesLoaded, setImagesLoaded] = useState(0);

  // Préchargement des visuels PNG de chaque lot
  useEffect(() => {
    rewards.forEach((r) => {
      if (r.image_url && !imagesCacheRef.current.has(r.image_url)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = r.image_url;
        img.onload = () => {
          imagesCacheRef.current.set(r.image_url!, img);
          setImagesLoaded((prev) => prev + 1);
        };
      }
    });
  }, [rewards]);

  // Synthétiseur audio de cliquetis métallique (Web Audio API)
  const playClickSound = useCallback((speedFactor = 1) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const baseFreq = 580 * (0.85 + 0.35 * speedFactor);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.025);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.035);

      if (navigator.vibrate) {
        navigator.vibrate(8);
      }
    } catch {
      // Audio context silencieux si non autorisé
    }
  }, []);

  // Alternance bicolore élégante violet / lilas (ou basée sur le thème du restaurant)
  const getSliceColor = (_reward: Reward, index: number, total: number) => {
    const palette = [
      primaryColor || '#7C3AED',
      secondaryColor || '#A855F7',
    ];
    let color = palette[index % palette.length];
    // Évite la même couleur consécutive sur un nombre impair de segments
    if (total % 2 !== 0 && index === total - 1) {
      color = '#6366F1'; // Teinte indigo complémentaire
    }
    return color;
  };

  // Typographie adaptative
  const getWrappedText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxLines = 2
  ): { lines: string[]; fontSize: number; lineHeight: number } => {
    let fontSize = 12.5;
    while (fontSize >= 7.5) {
      ctx.font = `900 ${fontSize}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = words[0] || '';

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const testWidth = ctx.measureText(currentLine + ' ' + word).width;
        if (testWidth < maxWidth) {
          currentLine += ' ' + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);

      if (lines.length <= maxLines && lines.every((l) => ctx.measureText(l).width <= maxWidth)) {
        return { lines, fontSize, lineHeight: fontSize * 1.15 };
      }
      fontSize -= 0.5;
    }
    return { lines: [text], fontSize: 7.5, lineHeight: 9 };
  };

  // Moteur Canvas High-DPI 60 FPS
  const drawWheel = useCallback(
    (angleOffset: number) => {
      const canvas = canvasRef.current;
      if (!canvas || rewards.length === 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2;
      const cssSize = 340;

      if (canvas.width !== cssSize * dpr || canvas.height !== cssSize * dpr) {
        canvas.width = cssSize * dpr;
        canvas.height = cssSize * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, cssSize, cssSize);

      const center = cssSize / 2;
      const radius = center - 14;
      const totalSegments = rewards.length;
      const segmentAngle = (2 * Math.PI) / totalSegments;

      // 1. OMBRE PORTÉE EXTÉRIEURE DOUCE & CONTOUR BLANC ÉPAIS
      ctx.save();
      ctx.translate(center, center);

      // Ombre portée sous la roue
      ctx.beginPath();
      ctx.arc(0, 0, radius + 8, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Anneau extérieur blanc épais et net
      ctx.beginPath();
      ctx.arc(0, 0, radius + 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // 2. ROTATION DES SECTEURS
      ctx.rotate(angleOffset);

      rewards.forEach((reward, i) => {
        const startAngle = i * segmentAngle;
        const endAngle = startAngle + segmentAngle;
        const sliceColor = getSliceColor(reward, i, totalSegments);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, startAngle, endAngle);
        ctx.closePath();

        // Remplissage du secteur
        ctx.fillStyle = sliceColor;
        ctx.fill();

        // Liseré blanc net entre les tranches
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();

        // 3. IMAGE PNG & TEXTE EN BLANC BOLD RADIAL
        ctx.save();
        const midAngle = startAngle + segmentAngle / 2;
        ctx.rotate(midAngle);

        const maxLabelRadius = radius - 20;
        const minLabelRadius = 45;
        const availableLength = maxLabelRadius - minLabelRadius;

        // Image PNG du lot si disponible
        const cachedImg = reward.image_url ? imagesCacheRef.current.get(reward.image_url) : null;
        const hasImage = cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0;

        if (hasImage && cachedImg) {
          const imgSize = Math.min(32, segmentAngle * radius * 0.4);
          const imgX = radius - 36;
          const imgY = -imgSize / 2;

          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
          ctx.shadowBlur = 4;
          ctx.drawImage(cachedImg, imgX, imgY, imgSize, imgSize);
          ctx.restore();
        }

        // Texte du lot en blanc pur gras
        const textMaxWidth = hasImage ? availableLength - 32 : availableLength;
        const { lines, fontSize, lineHeight } = getWrappedText(ctx, reward.label, textMaxWidth, 2);

        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `900 ${fontSize}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;

        // Légère ombre portée sous le texte
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
        ctx.shadowBlur = 3;

        const textTargetX = hasImage ? radius - 42 : radius - 18;
        const startY = -((lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, lineIdx) => {
          const y = startY + lineIdx * lineHeight;
          ctx.fillText(line, textTargetX, y);
        });

        ctx.restore();
        ctx.restore();
      });

      // 4. MOYEU CENTRAL SOMBRE & ANNEAU
      ctx.restore(); // Retour au centre fixe

      // Anneau blanc autour du moyeu central
      ctx.beginPath();
      ctx.arc(center, center, 32, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(15, 23, 42, 0.15)';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Disque central bleu nuit / noir (#0A192F)
      ctx.beginPath();
      ctx.arc(center, center, 24, 0, 2 * Math.PI);
      ctx.fillStyle = '#0A192F';
      ctx.fill();

      // Point central blanc
      ctx.beginPath();
      ctx.arc(center, center, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // 5. POINTEUR CENTRAL POINTANT VERS LE HAUT (STYLE MALOU)
      ctx.save();
      ctx.translate(center, center);
      ctx.beginPath();
      ctx.moveTo(0, -38); // Pointe vers le haut à 12h
      ctx.lineTo(-12, -14);
      ctx.lineTo(12, -14);
      ctx.closePath();
      ctx.fillStyle = '#0A192F';
      ctx.shadowColor = 'rgba(15, 23, 42, 0.25)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = -2;
      ctx.fill();
      ctx.restore();

      ctx.restore();
    },
    [rewards, primaryColor, secondaryColor, imagesLoaded]
  );

  useEffect(() => {
    drawWheel(currentRotation);
  }, [drawWheel, currentRotation, imagesLoaded]);

  // Tirage au sort pondéré
  const pickWeightedReward = (): { reward: Reward; index: number } => {
    const totalProb = rewards.reduce((sum, r) => sum + (Number(r.probability) || 0), 0);
    const rand = Math.random() * (totalProb > 0 ? totalProb : 100);

    let cum = 0;
    for (let i = 0; i < rewards.length; i++) {
      cum += Number(rewards[i].probability) || 0;
      if (rand <= cum) {
        return { reward: rewards[i], index: i };
      }
    }
    return { reward: rewards[0], index: 0 };
  };

  // Animation de rotation avec décélération fluide (Ease-Out quartique)
  const handleSpin = () => {
    if (isSpinning || hasSpun || rewards.length === 0) return;
    setIsSpinning(true);
    setHasSpun(true);

    const { reward: winning, index: winningIndex } = pickWeightedReward();
    setWinningReward(winning);

    const totalSegments = rewards.length;
    const segmentAngle = (2 * Math.PI) / totalSegments;

    // Le pointeur central pointe vers 12h (angle 3*PI/2)
    const targetSliceAngle = winningIndex * segmentAngle + segmentAngle / 2;
    const baseSpins = 8 * 2 * Math.PI;
    const targetAngle = (1.5 * Math.PI - targetSliceAngle + 2 * Math.PI) % (2 * Math.PI);
    const totalSpinRotation = currentRotation + baseSpins + (targetAngle - (currentRotation % (2 * Math.PI)));

    const startTime = performance.now();
    const duration = 4800;
    const startRotation = currentRotation;
    let lastPinTick = 0;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing Quartique
      const easeOut = 1 - Math.pow(1 - progress, 4);
      const angle = startRotation + (totalSpinRotation - startRotation) * easeOut;

      const pinIndex = Math.floor(angle / segmentAngle);
      if (pinIndex !== lastPinTick) {
        lastPinTick = pinIndex;
        playClickSound(1 - progress);
      }

      setCurrentRotation(angle);
      drawWheel(angle);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);

        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#7C3AED', '#A855F7', '#F59E0B', '#10B981', '#6366F1'],
          });
        } catch {}

        setTimeout(() => {
          onRewardWon(winning);
        }, 900);
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      {/* Conteneur de la Roue Canvas */}
      <div className="relative w-[320px] h-[320px] sm:w-[340px] sm:h-[340px] flex items-center justify-center mb-6 select-none">
        <canvas
          ref={canvasRef}
          style={{ width: '340px', height: '340px' }}
          className="w-full h-full rounded-full cursor-pointer touch-none filter drop-shadow-xl"
          onClick={handleSpin}
        />
      </div>

      {/* BOUTON D'ACTION BLEU NUIT (#0A192F) */}
      <motion.button
        whileHover={{ scale: isSpinning || hasSpun ? 1 : 1.02 }}
        whileTap={{ scale: isSpinning || hasSpun ? 1 : 0.98 }}
        onClick={handleSpin}
        disabled={isSpinning || hasSpun}
        className="w-full max-w-xs py-4 px-6 rounded-2xl bg-[#0A192F] hover:bg-[#112240] text-white font-black text-base shadow-xl shadow-slate-900/15 transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        {isSpinning ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
            <span>Tirage en cours...</span>
          </div>
        ) : hasSpun ? (
          <div className="flex items-center gap-2 text-amber-300">
            <Sparkles className="w-5 h-5" />
            <span>Cadeau Remporté !</span>
          </div>
        ) : (
          <>
            <span>Tourner la roue</span>
          </>
        )}
      </motion.button>

      {/* Gain affiché à la fin */}
      {winningReward && !isSpinning && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-center text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl"
        >
          🎁 Vous avez remporté : <strong>{winningReward.label}</strong>
        </motion.div>
      )}
    </div>
  );
};