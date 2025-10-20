import React from "react";
import PillNav from "../component/PillNav.jsx";
import GradientBlinds from "../component/GradientBlinds.jsx";
import TextType from "../component/TextType.jsx";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../store/useAuthStore.js";

const HomePage = () => {
  const [fadeIn, setFadeIn] = useState(false);
  const plasmaRef = useRef(null);
  const {authUser,logout}  = useAuth();

  // Trigger fade-in after mount
  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 100);
    return () => clearTimeout(timer);
  }, []);
  const navItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    ...(authUser
      ? [
          { label: "Logout", href: "#", onClick: logout }, // show logout if logged in
        ]
      : [
          { label: "Login", href: "/login" },
          { label: "Sign Up", href: "/signup" },
        ]),
  ];
  return (
    <div className="w-full backdrop-blur-md h-screen bg-black relative">
      <div
        ref={plasmaRef}
        className={`absolute inset-0 z-0 transition-opacity duration-1000 ${
          fadeIn ? "opacity-100" : "opacity-0"
        }`}
      >
        <GradientBlinds
          gradientColors={["#FF9FFC", "#5227FF"]}
          angle={0}
          noise={0.3}
          blindCount={12}
          blindMinWidth={50}
          spotlightRadius={0.5}
          spotlightSoftness={1}
          spotlightOpacity={1}
          mouseDampening={0.15}
          distortAmount={0}
          shineDirection="left"
          mixBlendMode="lighten"
        />
      </div>
      <div className="w-full flex h-screen absolute top-0 right-0 justify-center items-center">
        <PillNav
          logo="./ai.png"
          logoAlt="Company Logo"
          items={navItems}
          activeHref="/"
          className="custom-nav"
          ease="power2.easeOut"
          baseColor="#EEEEEE"
          pillColor="#222831"
          hoveredPillTextColor="#ffffff"
          pillTextColor="#EEEEEE"
        />
        <div className=" h-full w-full flex flex-col justify-center gap-8 items-center">
          <h1 className="text-5xl lg:text-7xl text-center  font-bold text-light">
            Welcome to HatMind
          </h1>
          <TextType
            className="text-4xl lg:text-6xl  font-bold text-center text-light"
            text={[
              "Instant AI reviews for your Python code.",
              "Write cleaner Python, faster.",
              "AI-powered Python code checks.",
              "Master Python with every review.",
            ]}
            typingSpeed={75}
            pauseDuration={1500}
            showCursor={true}
            cursorCharacter="|"
          />
          <div className="flex lg:w-[50%] justify-center items-center h-[15%] lg:gap-8 gap-2 py-5">
            <Link
              to="/chat"
              className="p-5  bg-light text-dark rounded-full text-xl lg:text-2xl font-bold  hover:p-6 transition-all"
            >
              Get started
            </Link>
            <Link
              to="/about"
              className="p-5 flex gap-2 justify-center items-center rounded-full bg-dark border hover:p-6 transition-all border-light backdrop-blur-lg opacity-50 text-light text-xl lg:text-2xl font-bold  "
            >
              Learn More <ExternalLink className="text-light" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
