'use client';

import React, { useState, useEffect } from 'react';

interface Particle {
  id: number;
  top: number;
  width: number;
  duration: number;
  delay: number;
}

const DragonBoatAnimation: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { innerWidth, innerHeight } = window;
    const x = (e.clientX / innerWidth - 0.5) * 10;
    const y = (e.clientY / innerHeight - 0.5) * 10;
    setMousePos({ x, y });
  };

  // Stabilize random values
  // Stabilize random values
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles([...Array(15)].map((_, i) => ({ // eslint-disable-line react-hooks/set-state-in-effect
        id: i,
        top: Math.random() * 100,
        width: 100 + Math.random() * 300,
        duration: 2 + Math.random() * 3,
        delay: -Math.random() * 5
      })));

  }, []);

  return (
    <div 
      className="relative w-full h-full bg-transparent overflow-hidden flex flex-col items-center justify-center perspective-1000"
      onMouseMove={handleMouseMove}
      style={{ perspective: '1000px' }}
    >
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx>{`
        @keyframes grid-move {
          0% { transform: translateY(0); opacity: 0; }
          20% { opacity: 0.3; }
          100% { transform: translateY(100px); opacity: 0; }
        }
        
        @keyframes stroke-abstract {
          0% { transform: translateX(0) scaleX(0.5); opacity: 0.2; }
          20% { transform: translateX(5px) scaleX(1.5); opacity: 1; }
          50% { transform: translateX(-10px) scaleX(1); opacity: 0.5; }
          100% { transform: translateX(0) scaleX(0.5); opacity: 0.2; }
        }

        @keyframes pulse-sync {
          0%, 100% { r: 4; fill-opacity: 0.5; }
          20% { r: 6; fill-opacity: 1; }
        }

        @keyframes flow {
          0% { transform: translateX(100vw); opacity: 0; }
          10% { opacity: 0.5; }
          90% { opacity: 0.5; }
          100% { transform: translateX(-100vw); opacity: 0; }
        }

        .animate-stroke { animation: stroke-abstract 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        .animate-pulse-sync { animation: pulse-sync 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
      `}</style>

      {/* Hintergrund: Tech-Grid & Partikel */}
      <div className="absolute inset-0 z-0">
        {/* Raster */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]"></div>
        
        {/* Speed Partikel */}
        {particles.map((p) => (
          <div 
            key={p.id}
            className="absolute h-[1px] bg-gradient-to-l from-blue-500 dark:from-cyan-500 to-transparent opacity-30 rounded-full"
            style={{
              top: `${p.top}%`,
              width: `${p.width}px`,
              animation: `flow ${p.duration}s linear infinite`,
              animationDelay: `${p.delay}s`
            }}
          />
        ))}
      </div>

      {/* Modernes Drachenboot */}
      <div 
        className="relative z-10 w-full max-w-[600px] h-[200px] transition-transform duration-100 ease-out"
        style={{ 
          transform: `rotateX(${mousePos.y}deg) rotateY(${mousePos.x}deg)`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="100%" height="160" viewBox="0 0 600 160" className="drop-shadow-2xl">
            <defs>
              <linearGradient id="hullGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e40af" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#1e40af" stopOpacity="0.8" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Rumpf */}
            <path 
              d="M 50,80 L 100,50 L 500,50 L 580,80 L 500,110 L 100,110 Z" 
              fill="url(#hullGradient)" 
              stroke="#2563eb" 
              strokeWidth="1"
              className="backdrop-blur-md"
            />
            
            {/* Highlight Linien */}
            <path d="M 110,65 L 490,65" stroke="#60a5fa" strokeWidth="1" opacity="0.5" />
            <path d="M 110,95 L 490,95" stroke="#60a5fa" strokeWidth="1" opacity="0.5" />

            {/* Die Crew */}
            <g fill="#3b82f6" className="dark:fill-cyan-400">
              {[...Array(8)].map((_, i) => (
                <g key={i} transform={`translate(${140 + i * 50}, 0)`}>
                  <circle cy="65" className="animate-pulse-sync" />
                  <circle cy="95" className="animate-pulse-sync" />
                </g>
              ))}
            </g>

            {/* Die Bewegung (Ruder als Energielinien) */}
            <g stroke="#3b82f6" className="dark:stroke-cyan-400" strokeWidth="2" strokeLinecap="round">
              {[...Array(8)].map((_, i) => (
                <g key={i} transform={`translate(${140 + i * 50}, 0)`}>
                  <line x1="0" y1="50" x2="0" y2="20" className="animate-stroke" style={{ transformOrigin: '0 50px' }} />
                  <line x1="0" y1="110" x2="0" y2="140" className="animate-stroke" style={{ transformOrigin: '0 110px' }} />
                </g>
              ))}
            </g>

            {/* Trommler */}
            <circle cx="540" cy="80" r="4" fill="white" className="animate-pulse">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
            </circle>
            
            {/* Steuer */}
            <rect x="60" y="78" width="20" height="4" fill="#64748b" rx="2" />

            {/* Bugspitze Glühen */}
            <circle cx="580" cy="80" r="2" fill="#3b82f6" className="dark:fill-cyan-400" filter="url(#glow)" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default DragonBoatAnimation;
