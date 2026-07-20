import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isFetchingNotifications: false,

  fetchNotifications: async () => {
    set({ isFetchingNotifications: true });
    try {
      const res = await axiosInstance.get("/notifications");
      const unreadCount = res.data.filter(n => !n.isRead).length;
      set({ notifications: res.data, unreadCount, isFetchingNotifications: false });
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      set({ isFetchingNotifications: false });
    }
  },

  markAsRead: async (id) => {
    try {
      await axiosInstance.patch(`/notifications/${id}/read`);
      set((state) => {
        const updated = state.notifications.map(n => 
          n._id === id ? { ...n, isRead: true } : n
        );
        const unreadCount = updated.filter(n => !n.isRead).length;
        return { notifications: updated, unreadCount };
      });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  },

  markAllAsRead: async () => {
    try {
      await axiosInstance.patch("/notifications/read-all");
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  },

  subscribeToNotifications: (socket) => {
    if (!socket) return;
    
    socket.on("newNotification", (notification) => {
      set((state) => {
        const isDuplicate = state.notifications.some(n => n._id === notification._id);
        if (isDuplicate) return state;

        // Optionally show toast for new notification
        toast(notification.title, {
          icon: '🔔',
        });

        const newNotifications = [notification, ...state.notifications].slice(0, 50); // limit to 50
        const unreadCount = newNotifications.filter(n => !n.isRead).length;
        
        return {
          notifications: newNotifications,
          unreadCount
        };
      });
    });
  },

  unsubscribeFromNotifications: (socket) => {
    if (!socket) return;
    socket.off("newNotification");
  }
}));
