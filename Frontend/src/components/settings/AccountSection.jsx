import React, { useState, useRef } from "react";
import { useAuth } from "../../store/useAuthStore.js";
import { useSettingsStore } from "../../store/useSettingsStore.js";
import { Camera, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const AccountSection = () => {
  const { authUser, updateAuthUser } = useAuth();
  const { updateProfile, changePassword, isUpdatingProfile, isChangingPassword } = useSettingsStore();
  
  const [formData, setFormData] = useState({
    fullName: authUser?.fullName || "",
    email: authUser?.email || "",
  });
  
  const [passData, setPassData] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const [avatarPreview, setAvatarPreview] = useState(authUser?.avatar || null);
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    if (authUser) {
      setFormData({
        fullName: authUser.fullName || "",
        email: authUser.email || "",
      });
      if (authUser.avatar) {
        setAvatarPreview(authUser.avatar);
      }
    }
  }, [authUser]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {};
      if (formData.fullName !== authUser?.fullName) data.fullName = formData.fullName;
      if (formData.email !== authUser?.email) data.email = formData.email;
      if (avatarPreview && avatarPreview !== authUser?.avatar) data.avatar = avatarPreview;
      
      if (Object.keys(data).length === 0) return;
      
      const updatedUser = await updateProfile(data);
      updateAuthUser(updatedUser);
    } catch (error) {
      // Error handled by store
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      await changePassword(passData);
      setPassData({ currentPassword: "", newPassword: "" });
    } catch (error) {
      // Error handled by store
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setAvatarPreview(reader.result);
    };
  };

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-semibold text-greenDark mb-1">Account Profile</h2>
        <p className="text-gray-500 mb-6">Manage your personal information and avatar.</p>
        
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-greenLight/10 border-2 border-greenLight/20 flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl text-greenDark uppercase">{authUser?.fullName?.[0]}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-greenDark text-cream rounded-full hover:bg-greenLight transition-colors shadow-sm"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            <div className="text-sm text-gray-500">
              <p>Recommended: Square image, max 5MB.</p>
              <p>JPG, PNG, or GIF.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-greenDark focus:ring-1 focus:ring-greenDark outline-none transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-greenDark focus:ring-1 focus:ring-greenDark outline-none transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isUpdatingProfile}
            className="px-6 py-2 bg-greenDark text-cream rounded-lg font-medium hover:bg-greenLight transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save Profile
          </button>
        </form>
      </div>

      <div className="pt-8 border-t border-gray-100">
        <h2 className="text-xl font-semibold text-greenDark mb-1">Change Password</h2>
        <p className="text-gray-500 mb-6">Ensure your account is using a long, random password.</p>
        
        <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Current Password</label>
            <input
              type="password"
              value={passData.currentPassword}
              onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-greenDark focus:ring-1 focus:ring-greenDark outline-none transition-all"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">New Password</label>
            <input
              type="password"
              value={passData.newPassword}
              onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-greenDark focus:ring-1 focus:ring-greenDark outline-none transition-all"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={isChangingPassword || !passData.currentPassword || !passData.newPassword}
            className="px-6 py-2 bg-greenDark text-cream rounded-lg font-medium hover:bg-greenLight transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccountSection;
