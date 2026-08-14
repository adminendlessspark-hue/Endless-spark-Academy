import { FlipbookMaterial } from '../components/InteractiveFlipbookStudio';

export const DEFAULT_FLIPBOOKS: FlipbookMaterial[] = [
  {
    id: 'material-production-art-mod1',
    title: 'Diploma in Production Art Engineer - Module 1: Fundamentals of Colour',
    description: 'Complete 16-page faculty master curriculum handbook covering electromagnetic light spectrum, trichromatic vision, RGB & CMYK physics, Pantone spot colors, prepress trapping, and Delta-E tolerances.',
    courseName: 'Diploma in Production Art Engineer',
    courseCategory: 'production-art-engineer',
    author: 'Endless School of Printing and Packaging',
    coverImageUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80',
    updatedAt: new Date().toISOString(),
    pages: [
      {
        id: 'pa-m1-p1',
        pageNumber: 1,
        title: 'Fundamental of colour',
        subtitle: 'What is colour?',
        courseName: 'Diploma in Production Art Engineer',
        courseModuleName: 'Module 1: Fundamentals of Colour',
        content: `<h3><strong>What is colour?</strong></h3>
<p>Colour is how our eyes and brain see different light waves. Objects absorb some light and reflect other light. Your eyes catch the reflected light and your brain turns it into a colour like red, blue, or green.</p>
<br/>
<h3><strong>Visual Electromagnetic Perception</strong></h3>
<p>Color is the visual sensation created when electromagnetic radiation in the 380–750 nm wavelength range is captured by the human eye and interpreted by the brain.</p>
<br/>
<h3><strong>How We See</strong></h3>
<p><strong>ColourLight waves:</strong> Light travels in waves. Each colour has a different size or length. Long waves look red. Short waves look blue or violet.<br/>
<strong>The eye:</strong> Special cells in your eyes called cones catch these light waves.<br/>
<strong>The brain:</strong> Your brain takes signals from your eyes and names the colour.</p>
<br/>
<h3><strong>Main Parts of Colour</strong></h3>
<p><strong>Hue:</strong> The name of the family of the colour, like red or yellow.<br/>
<strong>Lightness:</strong> How light or dark a colour is.<br/>
<strong>Brightness:</strong> How strong or pale a colour appears.</p>`,
        translations: {
          ta: {
            title: 'வண்ணத்தின் அடிப்படைகள் (Fundamental of colour)',
            subtitle: 'வண்ணம் என்றால் என்ன?',
            content: `<h3><strong>வண்ணம் என்றால் என்ன?</strong></h3>
<p>வண்ணம் என்பது நமது கண்களும் மூளையும் வெவ்வேறு ஒளி அலைகளை எவ்வாறு பார்க்கின்றன என்பதாகும். பொருள்கள் சில ஒளியை உறிஞ்சி மற்ற ஒளியைப் பிரதிபலிக்கின்றன. உங்கள் கண்கள் பிரதிபலித்த ஒளியைப் பிடித்து உங்கள் மூளை அதை சிவப்பு, நீலம் அல்லது பச்சை போன்ற நிறமாக மாற்றுகிறது.</p>
<br/>
<h3><strong>காட்சி மின்காந்த உணர்வு</strong></h3>
<p>வண்ணம் என்பது மனிதக் கண்ணால் 380–750 nm அலைநீள வரம்பில் மின்காந்த கதிர்வீச்சு பிடிக்கப்பட்டு மூளையால் விளக்கப்படும்போது உருவாகும் காட்சி உணர்வாகும்.</p>
<br/>
<h3><strong>நாம் எவ்வாறு பார்க்கிறோம்</strong></h3>
<p><strong>ஒளி அலைகள்:</strong> ஒளி அலைகளில் பயணிக்கிறது. ஒவ்வொரு வண்ணத்திற்கும் வெவ்வேறு அளவு அல்லது நீளம் உள்ளது. நீண்ட அலைகள் சிவப்பு நிறமாக இருக்கும். குறுகிய அலைகள் நீலம் அல்லது ஊதா நிறமாக இருக்கும்.<br/>
<strong>கண்:</strong> உங்கள் கண்களில் உள்ள கூம்புகள் (cones) எனப்படும் சிறப்பு செல்கள் இந்த ஒளி அலைகளைப் பிடிக்கின்றன.<br/>
<strong>மூளை:</strong> உங்கள் மூளை உங்கள் கண்களிலிருந்து சிக்னல்களை எடுத்து நிறத்திற்குப் பெயரிடுகிறது.</p>
<br/>
<h3><strong>வண்ணத்தின் முக்கிய பகுதிகள்</strong></h3>
<p><strong>சாயல் (Hue):</strong> சிவப்பு அல்லது மஞ்சள் போன்ற வண்ணக் குடும்பத்தின் பெயர்.<br/>
<strong>வெளிச்சம் (Lightness):</strong> ஒரு நிறம் எவ்வளவு வெளிச்சமாக அல்லது இருட்டாக இருக்கிறது.<br/>
<strong>பிரகாசம் (Brightness):</strong> ஒரு நிறம் எவ்வளவு வலுவாக அல்லது வெளிர் நிறமாகத் தோன்றுகிறது.</p>`,
            calloutText: 'முக்கிய கருத்து: நிறம் பரப்புகளில் இல்லை; இது பிரதிபலிக்கும் ஃபோட்டான்களிலிருந்து மனித மூளையால் உணரப்படும் ஒரு உணர்வு.'
          },
          ms: {
            title: 'Asas Warna (Fundamental of colour)',
            subtitle: 'Apakah itu warna?',
            content: `<h3><strong>Apakah itu warna?</strong></h3>
<p>Warna adalah cara mata dan otak kita melihat gelombang cahaya yang berbeza. Objek menyerap sebahagian cahaya dan memantulkan yang lain. Mata anda menangkap cahaya yang dipantulkan dan otak menukarkannya kepada warna seperti merah, biru, atau hijau.</p>
<br/>
<h3><strong>Persepsi Elektromagnet Visual</strong></h3>
<p>Warna ialah sensasi visual yang tercipta apabila sinaran elektromagnet dalam julat panjang gelombang 380–750 nm ditangkap oleh mata manusia dan ditafsirkan oleh otak.</p>
<br/>
<h3><strong>Bagaimana Kita Melihat</strong></h3>
<p><strong>Gelombang Cahaya:</strong> Cahaya bergerak dalam gelombang. Setiap warna mempunyai saiz berbeza. Gelombang panjang kelihatan merah. Gelombang pendek kelihatan biru atau ungu.<br/>
<strong>Mata:</strong> Sel khas di mata dipanggil kon menangkap gelombang cahaya ini.<br/>
<strong>Otak:</strong> Otak anda menerima isyarat daripada mata dan menamakan warna.</p>
<br/>
<h3><strong>Bahagian Utama Warna</strong></h3>
<p><strong>Hue:</strong> Nama keluarga warna, seperti merah atau kuning.<br/>
<strong>Kecerahan (Lightness):</strong> Berapa cerah atau gelap sesuatu warna.<br/>
<strong>Kekuatan Warna (Brightness):</strong> Berapa pekat atau pucat rupa sesuatu warna.</p>`
          }
        },
        mediaType: 'both',
        layoutStyle: 'grid-2x2',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        videoCaption: 'Fundamental of colour',
        imageUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80',
        imageCaption: 'WHAT IS COLOUR? - Electromagnetic Light Spectrum',
        calloutText: 'Key Takeaway: Color does not exist on surfaces; it is a neurological sensation decoded by the human brain from reflected photons.',
        bgTheme: 'classic-paper'
      },
      {
        id: 'pa-m1-p2',
        pageNumber: 2,
        title: 'Visible Light Spectrum & Wavelengths',
        subtitle: 'The 380 nm to 750 nm Electromagnetic Band',
        courseName: 'Diploma in Production Art Engineer',
        courseModuleName: 'Module 1: Fundamentals of Colour',
        content: `<h3><strong>The Electromagnetic Spectrum</strong></h3>
<p>Light is a form of radiant energy. The visible spectrum is only a tiny segment of the entire electromagnetic spectrum, bounded by ultraviolet (UV) radiation below 380 nm and infrared (IR) radiation above 750 nm.</p>
<br/>
<h3><strong>Wavelength Distribution by Colour</strong></h3>
<ul>
  <li><strong>Violet & Blue:</strong> 380 – 495 nm (High energy, short wavelength)</li>
  <li><strong>Green:</strong> 495 – 570 nm (Medium wavelength, peak human sensitivity)</li>
  <li><strong>Yellow & Orange:</strong> 570 – 620 nm</li>
  <li><strong>Red:</strong> 620 – 750 nm (Low energy, long wavelength)</li>
</ul>
<br/>
<h3><strong>Trichromatic Vision in Humans</strong></h3>
<p>Human retinas contain three distinct types of cone photoreceptors:</p>
<ol>
  <li><strong>S-Cones (Short):</strong> Peak sensitivity around 420 nm (Blue)</li>
  <li><strong>M-Cones (Medium):</strong> Peak sensitivity around 530 nm (Green)</li>
  <li><strong>L-Cones (Long):</strong> Peak sensitivity around 560 nm (Red)</li>
</ol>`,
        translations: {
          ta: {
            title: 'புலப்படும் ஒளி நிறமாலை & அலைநீளங்கள்',
            subtitle: '380 nm முதல் 750 nm வரையிலான மின்காந்தப் பட்டை',
            content: `<h3><strong>மின்காந்த நிறமாலை</strong></h3>
<p>ஒளி என்பது கதிர்வீச்சு ஆற்றலின் ஒரு வடிவமாகும். புலப்படும் நிறமாலை என்பது 380 nm க்குக் கீழே உள்ள புற ஊதா (UV) மற்றும் 750 nm க்கு மேலே உள்ள அகச்சிவப்பு (IR) ஆகியவற்றால் சூழப்பட்ட மின்காந்த நிறமாலையின் ஒரு சிறிய பகுதியாகும்.</p>
<br/>
<h3><strong>வண்ணத்தின்படி அலைநீள விநியோகம்</strong></h3>
<ul>
  <li><strong>ஊதா மற்றும் நீலம்:</strong> 380 – 495 nm (அதி ஆற்றல், குறுகிய அலைநீளம்)</li>
  <li><strong>பச்சை:</strong> 495 – 570 nm (நடுத்தர அலைநீளம், உச்ச உணர்திறன்)</li>
  <li><strong>மஞ்சள் மற்றும் ஆரஞ்சு:</strong> 570 – 620 nm</li>
  <li><strong>சிவப்பு:</strong> 620 – 750 nm (குறைந்த ஆற்றல், நீண்ட அலைநீளம்)</li>
</ul>`
          }
        },
        mediaType: 'image',
        layoutStyle: 'grid-bento',
        imageUrl: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=800&q=80',
        imageCaption: 'Visible Light Dispersion: Refraction of White Light through a Glass Prism',
        calloutText: 'Human eyes are most sensitive to green light (~555 nm in daylight photopic vision).',
        bgTheme: 'clean-white'
      },
      {
        id: 'pa-m1-p3',
        pageNumber: 3,
        title: 'Additive (RGB) vs Subtractive (CMYK) Colour Models',
        subtitle: 'Transmitted Light vs Reflected Ink Pigments',
        courseName: 'Diploma in Production Art Engineer',
        courseModuleName: 'Module 1: Fundamentals of Colour',
        content: `<h3><strong>The Additive Model (RGB - Light)</strong></h3>
<p>Used for emissive digital screens, monitors, and stage lighting. Primary colours of light are <strong>Red, Green, and Blue</strong>. When combined at maximum intensity, they produce pure <strong>White light</strong> (RGB 255, 255, 255).</p>
<br/>
<h3><strong>The Subtractive Model (CMYK - Pigment/Ink)</strong></h3>
<p>Used for all physical printing processes (Offset, Flexo, Gravure, Digital). Primary ink pigments are <strong>Cyan, Magenta, Yellow, and Key Black</strong>.</p>
<p>Inks act as optical filters: Cyan absorbs red light, Magenta absorbs green light, and Yellow absorbs blue light. When combined on white paper, they subtract reflected wavelengths to produce dark chromatic black.</p>
<br/>
<h3><strong>Why "K" (Black) is Essential</strong></h3>
<ol>
  <li>Physical cyan, magenta, and yellow ink impurities produce a muddy brown rather than deep neutral black.</li>
  <li>Black adds maximum optical density (Dmax) and typographic crispness.</li>
  <li>Black ink reduces total wet ink coverage (TIC/TAC) on high-speed press runs.</li>
</ol>`,
        mediaType: 'image',
        layoutStyle: 'split-right',
        imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
        imageCaption: 'RGB Additive Light Color Synthesis vs CMYK Subtractive Ink Overprints',
        calloutText: 'Never send RGB images directly to a commercial platesetter without proper ICC color conversion.',
        bgTheme: 'classic-paper'
      },
      {
        id: 'pa-m1-p4',
        pageNumber: 4,
        title: 'Color Gamuts & Color Spaces (sRGB, Adobe RGB, Fogra 51)',
        subtitle: 'CIE 1931 Chromaticity & Gamut Volume Boundaries',
        courseName: 'Diploma in Production Art Engineer',
        courseModuleName: 'Module 1: Fundamentals of Colour',
        content: `<h3><strong>Understanding Color Gamut</strong></h3>
<p>A color gamut represents the total range of colors reproducible by a specific device, color space, or printing substrate.</p>
<br/>
<h3><strong>Comparison of Industry Standard Color Spaces</strong></h3>
<ul>
  <li><strong>sRGB:</strong> The baseline standard for consumer monitors and the web. Narrow gamut (~35% of visible CIE spectrum).</li>
  <li><strong>Adobe RGB (1998):</strong> Expanded gamut designed for prepress and high-end photography (~50% of CIE spectrum). Covers rich cyan-green tones.</li>
  <li><strong>ProPhoto RGB:</strong> Ultra-wide gamut covering >90% of visible spectrum. Requires 16-bit depth to avoid banding.</li>
  <li><strong>ISO Coated v2 (FOGRA39) & PSO Coated v3 (FOGRA51):</strong> Standard European offset printing gamuts on premium coated papers.</li>
  <li><strong>GRACoL 2013:</strong> Leading North American commercial printing standard.</li>
</ul>
<br/>
<h3><strong>Gamut Clipping Warning</strong></h3>
<p>Vibrant saturated electric greens, bright oranges, and neon blues visible in RGB cannot be reproduced in standard four-color process CMYK printing and will be compressed during separation.</p>`,
        mediaType: 'image',
        layoutStyle: 'grid-bento',
        imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
        imageCaption: 'CIE 1931 Chromaticity Diagram showing sRGB, Adobe RGB, and CMYK Fogra Gamut Boundaries',
        calloutText: 'Always check "Gamut Warning" in Adobe Photoshop before converting master RGB product assets to CMYK.',
        bgTheme: 'clean-white'
      },
      {
        id: 'pa-m1-p5',
        pageNumber: 5,
        title: 'Color Reproduction in Prepress & Offset Lithography',
        subtitle: 'Process Cyan, Magenta, Yellow, and Key Black Formulations',
        courseName: 'Diploma in Production Art Engineer',
        courseModuleName: 'Module 1: Fundamentals of Colour',
        content: `<h3><strong>How Lithographic Offset Presses Produce Continuous Tones</strong></h3>
<p>Printing presses cannot vary ink thickness smoothly on a single plate. Instead, continuous-tone photographs are broken down into microscopic patterns of dots known as <strong>Halftone Screens</strong>.</p>
<br/>
<h3><strong>Screen Angles to Prevent Moiré Interference</strong></h3>
<p>When four halftone screen patterns overlap, improper dot angles create distracting geometric interference patterns called <strong>Moiré</strong>.</p>
<p>Industry standard screen angles for standard offset printing:</p>
<ul>
  <li><strong>Cyan:</strong> 15° or 105°</li>
  <li><strong>Magenta:</strong> 75°</li>
  <li><strong>Yellow:</strong> 0° or 90° (least visible color, placed at 0°)</li>
  <li><strong>Black (Key):</strong> 45° (most visible angle to human eye, placed at highest resolution 45°)</li>
</ul>`,
        mediaType: 'video',
        layoutStyle: 'media-top',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        videoCaption: 'Microscopic 500x View of Offset Rosette Halftone Dots & Screen Angles',
        calloutText: 'A proper 30-degree angle separation between the dominant colors (C, M, K) produces a clean, pleasing Rosette pattern.',
        bgTheme: 'dark-studio'
      },
      {
        id: 'pa-m1-p6',
        pageNumber: 6,
        title: 'Spot Colors & Pantone Matching System (PMS)',
        subtitle: 'Solid Coated (C) vs Solid Uncoated (U) Formulations',
        courseName: 'Diploma in Production Art Engineer',
        courseModuleName: 'Module 1: Fundamentals of Colour',
        content: `<h3><strong>What is a Spot Color?</strong></h3>
<p>A spot color is a pre-mixed, custom-formulated ink printed on its own dedicated press unit using an individual printing plate, rather than simulated by four-color CMYK halftone dots.</p>
<br/>
<h3><strong>When to Use Spot Colors in Packaging & Production Art</strong></h3>
<ol>
  <li><strong>Brand Identity:</strong> Precise corporate brand colors (e.g., Coca-Cola Red, Tiffany Blue, Cadbury Purple) that require absolute repeatability worldwide.</li>
  <li><strong>Out-of-Gamut Hues:</strong> Saturated pastels, fluorescent neon inks, and pure metallics (Gold 871, Silver 877).</li>
  <li><strong>Consistent Large Solid Areas:</strong> Eliminates color shifting and dot gain banding across large packaging panels.</li>
</ol>
<br/>
<h3><strong>Coated (C) vs Uncoated (U) Substrate Absorption</strong></h3>
<p>The exact same ink formulation will look significantly darker and more muted on porous uncoated stock due to ink absorption into paper fibers.</p>`,
        mediaType: 'image',
        layoutStyle: 'grid-2x2',
        imageUrl: 'https://images.unsplash.com/photo-1525909002-1b05e0c869d8?auto=format&fit=crop&w=800&q=80',
        imageCaption: 'Pantone Formula Guide Color Swatches & Precision Ink Mixing Formulations',
        calloutText: 'Never leave duplicate spot colors with different naming (e.g., "PANTONE 185 C" vs "PANTONE 185 CVC") in a production file.',
        bgTheme: 'classic-paper'
      },
      {
        id: 'pa-m1-p7',
        pageNumber: 7,
        title: 'Process Color Trapping, Chokes, and Spreads',
        subtitle: 'Preventing White Registration Gaps on High-Speed Presses',
        courseName: 'Diploma in Production Art Engineer',
        courseModuleName: 'Module 1: Fundamentals of Colour',
        content: `<h3><strong>The Problem of Mechanical Registration Drift</strong></h3>
<p>High-speed printing presses experience mechanical vibration, cylinder bounce, and paper stretching due to moisture absorption. If two adjacent abutting colors misregister by even 0.1 mm, a visible white paper gap appears.</p>
<br/>
<h3><strong>Trapping Solutions</strong></h3>
<ul>
  <li><strong>Spread Trap:</strong> The lighter foreground color expands slightly outward under the darker background boundary.</li>
  <li><strong>Choke Trap:</strong> The lighter background color contracts inward under the darker foreground element.</li>
  <li><strong>Overprint Black:</strong> 100% Black text and thin line strokes should ALWAYS overprint background colors without knocking out.</li>
</ul>
<br/>
<h3><strong>Recommended Trapping Tolerances</strong></h3>
<p>• Sheetfed Offset: <strong>0.10 pt – 0.25 pt (0.04 mm – 0.08 mm)</strong><br/>
• Flexographic Corrugated: <strong>0.50 pt – 1.0 pt (0.18 mm – 0.35 mm)</strong><br/>
• Screen Printing: <strong>1.0 pt – 2.0 pt</strong></p>`,
        mediaType: 'image',
        layoutStyle: 'split-left',
        imageUrl: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=800&q=80',
        imageCaption: 'Diagram of Trapping: Spread vs Choke and Knockout Misregistration',
        calloutText: 'Rich Black formula for large backgrounds: 60% Cyan, 40% Magenta, 30% Yellow, 100% Black.',
        bgTheme: 'clean-white'
      },
      {
        id: 'pa-m1-p8',
        pageNumber: 8,
        title: 'Screen Ruling (LPI), Dot Gain & Tone Value Increase (TVI)',
        subtitle: 'Halftone Screening & Mechanical vs Optical Dot Expansion',
        courseName: 'Diploma in Production Art Engineer',
        courseModuleName: 'Module 1: Fundamentals of Colour',
        content: `<h3><strong>What is Screen Ruling (Lines Per Inch - LPI)?</strong></h3>
<p>Screen ruling defines the frequency of halftone dot rows per linear inch. Higher LPI produces finer detail but requires smooth, coated paper stock.</p>
<br/>
<h3><strong>Industry LPI Guidelines by Substrate</strong></h3>
<ul>
  <li><strong>Newsprint:</strong> 85 – 100 LPI</li>
  <li><strong>Uncoated Offset Book Paper:</strong> 120 – 133 LPI</li>
  <li><strong>Coated Gloss/Matte Art Paper:</strong> 150 – 175 LPI</li>
  <li><strong>High-End Packaging & Luxury Catalogs:</strong> 200 – 240 LPI (or FM Stochastic screening)</li>
</ul>
<br/>
<h3><strong>Understanding Dot Gain (TVI)</strong></h3>
<p>Dot gain is the phenomenon where printed halftone dots expand in physical size when liquid ink hits the porous substrate. A 50% dot on the digital plate may measure 68% on the printed sheet (an 18% TVI).</p>`,
        mediaType: 'image',
        layoutStyle: 'grid-bento',
        imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
        imageCaption: 'Tone Value Increase (TVI) Calibration Curve across 0% to 100% Dot Tonal Range',
        calloutText: 'Prepress RIP calibration curves compensate for known press dot gain before laser-exposing CTP plates.',
        bgTheme: 'classic-paper'
      },
      {
        id: 'pa-m1-p9',
        pageNumber: 9,
        title: 'Standard Viewing Illuminants (D50, D65) & Light Booths',
        subtitle: 'ISO 3664 Viewing Conditions & Metamerism Failure',
        courseName: 'Diploma in Production Art Engineer',
        courseModuleName: 'Module 1: Fundamentals of Colour',
        content: `<h3><strong>The Critical Role of Light in Color Evaluation</strong></h3>
<p>An object's apparent color changes drastically depending on the spectral distribution of the ambient light source illuminating it.</p>
<br/>
<h3><strong>Standard CIE Illuminants</strong></h3>
<ul>
  <li><strong>D50 (5000 Kelvin):</strong> The official international prepress and graphic arts standard (ISO 3664:2009). Balances warm daylight for accurate CMYK press sheet proofing.</li>
  <li><strong>D65 (6500 Kelvin):</strong> The international standard for consumer digital displays, sRGB monitors, and industrial automotive/textile inspection.</li>
  <li><strong>Illuminant A (2856 Kelvin):</strong> Incandescent warm tungsten home lighting.</li>
</ul>
<br/>
<h3><strong>Metamerism Explained</strong></h3>
<p>Metamerism occurs when two different ink samples appear identical under D50 daylight illumination, but visibly mismatch when viewed under retail fluorescent or LED light.</p>`,
        mediaType: 'image',
        layoutStyle: 'split-right',
        imageUrl: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=800&q=80',
        imageCaption: 'ISO 3664 Compliant D50 Color Viewing Booth with Neutral 50% Gray Interior Surrounds',
        calloutText: 'Never evaluate press color proofs under standard office fluorescent or uncalibrated room lighting.',
        bgTheme: 'clean-white'
      },
      {
        id: 'pa-m1-p10',
        pageNumber: 10,
        title: 'Spectrophotometry, CIE L*a*b* & Delta-E (ΔE) Tolerances',
        subtitle: 'Scientific Color Measurement & Quality Tolerances',
        courseName: 'Diploma in Production Art Engineer',
        courseModuleName: 'Module 1: Fundamentals of Colour',
        content: `<h3><strong>The Device-Independent CIE L*a*b* Color Space</strong></h3>
<p>Developed in 1976 by the Commission Internationale de l'Éclairage, L*a*b* mathematically defines every color perceivable by the human eye:</p>
<ul>
  <li><strong>L* (Lightness):</strong> 0 (Pure Black) to 100 (Diffuse White)</li>
  <li><strong>a* (Green–Red axis):</strong> Negative values are Green; Positive values are Red</li>
  <li><strong>b* (Blue–Yellow axis):</strong> Negative values are Blue; Positive values are Yellow</li>
</ul>
<br/>
<h3><strong>Understanding Delta-E (ΔE) Color Difference</strong></h3>
<p>Delta-E measures the mathematical distance between two color points in L*a*b* space:</p>
<ul>
  <li><strong>ΔE < 1.0:</strong> Not perceptible by human eyes. Perfect match.</li>
  <li><strong>1.0 < ΔE < 2.0:</strong> Perceptible only through close inspection by experienced QC colorists.</li>
  <li><strong>2.0 < ΔE < 3.5:</strong> Commercial pass/fail tolerance for high-volume packaging production.</li>
  <li><strong>ΔE > 5.0:</strong> Unacceptable color shift. Batch rejection.</li>
</ul>`,
        mediaType: 'image',
        layoutStyle: 'grid-2x2',
        imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
        imageCaption: 'Handheld X-Rite eXact Spectrophotometer Measuring CIE L*a*b* Coordinates & Delta-E',
        calloutText: 'ISO 12647-2 specifies a maximum ΔE00 of 3.5 for CMYK solid primary inks on production press runs.',
        bgTheme: 'classic-paper'
      },
      {
        id: 'pa-m1-p11',
        pageNumber: 11,
        title: 'ICC Color Profiles & Rendering Intents',
        subtitle: 'Perceptual, Relative Colorimetric, Saturation & Absolute',
        courseName: 'Diploma in Production Art Engineer',
        courseModuleName: 'Module 1: Fundamentals of Colour',
        content: `<h3><strong>What is an ICC Profile?</strong></h3>
<p>An ICC profile is an ISO-standardized data file that characterizes how a specific scanner, monitor, proofer, or printing press translates color between device-dependent spaces (RGB/CMYK) and device-independent CIE L*a*b*.</p>
<br/>
<h3><strong>The 4 Standard ICC Rendering Intents</strong></h3>
<ol>
  <li><strong>Perceptual:</strong> Compresses the entire source gamut into the target gamut, maintaining visual relationships and smooth transitions. Best for natural photographic images.</li>
  <li><strong>Relative Colorimetric (Prepress Standard):</strong> Maps identical colors exactly; out-of-gamut colors are clipped to the nearest reproducible shade. White point is adapted to paper white.</li>
  <li><strong>Saturation:</strong> Maximizes vivid saturation at the expense of hue accuracy. Ideal for business presentation charts and graphs.</li>
  <li><strong>Absolute Colorimetric:</strong> Reproduces exact colors including substrate paper tint. Used exclusively for contract proofing systems.</li>
</ol>`,
        mediaType: 'image',
        layoutStyle: 'grid-bento',
        imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
        imageCaption: 'ICC Profile Conversion Pipeline via Color Management Module (CMM) Profile Connection Space',
        calloutText: 'Use "Relative Colorimetric with Black Point Compensation" as your default prepress conversion setting in Adobe Creative Cloud.',
        bgTheme: 'clean-white'
      },
      {
        id: 'pa-m1-p12',
        pageNumber: 12,
        title: 'Preflight Color Verification & Adobe Acrobat Output Preview',
        subtitle: 'Detecting RGB Elements, Missing Profiles & Spot Color Conversions',
        courseName: 'Diploma in Production Art Engineer',
        courseModuleName: 'Module 1: Fundamentals of Colour',
        content: `<h3><strong>The Final Gatekeeper: Preflight Inspection</strong></h3>
<p>Before releasing high-resolution PDF/X files to the platesetter RIP, production art engineers must rigorously inspect separations in <strong>Adobe Acrobat Pro Output Preview</strong>.</p>
<br/>
<h3><strong>Key Preflight Verification Checklist</strong></h3>
<ul>
  <li><strong>Simulation Profile:</strong> Set simulation profile to matching press condition (e.g., FOGRA51 / GRACoL 2013).</li>
  <li><strong>Color Separation Toggles:</strong> Isolate Cyan, Magenta, Yellow, Black, and Spot plates individually to verify clean plate knockouts.</li>
  <li><strong>Spot Color List:</strong> Ensure no unapproved spot colors remain that would trigger unwanted extra press plates.</li>
  <li><strong>Overprint Black Check:</strong> Verify black body text shows 0% knockout on underlying color plates.</li>
  <li><strong>RGB Object Audit:</strong> Search for unseparated RGB images or vector fills using the Object Inspector.</li>
</ul>`,
        mediaType: 'video',
        layoutStyle: 'media-top',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        videoCaption: 'Step-by-Step Walkthrough: Adobe Acrobat Pro Output Preview Plate Inspector',
        calloutText: 'Always certify PDF/X-4:2010 compliance to preserve transparency integrity and device-independent color definitions.',
        bgTheme: 'dark-studio'
      },
      {
        id: 'pa-m1-p13',
        pageNumber: 13,
        title: 'Total Ink Coverage (TIC / TAC) & Under Color Removal (UCR / GCR)',
        subtitle: 'Limiting Press Saturation to 300%-320% for Clean Ink Drying',
        courseName: 'Diploma in Production Art Engineer',
        courseModuleName: 'Module 1: Fundamentals of Colour',
        content: `<h3><strong>What is Total Ink Coverage (TIC / TAC)?</strong></h3>
<p>Total Area Coverage (TAC) is the sum of percentage values of Cyan, Magenta, Yellow, and Black inks in the darkest shadow areas of an image (e.g., C:80% + M:75% + Y:75% + K:90% = 320% TAC).</p>
<p>If TAC exceeds press limits (e.g., 400%), excessive wet ink cannot dry in time, causing ink set-off, smearing, sheet sticking, and flaking.</p>
<br/>
<h3><strong>Standard TAC Limits by Press Process</strong></h3>
<ul>
  <li><strong>Sheetfed Offset (Coated):</strong> Maximum 300% – 320%</li>
  <li><strong>Coldset Web Newspaper:</strong> Maximum 220% – 240%</li>
  <li><strong>Flexographic Packaging:</strong> Maximum 260% – 280%</li>
</ul>
<br/>
<h3><strong>UCR (Under Color Removal) vs GCR (Gray Component Replacement)</strong></h3>
<p>UCR and GCR algorithms replace redundant overlapping CMY chromatic components in neutral shadows with equivalent black ink, dramatically saving expensive colored inks and stabilizing press neutral balance.</p>`,
        mediaType: 'image',
        layoutStyle: 'split-left',
        imageUrl: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=800&q=80',
        imageCaption: 'Acrobat Total Area Coverage Warning Highlighting Areas Exceeding 300% in Neon Green',
        calloutText: 'Never allow TAC to exceed 320% on commercial sheetfed offset presses.',
        bgTheme: 'classic-paper'
      },
      {
        id: 'pa-m1-p14',
        pageNumber: 14,
        title: 'RIP (Raster Image Processor) Architecture & Screening Algorithms',
        subtitle: 'Amplitude Modulation (AM) vs Frequency Modulation (FM / Stochastic)',
        courseName: 'Diploma in Production Art Engineer',
        courseModuleName: 'Module 1: Fundamentals of Colour',
        content: `<h3><strong>The Engine of Prepress: The Modern RIP</strong></h3>
<p>The Raster Image Processor (RIP) interprets PostScript and PDF vectors, executes ICC color transformations, applies trapping rules, and renders 1-bit high-resolution TIFF bitmaps for laser CTP (Computer-to-Plate) platesetters.</p>
<br/>
<h3><strong>Screening Technologies</strong></h3>
<ul>
  <li><strong>AM (Amplitude Modulated) Screening:</strong> Traditional halftone screening where dot centers remain equidistant on a rigid grid while dot sizes vary according to tonal density.</li>
  <li><strong>FM (Frequency Modulated / Stochastic) Screening:</strong> Microscopic dots (10–20 microns) remain fixed in tiny size while dot frequency and population distribution vary. Completely eliminates screen angle moiré and produces photographic detail.</li>
  <li><strong>Hybrid Screening (XM):</strong> Combines AM screening in midtones with FM screening in delicate highlight (1%-5%) and shadow (95%-99%) regions.</li>
</ul>`,
        mediaType: 'image',
        layoutStyle: 'grid-bento',
        imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
        imageCaption: 'Microscopic Comparison: Conventional AM Halftone Rosette vs Random Stochastic FM Screening',
        calloutText: 'Stochastic FM screening requires pristine plate exposure and highly consistent press temperature control.',
        bgTheme: 'clean-white'
      },
      {
        id: 'pa-m1-p15',
        pageNumber: 15,
        title: 'Color Proofing: Contract Hard Proofs vs Digital Soft Proofing',
        subtitle: 'ISO 12647-7 Certification & Fogra Media Wedge Validation',
        courseName: 'Diploma in Production Art Engineer',
        courseModuleName: 'Module 1: Fundamentals of Colour',
        content: `<h3><strong>What is a Contract Proof?</strong></h3>
<p>A contract proof is a legally binding physical print sample produced on a calibrated inkjet proofer (e.g., Epson SureColor with UltraChrome inks) that precisely simulates the final production press run.</p>
<br/>
<h3><strong>The Fogra Media Wedge (Ugra/Fogra CMYK v3.0)</strong></h3>
<p>Every certified contract proof must include an intact 72-patch Fogra Media Wedge control strip along its margin.</p>
<p>A spectrophotometer reads each patch to verify compliance with <strong>ISO 12647-7</strong> tolerances:</p>
<ul>
  <li>Average ΔE across all patches: <strong>≤ 2.0</strong></li>
  <li>Maximum ΔE on primary solid colors: <strong>≤ 5.0</strong></li>
  <li>Maximum ΔE on substrate paper white: <strong>≤ 1.5</strong></li>
</ul>
<br/>
<h3><strong>Soft Proofing on Calibrated Monitors</strong></h3>
<p>Soft proofing requires hardware-calibrated wide-gamut monitors (e.g., EIZO ColorEdge) with periodic sensor calibration to match D50 ambient light conditions.</p>`,
        mediaType: 'image',
        layoutStyle: 'split-right',
        imageUrl: 'https://images.unsplash.com/photo-1525909002-1b05e0c869d8?auto=format&fit=crop&w=800&q=80',
        imageCaption: 'Certified Contract Proof with Spectrophotometer Pass/Fail Inspection Label and Fogra Wedge',
        calloutText: 'Never sign off on an offset press run without an ISO 12647-7 certified contract proof on the press console.',
        bgTheme: 'classic-paper'
      },
      {
        id: 'pa-m1-p16',
        pageNumber: 16,
        title: 'Prepress Color QC Checklist & Production Sign-Off Protocol',
        subtitle: 'End-to-End Press Approval Protocol & Quality Certification',
        courseName: 'Diploma in Production Art Engineer',
        courseModuleName: 'Module 1: Fundamentals of Colour',
        content: `<h3><strong>Master Prepress Quality Control Sign-Off Checklist</strong></h3>
<p>Before releasing production files to high-volume manufacturing, certify every item on this mandatory checklist:</p>
<br/>
<ol>
  <li><strong>Document Geometry:</strong> Ensure 3mm (0.125 in) bleed on all perimeter edges with proper trim marks.</li>
  <li><strong>Color Mode Audit:</strong> 100% of raster images converted to CMYK or approved PMS Spot colors. Zero RGB elements remaining.</li>
  <li><strong>Image Resolution:</strong> Minimum 300 DPI effective resolution at 100% placement scale.</li>
  <li><strong>Total Ink Coverage:</strong> Peak TAC within press substrate threshold (≤ 300% for standard stock).</li>
  <li><strong>Trapping & Overprint:</strong> Small black text set to overprint; spread/choke trapping applied to adjoining spot hues.</li>
  <li><strong>Barcode Verification:</strong> Barcodes printed in 100% solid Black on white background at minimum 80% magnification (Grade A / ISO 15416).</li>
  <li><strong>Contract Proof Sign-Off:</strong> Client and QC Lead physical signatures recorded on certified Fogra proof.</li>
</ol>`,
        mediaType: 'video',
        layoutStyle: 'media-top',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        videoCaption: 'Faculty Summary: Professional Certification & Prepress Engineering Best Practices',
        calloutText: 'Congratulations! You have completed Module 1: Fundamentals of Colour. Download the exercise pack below to practice in Adobe Illustrator and Acrobat Pro.',
        bgTheme: 'dark-studio',
        exerciseTitle: 'Module 1 Hands-on Color Preflight Lab Assets',
        exerciseFilePath: 'https://storage.googleapis.com/faculty-assets/exercises/module1-color-lab.zip'
      }
    ]
  },
  {
    id: 'material-packaging-101',
    title: 'Packaging Engineering Fundamentals & Die-Line Masterclass',
    description: 'Complete faculty handbook covering corrugated board architecture, flexographic prepress, trapping tolerance, and structural CAD die-lines.',
    courseName: 'Diploma in Packaging Engineer',
    courseCategory: 'packaging-engineer',
    author: 'Endless School of Printing and Packaging',
    coverImageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1200&q=80',
    updatedAt: new Date().toISOString(),
    pages: [
      {
        id: 'p1',
        pageNumber: 1,
        title: 'Introduction to Structural Packaging Design',
        subtitle: 'Corrugated Architecture & Folding Flutes',
        courseName: 'Diploma in Packaging Engineer',
        courseModuleName: 'Module 2: Fundamentals of Packaging',
        content: `<h3><strong>Structural Packaging Engineering</strong></h3>
<p>Structural packaging engineering is the backbone of retail presentation and physical product protection. Engineers must carefully balance strength-to-weight ratios, folding tolerances, and printing precision.</p>
<br/>
<h3><strong>Key structural considerations include:</strong></h3>
<ol>
  <li><strong>Substrates:</strong> Solid bleached sulfate (SBS), Folding boxboard (FBB), Corrugated B/C/E/F flute.</li>
  <li><strong>Machine Grain Direction:</strong> Parallel to primary folds to avoid board cracking during high-speed gluing.</li>
  <li><strong>Crease Scores & Caliper Compensation:</strong> Adjusting score widths based on board thickness (pt/mm).</li>
</ol>`,
        translations: {
          ms: {
            title: 'Pengenalan kepada Reka Bentuk Pembungkusan Struktur',
            subtitle: '',
            content: `Kejuruteraan pembungkusan struktur adalah teras persembahan runcit dan perlindungan fizikal produk. Jurutera mesti mengimbangi nisbah kekuatan, toleransi lipatan, dan ketepatan cetakan.

Pertimbangan struktur utama meliputi:
1. Substrat: Papan bertutup SBS, FBB, dan profil seruling B/C/E/F corrugated.
2. Arah Urat Mesin (Grain Direction): Selari dengan lipatan utama untuk mengelakkan kertas retak semasa penggaman berkelajuan tinggi.
3. Toleransi Alur & Ketebalan Papan: Pelarasan lebar garisan acuan berdasarkan ketebalan papan (pt/mm).`,
            calloutText: ''
          },
          ta: {
            title: 'கட்டமைப்பு பேக்கேஜிங் வடிவமைப்பு அறிமுகம்',
            subtitle: '',
            content: `கட்டமைப்பு பேக்கேஜிங் பொறியியல் என்பது சில்லறை விற்பனை விளக்கக்காட்சி மற்றும் தயாரிப்பு பாதுகாப்பின் முக்கிய அம்சமாகும். பொறியாளர்கள் வலிமை, மடிப்பு சகிப்புத்தன்மை மற்றும் அச்சிடும் துல்லியத்தை சமநிலைப்படுத்த வேண்டும்.

முக்கிய பரிசீலனைகள்:
1. அடி மூலக்கூறுகள்: SBS, FBB, மற்றும் நெளி பலகை B/C/E/F புல்லாங்குழல்.
2. இயந்திர தானிய திசை: அதிவேக ஒட்டுதலின் போது உடைப்பைத் தவிர்க்க முதன்மை மடிப்புகளுக்கு இணையாக.`,
            calloutText: ''
          }
        },
        mediaType: 'both',
        imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1000&q=80',
        imageCaption: 'Fig 1.1: Corrugated Board Flute Profile Architecture & Crease Scores',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        videoCaption: 'Video Tutorial: Folding Carton Creasing & Die-cutting Demonstration',
        layoutStyle: 'grid-2x2',
        calloutText: '',
        bgTheme: 'classic-paper',
        courseModuleId: 'mod-1',
        exerciseFilePath: '',
        exerciseTitle: ''
      },
      {
        id: 'p2',
        pageNumber: 2,
        title: 'Preflight & Color Management Workflow',
        subtitle: 'Plate Output & Registration Tolerances',
        courseName: 'Diploma in Packaging Engineer',
        courseModuleName: 'Module 2: Fundamentals of Packaging',
        content: `<h3><strong>Preflight Validation</strong></h3>
<p>Preflighting guarantees error-free plate output by validating color separation, font outlines, minimum line weights, and resolution settings before RIP processing.</p>
<br/>
<h3><strong>Core Rules for Flexographic & Offset Prepress:</strong></h3>
<ul>
  <li><strong>Minimum Line Weight:</strong> 0.25 pt for single color, 0.5 pt for reverse knockout text.</li>
  <li><strong>Image Resolution:</strong> Exactly 300 DPI at 100% placement scale.</li>
  <li><strong>Trapping Distance:</strong> 0.15 mm - 0.3 mm for flexographic presses to prevent white gaps caused by registration drift.</li>
</ul>`,
        translations: {
          ms: {
            title: 'Aliran Kerja Prasemak & Pengurusan Warna',
            subtitle: '',
            content: `Prasemak (Preflight) menjamin output plat tanpa ralat dengan mengesahkan pemisahan warna, garis luar fon, dan ketetapan resolusi sebelum pemprosesan RIP.

Peraturan Asas Prasemak:
• Lebar Garis Minimum: 0.25 pt untuk warna tunggal, 0.5 pt untuk teks knockout terbalik.
• Resolusi Imej: Tepat 300 DPI pada skala 100%.
• Jarak Trapping: 0.15 mm - 0.3 mm untuk mesin cetak fleksografi bagi mengelakkan ruang putih.`,
            calloutText: ''
          },
          ta: {
            title: 'முன்-பரிசோதனை மற்றும் வண்ண மேலாண்மை பணிப்பாய்வு',
            subtitle: '',
            content: `முன்-பரிசோதனை (Preflighting) என்பது RIP செயலாக்கத்திற்கு முன் வண்ணப் பிரிப்பு, எழுத்துருக் கோடுகள், குறைந்தபட்ச கோடு எடைகள் மற்றும் தெளிவுத்திறன் அமைப்புகளைச் சரிபார்ப்பதன் மூலம் பிழையற்ற தட்டு வெளியீட்டிற்கு உத்தரவாதம் அளிக்கிறது.

ஃப்ளெக்ஸோகிராஃபிக் & ஆப்செட் பிரீபிரஸிற்கான முக்கிய விதிகள்:
• குறைந்தபட்ச கோடு எடை: ஒற்றை வண்ணத்திற்கு 0.25 pt, தலைகீழ் நாக் அவுட் உரைகளுக்கு 0.5 pt.
• படத் தெளிவுத்திறன்: 100% பொருத்துதல் அளவில் சரியாக 300 DPI.
• ட்ராப்பிங் தூரம்: பதிவு நகர்வினால் ஏற்படும் வெள்ளை இடைவெளிகளைத் தடுக்க ஃப்ளெக்ஸோகிராஃபிக் அச்சகங்களுக்கு 0.15 மிமீ - 0.3 மிமீ.`,
            calloutText: '',
            imageCaption: 'படம் 2.1: அடோப் அக்ரோபேட் புரோ DC இல் முன்-பரிசோதனை கண்டறிதல் குழு'
          }
        },
        mediaType: 'image',
        imageUrl: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=1000&q=80',
        imageCaption: 'Fig 2.1: Preflight Diagnostic Panel in Adobe Acrobat Pro DC',
        layoutStyle: 'grid-bento',
        calloutText: '',
        bgTheme: 'clean-white',
        courseModuleId: 'mod-2',
        exerciseFilePath: '',
        exerciseTitle: ''
      },
      {
        id: 'p3',
        pageNumber: 3,
        title: 'Interactive Case Study: Acrobat Preflight Auto-Fix',
        subtitle: 'Automated Profile Execution',
        courseName: 'Diploma in Packaging Engineer',
        courseModuleName: 'Module 2: Fundamentals of Packaging',
        content: `<h3><strong>Automated Preflight Execution</strong></h3>
<p>Watch the video lecture below to observe how automated Acrobat Preflight profiles systematically identify missing Bleeds (3mm), RGB color spaces, corrupt fonts, and low-resolution raster objects.</p>
<br/>
<h3><strong>Follow along with the step-by-step checklist:</strong></h3>
<ol>
  <li>Open PDF file in Acrobat Pro Preflight tool.</li>
  <li>Select "Convert All RGB to CMYK (FOGRA39 / GRACoL 2013)".</li>
  <li>Execute "Add 3mm Bleed Box Expansion" script.</li>
  <li>Export High-Res PDF/X-4 PDF for plate output.</li>
</ol>`,
        translations: {
          ms: {
            title: 'Kajian Kes Interaktif: Pembaikan Automatik Acrobat Preflight',
            subtitle: '',
            content: `Tonton kuliah video di bawah untuk melihat bagaimana profil Acrobat Preflight mengesan limpahan warna (Bleed 3mm), ruang warna RGB, dan objek resolusi rendah.

Langkah Semakan:
1. Buka fail PDF dalam alat Acrobat Preflight.
2. Pilih "Tukar Semua RGB ke CMYK (GRACoL / FOGRA39)".
3. Jalankan skrip "Tambah Limpahan Bleed 3mm".
4. Eksport PDF/X-4 Resolusi Tinggi untuk pembentukan plat.`,
            calloutText: ''
          },
          ta: {
            title: 'இன்டராக்டிவ் கேஸ் ஸ்டடி: அக்ரோபேட் பிரீஃப்ளைட் ஆட்டோ-ஃபிக்ஸ்',
            subtitle: '',
            content: `தானியங்கி அக்ரோபேட் பிரீஃப்ளைட் சுயவிவரங்கள் விடுபட்ட ப்ளீட்ஸ் (3மிமீ), RGB வண்ண இடைவெளிகள், சிதைந்த எழுத்துருக்கள் மற்றும் குறைந்த தெளிவுத்திறன் கொண்ட ராஸ்டர் பொருள்களை எவ்வாறு முறையாகக் கண்டறிகின்றன என்பதைக் கவனிக்க கீழே உள்ள வீடியோ சொற்பொழிவைப் பார்க்கவும்.

படி-படியாக சரிபார்ப்புப் பட்டியலைப் பின்தொடரவும்:
1. அக்ரோபேட் புரோ பிரீஃப்ளைட் கருவியில் PDF கோப்பைத் திறக்கவும்.
2. "அனைத்து RGB ஐயும் CMYK ஆக மாற்று (FOGRA39 / GRACoL 2013)" என்பதைத் தேர்ந்தெடுக்கவும்.
3. "3மிமீ ப்ளீட் பாக்ஸ் விரிவாக்கத்தைச் சேர்" ஸ்கிரிப்டைச் செயல்படுத்தவும்.
4. தட்டு வெளியீட்டிற்கு உயர் தெளிவுத்திறன் கொண்ட PDF/X-4 PDF ஐ ஏற்றுமதி செய்யவும்.`,
            calloutText: '',
            videoCaption: 'வீடியோ விரிவுரை: ஆசிரியரின் பின்னணி குரலுடன் பிரீஃப்ளைட்டிங் மாஸ்டர்கிளாஸ்'
          }
        },
        mediaType: 'video',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        videoCaption: 'Video Lecture: Preflighting Masterclass with Faculty Voiceover',
        layoutStyle: 'media-top',
        calloutText: '',
        bgTheme: 'dark-studio',
        courseModuleId: 'mod-3',
        exerciseFilePath: '',
        exerciseTitle: ''
      }
    ]
  }
];
