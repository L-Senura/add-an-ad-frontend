import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  PlusCircle,
  CheckCircle2,
  Calendar,
  Loader2,
  RefreshCw,
  X,
  Ban,
} from 'lucide-react';
import {
  getClientTasks,
  submitClientTask,
  cancelClientTask,
} from './operationsApi';
import { getCampaignsByClientId } from '../campaign/campaignApi';

export default function ClientTaskSubmissionSection({ clientId = 1, clientName = 'Your Agency' }) {
  const [tasks, setTasks] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Modal State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [taskForm, setTaskForm] = useState(() => ({
    taskTitle: '',
    taskDetails: '',
    taskCategory: 'Graphic Design',
    campaignId: '',
    priority: 'MEDIUM',
    clientDeadline: '',
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancellingTaskId, setCancellingTaskId] = useState(null);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const list = await getClientTasks(clientId);
      setTasks(list || []);
    } catch (err) {
      console.warn('Error fetching client tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const [taskList, campList] = await Promise.all([
          getClientTasks(clientId),
          getCampaignsByClientId(clientId).catch(() => []),
        ]);
        if (isMounted) {
          setTasks(taskList || []);
          setCampaigns(campList || []);
        }
      } catch (err) {
        console.warn('Error loading client task section data:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [clientId]);

  // Submit new task
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.taskTitle.trim() || !taskForm.taskDetails.trim()) return;

    setIsSubmitting(true);
    try {
      await submitClientTask({
        clientId: Number(clientId),
        clientName,
        campaignId: taskForm.campaignId ? Number(taskForm.campaignId) : null,
        taskTitle: taskForm.taskTitle.trim(),
        taskDetails: taskForm.taskDetails.trim(),
        taskCategory: taskForm.taskCategory,
        priority: taskForm.priority,
        clientDeadline: taskForm.clientDeadline || null,
      });

      setNotification({
        type: 'success',
        text: 'Advertising task submitted! Our Task Coordinator will assign it to Production Staff shortly.',
      });

      setShowSubmitModal(false);
      setTaskForm({
        taskTitle: '',
        taskDetails: '',
        taskCategory: 'Graphic Design',
        campaignId: '',
        priority: 'MEDIUM',
        clientDeadline: '',
      });

      const updated = await getClientTasks(clientId);
      setTasks(updated || []);
    } catch (err) {
      setNotification({
        type: 'error',
        text: err.message || 'Failed to submit task.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel task
  const handleCancelTask = async (taskId) => {
    setCancellingTaskId(taskId);
    try {
      await cancelClientTask(taskId);
      setNotification({
        type: 'success',
        text: `Task #${taskId} has been cancelled.`,
      });
      const updated = await getClientTasks(clientId);
      setTasks(updated || []);
    } catch (err) {
      setNotification({
        type: 'error',
        text: err.message || 'Failed to cancel task.',
      });
    } finally {
      setCancellingTaskId(null);
    }
  };

  // Status badge helper
  const getStatusBadge = (status) => {
    const s = String(status).toUpperCase();
    if (s === 'COMPLETED') return { bg: 'rgba(8, 217, 214, 0.15)', text: '#252A34', border: '#08D9D6', label: 'Completed' };
    if (s === 'IN PROGRESS') return { bg: 'rgba(8, 217, 214, 0.25)', text: '#252A34', border: '#08D9D6', label: 'In Progress' };
    if (s === 'ASSIGNED') return { bg: 'rgba(37, 42, 52, 0.08)', text: '#252A34', border: 'rgba(37, 42, 52, 0.2)', label: 'Assigned to Staff' };
    if (s === 'CANCELLED') return { bg: '#FFF5F7', text: '#FF2E63', border: '#FF2E63', label: 'Cancelled' };
    return { bg: '#FFF5F7', text: '#FF2E63', border: '#FF2E63', label: 'Awaiting Coordinator Assignment' };
  };

  return (
    <div
      className="rounded-[32px] p-6 sm:p-8 bg-white border shadow-md transition-all"
      style={{ borderColor: 'rgba(8, 217, 214, 0.25)' }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-gray-100 gap-3">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 text-[#252A34]">
            <Briefcase className="w-5 h-5 text-[#FF2E63]" />
            Advertising Tasks & Requirements Desk
          </h3>
          <p className="text-xs text-gray-500">
            Submit creative tasks (graphics, videos, ad copies, landing pages) and track agency coordination.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchTasks}
            disabled={isLoading}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Refresh Tasks"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#08D9D6]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold shadow-md flex items-center gap-1.5 hover:opacity-95 transition-opacity cursor-pointer text-[#252A34]"
            style={{ background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)' }}
          >
            <PlusCircle className="w-4 h-4 text-[#252A34]" />
            <span>Give / Request a Task</span>
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className="mb-4 p-3.5 rounded-2xl flex items-center justify-between border text-xs animate-fade-in"
          style={{
            backgroundColor: notification.type === 'success' ? 'rgba(8, 217, 214, 0.1)' : '#FFF5F7',
            borderColor: notification.type === 'success' ? '#08D9D6' : '#FF2E63',
            color: notification.type === 'success' ? '#252A34' : '#FF2E63',
          }}
        >
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-[#08D9D6]" />
            <span>{notification.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Task List Content */}
      {isLoading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#08D9D6]" />
          <p className="text-xs font-semibold text-gray-400">Loading your submitted tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-10 text-center rounded-2xl bg-gray-50 border border-dashed border-gray-200">
          <Briefcase className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <h4 className="text-sm font-bold text-[#252A34]">No Advertising Tasks Submitted Yet</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
            Need custom graphics, promotional video cuts, ad copywriting, or landing page tweaks? Submit your requirements to our agency team.
          </p>
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer"
            style={{ backgroundColor: '#FF2E63' }}
          >
            + Submit First Task
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task) => {
            const sBadge = getStatusBadge(task.status);
            const canCancel = task.status !== 'Completed' && task.status !== 'Cancelled';

            return (
              <div
                key={task.id}
                className="p-5 rounded-2xl border bg-gray-50/70 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between"
                style={{ borderColor: 'rgba(37, 42, 52, 0.12)' }}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase" style={{ backgroundColor: '#FFF5F7', color: '#FF2E63' }}>
                        {task.taskCategory}
                      </span>
                      <h4 className="font-extrabold text-sm text-[#252A34] mt-1 leading-snug">
                        {task.taskTitle}
                      </h4>
                    </div>

                    <span
                      className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border whitespace-nowrap"
                      style={{
                        backgroundColor: sBadge.bg,
                        color: sBadge.text,
                        borderColor: sBadge.border,
                      }}
                    >
                      {sBadge.label}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mb-3 line-clamp-3">
                    {task.taskDetails}
                  </p>

                  {/* Coordination details if assigned */}
                  <div
                    className="p-2.5 rounded-xl border text-xs mb-3 flex flex-col gap-1"
                    style={{
                      backgroundColor: task.employeeName ? 'rgba(8, 217, 214, 0.08)' : '#FFF5F7',
                      borderColor: task.employeeName ? 'rgba(8, 217, 214, 0.3)' : 'rgba(255, 46, 99, 0.3)',
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Assigned Staff:</span>
                      <span className="font-bold text-xs" style={{ color: task.employeeName ? '#252A34' : '#FF2E63' }}>
                        {task.employeeName || 'Awaiting Coordinator'}
                      </span>
                    </div>

                    {task.coordinatorNotes && (
                      <p className="text-[11px] text-gray-600 italic pt-1 border-t border-gray-200/50">
                        <strong className="not-italic text-gray-500">Agency Note: </strong>
                        "{task.coordinatorNotes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#08D9D6]" />
                      Requested Due: <strong className="text-[#252A34]">{task.clientDeadline || 'Flexible'}</strong>
                    </span>
                    <span>Priority: <strong className="text-[#FF2E63]">{task.priority}</strong></span>
                  </div>
                </div>

                {/* Cancel Action */}
                {canCancel && (
                  <div className="pt-2.5 border-t border-gray-200 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleCancelTask(task.id)}
                      disabled={cancellingTaskId === task.id}
                      className="text-xs text-gray-400 hover:text-[#FF2E63] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {cancellingTaskId === task.id ? (
                        <Loader2 className="w-3 h-3 animate-spin text-[#FF2E63]" />
                      ) : (
                        <Ban className="w-3 h-3" />
                      )}
                      <span>Cancel Task</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* SUBMIT TASK MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div
            className="w-full max-w-lg rounded-3xl p-6 sm:p-7 bg-white border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            style={{ borderColor: 'rgba(37, 42, 52, 0.2)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-base text-[#252A34]">
                  Submit Advertising Task to Agency
                </h3>
                <p className="text-xs text-gray-500">
                  Provide creative briefs or technical requirements for our Task Coordinator.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
              {/* Task Title */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Task Title / Brief <span className="text-[#FF2E63]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={taskForm.taskTitle}
                  onChange={(e) => setTaskForm({ ...taskForm, taskTitle: e.target.value })}
                  placeholder="e.g. Design 3 Promo Instagram Banners for Weekend Flash Sale"
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#08D9D6] text-xs"
                />
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Task Category</label>
                  <select
                    value={taskForm.taskCategory}
                    onChange={(e) => setTaskForm({ ...taskForm, taskCategory: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#08D9D6] bg-white text-xs"
                  >
                    <option value="Graphic Design">Graphic Design & Banners</option>
                    <option value="Video Production">Video Production & Reels</option>
                    <option value="Copywriting">Copywriting & Slogans</option>
                    <option value="Social Media">Social Media Posts</option>
                    <option value="Web Development">Web / Landing Page</option>
                    <option value="General Marketing">General Marketing</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#08D9D6] bg-white text-xs"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              {/* Linked Campaign */}
              {campaigns.length > 0 && (
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Associated Campaign (Optional)</label>
                  <select
                    value={taskForm.campaignId}
                    onChange={(e) => setTaskForm({ ...taskForm, campaignId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#08D9D6] bg-white text-xs"
                  >
                    <option value="">No specific campaign</option>
                    {campaigns.map((camp) => (
                      <option key={camp.campaignId} value={String(camp.campaignId)}>
                        Campaign #{camp.campaignId}: {camp.campaignName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Deadline */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Requested Deadline Date</label>
                <input
                  type="date"
                  value={taskForm.clientDeadline}
                  onChange={(e) => setTaskForm({ ...taskForm, clientDeadline: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#08D9D6] text-xs"
                />
              </div>

              {/* Task Details / Requirements */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Detailed Requirements / Creative Instructions <span className="text-[#FF2E63]">*</span>
                </label>
                <textarea
                  rows="4"
                  required
                  value={taskForm.taskDetails}
                  onChange={(e) => setTaskForm({ ...taskForm, taskDetails: e.target.value })}
                  placeholder="Specify dimensions, copy slogans, color preferences, file format needs (PNG, MP4, etc.)..."
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#08D9D6] text-xs"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl font-bold shadow-xs flex items-center gap-1.5 cursor-pointer text-[#252A34]"
                  style={{ background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)' }}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-[#252A34]" /> : <PlusCircle className="w-4 h-4 text-[#252A34]" />}
                  <span>Submit Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
