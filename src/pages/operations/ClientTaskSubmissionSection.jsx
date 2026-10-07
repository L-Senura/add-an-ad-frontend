import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  PlusCircle,
  CheckCircle2,
  Calendar,
  Loader2,
  RefreshCw,
  X,
  Clock,
  Filter,
  User,
  Info,
  AlertCircle,
  FileText,
  Pencil,
  Lock,
  Trash2,
} from 'lucide-react';
import {
  getClientTasks,
  getClientTasksByStatus,
  getTaskDetails,
  submitClientTask,
  updateClientTask,
  cancelClientTask,
} from './operationsApi';
import { getCampaignsByClientId } from '../campaign/campaignApi';

export default function ClientTaskSubmissionSection({ clientId = 1, clientName = 'Your Agency' }) {
  const [tasks, setTasks] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Submit Modal State
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

  // Edit Task Modal State (Client editing before admin assignment)
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({
    taskTitle: '',
    taskDetails: '',
    taskCategory: 'Graphic Design',
    campaignId: '',
    priority: 'MEDIUM',
    clientDeadline: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // View Details Modal State
  const [viewingTask, setViewingTask] = useState(null);
  const [loadingDetailsTaskId, setLoadingDetailsTaskId] = useState(null);

  const fetchTasks = async (status = statusFilter) => {
    setIsLoading(true);
    try {
      let list = [];
      if (status && status !== 'ALL') {
        list = await getClientTasksByStatus(clientId, status);
      } else {
        list = await getClientTasks(clientId);
      }
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

  // Handle status filter change (GET /api/client_tasks/client/{clientId}/status/{status})
  const handleStatusFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
    fetchTasks(newStatus);
  };

  // Submit new task (POST /api/client_tasks/submit)
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
        text: 'Advertising task submitted! Our Task Coordinator will review and assign it to Production Staff.',
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

      await fetchTasks(statusFilter);
    } catch (err) {
      setNotification({
        type: 'error',
        text: err.message || 'Failed to submit task.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel & delete task from database
  const handleCancelTask = async (taskId) => {
    if (
      !window.confirm(
        `Are you sure you want to cancel Task #${taskId}? This will permanently delete the record from the database.`
      )
    ) {
      return;
    }
    setCancellingTaskId(taskId);
    try {
      await cancelClientTask(taskId);
      setNotification({
        type: 'success',
        text: `Task #${taskId} has been cancelled and permanently deleted from the database.`,
      });
      await fetchTasks(statusFilter);
    } catch (err) {
      setNotification({
        type: 'error',
        text: err.message || 'Failed to cancel and delete task.',
      });
    } finally {
      setCancellingTaskId(null);
    }
  };

  // View details (GET /api/client_tasks/{taskId})
  const handleOpenDetails = async (taskId) => {
    setLoadingDetailsTaskId(taskId);
    try {
      const details = await getTaskDetails(taskId);
      setViewingTask(details);
    } catch (err) {
      setNotification({
        type: 'error',
        text: err.message || 'Failed to fetch task details.',
      });
    } finally {
      setLoadingDetailsTaskId(null);
    }
  };

  // Open edit modal (before task is assigned to employee)
  const handleOpenEdit = (task) => {
    if (task.employeeId) {
      setNotification({
        type: 'error',
        text: `Cannot edit Task #${task.id}: It has already been assigned to an employee (${task.employeeName || 'Staff'}).`,
      });
      return;
    }
    const status = String(task.status || '').toUpperCase().trim();
    if (['COMPLETED', 'CANCELLED', 'ASSIGNED', 'IN PROGRESS'].includes(status)) {
      setNotification({
        type: 'error',
        text: `Cannot edit Task #${task.id}: Current status is ${task.status}. Edits are only permitted prior to employee allocation.`,
      });
      return;
    }

    setEditingTask(task);
    setEditForm({
      taskTitle: task.taskTitle || '',
      taskDetails: task.taskDetails || '',
      taskCategory: task.taskCategory || 'Graphic Design',
      campaignId: task.campaignId ? String(task.campaignId) : '',
      priority: task.priority || 'MEDIUM',
      clientDeadline: task.clientDeadline || '',
    });
  };

  // Submit task edit (PUT /api/client_tasks/{taskId})
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editForm.taskTitle.trim() || !editForm.taskDetails.trim()) return;
    if (!editingTask) return;

    setIsUpdating(true);
    try {
      const updatedFields = {
        clientId: Number(clientId),
        clientName,
        campaignId: editForm.campaignId ? Number(editForm.campaignId) : null,
        taskTitle: editForm.taskTitle.trim(),
        taskDetails: editForm.taskDetails.trim(),
        taskCategory: editForm.taskCategory,
        priority: editForm.priority,
        clientDeadline: editForm.clientDeadline || null,
      };

      const serverResult = await updateClientTask(editingTask.id, updatedFields);

      // Optimistically update local task state immediately
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          Number(t.id) === Number(editingTask.id)
            ? { ...t, ...updatedFields, ...(serverResult || {}) }
            : t
        )
      );

      setNotification({
        type: 'success',
        text: `Task #${editingTask.id} updated successfully! Your revisions have been recorded.`,
      });

      setEditingTask(null);
      await fetchTasks(statusFilter);
    } catch (err) {
      setNotification({
        type: 'error',
        text: err.message || 'Failed to update task.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Status badge styling helper
  const getStatusBadge = (status) => {
    const s = String(status).toUpperCase();
    if (s === 'COMPLETED')
      return {
        bg: 'rgba(8, 217, 214, 0.15)',
        text: '#008280',
        border: 'rgba(8, 217, 214, 0.4)',
        label: 'Completed',
      };
    if (s === 'IN PROGRESS')
      return {
        bg: 'rgba(8, 217, 214, 0.25)',
        text: '#252A34',
        border: '#08D9D6',
        label: 'In Progress',
      };
    if (s === 'ASSIGNED')
      return {
        bg: 'rgba(37, 42, 52, 0.08)',
        text: '#252A34',
        border: 'rgba(37, 42, 52, 0.2)',
        label: 'Assigned to Staff',
      };
    if (s === 'CANCELLED')
      return {
        bg: '#FFF5F7',
        text: '#FF2E63',
        border: '#FF2E63',
        label: 'Cancelled',
      };
    return {
      bg: '#FFF5F7',
      text: '#FF2E63',
      border: '#FF2E63',
      label: 'Awaiting Coordination',
    };
  };

  return (
    <div className="rounded-[32px] p-6 sm:p-8 bg-white border border-gray-200 shadow-md transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-gray-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#08D9D6]" />
            <h3 className="text-xl font-bold text-[#252A34]">
              Advertising Tasks & Production Coordination
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#08D9D6]/15 text-[#008280] border border-[#08D9D6]/30 uppercase">
              Client #{clientId}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Submit campaign requirements and track task coordination with agency production staff.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchTasks(statusFilter)}
            disabled={isLoading}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Refresh tasks"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#08D9D6]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-[#252A34] shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
            }}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit New Task</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`mb-4 p-3.5 rounded-2xl flex items-center justify-between border text-xs animate-fade-in ${
            notification.type === 'success'
              ? 'bg-[#08D9D6]/10 border-[#08D9D6] text-[#252A34]'
              : 'bg-[#FF2E63]/10 border-[#FF2E63] text-[#FF2E63]'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#08D9D6]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#FF2E63]" />
            )}
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

      {/* Status Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-[#08D9D6]" />
          <span className="text-gray-500 font-semibold">Status Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="px-2.5 py-1 rounded-xl border border-gray-200 text-xs font-semibold bg-gray-50 text-[#252A34] focus:outline-none"
          >
            <option value="ALL">All Statuses ({tasks.length})</option>
            <option value="PENDING_COORDINATION">Awaiting Coordination</option>
            <option value="ASSIGNED">Assigned to Staff</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <span className="text-xs text-gray-400">
          {tasks.length} tasks registered for {clientName}
        </span>
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#08D9D6]" />
          <p className="text-xs text-gray-400 mt-2">Loading tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-10 text-center rounded-2xl bg-gray-50 border border-dashed border-gray-200">
          <Briefcase className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <h4 className="text-sm font-bold text-gray-700">No Advertising Tasks Submitted Yet</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
            Give creative and marketing requirements to the agency. Our Task Coordinator will assign appropriate Production Staff.
          </p>
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#252A34] shadow-sm cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
            }}
          >
            + Submit First Task
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const badge = getStatusBadge(task.status);
            const isCompleted = String(task.status).toLowerCase() === 'completed';
            const isCancelled = String(task.status).toLowerCase() === 'cancelled';
            const isAssigned = Boolean(task.employeeId);
            const statusUpper = String(task.status || '').toUpperCase().trim();
            const canEdit =
              !task.employeeId &&
              !isCompleted &&
              !isCancelled &&
              !['ASSIGNED', 'IN PROGRESS', 'COMPLETED', 'CANCELLED'].includes(statusUpper);

            return (
              <div
                key={task.id}
                className="p-4 rounded-2xl border border-gray-200 bg-[#EAEAEA]/30 hover:bg-[#EAEAEA]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-xs text-[#252A34]">
                      Task #{task.id}
                    </span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                      style={{
                        backgroundColor: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`,
                      }}
                    >
                      {badge.label}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600">
                      {task.taskCategory}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                        task.priority === 'URGENT'
                          ? 'bg-[#FF2E63] text-white'
                          : task.priority === 'HIGH'
                          ? 'bg-[#FF2E63]/15 text-[#FF2E63]'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {task.priority || 'MEDIUM'}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-[#252A34]">{task.taskTitle}</h4>

                  <p className="text-xs text-gray-600 line-clamp-2">
                    {task.taskDetails}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 pt-1">
                    {task.campaignId && <span>Campaign #{task.campaignId}</span>}
                    {task.employeeName ? (
                      <span className="text-[#008280] font-semibold flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Staff: {task.employeeName}
                      </span>
                    ) : (
                      <span className="text-amber-600 font-medium">Unassigned</span>
                    )}
                    {task.clientDeadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#08D9D6]" />
                        Client Deadline: {task.clientDeadline}
                      </span>
                    )}
                    {task.deadline && (
                      <span className="flex items-center gap-1 text-gray-600">
                        <Clock className="w-3 h-3 text-[#FF2E63]" />
                        Coordinated Target: {task.deadline}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200">
                  {/* View Details Button (GET /api/client_tasks/{taskId}) */}
                  <button
                    type="button"
                    onClick={() => handleOpenDetails(task.id)}
                    disabled={loadingDetailsTaskId === task.id}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-300 hover:border-[#08D9D6] text-[#252A34] bg-white hover:bg-gray-50 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {loadingDetailsTaskId === task.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#08D9D6]" />
                    ) : (
                      <Info className="w-3.5 h-3.5 text-[#08D9D6]" />
                    )}
                    <span>Details</span>
                  </button>

                  {/* Edit Button (PUT /api/client_tasks/{taskId}) - enabled BEFORE admin assigns to employee */}
                  {canEdit ? (
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(task)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-300 hover:border-amber-400 text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="Edit this task brief before coordinator assigns it to production staff"
                    >
                      <Pencil className="w-3.5 h-3.5 text-amber-600" />
                      <span>Edit</span>
                    </button>
                  ) : isAssigned ? (
                    <span
                      className="px-2.5 py-1 rounded-xl text-[11px] font-medium border border-gray-200 text-gray-400 bg-gray-50 flex items-center gap-1 cursor-not-allowed select-none"
                      title={`Assigned to ${task.employeeName || 'Staff'} (Edits locked)`}
                    >
                      <Lock className="w-3 h-3 text-gray-400" />
                      <span>Assigned</span>
                    </span>
                  ) : null}

                  {/* Cancel & Delete Button (Deletes record from DB) */}
                  {!isCompleted && !isCancelled && (
                    <button
                      type="button"
                      onClick={() => handleCancelTask(task.id)}
                      disabled={cancellingTaskId === task.id}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold border border-rose-200 text-[#FF2E63] hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Cancel and delete this task from the database"
                    >
                      {cancellingTaskId === task.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUBMIT TASK MODAL (POST /api/client_tasks/submit) */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="rounded-[32px] p-6 sm:p-8 bg-white border border-gray-200 shadow-2xl max-w-lg w-full relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowSubmitModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-1 text-[#252A34] flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#08D9D6]" />
              Submit Advertising Task to Agency
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Describe your creative, production, or marketing requirements. Task Coordinator will review and allocate production staff.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#252A34] mb-1">
                  Task Title <span className="text-[#FF2E63]">*</span>
                </label>
                <input
                  type="text"
                  value={taskForm.taskTitle}
                  onChange={(e) => setTaskForm({ ...taskForm, taskTitle: e.target.value })}
                  placeholder="e.g. Design 3 Video Story Banners for TikTok & Instagram"
                  required
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#08D9D6] text-[#252A34]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#252A34] mb-1">Task Category</label>
                  <select
                    value={taskForm.taskCategory}
                    onChange={(e) => setTaskForm({ ...taskForm, taskCategory: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#08D9D6] bg-white text-[#252A34]"
                  >
                    <option value="Graphic Design">Graphic Design & Creative</option>
                    <option value="Video Production">Video Production & Reels</option>
                    <option value="Copywriting">Copywriting & Slogans</option>
                    <option value="Web Development">Landing Page & Web</option>
                    <option value="Social Media">Social Media Campaign</option>
                    <option value="General Marketing">General Marketing</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#252A34] mb-1">Urgency Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#08D9D6] bg-white text-[#252A34]"
                  >
                    <option value="LOW">Low Priority</option>
                    <option value="MEDIUM">Medium Priority (Standard)</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent (Immediate Turnaround)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#252A34] mb-1">
                    Related Campaign (Optional)
                  </label>
                  <select
                    value={taskForm.campaignId}
                    onChange={(e) => setTaskForm({ ...taskForm, campaignId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#08D9D6] bg-white text-[#252A34]"
                  >
                    <option value="">General Agency Request (No Campaign)</option>
                    {campaigns.map((c) => (
                      <option key={c.campaignId} value={String(c.campaignId)}>
                        #{c.campaignId} - {c.campaignName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#252A34] mb-1">
                    Desired Client Deadline
                  </label>
                  <input
                    type="date"
                    value={taskForm.clientDeadline}
                    onChange={(e) => setTaskForm({ ...taskForm, clientDeadline: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#08D9D6] text-[#252A34]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#252A34] mb-1">
                  Task Requirements & Specifications <span className="text-[#FF2E63]">*</span>
                </label>
                <textarea
                  rows="4"
                  value={taskForm.taskDetails}
                  onChange={(e) => setTaskForm({ ...taskForm, taskDetails: e.target.value })}
                  placeholder="Detail dimensions, copy guidelines, references, target channels, or specific creative requests..."
                  required
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#08D9D6] text-[#252A34]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl font-bold text-[#252A34] shadow-md flex items-center gap-1.5 cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
                  }}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Submit Task Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL (GET /api/client_tasks/{taskId}) */}
      {viewingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="rounded-[32px] p-6 sm:p-8 bg-white border border-gray-200 shadow-2xl max-w-md w-full relative">
            <button
              type="button"
              onClick={() => setViewingTask(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-[#252A34] mb-1 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#08D9D6]" />
              Task #{viewingTask.id} Coordination Details
            </h3>
            <p className="text-xs text-gray-500 mb-4">{viewingTask.taskTitle}</p>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Category:</span>
                <span className="font-bold text-[#252A34]">{viewingTask.taskCategory}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Current Status:</span>
                <span className="font-extrabold text-[#008280]">{viewingTask.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Priority:</span>
                <span className="font-bold text-[#FF2E63]">{viewingTask.priority}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Assigned Production Staff:</span>
                <span className="font-bold text-[#252A34]">
                  {viewingTask.employeeName || 'Awaiting Coordinator Assignment'}
                </span>
              </div>
              {viewingTask.clientDeadline && (
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Client Deadline:</span>
                  <span className="font-bold text-[#252A34]">{viewingTask.clientDeadline}</span>
                </div>
              )}
              {viewingTask.deadline && (
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Target Delivery Date:</span>
                  <span className="font-bold text-[#252A34]">{viewingTask.deadline}</span>
                </div>
              )}
              <div className="pt-2">
                <span className="text-gray-500 block mb-1">Your Requirements:</span>
                <p className="p-2.5 rounded-xl bg-gray-50 text-gray-700">
                  {viewingTask.taskDetails}
                </p>
              </div>
            {viewingTask.coordinatorNotes && (
                <div className="pt-2">
                  <span className="text-gray-500 block mb-1 font-semibold text-[#008280]">
                    Task Coordinator Instructions:
                  </span>
                  <p className="p-2.5 rounded-xl bg-[#08D9D6]/10 border border-[#08D9D6]/30 text-gray-700 italic">
                    "{viewingTask.coordinatorNotes}"
                  </p>
                </div>
              )}

              {/* Assignment / Edit status notice */}
              {viewingTask.employeeId ? (
                <div className="mt-2 p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-[11px] flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    This task has been assigned to <strong>{viewingTask.employeeName || 'staff'}</strong>. Revisions are locked.
                  </span>
                </div>
              ) : (
                <div className="mt-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>This task has not yet been assigned to an employee and can still be edited.</span>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center gap-2">
              {!viewingTask.employeeId &&
                !['COMPLETED', 'CANCELLED', 'ASSIGNED', 'IN PROGRESS'].includes(
                  String(viewingTask.status || '').toUpperCase().trim()
                ) && (
                  <button
                    type="button"
                    onClick={() => {
                      const t = viewingTask;
                      setViewingTask(null);
                      handleOpenEdit(t);
                    }}
                    className="flex-1 py-2.5 rounded-xl font-bold text-xs border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5 text-amber-600" />
                    <span>Edit Task</span>
                  </button>
                )}
              {String(viewingTask.status || '').toLowerCase() !== 'completed' && (
                <button
                  type="button"
                  onClick={() => {
                    const id = viewingTask.id;
                    setViewingTask(null);
                    handleCancelTask(id);
                  }}
                  className="py-2.5 px-3 rounded-xl font-bold text-xs border border-rose-200 text-[#FF2E63] hover:bg-rose-50 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  title="Cancel and delete this task from the database"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Cancel Task</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewingTask(null)}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-[#252A34] hover:bg-[#1a1e26] cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TASK MODAL (PUT /api/client_tasks/{taskId}) */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="rounded-[32px] p-6 sm:p-8 bg-white border border-gray-200 shadow-2xl max-w-lg w-full relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setEditingTask(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
                <Pencil className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-[#252A34]">
                  Edit Task #{editingTask.id}
                </h3>
                <span className="inline-block text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Pre-assignment Stage (Editable)
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-4 mt-2">
              Update task requirements, priority, category, or deadline before our Task Coordinator assigns it to an employee.
            </p>

            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#252A34] mb-1">
                  Task Title <span className="text-[#FF2E63]">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.taskTitle}
                  onChange={(e) => setEditForm({ ...editForm, taskTitle: e.target.value })}
                  placeholder="e.g. Design 3 Video Story Banners for TikTok & Instagram"
                  required
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#08D9D6] text-[#252A34]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#252A34] mb-1">Task Category</label>
                  <select
                    value={editForm.taskCategory}
                    onChange={(e) => setEditForm({ ...editForm, taskCategory: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#08D9D6] bg-white text-[#252A34]"
                  >
                    <option value="Graphic Design">Graphic Design & Creative</option>
                    <option value="Video Production">Video Production & Reels</option>
                    <option value="Copywriting">Copywriting & Slogans</option>
                    <option value="Web Development">Landing Page & Web</option>
                    <option value="Social Media">Social Media Campaign</option>
                    <option value="General Marketing">General Marketing</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#252A34] mb-1">Urgency Priority</label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#08D9D6] bg-white text-[#252A34]"
                  >
                    <option value="LOW">Low Priority</option>
                    <option value="MEDIUM">Medium Priority (Standard)</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent (Immediate Turnaround)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#252A34] mb-1">
                    Related Campaign (Optional)
                  </label>
                  <select
                    value={editForm.campaignId}
                    onChange={(e) => setEditForm({ ...editForm, campaignId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#08D9D6] bg-white text-[#252A34]"
                  >
                    <option value="">General Agency Request (No Campaign)</option>
                    {campaigns.map((c) => (
                      <option key={c.campaignId} value={String(c.campaignId)}>
                        #{c.campaignId} - {c.campaignName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#252A34] mb-1">
                    Desired Client Deadline
                  </label>
                  <input
                    type="date"
                    value={editForm.clientDeadline}
                    onChange={(e) => setEditForm({ ...editForm, clientDeadline: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#08D9D6] text-[#252A34]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#252A34] mb-1">
                  Task Requirements & Specifications <span className="text-[#FF2E63]">*</span>
                </label>
                <textarea
                  rows="4"
                  value={editForm.taskDetails}
                  onChange={(e) => setEditForm({ ...editForm, taskDetails: e.target.value })}
                  placeholder="Detail dimensions, copy guidelines, references, target channels, or specific creative requests..."
                  required
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#08D9D6] text-[#252A34]"
                />
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Note:</strong> Once our administrator assigns this task to a Production Staff member, further edits will be locked to maintain workflow consistency.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-xl font-bold text-[#252A34] shadow-md flex items-center gap-1.5 cursor-pointer hover:opacity-95 transition-opacity"
                  style={{
                    background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
                  }}
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
