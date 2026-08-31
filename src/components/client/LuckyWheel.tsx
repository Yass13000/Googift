import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Sparkles, Gift } from 'lucide-react';
import type { Reward } from '../../lib/types';

interface LuckyWheelProps {
  rewards: Reward[];
  onRewardWon: (reward: Reward) => void;
  // Propriétés du thème dynamique du restaurant
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  logoUrl?: string | null;
  restaurantName?: string;
}

export const LuckyWheel: React.FC<LuckyWheelProps> = ({
  rewards,
  onRewardWon,
  primaryColor = '#f16022',
  secondaryColor = '#283b25',
  accentColor = '#b8c073',
  backgroundColor = 'rgba(15, 23, 42, 0.92)',
  logoUrl = null,
  restaurantName = 'Notre Établissement',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [hasSpun, setHasSpun] = useState(false);
  const [pegTick, setPegTick] = useState(false);
  const [winningReward, setWinningReward] = useState<Reward | null>(null);

  // Cache d'images (PNGs des lots & Logo central)
  const imagesCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const logoImageRef = useRef<HTMLImageElement | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(0);

  // 1. Préchargement du logo restaurant
  useEffect(() => {
    if (logoUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = logoUrl;
      img.onload = () => {
        logoImageRef.current = img;
        setImagesLoaded(prev => prev + 1);
      };
    } else {
      logoImageRef.current = null;
    }
  }, [logoUrl]);

  // 2. Préchargement des visuels PNG de chaque lot
  useEffect(() => {
    rewards.forEach((r) => {
      if (r.image_url && !imagesCacheRef.current.has(r.image_url)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = r.image_url;
        img.onload = () => {
          imagesCacheRef.current.set(r.image_url!, img);
          setImagesLoaded(prev => prev + 1);
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

      const baseFreq = 620 * (0.85 + 0.35 * speedFactor);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.025);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.035);

      if (navigator.vibrate) {
        navigator.vibrate(8);
      }
    } catch {
      // Audio context silencieux si bloqué par le navigateur
    }
  }, []);

  // Palette harmonique de secours basée sur le thème du restaurant
  const getSliceColor = (reward: Reward, index: number, total: number) => {
    if (reward.color && reward.color.trim() !== '') return reward.color;

    const brandPalette = [primaryColor, secondaryColor, accentColor, '#1E293B'];
    let color = brandPalette[index % brandPalette.length];

    // Évite d'avoir la même couleur sur le premier et le dernier segment
    if (index === total - 1 && color === brandPalette[0]) {
      color = brandPalette[1 % brandPalette.length];
    }
    return color;
  };

  // Algorithme de calcul typographique adaptatif (aucun texte coupé)
  const getWrappedText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxLines = 2
  ): { lines: string[]; fontSize: number; lineHeight: number } => {
    let fontSize = 12.5;
    while (fontSize >= 7.5) {
      ctx.font = `bold ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
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

      if (lines.length <= maxLines && lines.every(l => ctx.measureText(l).width <= maxWidth)) {
        return { lines, fontSize, lineHeight: fontSize * 1.15 };
      }
      fontSize -= 0.5;
    }
    return { lines: [text], fontSize: 7.5, lineHeight: 9 };
  };

  // Moteur de rendu Canvas High-DPI (Retina)
  const drawWheel = useCallback((angleOffset: number, ledPhase = 0) => {
    const canvas = canvasRef.current;
    if (!canvas || rewards.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 2) : 2;
    const cssSize = 360;

    if (canvas.width !== cssSize * dpr || canvas.height !== cssSize * dpr) {
      canvas.width = cssSize * dpr;
      canvas.height = cssSize * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssSize, cssSize);

    const center = cssSize / 2;
    const radius = center - 20;
    const totalSegments = rewards.length;
    const segmentAngle = (2 * Math.PI) / totalSegments;

    // 1. ANNEAU EXTERNE MÉTALLISÉ & OMBRE PORTÉE
    ctx.save();
    ctx.translate(center, center);

    ctx.beginPath();
    ctx.arc(0, 0, radius + 18, 0, 2 * Math.PI);
    ctx.fillStyle = '#0B0F19';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 6;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Bordure en biseau chromé avec reflets
    const chromeGrad = ctx.createLinearGradient(-radius - 16, -radius - 16, radius + 16, radius + 16);
    chromeGrad.addColorStop(0, '#334155');
    chromeGrad.addColorStop(0.2, '#F8FAFC');
    chromeGrad.addColorStop(0.5, '#64748B');
    chromeGrad.addColorStop(0.8, '#E2E8F0');
    chromeGrad.addColorStop(1, '#1E293B');
    ctx.beginPath();
    ctx.arc(0, 0, radius + 16, 0, 2 * Math.PI);
    ctx.fillStyle = chromeGrad;
    ctx.fill();

    // Anneau sombre intérieur accueillant les LEDs
    ctx.beginPath();
    ctx.arc(0, 0, radius + 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#090D16';
    ctx.fill();

    // 2. LEDS CLIGNOTANTES COORDONNÉES AU THÈME
    const numLeds = Math.max(18, totalSegments * 3);
    for (let l = 0; l < numLeds; l++) {
      const ledAngle = (l * 2 * Math.PI) / numLeds;
      const lx = (radius + 13) * Math.cos(ledAngle);
      const ly = (radius + 13) * Math.sin(ledAngle);

      const isLit = (l + ledPhase) % 2 === 0;

      ctx.beginPath();
      ctx.arc(lx, ly, isLit ? 3 : 2, 0, 2 * Math.PI);
      ctx.fillStyle = isLit ? (accentColor || '#FDE047') : '#64748B';
      if (isLit) {
        ctx.shadowColor = accentColor || '#FDE047';
        ctx.shadowBlur = 6;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 3. SECTEURS & CONTENU DE LA ROUE
    ctx.rotate(angleOffset);

    rewards.forEach((reward, i) => {
      const startAngle = i * segmentAngle;
      const endAngle = startAngle + segmentAngle;
      const baseColor = getSliceColor(reward, i, totalSegments);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      // Dégradé radial avec reflet lumineux vers le centre
      const sliceGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, radius);
      sliceGrad.addColorStop(0, '#FFFFFF');
      sliceGrad.addColorStop(0.18, baseColor);
      sliceGrad.addColorStop(1, baseColor);
      ctx.fillStyle = sliceGrad;
      ctx.fill();

      // Séparateurs de tranches fins et élégants
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.stroke();

      // 4. IMAGE PNG & TEXTE ADAPTATIF DU LOT
      ctx.save();
      const midAngle = startAngle + segmentAngle / 2;
      ctx.rotate(midAngle);

      const maxLabelRadius = radius - 24;
      const minLabelRadius = 55;
      const availableLength = maxLabelRadius - minLabelRadius;

      // Dessin de l'image PNG si présente
      const cachedImg = reward.image_url ? imagesCacheRef.current.get(reward.image_url) : null;
      const hasImage = cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0;

      if (hasImage && cachedImg) {
        const imgSize = Math.min(36, segmentAngle * radius * 0.42);
        const imgX = radius - 38;
        const imgY = -imgSize / 2;

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 6;
        ctx.drawImage(cachedImg, imgX, imgY, imgSize, imgSize);
        ctx.restore();
      }

      // Dessin du texte dynamique
      const textMaxWidth = hasImage ? availableLength - 34 : availableLength;
      const { lines, fontSize, lineHeight } = getWrappedText(ctx, reward.label, textMaxWidth, 2);

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

      // Ombre portée fine pour garantir la lisibilité
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';

      const textTargetX = hasImage ? radius - 44 : radius - 18;
      const startY = -((lines.length - 1) * lineHeight) / 2;

      lines.forEach((line, lineIdx) => {
        const y = startY + lineIdx * lineHeight;
        ctx.strokeText(line, textTargetX, y);
        ctx.fillText(line, textTargetX, y);
      });

      ctx.restore();
      ctx.restore();
    });

    // 5. PICOTS EN LAITON SUR LE PÉRIMÈTRE
    for (let p = 0; p < totalSegments; p++) {
      const pegAngle = p * segmentAngle;
      const px = (radius - 2) * Math.cos(pegAngle);
      const py = (radius - 2) * Math.sin(pegAngle);

      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#F8FAFC';
      ctx.fill();

      ctx.lineWidth = 1;
      ctx.strokeStyle = '#475569';
      ctx.stroke();
    }

    // 6. MOYEU CENTRAL AVEC LOGO DU RESTAURANT
    ctx.restore(); // Retour au centre fixe

    // Ombre sous le moyeu
    ctx.beginPath();
    ctx.arc(center, center, 38, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fill();

    // Couronne chromée centrale
    const hubChrome = ctx.createLinearGradient(center - 32, center - 32, center + 32, center + 32);
    hubChrome.addColorStop(0, '#FFFFFF');
    hubChrome.addColorStop(0.5, '#64748B');
    hubChrome.addColorStop(1, '#0F172A');
    ctx.beginPath();
    ctx.arc(center, center, 32, 0, 2 * Math.PI);
    ctx.fillStyle = hubChrome;
    ctx.fill();

    // Disque intérieur avec logo ou couleur principale
    const hubInnerRadius = 25;
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, hubInnerRadius, 0, 2 * Math.PI);
    ctx.clip();

    if (logoImageRef.current && logoImageRef.current.complete && logoImageRef.current.naturalWidth > 0) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.drawImage(
        logoImageRef.current,
        center - hubInnerRadius + 3,
        center - hubInnerRadius + 3,
        (hubInnerRadius - 3) * 2,
        (hubInnerRadius - 3) * 2
      );
    } else {
      const brandHubGrad = ctx.createRadialGradient(center - 4, center - 4, 2, center, center, hubInnerRadius);
      brandHubGrad.addColorStop(0, '#FFFFFF');
      brandHubGrad.addColorStop(0.35, primaryColor);
      brandHubGrad.addColorStop(1, '#090D16');
      ctx.fillStyle = brandHubGrad;
      ctx.fill();
    }
    ctx.restore();

    // Liseré blanc autour du disque central
    ctx.beginPath();
    ctx.arc(center, center, hubInnerRadius, 0, 2 * Math.PI);
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.stroke();

    ctx.restore();
  }, [rewards, primaryColor, secondaryColor, accentColor, imagesLoaded]);

  useEffect(() => {
    drawWheel(currentRotation);
  }, [drawWheel, currentRotation, imagesLoaded]);

  // Sélection pondérée du lot
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

  // Animation de rotation avec décélération quartique
  const handleSpin = () => {
    if (isSpinning || hasSpun || rewards.length === 0) return;
    setIsSpinning(true);
    setHasSpun(true);

    const { reward: winning, index: winningIndex } = pickWeightedReward();
    setWinningReward(winning);

    const totalSegments = rewards.length;
    const segmentAngle = (2 * Math.PI) / totalSegments;

    // Pointeur situé à 12h (angle 3*PI/2)
    const targetSliceAngle = winningIndex * segmentAngle + segmentAngle / 2;
    const baseSpins = 8 * 2 * Math.PI;
    const targetAngle = (1.5 * Math.PI - targetSliceAngle + 2 * Math.PI) % (2 * Math.PI);
    const totalSpinRotation = currentRotation + baseSpins + (targetAngle - (currentRotation % (2 * Math.PI)));

    const startTime = performance.now();
    const duration = 5000;
    const startRotation = currentRotation;
    let lastPinTick = 0;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Courbe Ease-Out quartique
      const easeOut = 1 - Math.pow(1 - progress, 4);
      const angle = startRotation + (totalSpinRotation - startRotation) * easeOut;

      const pinIndex = Math.floor(angle / segmentAngle);
      if (pinIndex !== lastPinTick) {
        lastPinTick = pinIndex;
        playClickSound(1 - progress);
        setPegTick(true);
        setTimeout(() => setPegTick(false), 35);
      }

      const ledPhase = Math.floor(now / 110);
      setCurrentRotation(angle);
      drawWheel(angle, ledPhase);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);

        try {
          confetti({
            particleCount: 90,
            spread: 75,
            origin: { y: 0.6 },
            colors: [primaryColor, accentColor, '#F59E0B', '#10B981', '#FFFFFF']
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
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center p-6 sm:p-8 rounded-3xl sm:rounded-4xl shadow-2xl border border-white/10 max-w-md w-full mx-auto relative overflow-hidden backdrop-blur-2xl"
      style={{
        backgroundColor: backgroundColor || 'rgba(15, 23, 42, 0.92)',
        boxShadow: `0 20px 50px -15px ${primaryColor}33`,
      }}
    >
      {/* Lueur d'ambiance dynamique du restaurant */}
      <div
        className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{ backgroundColor: primaryColor }}
      />
      <div
        className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: accentColor }}
      />

      {/* Badge du Restaurant */}
      <div
        className="flex items-center gap-2 border px-4 py-1.5 rounded-full mb-3 text-xs font-black uppercase tracking-wider shadow-sm"
        style={{
          backgroundColor: `${primaryColor}1A`,
          borderColor: `${primaryColor}4D`,
          color: accentColor || '#FDE047',
        }}
      >
        <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
        <span>{restaurantName} • 100% Gagnant</span>
      </div>

      <h2 className="text-2xl font-black text-white tracking-tight mb-1 text-center">
        Tournez & Gagnez !
      </h2>
      <p className="text-slate-300 text-xs text-center mb-6 max-w-xs font-medium">
        Touchez la roue ou le bouton pour remporter votre cadeau immédiatement.
      </p>

      {/* CONTENEUR DE LA ROUE & AIGUILLE 3D */}
      <div className="relative w-[340px] h-[340px] sm:w-[360px] sm:h-[360px] flex items-center justify-center mb-6 select-none">
        {/* Aiguille supérieure stylisée aux couleurs du restaurant */}
        <motion.div
          animate={{
            rotate: pegTick ? -12 : 0,
            scale: pegTick ? 1.15 : 1
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          className="absolute -top-3 z-30 flex flex-col items-center pointer-events-none drop-shadow-2xl"
        >
          <div className="w-9 h-12 relative flex items-center justify-center">
            <svg viewBox="0 0 36 48" className="w-9 h-12 filter drop-shadow-md">
              <path
                d="M 18,46 L 4,14 C 0,6 6,0 18,0 C 30,0 36,6 32,14 Z"
                fill="url(#themeNeedleGrad)"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              <circle cx="18" cy="14" r="5" fill="#FFFFFF" stroke={primaryColor} strokeWidth="1.5" />
              <defs>
                <linearGradient id="themeNeedleGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={primaryColor} />
                  <stop offset="60%" stopColor={accentColor || '#F59E0B'} />
                  <stop offset="100%" stopColor={primaryColor} />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </motion.div>

        {/* Canvas Haute Définition */}
        <canvas
          ref={canvasRef}
          style={{ width: '360px', height: '360px' }}
          className="w-full h-full rounded-full cursor-pointer touch-none"
          onClick={handleSpin}
        />
      </div>

      {/* BOUTON D'ACTION DYNAMIQUE */}
      <button
        onClick={handleSpin}
        disabled={isSpinning || hasSpun}
        className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl text-white font-black text-base shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
        style={{
          backgroundColor: primaryColor,
          boxShadow: `0 10px 25px -5px ${primaryColor}80`
        }}
      >
        {isSpinning ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
            <span>Tirage en cours...</span>
          </div>
        ) : hasSpun ? (
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span>Cadeau Remporté !</span>
          </div>
        ) : (
          <>
            <Gift className="w-5 h-5" />
            <span>Lancer la Roue</span>
          </>
        )}
      </button>

      {/* Libellé du gain */}
      {winningReward && !isSpinning && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-center text-xs font-bold text-amber-300 animate-pulse"
        >
          🎁 Vous avez gagné : <strong>{winningReward.label}</strong>
        </motion.div>
      )}

      <p className="text-[11px] text-slate-400 mt-3 text-center">
        🔒 1 participation par client • Offre valable immédiatement
      </p>
    </motion.div>
  );
};