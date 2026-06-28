import React from "react";
import { Terminal, Code, Braces, Cpu } from "lucide-react";

const FloatingTile = ({ children, className, delay, duration }) => (
  <div
    className={`absolute w-16 h-16 rounded-2xl bg-cream/10 backdrop-blur-md border border-cream/20 flex justify-center items-center text-cream shadow-[0_0_15px_rgba(251,245,221,0.2)] ${className}`}
    style={{
      animation: `float-tile ${duration}s ease-in-out infinite`,
      animationDelay: `${delay}s`,
    }}
  >
    {children}
  </div>
);

const AuthVisual = () => {
  return (
    <div className="hidden lg:flex w-1/2 bg-[#1A5B2E] relative flex-col justify-center items-center overflow-hidden">
      <style>
        {`
          @keyframes float-tile {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(3deg); }
          }
        `}
      </style>

      {/* Floating Tiles mimicking the radial pattern in the image */}
      {/* Top Left */}
      <FloatingTile delay={0} duration={6} className="top-[15%] left-[20%]">
        <Braces size={28} />
      </FloatingTile>

      {/* Top Center-Right */}
      <FloatingTile delay={1.5} duration={7} className="top-[8%] right-[35%]">
        <Terminal size={28} />
      </FloatingTile>

      {/* Top Right */}
      <FloatingTile delay={0.5} duration={6.5} className="top-[20%] right-[15%]">
        <Cpu size={28} />
      </FloatingTile>

      {/* Middle Left */}
      <FloatingTile delay={2} duration={8} className="top-[45%] left-[10%]">
        <Terminal size={28} />
      </FloatingTile>

      {/* Middle Right */}
      <FloatingTile delay={1} duration={7.5} className="top-[45%] right-[10%]">
        <Code size={28} />
      </FloatingTile>

      {/* Bottom Left */}
      <FloatingTile delay={2.5} duration={6} className="bottom-[15%] left-[20%]">
        <Braces size={28} />
      </FloatingTile>

      {/* Bottom Center */}
      <FloatingTile delay={0.8} duration={7} className="bottom-[8%] left-[45%]">
        <Terminal size={28} />
      </FloatingTile>

      {/* Bottom Right */}
      <FloatingTile delay={1.8} duration={6.5} className="bottom-[15%] right-[20%]">
        <Cpu size={28} />
      </FloatingTile>

      {/* Central Content */}
      <div className="relative z-10 max-w-md px-8 text-center flex flex-col gap-6 items-center">
        {/* Logo Box */}
        <div className="w-20 h-20 rounded-3xl bg-cream flex justify-center items-center shadow-[0_0_30px_rgba(251,245,221,0.3)] mb-2">
          <span className="text-4xl font-black text-[#1A5B2E] tracking-tighter">Ai</span>
        </div>
        
        {/* Main Text */}
        <h1 className="text-5xl font-bold text-cream tracking-tight drop-shadow-sm leading-tight">
          Join the AI<br/>Revolution
        </h1>
        
        {/* Subtext */}
        <p className="text-lg text-cream/90 font-medium leading-relaxed max-w-sm">
          Sign up to collaborate with your<br/>
          intelligent pair programmer. Level up<br/>
          your coding experience.
        </p>
      </div>
    </div>
  );
};

export default AuthVisual;
