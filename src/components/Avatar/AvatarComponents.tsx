import React from 'react';

// ─────────────────────────────────────────────
// SVG Animal Faces
// ─────────────────────────────────────────────

export const Lion = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    {/* mane */}
    {[0,30,60,90,120,150,180,210,240,270,300,330].map((angle, i) => (
      <ellipse key={i} cx={50 + 44 * Math.cos((angle * Math.PI) / 180)} cy={50 + 44 * Math.sin((angle * Math.PI) / 180)}
        rx="11" ry="8" fill={color} opacity="0.85"
        transform={`rotate(${angle + 90}, ${50 + 44 * Math.cos((angle * Math.PI) / 180)}, ${50 + 44 * Math.sin((angle * Math.PI) / 180)})`}
      />
    ))}
    {/* face */}
    <circle cx="50" cy="50" r="33" fill={color} />
    <circle cx="50" cy="50" r="29" fill="#F5C842" />
    {/* ears */}
    <circle cx="24" cy="25" r="9" fill={color} /><circle cx="76" cy="25" r="9" fill={color} />
    <circle cx="24" cy="25" r="5" fill="#F5C842" /><circle cx="76" cy="25" r="5" fill="#F5C842" />
    {/* eyes */}
    <ellipse cx="38" cy="44" rx="6" ry="7" fill="white" /><ellipse cx="62" cy="44" rx="6" ry="7" fill="white" />
    <circle cx="39" cy="45" r="4" fill="#1a1a1a" /><circle cx="63" cy="45" r="4" fill="#1a1a1a" />
    <circle cx="40" cy="43" r="1.5" fill="white" /><circle cx="64" cy="43" r="1.5" fill="white" />
    {/* nose */}
    <ellipse cx="50" cy="57" rx="9" ry="6" fill="#e8a040" />
    <ellipse cx="50" cy="55" rx="5" ry="3.5" fill="#c0603a" />
    {/* mouth */}
    <path d="M44 61 Q50 67 56 61" stroke="#8b3a1a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    <line x1="50" y1="58.5" x2="50" y2="62" stroke="#8b3a1a" strokeWidth="1.5" />
    {/* whiskers */}
    <line x1="20" y1="55" x2="40" y2="57" stroke="#c0603a" strokeWidth="1.2" opacity="0.6" strokeLinecap="round" />
    <line x1="20" y1="59" x2="40" y2="59" stroke="#c0603a" strokeWidth="1.2" opacity="0.6" strokeLinecap="round" />
    <line x1="60" y1="57" x2="80" y2="55" stroke="#c0603a" strokeWidth="1.2" opacity="0.6" strokeLinecap="round" />
    <line x1="60" y1="59" x2="80" y2="59" stroke="#c0603a" strokeWidth="1.2" opacity="0.6" strokeLinecap="round" />
  </svg>
);

export const Fox = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    <circle cx="50" cy="54" r="33" fill={color} />
    {/* pointy ears */}
    <polygon points="22,32 14,8 36,22" fill={color} /><polygon points="78,32 86,8 64,22" fill={color} />
    <polygon points="25,30 18,12 34,22" fill="#f8c8a0" /><polygon points="75,30 82,12 66,22" fill="#f8c8a0" />
    {/* white face mask */}
    <ellipse cx="50" cy="58" rx="22" ry="18" fill="white" />
    {/* eyes */}
    <ellipse cx="37" cy="46" rx="6" ry="7" fill="white" /><ellipse cx="63" cy="46" rx="6" ry="7" fill="white" />
    <circle cx="37" cy="47" r="4" fill="#1a1a1a" /><circle cx="63" cy="47" r="4" fill="#1a1a1a" />
    <circle cx="38" cy="45" r="1.5" fill="white" /><circle cx="64" cy="45" r="1.5" fill="white" />
    {/* nose */}
    <ellipse cx="50" cy="58" rx="4.5" ry="3" fill="#1a1a1a" />
    <circle cx="50.5" cy="57" r="1.2" fill="white" opacity="0.7" />
    {/* mouth */}
    <path d="M44 63 Q50 69 56 63" stroke="#888" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    <line x1="50" y1="61" x2="50" y2="64" stroke="#888" strokeWidth="1.4" />
    {/* whiskers */}
    <line x1="18" y1="57" x2="42" y2="58" stroke="#ccc" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="19" y1="61" x2="42" y2="61" stroke="#ccc" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="58" y1="58" x2="82" y2="57" stroke="#ccc" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="58" y1="61" x2="81" y2="61" stroke="#ccc" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const Bear = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    <circle cx="50" cy="52" r="33" fill={color} />
    {/* ears */}
    <circle cx="24" cy="24" r="12" fill={color} /><circle cx="76" cy="24" r="12" fill={color} />
    <circle cx="24" cy="24" r="7" fill="#d4956a" /><circle cx="76" cy="24" r="7" fill="#d4956a" />
    {/* muzzle */}
    <ellipse cx="50" cy="61" rx="16" ry="12" fill="#d4956a" />
    {/* eyes */}
    <circle cx="37" cy="46" r="7" fill="white" /><circle cx="63" cy="46" r="7" fill="white" />
    <circle cx="37" cy="47" r="4.5" fill="#1a1a1a" /><circle cx="63" cy="47" r="4.5" fill="#1a1a1a" />
    <circle cx="38.5" cy="45" r="1.8" fill="white" /><circle cx="64.5" cy="45" r="1.8" fill="white" />
    {/* nose */}
    <ellipse cx="50" cy="57" rx="6" ry="4" fill="#1a1a1a" />
    <circle cx="51" cy="55.5" r="1.5" fill="white" opacity="0.7" />
    {/* mouth */}
    <path d="M44 64 Q50 70 56 64" stroke="#8b5e3c" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    <line x1="50" y1="61" x2="50" y2="65" stroke="#8b5e3c" strokeWidth="1.6" />
  </svg>
);

