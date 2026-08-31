import fs from 'fs';
import path from 'path';

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0B0F19"/>
    </linearGradient>
    <linearGradient id="giftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F43F5E"/>
      <stop offset="50%" stop-color="#E11D48"/>
      <stop offset="100%" stop-color="#BE123C"/>
    </linearGradient>
    <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background rounded rect -->
  <rect width="512" height="512" rx="128" fill="url(#bgGrad)"/>
  
  <!-- Outer glowing accent ring -->
  <circle cx="256" cy="256" r="210" fill="none" stroke="url(#giftGrad)" stroke-width="6" opacity="0.3"/>

  <!-- Gift Box Body -->
  <g filter="url(#glow)">
    <!-- Box bottom -->
    <rect x="136" y="240" width="240" height="170" rx="20" fill="url(#giftGrad)"/>
    <!-- Box lid -->
    <rect x="116" y="196" width="280" height="56" rx="16" fill="#FB7185"/>

    <!-- Vertical Ribbon -->
    <rect x="232" y="196" width="48" height="214" fill="url(#ribbonGrad)"/>
    <!-- Horizontal Ribbon on body -->
    <rect x="136" y="310" width="240" height="32" fill="url(#ribbonGrad)"/>

    <!-- Ribbon Bows -->
    <path d="M 256,196 C 220,120 150,130 180,180 C 196,204 236,200 256,196 Z" fill="url(#ribbonGrad)"/>
    <path d="M 256,196 C 292,120 362,130 332,180 C 316,204 276,200 256,196 Z" fill="url(#ribbonGrad)"/>
    <circle cx="256" cy="196" r="18" fill="#FEF08A"/>
  </g>

  <!-- Star Sparkles -->
  <path d="M 390,130 Q 400,150 420,160 Q 400,170 390,190 Q 380,170 360,160 Q 380,150 390,130 Z" fill="#FDE047"/>
  <path d="M 120,330 Q 128,345 142,352 Q 128,360 120,374 Q 112,360 98,352 Q 112,345 120,330 Z" fill="#F43F5E"/>
  <circle cx="140" cy="130" r="8" fill="#FDE047" opacity="0.8"/>
  <circle cx="380" cy="380" r="10" fill="#FDE047" opacity="0.8"/>
</svg>`;

const publicDir = path.resolve('public');

// Write vector SVG icon
fs.writeFileSync(path.join(publicDir, 'pwa-icon.svg'), svgIcon);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgIcon);

console.log('SVG icons generated successfully.');
