import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Building2,
  Send,
  Reply,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  Clock,
  Loader2,
  Shield,
  ArrowLeft,
  RefreshCw,
  Star,
} from 'lucide-react';
import {
  sendAdminMessageToClient,
  replyAdminMessage,
  updateAdminMessage,
  deleteAdminMessage,
  getFullConversationThread,
} from './communicationApi';
import { getAllClients, getStoredAuthSession } from '../client/api';
import AdminReviewDesk from './AdminReviewDesk';
import logoImg from '../../assets/Add-an-Ad.png';

// Sample client list for offline/demo reliability
const DEMO_CHAT_CLIENTS = [
  {
    clientID: 1,
    companyName: 'Nova Marketing Agency',
    firstName: 'Alexander',
    lastName: 'Wright',
    email: 'alex@novamedia.com',
    lastMessage: 'Could you also confirm the exact billing cycle for the on-site pin ad campaign?',
    lastTime: '45m ago',
    unread: true,
  },
  {
    clientID: 101,
    companyName: 'OmniVanguard Digital',
    firstName: 'Marcus',
    lastName: 'Vance',
    email: 'marcus@omnivanguard.io',
    lastMessage: 'We have updated our campaign proposal with additional Instagram reels.',
    lastTime: '2h ago',
    unread: false,
  },
  {
    clientID: 102,
    companyName: 'Lumina Creative Labs',
    firstName: 'Elena',
    lastName: 'Rostova',
    email: 'elena@luminacreative.com',
    lastMessage: 'Requesting review of ad copy approval before launch.',
    lastTime: '1d ago',
    unread: false,
  },
];

