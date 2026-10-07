import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  X,
  MessageSquare,
  Star,
  Megaphone,
  Radio,
  Clock,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';
import {
  getClientNotifications,
  getClientUnreadCount,
  markAllClientNotificationsRead,
  getAllAdminNotifications,
  getAdminUnreadCount,
  markAllAdminNotificationsRead,
  markNotificationAsRead,
  deleteNotification,
} from './notificationApi';

function formatRelativeTime(dateString) {
  if (!dateString) return 'Recently';
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffSec < 45) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export default function NotificationBell({
  role = 'CLIENT', // 'CLIENT' | 'ADMIN'
  clientId = 1,
  adminId = 1,
  onNavigateToItem = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'CHAT' | 'REVIEWS'
  const popoverRef = useRef(null);

  const isClient = role === 'CLIENT';

  const fetchNotificationData = async () => {
    try {
      if (isClient) {
        const [items, count] = await Promise.all([
          getClientNotifications(clientId),
          getClientUnreadCount(clientId),
        ]);
        setNotifications(Array.isArray(items) ? items : []);
        setUnreadCount(Number(count) || 0);
      } else {
        const [items, count] = await Promise.all([
          getAllAdminNotifications(),
          getAdminUnreadCount(adminId),
        ]);
        setNotifications(Array.isArray(items) ? items : []);
        setUnreadCount(Number(count) || 0);
      }
    } catch (err) {
      console.warn('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotificationData();
    // Poll notifications every 20 seconds
    const interval = setInterval(fetchNotificationData, 20000);
    return () => clearInterval(interval);
  }, [role, clientId, adminId]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        setIsLoading(true);
        fetchNotificationData().finally(() => setIsLoading(false));
      }
      return next;
    });
  };

  const handleMarkAllRead = async () => {
    try {
      if (isClient) {
        await markAllClientNotificationsRead(clientId);
      } else {
        await markAllAdminNotificationsRead();
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark all as read:', err);
    }
  };

  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationID === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Failed to mark notification as read:', err);
    }
  };

  const handleDelete = async (id, isRead, e) => {
    e?.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.notificationID !== id));
      if (!isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.warn('Failed to delete notification:', err);
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === 'UNREAD') return !item.isRead;
    if (activeFilter === 'CHAT') {
      return (
        item.notificationType === 'CHAT_MESSAGE' ||
        item.notificationType === 'CHAT_REPLY'
      );
    }
    if (activeFilter === 'REVIEWS') {
      return (
        item.notificationType === 'CLIENT_REVIEW' ||
        item.notificationType === 'PUBLIC_REVIEW'
      );
    }
    return true;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'CHAT_MESSAGE':
      case 'CHAT_REPLY':
        return <MessageSquare className="w-4 h-4 text-[#08D9D6]" />;
      case 'CLIENT_REVIEW':
      case 'PUBLIC_REVIEW':
        return <Star className="w-4 h-4 text-amber-400 fill-amber-400" />;
      case 'SYSTEM_ALERT':
        return <Megaphone className="w-4 h-4 text-[#FF2E63]" />;
      default:
        return <Radio className="w-4 h-4 text-[#08D9D6]" />;
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className={`relative p-2 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center ${
          isOpen
            ? 'bg-white/20 text-white shadow-inner'
            : 'bg-white/10 hover:bg-white/15 text-white/90 hover:text-white'
        }`}
        title={`Notifications (${unreadCount} unread)`}
        aria-label="Toggle notifications menu"
      >
        <Bell className="w-4 h-4 transition-transform group-hover:scale-110" />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-[18px] px-1 items-center justify-center rounded-full bg-[#FF2E63] text-white text-[10px] font-black shadow-md border border-[#161B26] animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-[380px] sm:w-[420px] max-w-[calc(100vw-32px)] bg-[#1A1F2C] border border-white/15 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col font-sans animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3.5 bg-[#141824] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#08D9D6]/20 flex items-center justify-center text-[#08D9D6]">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">Notifications</h3>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-[#08D9D6]/20 text-[#08D9D6] border border-[#08D9D6]/30">
                    Observer Bus
                  </span>
                </div>
                <p className="text-[11px] text-white/50">
                  {unreadCount > 0
                    ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}`
                    : 'All communication caught up'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={fetchNotificationData}
                disabled={isLoading}
                title="Refresh notifications"
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#08D9D6]' : ''}`} />
              </button>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                  className="px-2 py-1 rounded-lg text-[11px] font-semibold text-[#08D9D6] hover:bg-[#08D9D6]/10 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Chips Bar */}
          <div className="px-3 py-2 bg-[#171C28] border-b border-white/5 flex items-center gap-1 overflow-x-auto scrollbar-none text-[11px]">
            {[
              { id: 'ALL', label: 'All', count: notifications.length },
              { id: 'UNREAD', label: 'Unread', count: unreadCount },
              {
                id: 'CHAT',
                label: 'Chat',
                count: notifications.filter(
                  (n) => n.notificationType === 'CHAT_MESSAGE' || n.notificationType === 'CHAT_REPLY'
                ).length,
              },
              {
                id: 'REVIEWS',
                label: 'Reviews',
                count: notifications.filter(
                  (n) => n.notificationType === 'CLIENT_REVIEW' || n.notificationType === 'PUBLIC_REVIEW'
                ).length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                  activeFilter === tab.id
                    ? 'bg-[#08D9D6] text-[#161B26] font-bold shadow-xs'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`text-[9px] px-1 rounded-full ${
                      activeFilter === tab.id ? 'bg-[#161B26]/30 text-[#161B26]' : 'bg-white/10 text-white/70'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Notifications Scrollable List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-white/5 scrollbar-thin scrollbar-thumb-white/10">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center flex flex-col items-center justify-center text-white/50">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                  <Check className="w-6 h-6 text-[#08D9D6]" />
                </div>
                <p className="text-sm font-semibold text-white/80">No notifications here</p>
                <p className="text-xs text-white/40 mt-1 max-w-[240px]">
                  {activeFilter === 'UNREAD'
                    ? 'All events have been reviewed.'
                    : 'New chat messages, reviews, and updates will appear here instantly.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.notificationID}
                  onClick={() => {
                    if (!item.isRead) handleMarkAsRead(item.notificationID);
                    if (onNavigateToItem) onNavigateToItem(item);
                  }}
                  className={`p-3.5 transition-colors cursor-pointer relative group flex gap-3 ${
                    item.isRead ? 'bg-transparent hover:bg-white/5 opacity-80' : 'bg-white/[0.04] hover:bg-white/[0.08]'
                  }`}
                >
                  {/* Left Icon Badge */}
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-8 h-8 rounded-xl bg-[#252A34] border border-white/10 flex items-center justify-center shadow-xs">
                      {getNotificationIcon(item.notificationType)}
                    </div>
                  </div>

                  {/* Body Text */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/10 text-white/80">
                        {item.senderName || item.senderRole || 'System'}
                      </span>
                      <span className="text-[10px] text-white/40 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {formatRelativeTime(item.createdAt)}
                      </span>
                      {!item.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#08D9D6] ring-4 ring-[#08D9D6]/20" />
                      )}
                    </div>

                    <h4
                      className={`text-xs font-semibold leading-snug line-clamp-1 ${
                        item.isRead ? 'text-white/80' : 'text-white font-bold'
                      }`}
                    >
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-white/60 line-clamp-2 mt-0.5 leading-relaxed">
                      {item.message}
                    </p>
                  </div>

                  {/* Right Actions on Hover */}
                  <div className="absolute right-2 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(item.notificationID, e)}
                        title="Mark read"
                        className="p-1 rounded-md text-white/60 hover:text-[#08D9D6] hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(item.notificationID, item.isRead, e)}
                      title="Delete"
                      className="p-1 rounded-md text-white/60 hover:text-[#FF2E63] hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-[#141824] border-t border-white/10 flex items-center justify-between text-[11px] text-white/50">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#08D9D6]" />
              <span>Observer Pattern Active</span>
            </div>
            <span className="text-[10px] text-white/40">Real-time Event Bus</span>
          </div>
        </div>
      )}
    </div>
  );
}
