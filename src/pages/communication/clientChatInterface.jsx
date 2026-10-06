import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  MessageSquare,
  Shield,
  Edit2,
  Trash2,
  Check,
  X,
  Clock,
  Loader2,
  Headphones,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  sendClientMessage,
  updateClientMessage,
  deleteClientMessage,
  getFullConversationThread,
} from './communicationApi';

export default function ClientChatInterface({ clientId = 1, clientName = 'Your Agency' }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState('');

  const messagesContainerRef = useRef(null);
  const isFirstLoadRef = useRef(true);

  // Safely scroll ONLY the inner chatbox container to bottom without scrolling the browser window
  const scrollChatToBottom = (behavior = 'smooth') => {
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

  const loadConversation = async () => {
    try {
      const thread = await getFullConversationThread(clientId);
      setMessages(thread);
    } catch (err) {
      console.warn('Error loading chat thread:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchThread() {
      try {
        const thread = await getFullConversationThread(clientId);
        if (isMounted) {
          setMessages(thread);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('Error loading chat thread:', err);
        if (isMounted) setIsLoading(false);
      }
    }
    fetchThread();

    const interval = setInterval(async () => {
      try {
        const thread = await getFullConversationThread(clientId);
        if (isMounted && Array.isArray(thread)) {
          setMessages((prev) => {
            // Avoid triggering re-renders if messages haven't changed
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
  }, [clientId]);

  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const el = messagesContainerRef.current;
    if (!el) return;

    if (isFirstLoadRef.current) {
      // Instant internal scroll on first load without affecting parent window scroll
      el.scrollTop = el.scrollHeight;
      isFirstLoadRef.current = false;
    } else {
      // Only smooth scroll if user is already near bottom of chatbox
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      if (isNearBottom) {
        scrollChatToBottom('smooth');
      }
    }
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setInputText('');

    try {
      await sendClientMessage(clientId, trimmed);
      await loadConversation();
      setTimeout(() => scrollChatToBottom('smooth'), 50);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleStartEdit = (msg) => {
    setEditingMessageId(msg.clientMessageID);
    setEditText(msg.clientMessage);
  };

  const handleSaveEdit = async (msgId) => {
    if (!editText.trim()) return;
    try {
      await updateClientMessage(clientId, msgId, editText.trim());
      setEditingMessageId(null);
      await loadConversation();
    } catch (err) {
      console.error('Failed to update message:', err);
    }
  };

  const handleDelete = async (msgId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await deleteClientMessage(clientId, msgId);
      await loadConversation();
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return 'Just now';
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recent';
    }
  };

  const quickQuestions = [
    'How do I add multiple campaign channels?',
    'What is the rate card for YouTube & Facebook?',
    'When will our ad creative be published?',
  ];

  return (
    <div
      className="rounded-[32px] bg-white border border-gray-200 shadow-xl flex flex-col overflow-hidden transition-all duration-300"
      style={{
        minHeight: '520px',
      }}
    >
      {/* Top Header */}
      <div
        className="px-6 py-4 border-b border-gray-700 flex items-center justify-between bg-[#252A34]"
      >
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner bg-[#08D9D6]/20 border border-[#08D9D6]/30"
          >
            <Headphones className="w-5 h-5 text-[#08D9D6]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                Agency Executive & Admin Support
              </h3>
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Desk
              </span>
            </div>
            <p className="text-xs text-white/70">
              Direct communication line with Add-an-Ad Operations & Communication Executives
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadConversation}
          title="Refresh Messages"
          className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Message History Thread */}
      <div
        ref={messagesContainerRef}
        className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4 max-h-[380px] bg-[#EAEAEA]/40"
      >
        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#08D9D6]" />
            <p className="text-xs font-semibold text-gray-500">
              Connecting to secure agency chat...
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div
              className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-3 bg-[#08D9D6]/15"
            >
              <MessageSquare className="w-6 h-6 text-[#08D9D6]" />
            </div>
            <h4 className="text-sm font-bold text-[#252A34] mb-1">
              Start a Conversation with Agency Admins
            </h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
              Have questions regarding advertising campaigns, pricing, invoices, or creative tasks?
              Drop a message here and our executives will assist you.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isClient = msg.sender === 'CLIENT';

            return (
              <div
                key={isClient ? `client-${msg.clientMessageID || index}` : `admin-${msg.adminMessageID || index}`}
                className={`flex flex-col ${isClient ? 'items-end' : 'items-start'} group`}
              >
                {/* Sender badge header */}
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] font-semibold text-gray-500">
                  {isClient ? (
                    <span className="text-[#252A34] font-bold">You ({clientName})</span>
                  ) : (
                    <span className="flex items-center gap-1 text-[#FF2E63] font-bold">
                      <Shield className="w-3 h-3" />
                      Add-an-Ad Executive
                    </span>
                  )}
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-gray-400 font-normal">
                    <Clock className="w-3 h-3" />
                    {formatTime(msg.clientMessageTime || msg.adminMessageTime)}
                  </span>
                </div>

                {/* Message Bubble */}
                <div className="relative max-w-lg">
                  {isClient && editingMessageId === msg.clientMessageID ? (
                    <div className="p-2.5 rounded-2xl bg-white border border-gray-200 shadow-md flex items-center gap-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="text-xs px-2 py-1 rounded border border-gray-300 flex-1 focus:ring-1 focus:ring-[#08D9D6] text-[#252A34]"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(msg.clientMessageID)}
                        className="p-1 rounded bg-[#08D9D6] text-[#252A34] hover:bg-[#00c7c4]"
                        title="Save edit"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingMessageId(null)}
                        className="p-1 rounded bg-gray-200 text-gray-600 hover:bg-gray-300"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs transition-all ${
                        isClient
                          ? 'text-[#252A34] font-medium rounded-tr-xs'
                          : 'bg-white border border-gray-200 text-[#252A34] rounded-tl-xs shadow-xs'
                      }`}
                      style={{
                        background: isClient
                          ? 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)'
                          : '#FFFFFF',
                      }}
                    >
                      {/* If replying to a specific client msg */}
                      {msg.clientMessageID && !isClient && (() => {
                        const referenced = messages.find(
                          (m) => m.sender === 'CLIENT' && String(m.clientMessageID) === String(msg.clientMessageID)
                        );
                        return (
                          <div
                            className="mb-2 p-2 rounded-xl border-l-4 text-[11px] bg-gray-50 border-[#08D9D6] text-gray-600 shadow-2xs"
                          >
                            <span className="font-bold text-[#08D9D6] block text-[10px] uppercase tracking-wider">
                              In reply to your inquiry #{msg.clientMessageID}
                            </span>
                            {referenced?.clientMessage ? (
                              <p className="line-clamp-2 italic text-gray-500 mt-0.5">
                                "{referenced.clientMessage}"
                              </p>
                            ) : null}
                          </div>
                        );
                      })()}
                      <p className="whitespace-pre-wrap">{msg.adminMessage || msg.clientMessage}</p>
                    </div>
                  )}

                  {/* Client action buttons (edit/delete) on hover */}
                  {isClient && editingMessageId !== msg.clientMessageID && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-1 justify-end px-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(msg)}
                        className="text-[10px] text-gray-500 hover:text-[#08D9D6] flex items-center gap-0.5"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                        Edit
                      </button>
                      <span className="text-gray-300">•</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(msg.clientMessageID)}
                        className="text-[10px] text-gray-500 hover:text-[#FF2E63] flex items-center gap-0.5"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Inquiry Suggestions */}
      <div className="px-5 py-2.5 bg-white border-t border-gray-100 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1 mr-1">
          <Sparkles className="w-3 h-3 text-[#08D9D6]" />
          Suggested:
        </span>
        {quickQuestions.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setInputText(q)}
            className="text-[11px] px-2.5 py-1 rounded-full border border-gray-200 transition-all hover:bg-gray-50 hover:border-[#08D9D6] text-gray-600 truncate max-w-xs"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Bottom Message Input Area */}
      <form
        onSubmit={handleSend}
        className="p-4 bg-white border-t border-gray-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your inquiry to advertising agency administrators..."
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
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
