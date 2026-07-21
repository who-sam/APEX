package main

import "encoding/base64"

// Course cover art. Each is a self-contained 800x400 SVG rendered into a
// base64 data URI and stored in Class.CoverImage, so the demo classes ship
// with polished, on-theme banners without any external asset hosting.

func svgURI(svg string) string {
	return "data:image/svg+xml;base64," + base64.StdEncoding.EncodeToString([]byte(svg))
}

var (
	coverCS101  = svgURI(coverCS101SVG)
	coverCS210  = svgURI(coverCS210SVG)
	coverCS330  = svgURI(coverCS330SVG)
	coverECE240 = svgURI(coverECE240SVG)
)

const coverCS101SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4f46e5"/>
      <stop offset="1" stop-color="#7c3aed"/>
    </linearGradient>
  </defs>
  <rect width="800" height="400" fill="url(#g)"/>
  <circle cx="700" cy="70" r="190" fill="#ffffff" opacity="0.06"/>
  <circle cx="120" cy="380" r="150" fill="#000000" opacity="0.08"/>
  <g fill="none" stroke="#c4b5fd" stroke-width="12" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="560,140 512,210 560,280"/>
    <polyline points="672,140 720,210 672,280"/>
  </g>
  <line x1="600" y1="290" x2="632" y2="130" stroke="#ede9fe" stroke-width="9" stroke-linecap="round"/>
  <text x="60" y="180" fill="#ffffff" font-size="76" font-weight="700" letter-spacing="1">CS101</text>
  <text x="62" y="232" fill="#e0e7ff" font-size="31" font-weight="500">Introduction to Programming</text>
  <text x="62" y="312" fill="#c7d2fe" font-size="23" font-family="Consolas, Menlo, monospace">print(&quot;Hello, World&quot;)</text>
</svg>`

const coverCS210SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#059669"/>
      <stop offset="1" stop-color="#0d9488"/>
    </linearGradient>
  </defs>
  <rect width="800" height="400" fill="url(#g)"/>
  <circle cx="710" cy="330" r="180" fill="#ffffff" opacity="0.06"/>
  <circle cx="140" cy="60" r="130" fill="#000000" opacity="0.07"/>
  <g stroke="#a7f3d0" stroke-width="5" opacity="0.9">
    <line x1="560" y1="120" x2="620" y2="200"/>
    <line x1="690" y1="110" x2="620" y2="200"/>
    <line x1="690" y1="110" x2="730" y2="210"/>
    <line x1="620" y1="200" x2="730" y2="210"/>
    <line x1="620" y1="200" x2="575" y2="295"/>
    <line x1="730" y1="210" x2="700" y2="300"/>
    <line x1="575" y1="295" x2="700" y2="300"/>
  </g>
  <g fill="#ecfdf5" stroke="#34d399" stroke-width="4">
    <circle cx="560" cy="120" r="17"/>
    <circle cx="690" cy="110" r="17"/>
    <circle cx="620" cy="200" r="19"/>
    <circle cx="730" cy="210" r="17"/>
    <circle cx="575" cy="295" r="17"/>
    <circle cx="700" cy="300" r="17"/>
  </g>
  <text x="60" y="180" fill="#ffffff" font-size="76" font-weight="700" letter-spacing="1">CS210</text>
  <text x="62" y="232" fill="#d1fae5" font-size="31" font-weight="500">Data Structures &amp; Algorithms</text>
  <text x="62" y="312" fill="#a7f3d0" font-size="23" font-family="Consolas, Menlo, monospace">O(log n) &#183; trees &#183; graphs</text>
</svg>`

const coverCS330SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f59e0b"/>
      <stop offset="1" stop-color="#ea580c"/>
    </linearGradient>
  </defs>
  <rect width="800" height="400" fill="url(#g)"/>
  <circle cx="700" cy="80" r="185" fill="#ffffff" opacity="0.07"/>
  <circle cx="130" cy="370" r="150" fill="#000000" opacity="0.08"/>
  <g transform="translate(590,110)" fill="#fff7ed" stroke="#fdba74" stroke-width="4">
    <path d="M0,18 v124 a55,18 0 0 0 110,0 v-124" fill="#fed7aa" opacity="0.55"/>
    <ellipse cx="55" cy="18" rx="55" ry="18" fill="#fff7ed"/>
    <path d="M0,60 a55,18 0 0 0 110,0" fill="none"/>
    <path d="M0,102 a55,18 0 0 0 110,0" fill="none"/>
  </g>
  <text x="60" y="180" fill="#ffffff" font-size="76" font-weight="700" letter-spacing="1">CS330</text>
  <text x="62" y="232" fill="#ffedd5" font-size="31" font-weight="500">Database Systems</text>
  <text x="62" y="312" fill="#fed7aa" font-size="23" font-family="Consolas, Menlo, monospace">SELECT * FROM knowledge;</text>
</svg>`

const coverECE240SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0ea5e9"/>
      <stop offset="1" stop-color="#1e3a8a"/>
    </linearGradient>
  </defs>
  <rect width="800" height="400" fill="url(#g)"/>
  <circle cx="700" cy="330" r="180" fill="#ffffff" opacity="0.05"/>
  <g stroke="#7dd3fc" stroke-width="4" fill="none" opacity="0.85" stroke-linecap="round">
    <path d="M545,120 h40 v-40"/>
    <path d="M545,170 h70"/>
    <path d="M545,230 h70"/>
    <path d="M545,280 h40 v40"/>
    <path d="M735,140 h-40 v-30"/>
    <path d="M735,210 h-55"/>
    <path d="M735,275 h-40 v35"/>
  </g>
  <g fill="#38bdf8">
    <circle cx="585" cy="80" r="6"/><circle cx="585" cy="320" r="6"/>
    <circle cx="695" cy="110" r="6"/><circle cx="695" cy="310" r="6"/>
  </g>
  <rect x="600" y="160" width="100" height="100" rx="12" fill="#0b1220" stroke="#60a5fa" stroke-width="4"/>
  <g fill="#93c5fd">
    <rect x="618" y="188" width="64" height="8" rx="4"/>
    <rect x="618" y="208" width="64" height="8" rx="4"/>
    <rect x="618" y="228" width="44" height="8" rx="4"/>
  </g>
  <text x="60" y="180" fill="#ffffff" font-size="72" font-weight="700" letter-spacing="1">ECE240</text>
  <text x="62" y="232" fill="#dbeafe" font-size="31" font-weight="500">Embedded C Programming</text>
  <text x="62" y="312" fill="#bae6fd" font-size="23" font-family="Consolas, Menlo, monospace">volatile uint8_t *GPIO;</text>
</svg>`
