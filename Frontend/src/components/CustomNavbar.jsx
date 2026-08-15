import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, PanelLeftOpen, Bell, Check, CheckCheck } from "lucide-react";
import { useNotificationStore } from "../store/useNotificationStore.js";
import { useReviewStore } from "../store/useReviewStore.js";
import { useAuth } from "../store/useAuthStore.js";

const CustomNavbar = ({ items, logo, className = "", onSidebarToggle, dashboardMode = false, indexingStatus, darkTheme = false }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigate = useNavigate();
  const { authUser } = useAuth();
  const { socket } = useReviewStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, subscribeToNotifications, unsubscribeFromNotifications } = useNotificationStore();
  const [showDropdown, setShowDropdown] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

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

  const regularItems = items.filter(item => item.label !== "Settings");
  const settingsItem = items.find(item => item.label === "Settings");

  return (
    <header
      className={`${
        dashboardMode ? `${darkTheme ? 'bg-[#050505] border-white/10' : 'bg-cream border-greenDark/10'} border-b py-4` : "fixed top-0 left-0 right-0 py-5"
      } z-50 transition-all duration-300 w-full ${
        (!dashboardMode && isScrolled)
          ? `${darkTheme ? 'bg-[#050505]/80' : 'bg-cream/80'} backdrop-blur-md shadow-sm !py-3`
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
            <span className={`text-2xl font-black tracking-tighter ${darkTheme ? 'text-cream' : 'text-greenDark'}`}>
              HatMind
            </span>
          </Link>
        </div>

        {/* Right Section: Progress Pill & Nav */}
        <div className="flex items-center gap-3">
          {/* Indexing Progress Pill (Desktop only to save space) */}
          {indexingStatus && indexingStatus.total > 0 && (
            <div 
              className="hidden lg:flex items-center gap-3"
              title={`${indexingStatus.indexed} out of ${indexingStatus.total} repositories indexed`}
            >
              <div className="flex items-center gap-2">
                {indexingStatus.progress === 100 ? (
                  <span className={`flex h-2 w-2 rounded-full ${darkTheme ? 'bg-greenLight' : 'bg-greenDark'}`}></span>
                ) : (
                  <span className="flex h-2 w-2 relative">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${darkTheme ? 'bg-greenLight' : 'bg-greenDark'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${darkTheme ? 'bg-greenLight' : 'bg-greenDark'}`}></span>
                  </span>
                )}
                <span className={`text-xs font-semibold ${
                  indexingStatus.progress === 100 ? (darkTheme ? 'text-greenLight' : 'text-greenDark') : (darkTheme ? 'text-white/70' : 'text-greenDark/70')
                }`}>
                  {indexingStatus.progress === 100 
                    ? `Indexed`
                    : `Indexing ${indexingStatus.progress}%`}
                </span>
              </div>
              
              {indexingStatus.progress < 100 && (
                <div className="w-16 h-1 bg-greenDark/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ease-out ${darkTheme ? 'bg-greenLight' : 'bg-greenDark'}`}
                    style={{ width: `${indexingStatus.progress}%` }}
                  />
                </div>
              )}
            </div>
          )}

        {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {regularItems.map((item, idx) => {
              const isActive = location.pathname === item.href;

              return item.onClick ? (
                <button
                  key={idx}
                  onClick={item.onClick}
                  className={`px-1 py-1 text-sm font-semibold transition-all duration-300 relative group ${darkTheme ? 'text-cream/80 hover:text-cream' : 'text-greenDark/80 hover:text-greenDark'}`}
                >
                  {item.label}
                  <span className={`absolute -bottom-1 left-0 h-[2px] transition-all duration-300 w-0 group-hover:w-full ${darkTheme ? "bg-greenLight" : "bg-greenDark"}`} />
                </button>
              ) : (
                <Link
                  key={idx}
                  to={item.href}
                  className={`px-1 py-1 text-sm font-semibold transition-all duration-300 relative group ${
                    isActive
                      ? (darkTheme ? "text-greenLight" : "text-greenDark")
                      : (darkTheme ? "text-cream/80 hover:text-cream" : "text-greenDark/80 hover:text-greenDark")
                  }`}
                >
                  {item.label}
                  <span className={`absolute -bottom-1 left-0 h-[2px] transition-all duration-300 ${
                     isActive ? "w-full" : "w-0 group-hover:w-full"
                  } ${darkTheme ? "bg-greenLight" : "bg-greenDark"}`} />
                </Link>
              );
            })}
          </div>

          {/* Notification Bell & Profile (Desktop) */}
          <div className="hidden md:flex items-center gap-3 ml-2 pl-4 border-l border-greenDark/20">
            {authUser && (
              <div className="relative flex items-center">
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`relative p-2 rounded-full transition-colors ${darkTheme ? 'text-cream hover:bg-white/10' : 'text-greenDark hover:bg-greenDark/10'}`}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className={`absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 ${darkTheme ? 'border-[#050505]' : 'border-cream'}`}>
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

            {/* Profile Photo - Most Right */}
            {settingsItem && authUser && (
              <Link
                to={settingsItem.href}
                className={`h-9 w-9 rounded-full overflow-hidden border-2 transition-transform duration-300 flex items-center justify-center font-bold text-sm hover:scale-110 shadow-sm ${
                  location.pathname === settingsItem.href
                    ? "border-greenLight shadow-md"
                    : (darkTheme ? "border-white/20 hover:border-white/50" : "border-greenDark/20 hover:border-greenDark/50")
                } ${darkTheme ? "bg-white/10 text-cream" : "bg-greenDark text-cream"}`}
                title="Settings"
              >
                {authUser.avatar ? (
                  <img src={authUser.avatar} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  getInitials(authUser.fullName)
                )}
              </Link>
            )}
          </div>

        {/* Mobile Toggle */}
        <button
          className={`md:hidden p-2 rounded-full border ${darkTheme ? 'text-cream bg-white/5 border-white/10' : 'text-greenDark bg-cream/50 border-greenDark/10'}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div
        className={`md:hidden absolute top-full left-0 w-full shadow-xl border-t transition-all duration-300 origin-top overflow-hidden ${darkTheme ? 'bg-[#050505] border-white/10' : 'bg-cream border-greenDark/10'} ${
          mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col p-4 gap-2">
          {regularItems.map((item, idx) => {
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
          
          {settingsItem && authUser && (
            <Link
              to={settingsItem.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors mt-2 border-t border-greenDark/10 ${
                location.pathname === settingsItem.href
                  ? "bg-greenDark text-cream"
                  : "text-greenDark hover:bg-greenDark/10"
              }`}
            >
              <div className={`h-8 w-8 rounded-full overflow-hidden flex items-center justify-center text-sm shrink-0 border border-greenDark/20 ${darkTheme ? "bg-white/10 text-cream" : "bg-greenDark text-cream"}`}>
                {authUser.avatar ? (
                  <img src={authUser.avatar} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  getInitials(authUser.fullName)
                )}
              </div>
              <span>Profile</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default CustomNavbar;
