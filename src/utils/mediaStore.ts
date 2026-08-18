// IndexedDB & Local Storage Resilient Store for Video/Image Media Uploads
// Solves Firestore ~1MB document limit and provides instant offline media playback.

const IDB_NAME_V2 = 'FlipbookStudio_MediaStore_v2';
const IDB_NAME_V1 = 'FlipbookStudio_MediaStore';
const IDB_STORE = 'media_files';

// Fast In-Memory Object URL and Data URL Cache to prevent redundant async fetches & avoid flickering
const GLOBAL_MEDIA_CACHE = new Map<string, string>();

// High-Definition Embedded SVG Diagrams for Graphic Arts, Printing & Packaging
// Guaranteed 100% resilient (0ms latency, zero CORS, zero network failures, infinite zoom quality)
export const SVG_DIAGRAMS = {
  colorWheel: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
      <defs>
        <radialGradient id="bgGrad" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#020617" />
        </radialGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <rect width="800" height="600" fill="url(#bgGrad)" />
      
      <!-- Title Header -->
      <text x="400" y="45" text-anchor="middle" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="22" font-weight="900" letter-spacing="1">12-COLOR THEORY &amp; HARMONY WHEEL</text>
      <text x="400" y="70" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13">Primary (1°), Secondary (2°), and Tertiary (3°) Chromatic Relationships</text>
      
      <!-- 12 Color Segments -->
      <g transform="translate(320, 320)">
        <!-- 1. Red (0 deg) -->
        <path d="M 0 0 L 0 -190 A 190 190 0 0 1 95 -164.5 Z" fill="#ef4444" stroke="#0f172a" stroke-width="3" />
        <!-- 2. Red-Orange (30 deg) -->
        <path d="M 0 0 L 95 -164.5 A 190 190 0 0 1 164.5 -95 Z" fill="#f97316" stroke="#0f172a" stroke-width="3" />
        <!-- 3. Orange (60 deg) -->
        <path d="M 0 0 L 164.5 -95 A 190 190 0 0 1 190 0 Z" fill="#fb923c" stroke="#0f172a" stroke-width="3" />
        <!-- 4. Yellow-Orange (90 deg) -->
        <path d="M 0 0 L 190 0 A 190 190 0 0 1 164.5 95 Z" fill="#facc15" stroke="#0f172a" stroke-width="3" />
        <!-- 5. Yellow (120 deg) -->
        <path d="M 0 0 L 164.5 95 A 190 190 0 0 1 95 164.5 Z" fill="#fde047" stroke="#0f172a" stroke-width="3" />
        <!-- 6. Yellow-Green (150 deg) -->
        <path d="M 0 0 L 95 164.5 A 190 190 0 0 1 0 190 Z" fill="#84cc16" stroke="#0f172a" stroke-width="3" />
        <!-- 7. Green (180 deg) -->
        <path d="M 0 0 L 0 190 A 190 190 0 0 1 -95 164.5 Z" fill="#22c55e" stroke="#0f172a" stroke-width="3" />
        <!-- 8. Blue-Green (210 deg) -->
        <path d="M 0 0 L -95 164.5 A 190 190 0 0 1 -164.5 95 Z" fill="#06b6d4" stroke="#0f172a" stroke-width="3" />
        <!-- 9. Blue (240 deg) -->
        <path d="M 0 0 L -164.5 95 A 190 190 0 0 1 -190 0 Z" fill="#3b82f6" stroke="#0f172a" stroke-width="3" />
        <!-- 10. Blue-Violet (270 deg) -->
        <path d="M 0 0 L -190 0 A 190 190 0 0 1 -164.5 -95 Z" fill="#6366f1" stroke="#0f172a" stroke-width="3" />
        <!-- 11. Violet / Purple (300 deg) -->
        <path d="M 0 0 L -164.5 -95 A 190 190 0 0 1 -95 -164.5 Z" fill="#a855f7" stroke="#0f172a" stroke-width="3" />
        <!-- 12. Red-Violet (330 deg) -->
        <path d="M 0 0 L -95 -164.5 A 190 190 0 0 1 0 -190 Z" fill="#ec4899" stroke="#0f172a" stroke-width="3" />
        
        <!-- Inner Core Hub -->
        <circle cx="0" cy="0" r="75" fill="#0f172a" stroke="#334155" stroke-width="4" />
        <text x="0" y="-8" text-anchor="middle" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">COLOR</text>
        <text x="0" y="12" text-anchor="middle" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">WHEEL</text>
      </g>
      
      <!-- Right Legend / Technical Specs -->
      <g transform="translate(560, 120)">
        <rect width="210" height="420" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
        <text x="105" y="32" text-anchor="middle" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="14" font-weight="bold">COLOR CLASSIFICATION</text>
        
        <!-- Primary -->
        <circle cx="25" cy="70" r="10" fill="#ef4444" />
        <circle cx="45" cy="70" r="10" fill="#fde047" />
        <circle cx="65" cy="70" r="10" fill="#3b82f6" />
        <text x="90" y="74" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">1° Primary (RYB)</text>
        <text x="25" y="98" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">Pure hues: Red, Yellow, Blue</text>
        
        <line x1="20" y1="120" x2="190" y2="120" stroke="#334155" />
        
        <!-- Secondary -->
        <circle cx="25" cy="150" r="10" fill="#fb923c" />
        <circle cx="45" cy="150" r="10" fill="#22c55e" />
        <circle cx="65" cy="150" r="10" fill="#a855f7" />
        <text x="90" y="154" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">2° Secondary</text>
        <text x="25" y="178" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">Mix of 2 primaries: Org, Grn, Pur</text>
        
        <line x1="20" y1="200" x2="190" y2="200" stroke="#334155" />
        
        <!-- Tertiary -->
        <circle cx="25" cy="230" r="8" fill="#f97316" />
        <circle cx="45" cy="230" r="8" fill="#84cc16" />
        <circle cx="65" cy="230" r="8" fill="#06b6d4" />
        <circle cx="85" cy="230" r="8" fill="#ec4899" />
        <text x="105" y="234" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">3° Tertiary</text>
        <text x="25" y="258" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">Primary + Adjacent Secondary</text>
        
        <line x1="20" y1="280" x2="190" y2="280" stroke="#334155" />
        
        <!-- Harmony Rules -->
        <text x="25" y="310" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">HARMONY COMBINATIONS:</text>
        <text x="25" y="332" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="11">• Complementary: 180° opposite</text>
        <text x="25" y="352" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="11">• Analogous: 3 adjacent hues</text>
        <text x="25" y="372" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="11">• Triadic: 120° equilateral</text>
        <text x="25" y="392" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="11">• Split-Complementary</text>
      </g>
    </svg>
  `)}`,

  spectrum: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
      <rect width="800" height="600" fill="#090d16" />
      <text x="400" y="45" text-anchor="middle" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="22" font-weight="900">VISIBLE LIGHT SPECTRUM &amp; WAVELENGTHS</text>
      <text x="400" y="70" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13">Prism Refraction &amp; Human Photoreceptor Sensitivity (380 nm – 750 nm)</text>
      
      <!-- Incident White Ray -->
      <path d="M 60 270 L 250 270" stroke="#ffffff" stroke-width="7" stroke-linecap="round" />
      <text x="140" y="250" fill="#ffffff" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">White Light Ray</text>
      
      <!-- Glass Prism -->
      <polygon points="250,150 400,420 100,420" fill="rgba(255, 255, 255, 0.12)" stroke="#38bdf8" stroke-width="3" />
      <text x="250" y="390" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">Dispersion Prism</text>
      
      <!-- Dispersed Wavelength Rays -->
      <path d="M 280 275 L 700 160" stroke="#ef4444" stroke-width="12" opacity="0.9" />
      <path d="M 280 280 L 700 200" stroke="#f97316" stroke-width="12" opacity="0.9" />
      <path d="M 280 285 L 700 240" stroke="#facc15" stroke-width="12" opacity="0.9" />
      <path d="M 280 290 L 700 280" stroke="#22c55e" stroke-width="12" opacity="0.9" />
      <path d="M 280 295 L 700 320" stroke="#06b6d4" stroke-width="12" opacity="0.9" />
      <path d="M 280 300 L 700 360" stroke="#3b82f6" stroke-width="12" opacity="0.9" />
      <path d="M 280 305 L 700 400" stroke="#a855f7" stroke-width="12" opacity="0.9" />
      
      <!-- Wavelength Labels -->
      <text x="715" y="165" fill="#ef4444" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">Red: 620–750 nm</text>
      <text x="715" y="205" fill="#f97316" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">Orange: 590–620 nm</text>
      <text x="715" y="245" fill="#facc15" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">Yellow: 570–590 nm</text>
      <text x="715" y="285" fill="#22c55e" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">Green: 495–570 nm</text>
      <text x="715" y="325" fill="#06b6d4" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">Cyan: 475–495 nm</text>
      <text x="715" y="365" fill="#3b82f6" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">Blue: 450–475 nm</text>
      <text x="715" y="405" fill="#a855f7" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">Violet: 380–450 nm</text>
      
      <!-- Bottom Summary Box -->
      <rect x="60" y="470" width="680" height="90" rx="10" fill="#1e293b" stroke="#334155" />
      <text x="80" y="500" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">TRICHROMATIC HUMAN EYE SENSITIVITY:</text>
      <text x="80" y="524" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• L-Cones (Long): Peak ~564 nm (Red)   • M-Cones (Medium): Peak ~534 nm (Green)   • S-Cones (Short): Peak ~420 nm (Blue)</text>
      <text x="80" y="546" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">Peak human eye photopic sensitivity occurs at ~555 nm in the yellow-green band.</text>
    </svg>
  `)}`,

  cmykRgb: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
      <rect width="800" height="600" fill="#0b0f19" />
      <text x="400" y="45" text-anchor="middle" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="22" font-weight="900">ADDITIVE (RGB) vs SUBTRACTIVE (CMYK) MODELS</text>
      <text x="400" y="70" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13">Digital Emissive Display Light vs Print Substrate Ink Overprints</text>
      
      <!-- Left: RGB Additive -->
      <g transform="translate(40, 100)">
        <rect width="340" height="440" rx="14" fill="#111827" stroke="#374151" stroke-width="2" />
        <text x="170" y="35" text-anchor="middle" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="16" font-weight="bold">ADDITIVE COLOR (RGB)</text>
        <text x="170" y="55" text-anchor="middle" fill="#9ca3af" font-family="system-ui, sans-serif" font-size="11">Digital Screens, Monitors, Projectors</text>
        
        <!-- RGB Overlapping Circles -->
        <g transform="translate(170, 180)">
          <!-- Red -->
          <circle cx="-35" cy="-25" r="55" fill="#ef4444" opacity="0.8" style="mix-blend-mode: screen;" />
          <!-- Green -->
          <circle cx="35" cy="-25" r="55" fill="#22c55e" opacity="0.8" style="mix-blend-mode: screen;" />
          <!-- Blue -->
          <circle cx="0" cy="35" r="55" fill="#3b82f6" opacity="0.8" style="mix-blend-mode: screen;" />
          <!-- Center White -->
          <circle cx="0" cy="0" r="18" fill="#ffffff" />
          <text x="0" y="4" text-anchor="middle" fill="#000000" font-family="system-ui, sans-serif" font-size="9" font-weight="bold">WHITE</text>
        </g>
        
        <g transform="translate(25, 290)">
          <text x="0" y="18" fill="#f3f4f6" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">• Primaries: Red, Green, Blue</text>
          <text x="0" y="38" fill="#f3f4f6" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">• Mechanism: Emitted Photons</text>
          <text x="0" y="58" fill="#9ca3af" font-family="system-ui, sans-serif" font-size="11">• R + G = Yellow (255, 255, 0)</text>
          <text x="0" y="76" fill="#9ca3af" font-family="system-ui, sans-serif" font-size="11">• G + B = Cyan (0, 255, 255)</text>
          <text x="0" y="94" fill="#9ca3af" font-family="system-ui, sans-serif" font-size="11">• R + B = Magenta (255, 0, 255)</text>
          <text x="0" y="116" fill="#34d399" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">R + G + B (100%) = Pure White Light</text>
        </g>
      </g>
      
      <!-- Right: CMYK Subtractive -->
      <g transform="translate(420, 100)">
        <rect width="340" height="440" rx="14" fill="#111827" stroke="#374151" stroke-width="2" />
        <text x="170" y="35" text-anchor="middle" fill="#f43f5e" font-family="system-ui, sans-serif" font-size="16" font-weight="bold">SUBTRACTIVE COLOR (CMYK)</text>
        <text x="170" y="55" text-anchor="middle" fill="#9ca3af" font-family="system-ui, sans-serif" font-size="11">Commercial Offset, Flexo, Digital Print</text>
        
        <!-- CMYK Overlapping Circles -->
        <g transform="translate(170, 180)">
          <!-- Cyan -->
          <circle cx="-35" cy="-25" r="55" fill="#06b6d4" opacity="0.85" style="mix-blend-mode: multiply;" />
          <!-- Magenta -->
          <circle cx="35" cy="-25" r="55" fill="#ec4899" opacity="0.85" style="mix-blend-mode: multiply;" />
          <!-- Yellow -->
          <circle cx="0" cy="35" r="55" fill="#facc15" opacity="0.85" style="mix-blend-mode: multiply;" />
          <!-- Center Black -->
          <circle cx="0" cy="0" r="18" fill="#000000" />
          <text x="0" y="4" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="9" font-weight="bold">BLACK</text>
        </g>
        
        <g transform="translate(25, 290)">
          <text x="0" y="18" fill="#f3f4f6" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">• Primaries: Cyan, Magenta, Yellow, Key Black</text>
          <text x="0" y="38" fill="#f3f4f6" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">• Mechanism: Ink Pigment Light Absorption</text>
          <text x="0" y="58" fill="#9ca3af" font-family="system-ui, sans-serif" font-size="11">• C + M = Blue / Violet</text>
          <text x="0" y="76" fill="#9ca3af" font-family="system-ui, sans-serif" font-size="11">• M + Y = Bright Red</text>
          <text x="0" y="94" fill="#9ca3af" font-family="system-ui, sans-serif" font-size="11">• C + Y = Deep Green</text>
          <text x="0" y="116" fill="#fb7185" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">C + M + Y + K = Maximum Dmax Black</text>
        </g>
      </g>
    </svg>
  `)}`,

  offsetPress: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
      <rect width="800" height="600" fill="#090d16" />
      <text x="400" y="45" text-anchor="middle" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="22" font-weight="900">OFFSET LITHOGRAPHY 3-CYLINDER UNIT</text>
      <text x="400" y="70" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13">Principle of Oil/Water Repulsion &amp; Rubber Blanket Offset Transfer</text>
      
      <!-- Inking & Dampening Rollers Top -->
      <g transform="translate(400, 140)">
        <circle cx="-50" cy="0" r="22" fill="#0284c7" stroke="#38bdf8" stroke-width="2" />
        <text x="-50" y="4" text-anchor="middle" fill="#ffffff" font-size="9" font-weight="bold">Dampening</text>
        <circle cx="50" cy="0" r="22" fill="#e11d48" stroke="#fb7185" stroke-width="2" />
        <text x="50" y="4" text-anchor="middle" fill="#ffffff" font-size="9" font-weight="bold">Inking Unit</text>
      </g>
      
      <!-- Cylinder 1: Plate Cylinder -->
      <g transform="translate(400, 220)">
        <circle cx="0" cy="0" r="55" fill="#334155" stroke="#94a3b8" stroke-width="4" />
        <text x="0" y="-4" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">1. PLATE CYLINDER</text>
        <text x="0" y="14" text-anchor="middle" fill="#cbd5e1" font-size="10">(Aluminum CTP Plate)</text>
      </g>
      
      <!-- Cylinder 2: Rubber Blanket Cylinder -->
      <g transform="translate(400, 335)">
        <circle cx="0" cy="0" r="55" fill="#0f766e" stroke="#2dd4bf" stroke-width="4" />
        <text x="0" y="-4" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">2. BLANKET CYLINDER</text>
        <text x="0" y="14" text-anchor="middle" fill="#99f6e4" font-size="10">(Flexible Rubber Blanket)</text>
      </g>
      
      <!-- Paper Substrate Passing Through -->
      <line x1="120" y1="395" x2="680" y2="395" stroke="#facc15" stroke-width="6" stroke-linecap="round" />
      <text x="180" y="380" fill="#facc15" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">Paper Sheet Feed Direction ➔</text>
      
      <!-- Cylinder 3: Impression Cylinder -->
      <g transform="translate(400, 455)">
        <circle cx="0" cy="0" r="55" fill="#1e293b" stroke="#64748b" stroke-width="4" />
        <text x="0" y="-4" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">3. IMPRESSION CYLINDER</text>
        <text x="0" y="14" text-anchor="middle" fill="#cbd5e1" font-size="10">(Steel Pressure Drum)</text>
      </g>
      
      <!-- Left & Right Explanations -->
      <g transform="translate(50, 200)">
        <rect width="180" height="150" rx="8" fill="#1e293b" stroke="#334155" />
        <text x="15" y="25" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">KEY ADVANTAGES:</text>
        <text x="15" y="50" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="11">• Crisp sharp dots</text>
        <text x="15" y="75" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="11">• Offset blanket protects plate</text>
        <text x="15" y="100" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="11">• High speed (18,000 sph)</text>
        <text x="15" y="125" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="11">• Cost effective on long runs</text>
      </g>
      
      <g transform="translate(570, 200)">
        <rect width="180" height="150" rx="8" fill="#1e293b" stroke="#334155" />
        <text x="15" y="25" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">CHEMICAL PRINCIPLE:</text>
        <text x="15" y="50" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="11">• Image area: Oleophilic</text>
        <text x="15" y="70" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="10">(Attracts greasy ink)</text>
        <text x="15" y="95" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="11">• Non-image: Hydrophilic</text>
        <text x="15" y="115" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="10">(Attracts water solution)</text>
      </g>
    </svg>
  `)}`,

  packagingDieline: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
      <rect width="800" height="600" fill="#0b0f19" />
      <text x="400" y="45" text-anchor="middle" fill="#34d399" font-family="system-ui, sans-serif" font-size="22" font-weight="900">STRUCTURAL PACKAGING DIELINE (RTE CARTON)</text>
      <text x="400" y="70" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13">Reverse Tuck End Folding Carton with Cut, Crease, Bleed &amp; Glue Flaps</text>
      
      <!-- Dieline Box Outlines -->
      <g transform="translate(100, 110)">
        <!-- Glue Flap -->
        <polygon points="0,60 30,70 30,310 0,320" fill="rgba(52, 211, 153, 0.15)" stroke="#10b981" stroke-width="2" stroke-dasharray="4,4" />
        <text x="15" y="195" text-anchor="middle" fill="#6ee7b7" font-size="9" transform="rotate(-90 15 195)">GLUE FLAP</text>
        
        <!-- Panel 1: Back Panel -->
        <rect x="30" y="60" width="120" height="260" fill="none" stroke="#10b981" stroke-width="2.5" />
        <text x="90" y="190" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">BACK PANEL</text>
        
        <!-- Top Tuck Flap -->
        <polygon points="30,60 35,10 145,10 150,60" fill="rgba(56, 189, 248, 0.1)" stroke="#38bdf8" stroke-width="2" />
        <text x="90" y="38" text-anchor="middle" fill="#38bdf8" font-size="10">TOP TUCK FLAP</text>
        
        <!-- Panel 2: Left Side Panel -->
        <rect x="150" y="60" width="80" height="260" fill="none" stroke="#10b981" stroke-width="2.5" />
        <text x="190" y="190" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">SIDE</text>
        
        <!-- Panel 3: Front Panel -->
        <rect x="230" y="60" width="120" height="260" fill="none" stroke="#10b981" stroke-width="2.5" />
        <text x="290" y="190" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">FRONT PANEL</text>
        
        <!-- Panel 4: Right Side Panel -->
        <rect x="350" y="60" width="80" height="260" fill="none" stroke="#10b981" stroke-width="2.5" />
        <text x="390" y="190" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">SIDE</text>
        
        <!-- Bottom Tuck Flap -->
        <polygon points="230,320 235,370 345,370 350,320" fill="rgba(56, 189, 248, 0.1)" stroke="#38bdf8" stroke-width="2" />
        <text x="290" y="348" text-anchor="middle" fill="#38bdf8" font-size="10">BOTTOM TUCK FLAP</text>
        
        <!-- Dust Flaps (Top & Bottom on side panels) -->
        <polygon points="150,60 160,20 220,20 230,60" fill="none" stroke="#eab308" stroke-width="2" stroke-dasharray="3,3" />
        <polygon points="350,60 360,20 420,20 430,60" fill="none" stroke="#eab308" stroke-width="2" stroke-dasharray="3,3" />
        <polygon points="150,320 160,360 220,360 230,320" fill="none" stroke="#eab308" stroke-width="2" stroke-dasharray="3,3" />
        <polygon points="350,320 360,360 420,360 430,320" fill="none" stroke="#eab308" stroke-width="2" stroke-dasharray="3,3" />
      </g>
      
      <!-- Right Legend -->
      <g transform="translate(560, 130)">
        <rect width="200" height="340" rx="10" fill="#1e293b" stroke="#334155" />
        <text x="100" y="30" text-anchor="middle" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">DIELINE LINE TYPES</text>
        
        <!-- Cut Line -->
        <line x1="20" y1="65" x2="60" y2="65" stroke="#10b981" stroke-width="3" />
        <text x="70" y="70" fill="#ffffff" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">100% Cut Line</text>
        
        <!-- Crease Line -->
        <line x1="20" y1="105" x2="60" y2="105" stroke="#38bdf8" stroke-width="3" stroke-dasharray="5,3" />
        <text x="70" y="110" fill="#ffffff" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">Fold / Crease</text>
        
        <!-- Perforation -->
        <line x1="20" y1="145" x2="60" y2="145" stroke="#eab308" stroke-width="2" stroke-dasharray="2,3" />
        <text x="70" y="150" fill="#ffffff" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">Dust Flap</text>
        
        <!-- Bleed -->
        <line x1="20" y1="185" x2="60" y2="185" stroke="#ec4899" stroke-width="2" stroke-dasharray="8,4" />
        <text x="70" y="190" fill="#ffffff" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">3mm Bleed Zone</text>
        
        <line x1="15" y1="215" x2="185" y2="215" stroke="#334155" />
        
        <text x="20" y="245" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">• Steel Rule Die Tooling</text>
        <text x="20" y="270" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">• Grain Direction: Parallel to main folds</text>
        <text x="20" y="295" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">• Caliper allowance on tucks</text>
      </g>
    </svg>
  `)}`,

  paperGsm: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
      <rect width="800" height="600" fill="#090d16" />
      <text x="400" y="45" text-anchor="middle" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="22" font-weight="900">PAPER WEIGHT (GSM) &amp; GRAIN DIRECTION</text>
      <text x="400" y="70" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13">Grams per Square Meter (g/m²) &amp; Fiber Alignment for Crack-Free Folding</text>
      
      <!-- GSM Stacks Comparison -->
      <g transform="translate(60, 110)">
        <!-- 80 GSM -->
        <g transform="translate(0, 0)">
          <rect x="0" y="180" width="130" height="30" rx="4" fill="#38bdf8" />
          <text x="65" y="200" text-anchor="middle" fill="#000000" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">80 GSM</text>
          <text x="65" y="235" text-anchor="middle" fill="#94a3b8" font-size="11">Standard Copy Paper</text>
          <text x="65" y="255" text-anchor="middle" fill="#64748b" font-size="10">Letterheads, Invoices</text>
        </g>
        
        <!-- 150 GSM -->
        <g transform="translate(160, 0)">
          <rect x="0" y="150" width="130" height="60" rx="4" fill="#34d399" />
          <text x="65" y="185" text-anchor="middle" fill="#000000" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">150 GSM</text>
          <text x="65" y="235" text-anchor="middle" fill="#94a3b8" font-size="11">Coated Art Paper</text>
          <text x="65" y="255" text-anchor="middle" fill="#64748b" font-size="10">Flyers, Brochures</text>
        </g>
        
        <!-- 300 GSM -->
        <g transform="translate(320, 0)">
          <rect x="0" y="100" width="130" height="110" rx="4" fill="#fbbf24" />
          <text x="65" y="160" text-anchor="middle" fill="#000000" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">300 GSM</text>
          <text x="65" y="235" text-anchor="middle" fill="#94a3b8" font-size="11">Heavy Artboard</text>
          <text x="65" y="255" text-anchor="middle" fill="#64748b" font-size="10">Business Cards, Covers</text>
        </g>
        
        <!-- 450 GSM -->
        <g transform="translate(480, 0)">
          <rect x="0" y="40" width="130" height="170" rx="4" fill="#f43f5e" />
          <text x="65" y="130" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">450 GSM</text>
          <text x="65" y="235" text-anchor="middle" fill="#94a3b8" font-size="11">Duplex Board / FBB</text>
          <text x="65" y="255" text-anchor="middle" fill="#64748b" font-size="10">Folding Box Packaging</text>
        </g>
      </g>
      
      <!-- Grain Direction Section -->
      <g transform="translate(60, 400)">
        <rect width="680" height="150" rx="10" fill="#1e293b" stroke="#334155" />
        <text x="25" y="30" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="14" font-weight="bold">GRAIN DIRECTION RULES FOR FOLDING &amp; BINDING</text>
        <text x="25" y="58" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• <tspan fill="#34d399" font-weight="bold">Fold With Grain:</tspan> Smooth, sharp fold without surface fiber fracture or toner cracking.</text>
        <text x="25" y="85" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• <tspan fill="#f43f5e" font-weight="bold">Fold Against Grain:</tspan> Ragged, uneven fold; requires scoring/creasing matrix first to prevent burst.</text>
        <text x="25" y="112" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">• <tspan fill="#f59e0b" font-weight="bold">Bookbinding Standard:</tspan> Spine must ALWAYS run parallel to the grain direction to prevent page buckling.</text>
      </g>
    </svg>
  `)}`,

  prepressPreflight: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
      <rect width="800" height="600" fill="#090d16" />
      <text x="400" y="45" text-anchor="middle" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="22" font-weight="900">PREPRESS &amp; PREFLIGHT QUALITY STANDARDS</text>
      <text x="400" y="70" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13">ISO 12647 Specifications for Press-Ready PDF/X-1a &amp; PDF/X-4</text>
      
      <!-- 4 Cards Grid -->
      <g transform="translate(60, 110)">
        <!-- 1. Bleed & Trim -->
        <rect x="0" y="0" width="320" height="190" rx="10" fill="#111827" stroke="#38bdf8" stroke-width="2" />
        <text x="20" y="32" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="15" font-weight="bold">1. BLEED &amp; TRIM MARGINS</text>
        <text x="20" y="62" fill="#cbd5e1" font-size="12">• Minimum 3.0 mm (0.125 in) Bleed</text>
        <text x="20" y="86" fill="#cbd5e1" font-size="12">• 4.0 mm Safe Zone inside trim boundary</text>
        <text x="20" y="110" fill="#cbd5e1" font-size="12">• Include Standard Japanese/European Crop Marks</text>
        <text x="20" y="134" fill="#94a3b8" font-size="11">Prevents white edge slivers during guillotine cutting.</text>
        
        <!-- 2. Image Resolution -->
        <rect x="360" y="0" width="320" height="190" rx="10" fill="#111827" stroke="#f59e0b" stroke-width="2" />
        <text x="380" y="32" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="15" font-weight="bold">2. IMAGE RESOLUTION &amp; DPI</text>
        <text x="380" y="62" fill="#cbd5e1" font-size="12">• 300 DPI at 100% final output size</text>
        <text x="380" y="86" fill="#cbd5e1" font-size="12">• 1200 DPI for 1-bit Bitmap line art</text>
        <text x="380" y="110" fill="#cbd5e1" font-size="12">• Quality Factor (QF) = 2.0 × LPI screen frequency</text>
        <text x="380" y="134" fill="#94a3b8" font-size="11">Never upscale low-res 72 DPI web graphics for offset print.</text>
        
        <!-- 3. Color Space -->
        <rect x="0" y="220" width="320" height="190" rx="10" fill="#111827" stroke="#ec4899" stroke-width="2" />
        <text x="20" y="252" fill="#ec4899" font-family="system-ui, sans-serif" font-size="15" font-weight="bold">3. COLOR SPACE CONVERSION</text>
        <text x="20" y="282" fill="#cbd5e1" font-size="12">• 100% CMYK + Pantone Spot separation</text>
        <text x="20" y="306" fill="#cbd5e1" font-size="12">• No uncalibrated RGB or DeviceN colors</text>
        <text x="20" y="330" fill="#cbd5e1" font-size="12">• Total Area Coverage (TAC/TIC) ≤ 300%</text>
        <text x="20" y="354" fill="#94a3b8" font-size="11">Overprint 100% Black (K) to eliminate trapping halos.</text>
        
        <!-- 4. Typography & Trapping -->
        <rect x="360" y="220" width="320" height="190" rx="10" fill="#111827" stroke="#10b981" stroke-width="2" />
        <text x="380" y="252" fill="#10b981" font-family="system-ui, sans-serif" font-size="15" font-weight="bold">4. FONTS &amp; VECTOR TRAPPING</text>
        <text x="380" y="282" fill="#cbd5e1" font-size="12">• Convert display text to Outlines / Curves</text>
        <text x="380" y="306" fill="#cbd5e1" font-size="12">• Embed all OpenType &amp; TrueType font subsets</text>
        <text x="380" y="330" fill="#cbd5e1" font-size="12">• 0.15 pt automatic choke/spread trapping</text>
        <text x="380" y="354" fill="#94a3b8" font-size="11">Minimum 6 pt body font size for rich black reverse text.</text>
      </g>
    </svg>
  `)}`,

  defaultDiagram: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
      <rect width="800" height="600" fill="#090d16" />
      <circle cx="400" cy="280" r="140" fill="none" stroke="#f59e0b" stroke-width="3" stroke-dasharray="10,6" opacity="0.6" />
      <polygon points="400,170 490,340 310,340" fill="none" stroke="#38bdf8" stroke-width="3" />
      <circle cx="400" cy="280" r="16" fill="#f59e0b" />
      <text x="400" y="470" text-anchor="middle" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="20" font-weight="bold">ENDLESS SCHOOL OF PRINTING &amp; PACKAGING</text>
      <text x="400" y="500" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13">Interactive Technical Curriculum &amp; Production Engineering Diagram</text>
    </svg>
  `)}`
};

