import React, { useEffect, useRef, useMemo } from 'react';

/**
 * 3D Poem Animation
 * Recreates the exact 3D room perspective from the original design.
 * The text floats perfectly along the walls, flowing seamlessly from 
 * the right wall, through the corner, across the back wall, and out the left.
 */
export const PoemAnimation = ({
  poemHTML,
  backgroundImageUrl,
  boyImageUrl,
}: {
  poemHTML: string;
  backgroundImageUrl: string;
  boyImageUrl: string;
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Responsive scaling to ensure the 3D scene fits any screen size
  useEffect(() => {
    function adjustContentSize() {
      if (contentRef.current) {
        const viewportWidth = window.innerWidth;
        // The base width of the 3D container is 1000px.
        // If the viewport is very wide, we scale it up to ensure the walls hit the screen edges.
        const scaleFactor = Math.max(1, viewportWidth / 1200);
        contentRef.current.style.transform = `scale(${scaleFactor})`;
      }
    }
    adjustContentSize();
    window.addEventListener('resize', adjustContentSize);
    return () => window.removeEventListener('resize', adjustContentSize);
  }, []);

  // Clean the HTML to just the raw tags, and repeat it 30 times so it's a huge continuous string.
  const repeatedPoem = useMemo(() => {
    // Replace <p> tags with spaces to keep it inline
    const cleanHTML = poemHTML.replace(/<\/?p>/gi, ' ').trim();
    return Array(30).fill(cleanHTML).join('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
  }, [poemHTML]);

  return (
    <>
      <style>{`
        /* ─────────────────────────────────────────────────────
           3D ROOM MARQUEE CSS
        ───────────────────────────────────────────────────── */

        .hero-section {
          position: relative;
          width: 100%;
          height: 100vh; /* Full viewport height */
          min-height: 600px;
          background: #000;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ── Animated Background (The Room) ── */
        .hs-bg-layer {
          position: absolute;
          inset: 0;
          z-index: 1;
        }

        .hs-bg {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          animation: hs-zoom-in 30s ease forwards;
        }

        /* The Hue overlay that makes the whole room change color */
        .hs-hue-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 50%, rgba(0,255,255,0.15) 0%, transparent 80%);
          mix-blend-mode: color; /* Blends color onto the room */
          animation: hs-filter-animation 8s ease-in-out infinite;
          z-index: 2;
        }

        /* ── 3D Scene Wrapper ── */
        .hs-scene-wrapper {
          position: absolute;
          inset: 0;
          z-index: 3;
          display: flex;
          align-items: center;
          justify-content: center;
          /* Lower perspective = wider FOV, pushing walls closer to edges */
          perspective: 600px; 
          perspective-origin: 50% 50%;
        }

        /* Reflection scene */
        .hs-scene-reflect {
          position: absolute;
          inset: 0;
          z-index: 3;
          display: flex;
          align-items: center;
          justify-content: center;
          perspective: 600px;
          perspective-origin: 50% 50%;
          transform: scaleY(-1); /* Flip vertically */
          opacity: 0.15;
          pointer-events: none;
          mask-image: linear-gradient(to bottom, transparent 30%, black 100%);
          -webkit-mask-image: linear-gradient(to bottom, transparent 30%, black 100%);
        }

        /* ── The 3D Room Cube ── */
        .hs-content {
          position: relative;
          width: 1000px;
          height: 562px;
          transform-style: preserve-3d;
        }

        /* The Walls */
        .hs-face {
          position: absolute;
          width: 1000px;
          height: 562px;
          overflow: hidden;
          /* No background color — text floats directly on the background image */
          display: flex;
          align-items: center;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        /* Position the walls to form a U-shape room */
        .hs-face.back {
          transform: translateZ(-500px);
        }
        .hs-face.left {
          /* Center is at X=-500. It spans from Z=500 to Z=-500, touching the back wall perfectly */
          transform: translateX(-500px) translateZ(0px) rotateY(90deg);
        }
        .hs-face.right {
          /* Center is at X=500. It spans from Z=500 to Z=-500, touching the back wall perfectly */
          transform: translateX(500px) translateZ(0px) rotateY(-90deg);
        }

        /* ── The Text ── */
        .hs-text-wrap {
          display: inline-block;
          white-space: nowrap;
          font-family: 'Inter', sans-serif;
          font-size: 72px; /* Large text spanning the wall height */
          font-weight: 300;
          color: rgba(220, 240, 255, 0.55);
          line-height: 562px; /* Center vertically */
          letter-spacing: -0.02em;
          mix-blend-mode: screen; /* Makes text look projected onto the wall */
          will-change: transform;
        }

        .hs-text-wrap span {
          color: #00ffff;
          font-weight: 600;
          text-shadow: 0 0 25px rgba(0, 255, 255, 0.8);
        }

        /* ── Seamless Marquee Animations ── */
        /* Text moves from right to left (decreasing X). 
           To flow perfectly across corners, each wall's text is offset by exactly 1000px (the face width). */
           
        .hs-face.right .hs-text-wrap {
          animation: hs-scroll-right 90s linear infinite;
        }
        .hs-face.back .hs-text-wrap {
          animation: hs-scroll-back 90s linear infinite;
        }
        .hs-face.left .hs-text-wrap {
          animation: hs-scroll-left 90s linear infinite;
        }

        /* Right wall: enters at 0, exits at -50000 */
        @keyframes hs-scroll-right {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-40000px); }
        }
        
        /* Back wall: starts exactly 1000px ahead, so it picks up exactly what exits the right wall */
        @keyframes hs-scroll-back {
          0%   { transform: translateX(1000px); }
          100% { transform: translateX(-39000px); }
        }

        /* Left wall: starts exactly 2000px ahead, picking up what exits the back wall */
        @keyframes hs-scroll-left {
          0%   { transform: translateX(2000px); }
          100% { transform: translateX(-38000px); }
        }

        /* ── Foreground Elements ── */
        .hs-boy {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          height: 90%; /* Scales slightly so it doesn't touch the very top */
          width: auto;
          object-fit: contain;
          object-position: bottom;
          z-index: 5;
          filter: drop-shadow(0 0 50px rgba(0,255,255,0.25));
          pointer-events: none;
        }

        /* ── Overlay Headline ── */
        .hs-overlay {
          position: absolute;
          inset: 0;
          z-index: 6;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 0 5%;
          pointer-events: none;
        }

        .hs-h1 {
          font-family: 'Inter', sans-serif;
          font-size: clamp(40px, 5.5vw, 72px);
          font-weight: 700;
          line-height: 1.05;
          color: #fff;
          margin: 0 0 18px 0;
          text-shadow: 0 4px 40px rgba(0,0,0,0.8);
        }

        .hs-h1 .hs-grad {
          background: linear-gradient(90deg, #00ffff 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* ── Background Animations ── */
        @keyframes hs-filter-animation {
          0%   { filter: hue-rotate(0deg); }
          50%  { filter: hue-rotate(180deg); }
          100% { filter: hue-rotate(360deg); }
        }

        @keyframes hs-zoom-in {
          0%   { transform: scale(1); filter: brightness(1) contrast(1); }
          100% { transform: scale(1.15); filter: brightness(0.8) contrast(1.2); }
        }
      `}</style>

      <header className="hero-section">
        
        {/* Background Layer */}
        <div className="hs-bg-layer">
          <img
            className="hs-bg"
            src={backgroundImageUrl}
            alt="Courtyard"
            onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
          />
          {/* Hue overlay causes the whole room to color-shift */}
          <div className="hs-hue-overlay" />
        </div>

        {/* 3D Scene Wrapper */}
        <div className="hs-scene-wrapper">
          <div ref={contentRef} className="hs-content">
            {/* The 3 Walls */}
            <div className="hs-face left">
              <div className="hs-text-wrap" dangerouslySetInnerHTML={{ __html: repeatedPoem }} />
            </div>
            <div className="hs-face back">
              <div className="hs-text-wrap" dangerouslySetInnerHTML={{ __html: repeatedPoem }} />
            </div>
            <div className="hs-face right">
              <div className="hs-text-wrap" dangerouslySetInnerHTML={{ __html: repeatedPoem }} />
            </div>
          </div>
        </div>

        {/* 3D Reflection Wrapper */}
        <div className="hs-scene-reflect">
          <div className="hs-content" style={{ transform: contentRef.current?.style.transform || 'none' }}>
            <div className="hs-face left">
              <div className="hs-text-wrap" dangerouslySetInnerHTML={{ __html: repeatedPoem }} />
            </div>
            <div className="hs-face back">
              <div className="hs-text-wrap" dangerouslySetInnerHTML={{ __html: repeatedPoem }} />
            </div>
            <div className="hs-face right">
              <div className="hs-text-wrap" dangerouslySetInnerHTML={{ __html: repeatedPoem }} />
            </div>
          </div>
        </div>

        {/* Foreground Character */}
        <img
          className="hs-boy"
          src={boyImageUrl}
          alt="Characters"
          onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
        />

        {/* Headline Overlay */}
        <div className="hs-overlay">
          <div style={{ maxWidth: '500px' }}>
            <div style={{
              display: 'inline-block',
              padding: '6px 16px',
              background: 'rgba(0,255,255,0.1)',
              border: '1px solid rgba(0,255,255,0.3)',
              borderRadius: '999px',
              color: '#00ffff',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '20px'
            }}>
              Featured Collection
            </div>
            <h1 className="hs-h1">
              Discover <br />
              <span className="hs-grad">Phygital</span> <br />
              Reality.
            </h1>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '15px',
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.6,
              maxWidth: '380px',
              marginBottom: '30px',
              textShadow: '0 2px 10px rgba(0,0,0,0.8)'
            }}>
              The bridge between physical assets and digital ownership.
              Verify, trade, and experience products like never before.
            </p>
            <button style={{
              padding: '12px 32px',
              background: '#00ffff',
              color: '#000',
              fontWeight: 700,
              borderRadius: '999px',
              border: 'none',
              pointerEvents: 'auto',
              cursor: 'pointer'
            }}>
              Explore Now
            </button>
          </div>
        </div>

      </header>
    </>
  );
};
