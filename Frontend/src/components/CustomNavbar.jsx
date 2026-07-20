import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, PanelLeftOpen, Bell, Check, CheckCheck } from "lucide-react";
import { useNotificationStore } from "../store/useNotificationStore.js";
import { useReviewStore } from "../store/useReviewStore.js";
import { useAuth } from "../store/useAuthStore.js";

const CustomNavbar = ({ items, logo, className = "", onSidebarToggle, dashboardMode = false, indexingStatus }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigate = useNavigate();
  const { authUser } = useAuth();
  const { socket } = useReviewStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, subscribeToNotifications, unsubscribeFromNotifications } = useNotificationStore();
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (authUser) {
      fetchNotifications();
    }
  }, [authUser]);

  useEffect(() => {
    if (socket && authUser) {
      subscribeToNotifications(socket);
      return () => unsubscribeFromNotifications(socket);
    }
  }, [socket, authUser, subscribeToNotifications, unsubscribeFromNotifications]);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    setShowDropdown(false);
    if (notification.metadata?.repoId && notification.metadata?.prNumber) {
      navigate(`/reviews?repoId=${notification.metadata.repoId}&prNumber=${notification.metadata.prNumber}`);
    }
  };


  return (
    <header
      className={`${
        dashboardMode ? "bg-cream border-b border-greenDark/10 py-4" : "fixed top-0 left-0 right-0 py-5"
      } z-50 transition-all duration-300 w-full ${
        (!dashboardMode && isScrolled)
          ? "bg-cream/80 backdrop-blur-md shadow-sm !py-3"
          : (!dashboardMode ? "bg-transparent" : "")
      } ${className}`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {onSidebarToggle && (
            <button
              onClick={onSidebarToggle}
              className="lg:hidden p-2 -ml-2 text-greenDark/70 hover:text-greenDark hover:bg-greenDark/10 rounded-xl transition-all"
              title="Open chat history"
            >
              <PanelLeftOpen size={22} />
            </button>
          )}
          {/* Logo */}
          <Link to="/" className={`flex items-center gap-2 group`}>
            <img 
              src={logo} 
              alt="Logo" 
              className="h-10 w-auto rounded-xl object-contain transition-transform group-hover:scale-105 shadow-md" 
            />
            <span className="text-2xl font-black tracking-tighter text-greenDark">
              HatMind
            </span>
          </Link>
        </div>

        {/* Right Section: Progress Pill & Nav */}
        <div className="flex items-center gap-3">
          {/* Indexing Progress Pill (Desktop only to save space) */}
          {indexingStatus && indexingStatus.total > 0 && (
            <div 
              className="hidden lg:flex items-center gap-3 bg-cream/50 backdrop-blur-sm border border-greenDark/10 pl-3 pr-4 py-1.5 rounded-full shadow-sm"
              title={`${indexingStatus.indexed} out of ${indexingStatus.total} repositories indexed`}
            >
              <div className="flex items-center gap-2">
                {indexingStatus.progress === 100 ? (
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                ) : (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-greenDark opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-greenDark"></span>
                  </span>
                )}
                <span className={`text-xs font-bold ${
                  indexingStatus.progress === 100 ? 'text-emerald-600' : 'text-greenDark'
                }`}>
                  {indexingStatus.progress === 100 
                    ? `Indexed`
                    : `Indexing... ${indexingStatus.progress}%`}
                </span>
              </div>
              
              <div className="w-16 h-1.5 bg-greenDark/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    indexingStatus.progress === 100
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                      : 'bg-gradient-to-r from-greenDark to-emerald-500'
                  }`}
                  style={{ width: `${indexingStatus.progress}%` }}
                />
              </div>
            </div>
          )}

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

          {/* Notification Bell (Desktop) */}
          {authUser && (
            <div className="relative flex items-center ml-2 mr-2">
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-greenDark hover:bg-greenDark/10 rounded-full transition-colors"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-cream">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute top-full mt-3 right-0 w-80 bg-white border border-greenDark/10 shadow-xl rounded-xl overflow-hidden z-50">
                  <div className="p-3 border-b border-greenDark/5 flex justify-between items-center bg-cream/30">
                    <span className="font-bold text-sm text-greenDark">Notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                        className="text-xs text-greenDark/60 hover:text-greenDark flex items-center gap-1 transition-colors"
                      >
                        <CheckCheck size={14} /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-greenDark/50">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n._id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3 border-b border-greenDark/5 cursor-pointer hover:bg-greenDark/5 transition-colors ${!n.isRead ? 'bg-greenDark/5' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className={`text-sm ${!n.isRead ? 'font-bold text-greenDark' : 'font-medium text-greenDark/80'}`}>
                              {n.title}
                            </span>
                            {!n.isRead && <span className="h-2 w-2 bg-greenLight rounded-full mt-1.5 flex-shrink-0"></span>}
                          </div>
                          <p className="text-xs text-greenDark/60 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-greenDark/40 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-greenDark p-2 bg-cream/50 rounded-full border border-greenDark/10"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        </div>
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
