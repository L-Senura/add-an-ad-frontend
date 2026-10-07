import React, { useState, useEffect } from 'react';
import {
  Layers,
  Radio,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  MessageSquare,
  Star,
  Megaphone,
  Mail,
  FileText,
  Activity,
  Trash2,
  Check,
  CheckCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  getAllAdminNotifications,
  getRegisteredObservers,
  sendCustomNotification,
  markNotificationAsRead,
  deleteNotification,
  markAllAdminNotificationsRead,
} from './notificationApi';

export default function ObserverEventMonitor({ adminSession }) {
  const [observers, setObservers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('ALL'); // 'ALL' | 'CLIENT' | 'ADMIN'
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'CHAT_MESSAGE' | 'CLIENT_REVIEW' | 'PUBLIC_REVIEW' | 'SYSTEM_ALERT'

  // Dispatch Simulator form state
  const [simTitle, setSimTitle] = useState('');
  const [simMessage, setSimMessage] = useState('');
  const [simRecipientRole, setSimRecipientRole] = useState('ALL'); // 'ALL' | 'CLIENT' | 'ADMIN'
  const [simType, setSimType] = useState('SYSTEM_ALERT');
  const [isSending, setIsSending] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [obsList, notifList] = await Promise.all([
        getRegisteredObservers(),
        getAllAdminNotifications(),
      ]);
      setObservers(Array.isArray(obsList) ? obsList : []);
      setNotifications(Array.isArray(notifList) ? notifList : []);
    } catch (err) {
      console.warn('Error loading Observer data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDispatchSimulation = async (e) => {
    e.preventDefault();
    if (!simTitle.trim() || !simMessage.trim()) return;

    setIsSending(true);
    setStatusFeedback(null);
    try {
      const newNotif = await sendCustomNotification({
        title: simTitle.trim(),
        message: simMessage.trim(),
        recipientRole: simRecipientRole,
        senderRole: 'ADMIN',
        senderID: adminSession?.adminId || 1,
        senderName: adminSession?.firstName || 'Agency Administrator',
        notificationType: simType,
      });

      setStatusFeedback({
        type: 'success',
        text: `Event successfully broadcasted to ${observers.length} registered observers!`,
      });
      setSimTitle('');
      setSimMessage('');
      // Reload notifications list
      loadData();
    } catch (err) {
      setStatusFeedback({
        type: 'error',
        text: err.message || 'Failed to dispatch notification.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationID === id ? { ...n, isRead: true } : n))
      );
    } catch {}
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.notificationID !== id));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAdminNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filterRole !== 'ALL' && n.recipientRole !== filterRole) return false;
    if (filterType !== 'ALL' && n.notificationType !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Design Pattern Introduction */}
      <div className="bg-[#161B26] text-white p-6 rounded-2xl shadow-lg border border-white/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-[#08D9D6]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-[#08D9D6]/20 text-[#08D9D6] border border-[#08D9D6]/30">
                GoF Observer Pattern
              </span>
              <span className="text-white/40">•</span>
              <span className="text-xs text-white/60 font-semibold">Communication Architecture</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Communication Observer Event Bus
            </h2>
            <p className="text-xs sm:text-sm text-white/70 max-w-2xl mt-1 leading-relaxed">
              Decouples agency chat, review submissions, and system events using the Observer design pattern.
              The <strong className="text-white">CommunicationSubject</strong> broadcasts events to registered
              observers for role routing, audit tracking, and multi-channel dispatch.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border border-white/10 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#08D9D6]' : ''}`} />
            <span>Refresh Bus Status</span>
          </button>
        </div>
      </div>

      {/* Grid: 1. Registered Observers Cards | 2. Live Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Architecture & Registered Observers */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-black/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#08D9D6]/10 flex items-center justify-center text-[#08D9D6]">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#252A34]">Active Concrete Observers</h3>
                  <p className="text-[11px] text-gray-500">
                    Discovered and managed by CommunicationSubject
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                {observers.length} Registered
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {observers.map((obs, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-white hover:border-[#08D9D6]/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className="text-xs font-bold text-[#252A34] truncate">{obs.name}</h4>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <p className="text-[11px] text-gray-500 font-mono">
                      {obs.class || obs.name}.java
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-gray-200/60 flex items-center gap-1.5 text-[10px]">
                    <span className="text-gray-400 font-medium">Handles:</span>
                    {obs.handlesClient && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">
                        CLIENT
                      </span>
                    )}
                    {obs.handlesAdmin && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-bold">
                        ADMIN
                      </span>
                    )}
                    {obs.handlesAll && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">
                        GLOBAL
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Event Bus Diagram */}
          <div className="bg-[#1A1F2C] text-white p-5 rounded-2xl shadow-sm border border-white/10">
            <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#08D9D6]" />
              Pattern Flow Architecture
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center">
                <span className="text-[10px] uppercase font-bold text-[#FF2E63] tracking-wider mb-1">
                  1. Event Producers
                </span>
                <span className="font-semibold text-white">ClientChatController</span>
                <span className="font-semibold text-white">AdminChatController</span>
                <span className="font-semibold text-white">ReviewController</span>
              </div>

              <div className="p-3 rounded-xl bg-[#08D9D6]/10 border border-[#08D9D6]/30 flex flex-col items-center justify-center">
                <span className="text-[10px] uppercase font-bold text-[#08D9D6] tracking-wider mb-1">
                  2. Subject / Event Bus
                </span>
                <span className="font-extrabold text-[#08D9D6]">CommunicationSubject</span>
                <span className="text-[10px] text-white/60">notifyObservers(event)</span>
                <span className="text-[9px] text-white/40 mt-1">Persists & broadcasts</span>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center">
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider mb-1">
                  3. Concrete Observers
                </span>
                <span className="font-semibold text-white">ClientNotificationObserver</span>
                <span className="font-semibold text-white">AdminNotificationObserver</span>
                <span className="font-semibold text-white">Audit & Email Observers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Dispatch Simulator Tool */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-black/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#FF2E63]/10 flex items-center justify-center text-[#FF2E63]">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#252A34]">Dispatch Simulator</h3>
                <p className="text-[11px] text-gray-500">Broadcast test communication event</p>
              </div>
            </div>

            {statusFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold mb-3 flex items-start gap-2 ${
                  statusFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {statusFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{statusFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleDispatchSimulation} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Recipient Audience
                </label>
                <select
                  value={simRecipientRole}
                  onChange={(e) => setSimRecipientRole(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#08D9D6] focus:outline-none"
                >
                  <option value="ALL">All Platform Users (Broadcast)</option>
                  <option value="CLIENT">Clients Only (Brands)</option>
                  <option value="ADMIN">Administrators Only</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Event Category
                </label>
                <select
                  value={simType}
                  onChange={(e) => setSimType(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#08D9D6] focus:outline-none"
                >
                  <option value="SYSTEM_ALERT">System Announcement</option>
                  <option value="CHAT_MESSAGE">Simulated Chat Message</option>
                  <option value="CLIENT_REVIEW">Service Review Event</option>
                  <option value="PUBLIC_REVIEW">Public Brand Review</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Notification Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q4 Agency Campaign Deadline Notice"
                  value={simTitle}
                  onChange={(e) => setSimTitle(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#08D9D6] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Message Body
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter detailed message text to pass through observers..."
                  value={simMessage}
                  onChange={(e) => setSimMessage(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#08D9D6] focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-[#FF2E63] hover:bg-[#FF2E63]/90 text-white shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Radio className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
                <span>{isSending ? 'Triggering Observers...' : 'Broadcast via Subject'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Dispatched Events Audit Log Table */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-black/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#252A34] text-white flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#252A34]">Dispatched Notification Records</h3>
              <p className="text-[11px] text-gray-500">
                Persisted events received by In-App and Audit Observers
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="CLIENT">Client Targets</option>
              <option value="ADMIN">Admin Targets</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="CHAT_MESSAGE">Chat Messages</option>
              <option value="CHAT_REPLY">Chat Replies</option>
              <option value="CLIENT_REVIEW">Client Reviews</option>
              <option value="PUBLIC_REVIEW">Public Reviews</option>
              <option value="SYSTEM_ALERT">System Alerts</option>
            </select>

            <button
              type="button"
              onClick={handleMarkAllRead}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All Read</span>
            </button>
          </div>
        </div>

        {/* Table / List */}
        <div className="overflow-x-auto">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              No dispatched notification records match the current filter.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 min-w-[600px]">
              {filteredNotifications.map((n) => (
                <div
                  key={n.notificationID}
                  className={`py-3 px-3 rounded-xl transition-colors flex items-center justify-between gap-4 ${
                    n.isRead ? 'bg-transparent' : 'bg-gray-50/80 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        n.isRead ? 'bg-gray-300' : 'bg-[#08D9D6]'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                          To: {n.recipientRole} {n.recipientID ? `#${n.recipientID}` : '(All)'}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                          {n.notificationType || 'NOTIFICATION'}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(n.createdAt || Date.now()).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-gray-900 truncate">{n.title}</h5>
                      <p className="text-[11px] text-gray-500 truncate">{n.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(n.notificationID)}
                        title="Mark Read"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(n.notificationID)}
                      title="Delete Record"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