export const Penguin = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    <circle cx="50" cy="50" r="36" fill="#2d2d3a" />
    {/* white belly */}
    <ellipse cx="50" cy="56" rx="22" ry="25" fill="white" />
    {/* color cheeks */}
    <ellipse cx="50" cy="36" rx="18" ry="14" fill={color} />
    {/* hair tuft */}
    <ellipse cx="50" cy="16" rx="6" ry="9" fill="#1a1a2a" />
    <ellipse cx="43" cy="18" rx="4" ry="7" fill="#1a1a2a" transform="rotate(-15,43,18)" />
    <ellipse cx="57" cy="18" rx="4" ry="7" fill="#1a1a2a" transform="rotate(15,57,18)" />
    {/* eyes */}
    <circle cx="38" cy="42" r="7" fill="white" /><circle cx="62" cy="42" r="7" fill="white" />
    <circle cx="38" cy="43" r="4.5" fill="#1a1a1a" /><circle cx="62" cy="43" r="4.5" fill="#1a1a1a" />
    <circle cx="39.5" cy="41" r="1.8" fill="white" /><circle cx="63.5" cy="41" r="1.8" fill="white" />
    {/* beak */}
    <polygon points="50,50 44,56 56,56" fill="#f5a623" />
    <line x1="44" y1="53" x2="56" y2="53" stroke="#e08010" strokeWidth="1" />
  </svg>
);

export const Cat = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    <circle cx="50" cy="54" r="32" fill={color} />
    {/* pointy ears */}
    <polygon points="22,36 18,10 40,28" fill={color} /><polygon points="78,36 82,10 60,28" fill={color} />
    <polygon points="24,34 22,16 38,27" fill="#f9c0c0" /><polygon points="76,34 78,16 62,27" fill="#f9c0c0" />
    {/* eyes */}
    <ellipse cx="37" cy="47" rx="7" ry="8" fill="#c8f0c8" />
    <ellipse cx="63" cy="47" rx="7" ry="8" fill="#c8f0c8" />
    <ellipse cx="37" cy="47" rx="3" ry="7" fill="#1a1a1a" />
    <ellipse cx="63" cy="47" rx="3" ry="7" fill="#1a1a1a" />
    <circle cx="38" cy="44" r="1.5" fill="white" /><circle cx="64" cy="44" r="1.5" fill="white" />
    {/* nose */}
    <polygon points="50,57 46,62 54,62" fill="#f06080" />
    {/* mouth */}
    <path d="M44 64 Q50 70 56 64" stroke="#c04060" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    <line x1="50" y1="62" x2="50" y2="65" stroke="#c04060" strokeWidth="1.4" />
    {/* whiskers */}
    <line x1="16" y1="57" x2="43" y2="58" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
    <line x1="16" y1="62" x2="43" y2="62" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
    <line x1="57" y1="58" x2="84" y2="57" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
    <line x1="57" y1="62" x2="84" y2="62" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
  </svg>
);

