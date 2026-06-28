import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const CustomNavbar = ({ items, logo }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-cream/80 backdrop-blur-md shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-greenDark flex justify-center items-center overflow-hidden transition-transform group-hover:scale-105 shadow-md">
            <img src={logo} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-greenDark">
            HatMind
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 bg-cream/50 backdrop-blur-sm border border-greenDark/10 p-1 rounded-full shadow-sm">
          {items.map((item, idx) => {
            const isActive = location.pathname === item.href;
            return item.onClick ? (
              <button
                key={idx}
                onClick={item.onClick}
                className="px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 text-greenDark hover:bg-greenDark/10"
              >
                {item.label}
              </button>
            ) : (
              <Link
                key={idx}
                to={item.href}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                  isActive
                    ? "bg-greenDark text-cream shadow-md"
                    : "text-greenDark hover:bg-greenDark/10"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-greenDark p-2 bg-cream/50 rounded-full border border-greenDark/10"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      <div
        className={`md:hidden absolute top-full left-0 w-full bg-cream shadow-xl border-t border-greenDark/10 transition-all duration-300 origin-top overflow-hidden ${
          mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col p-4 gap-2">
          {items.map((item, idx) => {
            const isActive = location.pathname === item.href;
            return item.onClick ? (
              <button
                key={idx}
                onClick={() => {
                  setMobileMenuOpen(false);
                  item.onClick();
                }}
                className="w-full text-left px-4 py-3 rounded-xl text-greenDark font-bold hover:bg-greenDark/10 transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <Link
                key={idx}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-xl font-bold transition-colors ${
                  isActive
                    ? "bg-greenDark text-cream"
                    : "text-greenDark hover:bg-greenDark/10"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export default CustomNavbar;
