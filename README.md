# Victory Always Academy

A premium, cinematic, scroll-led website for **Victory Always Academy**, C.B.D. Belapur, Navi Mumbai.

## Experience

- Branded loading sequence and responsive fixed navigation
- Weighted smooth scrolling with Lenis
- GSAP ScrollTrigger timelines, pinning, parallax, and horizontal scroll chapters
- Ten-part narrative progress indicator
- Layered editorial hero and sticky coaching pillars
- Horizontal student journey and review experiences
- Asymmetric program card system
- Classroom image reveal, confidence split-screen, verified number animations, and cinematic finale
- Contextual desktop cursor and magnetic calls to action
- Purpose-built full-screen mobile navigation and mobile layouts
- Reduced-motion and optional-library fallbacks
- Semantic landmarks, keyboard focus styles, descriptive alternative text, and touch-friendly controls

## Run locally

This is a dependency-free static website. Serve the repository directory with any local web server:

```bash
python3 -m http.server 4173 --bind 0.0.0.0
```

Then open `http://localhost:4173`.

## Project structure

```text
.
├── assets/
│   ├── classroom-victory.jpg
│   └── classroom-victory.webp
├── index.html
├── script.js
└── style.css
```

The optimized WebP classroom image is served first, with JPEG as the fallback. GSAP, ScrollTrigger, Lenis, and Google Fonts are loaded from CDNs; the layout falls back to accessible native scrolling if an optional animation library is unavailable.

## Academy details

**Victory Always Academy**<br>
A-1/2/26 & 27, C.B.D. Belapur, Sector 2, Maharashtra – 400614<br>
Phone: [087790 03486](tel:+918779003486)