export const Rabbit = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    {/* tall ears */}
    <ellipse cx="34" cy="22" rx="10" ry="22" fill={color} />
    <ellipse cx="66" cy="22" rx="10" ry="22" fill={color} />
    <ellipse cx="34" cy="22" rx="5.5" ry="17" fill="#f9c0c0" />
    <ellipse cx="66" cy="22" rx="5.5" ry="17" fill="#f9c0c0" />
    <circle cx="50" cy="56" r="30" fill={color} />
    {/* cheek tufts */}
    <ellipse cx="28" cy="62" rx="10" ry="7" fill="white" opacity="0.7" />
    <ellipse cx="72" cy="62" rx="10" ry="7" fill="white" opacity="0.7" />
    {/* eyes */}
    <circle cx="37" cy="48" r="7" fill="white" /><circle cx="63" cy="48" r="7" fill="white" />
    <circle cx="38" cy="49" r="4.5" fill="#3a1a4a" /><circle cx="64" cy="49" r="4.5" fill="#3a1a4a" />
    <circle cx="39.5" cy="47" r="2" fill="white" /><circle cx="65.5" cy="47" r="2" fill="white" />
    {/* nose */}
    <ellipse cx="50" cy="59" rx="4" ry="3" fill="#f06080" />
    <circle cx="50.5" cy="58" r="1.2" fill="white" opacity="0.6" />
    {/* mouth */}
    <path d="M44 63 Q50 69 56 63" stroke="#c04060" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    <line x1="50" y1="62" x2="50" y2="64" stroke="#c04060" strokeWidth="1.4" />
  </svg>
);

export const Panda = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    <circle cx="50" cy="52" r="33" fill="white" />
    {/* ears */}
    <circle cx="24" cy="22" r="12" fill="#1a1a1a" /><circle cx="76" cy="22" r="12" fill="#1a1a1a" />
    {/* eye patches */}
    <ellipse cx="36" cy="44" rx="10" ry="9" fill="#1a1a1a" transform="rotate(-10,36,44)" />
    <ellipse cx="64" cy="44" rx="10" ry="9" fill="#1a1a1a" transform="rotate(10,64,44)" />
    {/* color accent ring */}
    <circle cx="50" cy="52" r="33" fill="none" stroke={color} strokeWidth="4" />
    {/* eyes */}
    <circle cx="36" cy="44" r="5" fill="white" /><circle cx="64" cy="44" r="5" fill="white" />
    <circle cx="36" cy="45" r="3.5" fill="#1a1a1a" /><circle cx="64" cy="45" r="3.5" fill="#1a1a1a" />
    <circle cx="37" cy="43" r="1.5" fill="white" /><circle cx="65" cy="43" r="1.5" fill="white" />
    {/* muzzle */}
    <ellipse cx="50" cy="61" rx="14" ry="10" fill="#f0f0f0" />
    {/* nose */}
    <ellipse cx="50" cy="57" rx="5" ry="3.5" fill="#1a1a1a" />
    <circle cx="50.5" cy="56" r="1.5" fill="white" opacity="0.6" />
    {/* mouth */}
    <path d="M44 63 Q50 70 56 63" stroke="#666" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    <line x1="50" y1="60.5" x2="50" y2="64" stroke="#666" strokeWidth="1.4" />
  </svg>
);

export const Wolf = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    <circle cx="50" cy="54" r="32" fill={color} />
    {/* pointy ears */}
    <polygon points="20,38 14,6 40,26" fill={color} /><polygon points="80,38 86,6 60,26" fill={color} />
    <polygon points="22,36 18,12 38,26" fill="#e0e8f0" /><polygon points="78,36 82,12 62,26" fill="#e0e8f0" />
    {/* lighter muzzle */}
    <ellipse cx="50" cy="62" rx="20" ry="15" fill="#d8e4f0" />
    {/* eyes */}
    <ellipse cx="37" cy="46" rx="7" ry="7" fill="#d4f0d4" />
    <ellipse cx="63" cy="46" rx="7" ry="7" fill="#d4f0d4" />
    <circle cx="37" cy="47" r="4" fill="#1a1a1a" /><circle cx="63" cy="47" r="4" fill="#1a1a1a" />
    <circle cx="38" cy="45" r="1.8" fill="white" /><circle cx="64" cy="45" r="1.8" fill="white" />
    {/* nose */}
    <ellipse cx="50" cy="58" rx="5.5" ry="3.5" fill="#1a1a1a" />
    <circle cx="51" cy="57" r="1.5" fill="white" opacity="0.6" />
    {/* mouth */}
    <path d="M44 63 Q50 70 56 63" stroke="#666" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    <line x1="50" y1="61.5" x2="50" y2="64" stroke="#666" strokeWidth="1.4" />
    {/* whiskers */}
    <line x1="18" y1="59" x2="42" y2="60" stroke="#aaa" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="18" y1="63" x2="42" y2="63" stroke="#aaa" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="58" y1="60" x2="82" y2="59" stroke="#aaa" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="58" y1="63" x2="82" y2="63" stroke="#aaa" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const Owl = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    <circle cx="50" cy="52" r="33" fill={color} />
    {/* ear tufts */}
    <polygon points="32,28 26,8 42,22" fill={color} /><polygon points="68,28 74,8 58,22" fill={color} />
    {/* face disc */}
    <ellipse cx="50" cy="54" rx="26" ry="24" fill="#f5e8c8" />
    {/* big eyes */}
    <circle cx="37" cy="46" r="11" fill="white" /><circle cx="63" cy="46" r="11" fill="white" />
    <circle cx="37" cy="46" r="8" fill="#e8c840" /><circle cx="63" cy="46" r="8" fill="#e8c840" />
    <circle cx="37" cy="46" r="5" fill="#1a1a1a" /><circle cx="63" cy="46" r="5" fill="#1a1a1a" />
    <circle cx="38.5" cy="44" r="2" fill="white" /><circle cx="64.5" cy="44" r="2" fill="white" />
    {/* beak */}
    <polygon points="50,54 44,62 56,62" fill="#e0a030" />
    <line x1="44" y1="58" x2="56" y2="58" stroke="#c08010" strokeWidth="1" />
  </svg>
);