// Fallback media asset arrays cleared so no default placeholder media is injected
export const FALLBACK_SAMPLE_VIDEOS: string[] = [];

export const FALLBACK_SAMPLE_IMAGES: Record<string, string> = {
  color: '',
  spectrum: '',
  cmyk: '',
  printing: '',
  paper: '',
  packaging: '',
  preflight: '',
  design: '',
  default: ''
};

export function getFallbackImageForTopic(_query?: string, _pageTitle?: string, _subtitle?: string, _caption?: string): string {
  return '';
}

function openDB(dbName = IDB_NAME_V2): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB unavailable in this environment'));
      return;
    }
    try {
      const req = window.indexedDB.open(dbName, 2);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => {
        console.warn('IndexedDB open blocked, continuing');
      };
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Converts an image file to an optimized, high-resolution Base64 Data URL (JPEG / PNG / WebP)
 * This allows images to be stored directly and loaded instantaneously without async delay.
 */
export function fileToDataUrl(file: File, maxDimension = 1600, quality = 0.88): Promise<string> {
  return new Promise((resolve) => {
    if (!file) {
      resolve('');
      return;
    }

    // For SVG or small files (< 350KB), read directly as data URL without compression
    if (file.type === 'image/svg+xml' || file.size < 350 * 1024) {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    // For larger PNG / JPG / WebP images, downscale gracefully on canvas to maintain high quality while keeping payload < 300KB
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve((e.target?.result as string) || '');
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(outputMime, quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve((e.target?.result as string) || '');
      };
      img.src = (e.target?.result as string) || '';
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/**
 * Save a video/image File, Blob, or base64 Data URL to IndexedDB under key
 */
export async function saveMediaToIDB(key: string, data: File | Blob | string | ArrayBuffer): Promise<boolean> {
  try {
    const cleanKey = key.startsWith('idb:') ? key.replace('idb:', '') : key;

    // Cache in memory immediately
    if (typeof data === 'string') {
      GLOBAL_MEDIA_CACHE.set(cleanKey, data);
      // If small string (< 2MB), also persist to localStorage for cross-reload safety
      if (data.length < 2 * 1024 * 1024) {
        try {
          localStorage.setItem(`idb_backup_${cleanKey}`, data);
        } catch (_) {}
      }
    } else if (data instanceof File || data instanceof Blob) {
      const objUrl = URL.createObjectURL(data);
      GLOBAL_MEDIA_CACHE.set(cleanKey, objUrl);
    }

    const db = await openDB();

    // Serialize File / Blob to ArrayBuffer or store string directly to avoid structured clone issues
    let payloadToStore: any = data;
    if (data instanceof File || data instanceof Blob) {
      const buffer = await data.arrayBuffer();
      payloadToStore = {
        buffer,
        type: data.type || (data instanceof File ? data.type : 'application/octet-stream'),
        name: (data as any).name || 'media_file',
        updatedAt: Date.now()
      };
    }

    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(payloadToStore, cleanKey);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => {
        console.warn('IDB write transaction error, using fallback');
        resolve(false);
      };
    });
  } catch (err) {
    console.warn('saveMediaToIDB error:', err);
    return false;
  }
}

/**
 * Retrieve a video/image Object URL or Data URL from IndexedDB / Memory / LocalStorage
 */
export async function getMediaFromIDB(key: string): Promise<string | null> {
  const cleanKey = key.startsWith('idb:') ? key.replace('idb:', '') : key;

  // 1. Check fast in-memory cache first
  if (GLOBAL_MEDIA_CACHE.has(cleanKey)) {
    return GLOBAL_MEDIA_CACHE.get(cleanKey)!;
  }

  // 2. Check localStorage backup
  try {
    const localBackup = localStorage.getItem(`idb_backup_${cleanKey}`);
    if (localBackup) {
      GLOBAL_MEDIA_CACHE.set(cleanKey, localBackup);
      return localBackup;
    }
  } catch (_) {}

  // 3. Check IndexedDB store
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(cleanKey);

      req.onsuccess = () => {
        const result = req.result;
        if (!result) {
          resolve(null);
          return;
        }

        if (result instanceof Blob || result instanceof File) {
          const url = URL.createObjectURL(result);
          GLOBAL_MEDIA_CACHE.set(cleanKey, url);
          resolve(url);
        } else if (typeof result === 'string') {
          GLOBAL_MEDIA_CACHE.set(cleanKey, result);
          resolve(result);
        } else if (result && result.buffer instanceof ArrayBuffer) {
          const blob = new Blob([result.buffer], { type: result.type || 'video/mp4' });
          const url = URL.createObjectURL(blob);
          GLOBAL_MEDIA_CACHE.set(cleanKey, url);
          resolve(url);
        } else {
          resolve(null);
        }
      };

      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('getMediaFromIDB error:', err);
    return null;
  }
}