export default function AdminChatDashboard({ onBackToDashboard }) {
  const [adminSession] = useState(() => getStoredAuthSession());
  const [clients, setClients] = useState(DEMO_CHAT_CLIENTS);
  const [selectedClientId, setSelectedClientId] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [threadMessages, setThreadMessages] = useState([]);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyTargetMessage, setReplyTargetMessage] = useState(null); // client msg being directly replied to
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState('');
  const [activeView, setActiveView] = useState('chat'); // 'chat' | 'reviews'

  const messagesContainerRef = useRef(null);
  const isFirstLoadRef = useRef(true);

  // Safely scroll ONLY the inner chat messages container, NEVER the window
  const scrollThreadToBottom = (behavior = 'smooth') => {
    const el = messagesContainerRef.current;
    if (!el) return;
    if (behavior === 'auto') {
      el.scrollTop = el.scrollHeight;
    } else {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  // Load clients list from API
  useEffect(() => {
    async function loadClientList() {
      try {
        const apiClients = await getAllClients();
        if (Array.isArray(apiClients) && apiClients.length > 0) {
          const merged = apiClients.map((c, i) => ({
            ...c,
            lastMessage: DEMO_CHAT_CLIENTS[i % DEMO_CHAT_CLIENTS.length]?.lastMessage || 'Client inquiry registered.',
            lastTime: DEMO_CHAT_CLIENTS[i % DEMO_CHAT_CLIENTS.length]?.lastTime || 'Recent',
            unread: i === 0,
          }));
          setClients(merged);
          if (merged[0]) {
            setSelectedClientId(merged[0].clientID);
          }
        }
      } catch (err) {
        console.warn('Using demo client list for chat:', err);
      }
    }
    loadClientList();
  }, []);

  // Load conversation for the selected client
  const loadThread = async (cId) => {
    setIsLoadingThread(true);
    const resolvedAdminId = adminSession?.userId || 4;
    try {
      const thread = await getFullConversationThread(cId, resolvedAdminId);
      setThreadMessages(thread);
    } catch (err) {
      console.warn('Error loading admin thread:', err);
    } finally {
      setIsLoadingThread(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    isFirstLoadRef.current = true;
    const resolvedAdminId = adminSession?.userId || 4;

    async function fetchThread() {
      if (!selectedClientId) return;
      try {
        const thread = await getFullConversationThread(selectedClientId, resolvedAdminId);
        if (isMounted) {
          setThreadMessages(thread);
          setIsLoadingThread(false);
        }
      } catch (err) {
        console.warn('Error loading admin thread:', err);
        if (isMounted) setIsLoadingThread(false);
      }
    }
    fetchThread();

    const interval = setInterval(async () => {
      if (!selectedClientId) return;
      try {
        const thread = await getFullConversationThread(selectedClientId, resolvedAdminId);
        if (isMounted && Array.isArray(thread)) {
          setThreadMessages((prev) => {
            if (prev.length === thread.length && JSON.stringify(prev) === JSON.stringify(thread)) {
              return prev;
            }
            return thread;
          });
        }
      } catch {
        // silent
      }
    }, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedClientId, adminSession?.userId]);

  useEffect(() => {
    if (!threadMessages || threadMessages.length === 0) return;
    const el = messagesContainerRef.current;
    if (!el) return;

    if (isFirstLoadRef.current) {
      // Instant scroll only inside the chatbox container on first load, never touches page
      el.scrollTop = el.scrollHeight;
      isFirstLoadRef.current = false;
    } else {
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      if (isNearBottom) {
        scrollThreadToBottom('smooth');
      }
    }
  }, [threadMessages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setInputText('');
    const resolvedAdminId = adminSession?.userId || 1;

    try {
      if (replyTargetMessage) {
        await replyAdminMessage(
          resolvedAdminId,
          selectedClientId,
          replyTargetMessage.clientMessageID,
          trimmed
        );
        setReplyTargetMessage(null);
      } else {
        await sendAdminMessageToClient(resolvedAdminId, selectedClientId, trimmed);
      }
      await loadThread(selectedClientId);
      setTimeout(() => scrollThreadToBottom('smooth'), 50);
    } catch (err) {
      console.error('Failed to send admin message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleStartEdit = (msg) => {
    setEditingMessageId(msg.adminMessageID);
    setEditText(msg.adminMessage);
  };

  const handleSaveEdit = async (msgId) => {
    if (!editText.trim()) return;
    const resolvedAdminId = adminSession?.userId || 4;
    try {
      await updateAdminMessage(resolvedAdminId, msgId, editText.trim());
      setEditingMessageId(null);
      await loadThread(selectedClientId);
    } catch (err) {
      console.error('Failed to update admin message:', err);
    }
  };

  const handleDelete = async (msgId) => {
    if (!window.confirm('Delete your admin message?')) return;
    const resolvedAdminId = adminSession?.userId || 4;
    try {
      await deleteAdminMessage(resolvedAdminId, msgId);
      await loadThread(selectedClientId);
    } catch (err) {
      console.error('Failed to delete admin message:', err);
    }
  };

  const selectedClient =
    clients.find((c) => String(c.clientID) === String(selectedClientId)) || clients[0];

  const filteredClients = clients.filter(
    (c) =>
      c.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (timeStr) => {
    if (!timeStr) return 'Just now';
    try {
      return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div
      className="min-h-screen w-full py-8 px-4 sm:px-6 lg:px-8 font-sans"
      style={{
        backgroundColor: '#EAEAEA',
        backgroundImage: `
          radial-gradient(circle at 10% 20%, rgba(8, 217, 214, 0.12) 0%, transparent 40%),
          radial-gradient(circle at 90% 80%, rgba(255, 46, 99, 0.12) 0%, transparent 45%),
          radial-gradient(circle at 50% 50%, rgba(37, 42, 52, 0.03) 0%, transparent 60%)
        `,
      }}
    >
      {/* Top Navbar */}
      <header className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3">
          {/* <img
            src={logoImg}
            alt="Add-an-Ad Logo"
            className="h-10 w-auto object-contain select-none"
          /> */}
          <div>
            <div className="flex items-center gap-2">
              {/* <span className="text-xl font-bold tracking-tight text-[#252A34]">
                Add-an-Ad
              </span> */}
              <span
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider text-white bg-[#FF2E63]"
              >
                Admin Communication & Review Desk
              </span>
            </div>
            <p className="text-xs font-medium text-gray-500">
              Client Inquiries, Messaging Coordination & Direct Executive Replies
            </p>
          </div>
        </div>

        {onBackToDashboard && (
          <button
            type="button"
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-gray-300 transition-all duration-200 bg-white hover:bg-gray-50 text-[#252A34] shadow-xs hover:border-[#08D9D6]"
          >
            <ArrowLeft className="w-4 h-4 text-[#252A34]" />
            Back to Admin Suite
          </button>
        )}
      </header>

      {/* View Switcher: Live Chat vs Client Reviews */}
      <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between">
        <div className="inline-flex p-1.5 rounded-2xl bg-white border border-gray-200 shadow-xs gap-1.5">
          <button
            type="button"
            onClick={() => setActiveView('chat')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeView === 'chat'
                ? 'bg-[#252A34] text-[#08D9D6] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Live Client Messaging
          </button>
          <button
            type="button"
            onClick={() => setActiveView('reviews')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeView === 'reviews'
                ? 'bg-[#FF2E63] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            Client Reviews & Ratings
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto">
        {activeView === 'reviews' ? (
          <AdminReviewDesk adminSession={adminSession} />
        ) : (
          <div
            className="rounded-[32px] bg-white border border-gray-200 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]"
          >
          {/* LEFT SIDEBAR: Client Conversation Queue (4 cols) */}
          <div
            className="lg:col-span-4 border-r border-gray-200 flex flex-col bg-white"
          >
            {/* Sidebar Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Search className="w-4 h-4 text-gray-400" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search client agencies..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs bg-[#EAEAEA]/50 focus:ring-2 focus:ring-[#08D9D6] focus:border-transparent text-[#252A34]"
                />
              </div>
            </div>

            {/* Client Conversations List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {filteredClients.map((client) => {
                const isSelected = String(client.clientID) === String(selectedClientId);
                return (
                  <button
                    key={client.clientID}
                    type="button"
                    onClick={() => {
                      setSelectedClientId(client.clientID);
                      setReplyTargetMessage(null);
                    }}
                    className={`w-full text-left p-4 transition-colors flex items-start gap-3 relative ${
                      isSelected
                        ? 'bg-[#08D9D6]/10'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Active highlight bar */}
                    {isSelected && (
                      <span
                        className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#08D9D6]"
                      />
                    )}

                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        isSelected ? 'bg-[#08D9D6] text-[#252A34]' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-xs truncate text-[#252A34]">
                          {client.companyName}
                        </span>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                          {client.lastTime || '1h ago'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mb-1">
                        {client.firstName} {client.lastName}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate line-clamp-1 italic">
                        "{client.lastMessage}"
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: Chat Conversation View (8 cols) */}
          <div className="lg:col-span-8 flex flex-col bg-[#EAEAEA]/30">
            {/* Active Chat Header */}
            <div
              className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs bg-[#252A34]"
                >
                  <Building2 className="w-5 h-5 text-[#08D9D6]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm sm:text-base text-[#252A34]">
                      {selectedClient?.companyName || 'Agency Chat'}
                    </h3>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-[#08D9D6]/20 text-[#252A34] border border-[#08D9D6]/40"
                    >
                      Client #{selectedClient?.clientID}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Contact: {selectedClient?.firstName} {selectedClient?.lastName} • {selectedClient?.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => loadThread(selectedClientId)}
                title="Refresh Thread"
                className="p-2 rounded-xl text-gray-500 hover:text-[#252A34] hover:bg-gray-100 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Message Stream */}
            <div ref={messagesContainerRef} className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4 max-h-[460px]">
              {isLoadingThread ? (
                <div className="py-24 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#08D9D6]" />
                  <p className="text-xs font-semibold text-gray-500">
                    Loading agency thread...
                  </p>
                </div>
              ) : threadMessages.length === 0 ? (
                <div className="text-center py-20">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-semibold text-[#252A34]">
                    No messages recorded yet with {selectedClient?.companyName}.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Send a direct greeting or reply to initiate communication.
                  </p>
                </div>
              ) : (
                threadMessages.map((msg, idx) => {
                  const isAdmin = msg.sender === 'ADMIN';

                  return (
                    <div
                      key={isAdmin ? `admin-${msg.adminMessageID || idx}` : `client-${msg.clientMessageID || idx}`}
                      className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} group`}
                    >
                      {/* Sender label */}
                      <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] font-semibold text-gray-500">
                        {isAdmin ? (
                          <span className="flex items-center gap-1 text-[#FF2E63]">
                            <Shield className="w-3 h-3" />
                            Admin Reply
                          </span>
                        ) : (
                          <span className="text-[#252A34]">
                            {selectedClient?.companyName}
                          </span>
                        )}
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-gray-400 font-normal">
                          <Clock className="w-3 h-3" />
                          {formatTime(msg.adminMessageTime || msg.clientMessageTime)}
                        </span>
                      </div>

                      {/* Bubble Container */}
                      <div className="relative max-w-lg">
                        {isAdmin && editingMessageId === msg.adminMessageID ? (
                          <div className="p-2.5 rounded-2xl bg-white border border-gray-200 shadow-md flex items-center gap-2">
                            <input
                              type="text"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="text-xs px-2 py-1 rounded border border-gray-300 flex-1 focus:ring-1 focus:ring-[#08D9D6] text-[#252A34]"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(msg.adminMessageID)}
                              className="p-1 rounded bg-[#08D9D6] text-[#252A34] hover:bg-[#00c7c4]"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingMessageId(null)}
                              className="p-1 rounded bg-gray-200 text-gray-600 hover:bg-gray-300"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div
                            className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                              isAdmin
                                ? 'bg-[#252A34] text-white rounded-tr-xs'
                                : 'bg-white border border-gray-200 text-[#252A34] rounded-tl-xs'
                            }`}
                          >
                            {/* If an admin message is referencing a client msg */}
                            {msg.clientMessageID && isAdmin && (
                              <div
                                className="mb-2 p-1.5 rounded-lg border-l-2 text-[10px] text-white/80 border-[#08D9D6] bg-black/20 line-clamp-1"
                              >
                                Direct response to message #{msg.clientMessageID}
                              </div>
                            )}
                            <p>{msg.adminMessage || msg.clientMessage}</p>
                          </div>
                        )}

                        {/* Actions below bubble */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 mt-1 px-1 text-[10px] text-gray-400">
                          {!isAdmin && (
                            <button
                              type="button"
                              onClick={() => setReplyTargetMessage(msg)}
                              className="hover:text-[#08D9D6] flex items-center gap-1 font-semibold"
                            >
                              <Reply className="w-3 h-3" />
                              Reply to this
                            </button>
                          )}
                          {isAdmin && editingMessageId !== msg.adminMessageID && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(msg)}
                                className="hover:text-[#08D9D6] flex items-center gap-0.5"
                              >
                                <Edit2 className="w-2.5 h-2.5" />
                                Edit
                              </button>
                              <span>•</span>
                              <button
                                type="button"
                                onClick={() => handleDelete(msg.adminMessageID)}
                                className="hover:text-[#FF2E63] flex items-center gap-0.5"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Replying Context Pill */}
            {replyTargetMessage && (
              <div className="px-5 py-2 bg-[#08D9D6]/10 border-t border-[#08D9D6]/30 flex items-center justify-between text-xs text-[#252A34]">
                <div className="flex items-center gap-2 truncate">
                  <Reply className="w-3.5 h-3.5 flex-shrink-0 text-[#08D9D6]" />
                  <span className="truncate">
                    Replying to {selectedClient?.companyName}: "{replyTargetMessage.clientMessage}"
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyTargetMessage(null)}
                  className="p-1 hover:text-[#FF2E63]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Message Input Form */}
            <form
              onSubmit={handleSend}
              className="p-4 bg-white border-t border-gray-200 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  replyTargetMessage
                    ? `Write your reply to ${selectedClient?.companyName}...`
                    : `Send executive response to ${selectedClient?.companyName}...`
                }
                className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 text-xs sm:text-sm transition-all focus:ring-2 focus:ring-[#08D9D6] focus:border-transparent bg-[#EAEAEA]/50 text-[#252A34]"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="py-3 px-5 rounded-2xl text-[#252A34] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none hover:-translate-y-0.5 active:translate-y-0"
                style={{
                  background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
                }}
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Send Reply</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-gray-500">
        <p>© {new Date().getFullYear()} Add-an-Ad Platform • Admin Communication Module</p>
      </footer>
    </div>
  );
}