export const Deer = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    {/* antlers */}
    <path d="M30 30 L20 8 M20 8 L14 4 M20 8 L26 2" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M70 30 L80 8 M80 8 L86 4 M80 8 L74 2" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
    <circle cx="50" cy="54" r="32" fill={color} />
    {/* lighter muzzle */}
    <ellipse cx="50" cy="63" rx="18" ry="13" fill="#f0d8b0" />
    {/* eyes */}
    <ellipse cx="36" cy="46" rx="8" ry="9" fill="white" /><ellipse cx="64" cy="46" rx="8" ry="9" fill="white" />
    <circle cx="36" cy="47" r="5.5" fill="#3a1a00" /><circle cx="64" cy="47" r="5.5" fill="#3a1a00" />
    <circle cx="37.5" cy="45" r="2" fill="white" /><circle cx="65.5" cy="45" r="2" fill="white" />
    {/* nose */}
    <ellipse cx="50" cy="59" rx="5" ry="3.5" fill="#d06040" />
    <circle cx="50.5" cy="58" r="1.5" fill="white" opacity="0.6" />
    {/* mouth */}
    <path d="M44 64 Q50 70 56 64" stroke="#a04030" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    <line x1="50" y1="62.5" x2="50" y2="65" stroke="#a04030" strokeWidth="1.4" />
  </svg>
);

export const Frog = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    {/* big eyes on top */}
    <circle cx="30" cy="28" r="14" fill={color} /><circle cx="70" cy="28" r="14" fill={color} />
    <circle cx="30" cy="28" r="10" fill="white" /><circle cx="70" cy="28" r="10" fill="white" />
    <circle cx="30" cy="29" r="7" fill="#1a1a1a" /><circle cx="70" cy="29" r="7" fill="#1a1a1a" />
    <circle cx="32" cy="26" r="2.5" fill="white" /><circle cx="72" cy="26" r="2.5" fill="white" />
    {/* face */}
    <ellipse cx="50" cy="58" rx="34" ry="28" fill={color} />
    {/* lighter belly */}
    <ellipse cx="50" cy="63" rx="24" ry="18" fill="#d4f0c0" />
    {/* wide smile */}
    <path d="M28 58 Q50 78 72 58" stroke="#2a6a10" strokeWidth="3" fill="none" strokeLinecap="round" />
    {/* nose dots */}
    <circle cx="44" cy="52" r="3" fill="#2a6a10" opacity="0.5" />
    <circle cx="56" cy="52" r="3" fill="#2a6a10" opacity="0.5" />
  </svg>
);

export const Dog = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    <circle cx="50" cy="52" r="33" fill={color} />
    {/* floppy ears */}
    <ellipse cx="20" cy="46" rx="10" ry="18" fill="#8B5E3C" transform="rotate(-15,20,46)" />
    <ellipse cx="80" cy="46" rx="10" ry="18" fill="#8B5E3C" transform="rotate(15,80,46)" />
    {/* muzzle */}
    <ellipse cx="50" cy="63" rx="18" ry="13" fill="#d4956a" />
    {/* eyes */}
    <circle cx="37" cy="46" r="8" fill="white" /><circle cx="63" cy="46" r="8" fill="white" />
    <circle cx="37" cy="47" r="5.5" fill="#3a1a00" /><circle cx="63" cy="47" r="5.5" fill="#3a1a00" />
    <circle cx="38.5" cy="45" r="2" fill="white" /><circle cx="64.5" cy="45" r="2" fill="white" />
    {/* brow lines */}
    <path d="M30 39 Q37 36 44 39" stroke="#8B5E3C" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <path d="M56 39 Q63 36 70 39" stroke="#8B5E3C" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    {/* nose */}
    <ellipse cx="50" cy="59" rx="6" ry="4" fill="#1a1a1a" />
    <circle cx="51" cy="57.5" r="1.8" fill="white" opacity="0.6" />
    {/* mouth */}
    <path d="M44 65 Q50 72 56 65" stroke="#7a3a10" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    <line x1="50" y1="63" x2="50" y2="66" stroke="#7a3a10" strokeWidth="1.6" />
  </svg>
);
