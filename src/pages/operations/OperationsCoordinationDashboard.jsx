import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Users,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Search,
  UserCheck,
  RefreshCw,
  X,
  Loader2,
  ArrowRight,
  Shield,
  Layers,
  Calendar,
  AlertTriangle,
  UserPlus,
  Trash2,
  Cpu,
  Sparkles,
} from 'lucide-react';
import {
  getAllClientTasks,
  getAvailableEmployees,
  coordinateTask,
  reassignTask,
  addEmployee,
  getCoordinationSummary,
  updateTaskStatus,
  updateEmployeeAvailability,
  deleteTask,
  getStaffSuggestionForTask,
  SAMPLE_EMPLOYEES,
} from './operationsApi';
import StrategyPatternEngine from './StrategyPatternEngine';
import { getStoredAuthSession } from '../client/api';

export default function OperationsCoordinationDashboard({ onBackToDashboard }) {
  const [session] = useState(() => getStoredAuthSession());
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState(SAMPLE_EMPLOYEES);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Active Tab: 'coordination' | 'employees' | 'staff-workbench'
  const [activeTab, setActiveTab] = useState('coordination');

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [staffFilter, setStaffFilter] = useState('ALL');
  const [clientFilter, setClientFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Workbench sub-tab filter: 'ALL' | 'PENDING' | 'COMPLETED'
  const [workbenchFilter, setWorkbenchFilter] = useState('ALL');

  // Coordination Modal State
  const [coordinatingTask, setCoordinatingTask] = useState(null);
  const [coordinationForm, setCoordinationForm] = useState(() => ({
    employeeId: '',
    deadline: '',
    priority: 'MEDIUM',
    coordinatorNotes: '',
  }));
  const [isSubmittingCoordination, setIsSubmittingCoordination] = useState(false);

  // Strategy Pattern Recommendation State in Coordination Modal
  const [modalStrategyKey, setModalStrategyKey] = useState('role-match');
  const [modalStrategySuggestion, setModalStrategySuggestion] = useState(null);
  const [isLoadingStrategySuggestion, setIsLoadingStrategySuggestion] = useState(false);

  const fetchModalStrategySuggestion = async (task, stratKey) => {
    if (!task) return;
    setIsLoadingStrategySuggestion(true);
    try {
      const res = await getStaffSuggestionForTask(task.id, stratKey);
      setModalStrategySuggestion(res);
    } catch (e) {
      console.warn('Failed to fetch modal strategy suggestion:', e);
    } finally {
      setIsLoadingStrategySuggestion(false);
    }
  };

  const handleModalStrategyChange = (key) => {
    setModalStrategyKey(key);
    if (coordinatingTask) {
      fetchModalStrategySuggestion(coordinatingTask, key);
    }
  };

  const handleApplyStrategySuggestion = () => {
    if (modalStrategySuggestion?.suggestedStaffId) {
      setCoordinationForm((prev) => ({
        ...prev,
        employeeId: String(modalStrategySuggestion.suggestedStaffId),
      }));
    }
  };

  // Reassignment Modal State
  const [reassigningTask, setReassigningTask] = useState(null);
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [isSubmittingReassign, setIsSubmittingReassign] = useState(false);

  // Add Employee Modal State
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [newEmployeeForm, setNewEmployeeForm] = useState({
    name: '',
    email: '',
    role: 'Graphic Designer',
    contactNumber: '',
    maxWorkload: 5,
  });
  const [isSubmittingEmployee, setIsSubmittingEmployee] = useState(false);

  // Staff Workbench Simulation state
  const [activeStaffId, setActiveStaffId] = useState('');

  // Delete task state
  const [deletingTaskId, setDeletingTaskId] = useState(null);

  const handleDeleteTask = async (taskId) => {
    if (
      !window.confirm(
        `Are you sure you want to delete Task #${taskId}? This will permanently remove the record from the database.`
      )
    ) {
      return;
    }
    setDeletingTaskId(taskId);
    try {
      await deleteTask(taskId);
      setNotification({
        type: 'success',
        text: `Task #${taskId} has been permanently deleted from the database.`,
      });
      await loadData();
    } catch (err) {
      setNotification({
        type: 'error',
        text: err.message || 'Failed to delete task.',
      });
    } finally {
      setDeletingTaskId(null);
    }
  };

  // Load all operations data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [taskList, empList, summaryData] = await Promise.all([
        getAllClientTasks(),
        getAvailableEmployees(),
        getCoordinationSummary(),
      ]);

      const resolvedEmployees = Array.isArray(empList) && empList.length > 0 ? empList : SAMPLE_EMPLOYEES;
      setTasks(taskList || []);
      setEmployees(resolvedEmployees);
      setSummary(summaryData);

      if (resolvedEmployees.length > 0 && !activeStaffId) {
        setActiveStaffId(String(resolvedEmployees[0].id));
      }
    } catch (err) {
      console.warn('Error loading operations data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function init() {
      setIsLoading(true);
      try {
        const [taskList, empList, summaryData] = await Promise.all([
          getAllClientTasks(),
          getAvailableEmployees(),
          getCoordinationSummary(),
        ]);

        if (isMounted) {
          const resolvedEmployees = Array.isArray(empList) && empList.length > 0 ? empList : SAMPLE_EMPLOYEES;
          setTasks(taskList || []);
          setEmployees(resolvedEmployees);
          setSummary(summaryData);
          if (resolvedEmployees.length > 0) {
            setActiveStaffId(String(resolvedEmployees[0].id));
          }
        }
      } catch (err) {
        console.warn('Error loading operations data:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayEmployees = Array.isArray(employees) && employees.length > 0 ? employees : SAMPLE_EMPLOYEES;

  // Open Coordination Modal
  const openCoordinationModal = (task, preselectedStaffId = null) => {
    setCoordinatingTask(task);
    const availableEmps = displayEmployees.filter((e) => e.status !== 'ON_LEAVE');
    const defaultEmpId = preselectedStaffId
      ? String(preselectedStaffId)
      : task.employeeId
      ? String(task.employeeId)
      : availableEmps.length > 0
      ? String(availableEmps[0].id)
      : '1';

    setCoordinationForm({
      employeeId: defaultEmpId,
      deadline: task.deadline || task.clientDeadline || '',
      priority: task.priority || 'MEDIUM',
      coordinatorNotes: task.coordinatorNotes || '',
    });

    fetchModalStrategySuggestion(task, modalStrategyKey);
  };

  // Submit Coordination
  const handleCoordinateSubmit = async (e) => {
    e.preventDefault();
    if (!coordinatingTask || !coordinationForm.employeeId) {
      setNotification({ type: 'error', text: 'Please select a production staff employee.' });
      return;
    }

    setIsSubmittingCoordination(true);
    try {
      const coordinatorId = session?.adminId || session?.adminID || session?.userId || session?.id || 1;
      await coordinateTask(coordinatingTask.id, {
        coordinatorId: Number(coordinatorId),
        employeeId: Number(coordinationForm.employeeId),
        deadline: coordinationForm.deadline && String(coordinationForm.deadline).trim() !== '' ? coordinationForm.deadline : null,
        priority: coordinationForm.priority || 'MEDIUM',
        coordinatorNotes: coordinationForm.coordinatorNotes || '',
      });

      const assignedEmp = displayEmployees.find((emp) => String(emp.id) === String(coordinationForm.employeeId));
      setNotification({
        type: 'success',
        text: `Task #${coordinatingTask.id} successfully coordinated and assigned to ${assignedEmp?.name || 'Production Staff'}!`,
      });

      setCoordinatingTask(null);
      await loadData();
    } catch (err) {
      setNotification({ type: 'error', text: err.message || 'Coordination failed.' });
    } finally {
      setIsSubmittingCoordination(false);
    }
  };

  // Submit Reassignment
  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!reassigningTask || !newEmployeeId) return;

    setIsSubmittingReassign(true);
    try {
      await reassignTask(reassigningTask.id, Number(newEmployeeId), reassignReason);
      setNotification({
        type: 'success',
        text: `Task #${reassigningTask.id} reassigned to new employee successfully!`,
      });
      setReassigningTask(null);
      setReassignReason('');
      await loadData();
    } catch (err) {
      setNotification({ type: 'error', text: err.message || 'Reassignment failed.' });
    } finally {
      setIsSubmittingReassign(false);
    }
  };

  // Submit Add Employee
  const handleAddEmployeeSubmit = async (e) => {
    e.preventDefault();
    if (!newEmployeeForm.name.trim()) return;

    setIsSubmittingEmployee(true);
    try {
      await addEmployee(newEmployeeForm);
      setNotification({
        type: 'success',
        text: `Production staff member "${newEmployeeForm.name}" registered successfully!`,
      });
      setShowAddEmployeeModal(false);
      setNewEmployeeForm({
        name: '',
        email: '',
        role: 'Graphic Designer',
        contactNumber: '',
        maxWorkload: 5,
      });
      await loadData();
    } catch (err) {
      setNotification({ type: 'error', text: err.message || 'Failed to add employee.' });
    } finally {
      setIsSubmittingEmployee(false);
    }
  };

  // Workbench: Update Task Status
  const handleUpdateStatus = async (taskId, newStatus) => {
    if (!activeStaffId) return;
    try {
      await updateTaskStatus(Number(activeStaffId), taskId, newStatus);
      setNotification({
        type: 'success',
        text: `Task #${taskId} updated to "${newStatus}"!`,
      });
      await loadData();
    } catch (err) {
      setNotification({ type: 'error', text: err.message || 'Status update failed.' });
    }
  };

  // Toggle Employee Availability
  const handleToggleAvailability = async (emp) => {
    const nextStatus = emp.status === 'ON_LEAVE' ? 'AVAILABLE' : 'ON_LEAVE';
    try {
      await updateEmployeeAvailability(emp.id, nextStatus);
      await loadData();
    } catch (err) {
      console.warn('Failed to update availability:', err);
    }
  };

  // Helper to normalize and match task status
  const checkStatusMatch = (task, targetFilter) => {
    if (!targetFilter || targetFilter === 'ALL') return true;

    const clean = (str) => String(str || '').toLowerCase().replace(/[\s_-]/g, '');
    const ts = clean(task.status);
    const tf = clean(targetFilter);

    // Pending Coordination / Unassigned
    if (tf.includes('pending') || tf.includes('unassign') || tf === 'awaiting') {
      if (!task.employeeId) return true;
      return ts.includes('pending') || ts.includes('unassign') || ts === 'awaitingcoordination';
    }

    // Assigned / To Do
    if (tf === 'assigned' || tf === 'todo') {
      return ts === 'assigned' || ts === 'todo' || ts === 'inproduction';
    }

    // In Progress
    if (tf === 'inprogress') {
      return ts === 'inprogress' || ts === 'doing';
    }

    // Completed
    if (tf === 'completed' || tf === 'done') {
      return ts === 'completed' || ts === 'done';
    }

    // Cancelled
    if (tf === 'cancelled' || tf === 'canceled') {
      return ts === 'cancelled' || ts === 'canceled';
    }

    return ts === tf;
  };

  // Extract unique clients who have submitted tasks for the client filter
  const uniqueClients = Array.from(
    new Map(
      tasks
        .filter((t) => t.clientId)
        .map((t) => [String(t.clientId), { id: t.clientId, name: t.clientName || `Client #${t.clientId}` }])
    ).values()
  );

  // Filter tasks across status, category, priority, employee, client, and text query
  const filteredTasks = tasks.filter((t) => {
    const matchesStatus = checkStatusMatch(t, statusFilter);

    const matchesCategory =
      categoryFilter === 'ALL' ||
      String(t.taskCategory || '').toLowerCase() === categoryFilter.toLowerCase();

    const matchesPriority =
      priorityFilter === 'ALL' ||
      String(t.priority || '').toUpperCase() === priorityFilter.toUpperCase();

    const matchesStaff =
      staffFilter === 'ALL' ||
      String(t.employeeId || '') === String(staffFilter);

    const matchesClient =
      clientFilter === 'ALL' ||
      String(t.clientId || '') === String(clientFilter);

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.taskTitle?.toLowerCase().includes(q) ||
      t.taskDetails?.toLowerCase().includes(q) ||
      t.clientName?.toLowerCase().includes(q) ||
      t.employeeName?.toLowerCase().includes(q) ||
      t.taskCategory?.toLowerCase().includes(q) ||
      String(t.id).includes(q) ||
      String(t.clientId).includes(q);

    return matchesStatus && matchesCategory && matchesPriority && matchesStaff && matchesClient && matchesSearch;
  });

  // Dynamic live count calculations for status filter buttons
  const statusCounts = {
    ALL: tasks.length,
    PENDING_COORDINATION: tasks.filter((t) => checkStatusMatch(t, 'PENDING_COORDINATION')).length,
    ASSIGNED: tasks.filter((t) => checkStatusMatch(t, 'ASSIGNED')).length,
    'In Progress': tasks.filter((t) => checkStatusMatch(t, 'In Progress')).length,
    Completed: tasks.filter((t) => checkStatusMatch(t, 'Completed')).length,
    Cancelled: tasks.filter((t) => checkStatusMatch(t, 'Cancelled')).length,
  };

  // Priority styling helper
  const getPriorityBadge = (priority) => {
    const p = String(priority).toUpperCase();
    if (p === 'URGENT') return { bg: '#FFF5F7', text: '#FF2E63', border: '#FF2E63' };
    if (p === 'HIGH') return { bg: '#FFF5F7', text: '#FF2E63', border: 'rgba(255, 46, 99, 0.4)' };
    if (p === 'LOW') return { bg: 'rgba(8, 217, 214, 0.1)', text: '#252A34', border: 'rgba(8, 217, 214, 0.5)' };
    return { bg: 'rgba(8, 217, 214, 0.15)', text: '#252A34', border: '#08D9D6' }; // MEDIUM
  };

  // Status badge helper
  const getStatusBadge = (status) => {
    const clean = String(status || '').toUpperCase().replace(/[\s_-]/g, '');
    if (clean === 'COMPLETED' || clean === 'DONE') {
      return { bg: 'rgba(8, 217, 214, 0.15)', text: '#252A34', border: '#08D9D6', label: 'Completed' };
    }
    if (clean === 'INPROGRESS' || clean === 'DOING') {
      return { bg: 'rgba(8, 217, 214, 0.25)', text: '#252A34', border: '#08D9D6', label: 'In Progress' };
    }
    if (clean === 'ASSIGNED' || clean === 'TODO') {
      return { bg: 'rgba(37, 42, 52, 0.08)', text: '#252A34', border: 'rgba(37, 42, 52, 0.2)', label: 'Assigned' };
    }
    if (clean === 'CANCELLED' || clean === 'CANCELED') {
      return { bg: '#FFF5F7', text: '#FF2E63', border: '#FF2E63', label: 'Cancelled' };
    }
    return { bg: '#FFF5F7', text: '#FF2E63', border: '#FF2E63', label: 'Pending Coordination' };
  };

  const activeEmployee = employees.find((e) => String(e.id) === String(activeStaffId));
  const rawStaffTasks = tasks.filter((t) => String(t.employeeId) === String(activeStaffId));

  // Staff workbench filter for All vs Pending Execution vs Completed
  const staffTasks = rawStaffTasks.filter((t) => {
    if (workbenchFilter === 'PENDING') {
      return t.status !== 'Completed' && t.status !== 'Cancelled';
    }
    if (workbenchFilter === 'COMPLETED') {
      return t.status === 'Completed';
    }
    return true;
  });

  const staffPendingCount = rawStaffTasks.filter((t) => t.status !== 'Completed' && t.status !== 'Cancelled').length;
  const staffCompletedCount = rawStaffTasks.filter((t) => t.status === 'Completed').length;

  return (
    <div className="min-h-screen bg-[#EAEAEA] py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
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
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider text-white bg-[#252A34]"
              >
                Task Coordinator Desk
              </span>
            </div>
            <p className="text-xs font-medium text-gray-600">
              Coordinate Client Requirements among Production Staff & Track Workload Execution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all duration-200 bg-white hover:bg-gray-50 text-[#252A34] shadow-xs cursor-pointer"
            style={{ borderColor: 'rgba(37, 42, 52, 0.2)' }}
            title="Refresh Operations Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#08D9D6] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {onBackToDashboard && (
            <button
              type="button"
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all duration-200 bg-white hover:bg-gray-50 text-[#252A34] shadow-xs cursor-pointer"
              style={{ borderColor: 'rgba(37, 42, 52, 0.2)' }}
            >
              <ArrowLeft className="w-4 h-4 text-[#252A34]" />
              Back to Suite
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto">
        {/* Notification Banner */}
        {notification && (
          <div
            className="mb-6 p-4 rounded-2xl flex items-center justify-between border shadow-sm animate-fade-in"
            style={{
              backgroundColor: notification.type === 'success' ? 'rgba(8, 217, 214, 0.1)' : '#FFF5F7',
              borderColor: notification.type === 'success' ? '#08D9D6' : '#FF2E63',
              color: notification.type === 'success' ? '#252A34' : '#FF2E63',
            }}
          >
            <div className="flex items-center space-x-2 text-xs sm:text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{notification.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-gray-600 ml-3 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Coordination Summary KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-8">
          <div className="p-4 rounded-2xl bg-white border shadow-xs" style={{ borderColor: 'rgba(37, 42, 52, 0.12)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Client Tasks</span>
              <Briefcase className="w-4 h-4 text-[#08D9D6]" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#252A34]">
              {summary?.totalClientTasks ?? tasks.length}
            </div>
            <div className="text-[10px] text-gray-400 mt-1">
              Given by registered clients
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border shadow-xs" style={{ borderColor: 'rgba(255, 46, 99, 0.25)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Pending Coordination</span>
              <AlertTriangle className="w-4 h-4 text-[#FF2E63]" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#FF2E63]">
              {summary?.pendingCoordinationTasks ?? tasks.filter((t) => t.status === 'PENDING_COORDINATION').length}
            </div>
            <div className="text-[10px] text-gray-400 mt-1">
              Awaiting staff assignment
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border shadow-xs" style={{ borderColor: 'rgba(37, 42, 52, 0.12)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">In Flight / Assigned</span>
              <Clock className="w-4 h-4 text-[#08D9D6]" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#252A34]">
              {summary?.inProgressTasks ?? tasks.filter((t) => t.status === 'In Progress' || t.status === 'ASSIGNED').length}
            </div>
            <div className="text-[10px] text-gray-400 mt-1">
              Under production execution
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border shadow-xs" style={{ borderColor: 'rgba(37, 42, 52, 0.12)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Completed</span>
              <CheckCircle2 className="w-4 h-4 text-[#08D9D6]" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#252A34]">
              {summary?.completedTasks ?? tasks.filter((t) => t.status === 'Completed').length}
            </div>
            <div className="text-[10px] text-gray-400 mt-1">
              Finished & delivered
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border shadow-xs col-span-2 sm:col-span-1" style={{ borderColor: 'rgba(255, 46, 99, 0.25)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Production Staff</span>
              <Users className="w-4 h-4 text-[#FF2E63]" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#FF2E63]">
              {employees.length}
            </div>
            <div className="text-[10px] text-gray-400 mt-1">
              {employees.filter((e) => e.status === 'AVAILABLE').length} Available
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('coordination')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'coordination'
                ? 'bg-[#252A34] text-[#08D9D6] shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Task Coordination Desk ({filteredTasks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('employees')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'employees'
                ? 'bg-[#252A34] text-[#08D9D6] shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Production Staff & Workloads ({employees.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('strategy-engine')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'strategy-engine'
                ? 'bg-[#161B26] text-[#08D9D6] border border-[#08D9D6] shadow-md ring-2 ring-[#08D9D6]/20'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Cpu className="w-4 h-4 text-[#08D9D6]" />
            <span>Strategy Pattern Engine</span>
            {/* <span className="px-1.5 py-0.2 rounded-md bg-[#FF2E63] text-white text-[10px] font-black uppercase">
              GoF
            </span> */}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('staff-workbench')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'staff-workbench'
                ? 'bg-[#FF2E63] text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Employee Execution Workbench</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: TASK COORDINATION DESK */}
        {/* ========================================================================= */}
        {activeTab === 'coordination' && (
          <div>
            {/* Search, Status Buttons and Advanced Filters */}
            <div
              className="p-4 rounded-2xl bg-white border shadow-xs mb-6 space-y-3"
              style={{ borderColor: 'rgba(37, 42, 52, 0.12)' }}
            >
              {/* Row 1: Search & Status Filter Buttons */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search task title, requirements, client, staff..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#08D9D6]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                  {[
                    { key: 'ALL', label: 'All Tasks' },
                    { key: 'PENDING_COORDINATION', label: 'Pending Coordination' },
                    { key: 'ASSIGNED', label: 'Assigned' },
                    { key: 'In Progress', label: 'In Progress' },
                    { key: 'Completed', label: 'Completed' },
                    { key: 'Cancelled', label: 'Cancelled' },
                  ].map(({ key, label }) => {
                    const count = statusCounts[key] || 0;
                    const isActive = statusFilter.toLowerCase() === key.toLowerCase();
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setStatusFilter(key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-[#252A34] text-[#08D9D6] shadow-xs'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <span>{label}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isActive
                              ? 'bg-[#08D9D6]/20 text-[#08D9D6]'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 2: Category, Priority, Staff Dropdowns & Reset */}
              <div className="pt-2.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500 font-semibold text-[11px]">Category:</span>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="py-1 px-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#08D9D6]"
                    >
                      <option value="ALL">All Categories</option>
                      <option value="Graphic Design">Graphic Design</option>
                      <option value="Video Production">Video Production</option>
                      <option value="Copywriting">Copywriting</option>
                      <option value="Social Media">Social Media</option>
                      <option value="Web Development">Web Development</option>
                      <option value="General Marketing">General Marketing</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500 font-semibold text-[11px]">Priority:</span>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="py-1 px-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#08D9D6]"
                    >
                      <option value="ALL">All Priorities</option>
                      <option value="URGENT">URGENT</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500 font-semibold text-[11px]">Assigned Staff:</span>
                    <select
                      value={staffFilter}
                      onChange={(e) => setStaffFilter(e.target.value)}
                      className="py-1 px-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#08D9D6]"
                    >
                      <option value="ALL">All Staff</option>
                      {displayEmployees.map((emp) => (
                        <option key={emp.id} value={String(emp.id)}>
                          {emp.name} ({emp.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500 font-semibold text-[11px]">Client Brand:</span>
                    <select
                      value={clientFilter}
                      onChange={(e) => setClientFilter(e.target.value)}
                      className="py-1 px-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#08D9D6]"
                    >
                      <option value="ALL">All Clients ({uniqueClients.length})</option>
                      {uniqueClients.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          #{c.id} - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {(statusFilter !== 'ALL' || categoryFilter !== 'ALL' || priorityFilter !== 'ALL' || staffFilter !== 'ALL' || clientFilter !== 'ALL' || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('ALL');
                      setCategoryFilter('ALL');
                      setPriorityFilter('ALL');
                      setStaffFilter('ALL');
                      setClientFilter('ALL');
                      setSearchQuery('');
                    }}
                    className="text-[11px] font-bold text-[#FF2E63] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Reset All Filters</span>
                  </button>
                )}
              </div>
            </div>

            {/* Task Cards Grid */}
            {filteredTasks.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-gray-300">
                <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-base font-bold text-gray-700 mb-1">No Client Tasks Found</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  No advertising tasks matching this status or keyword. When clients submit tasks from their homepage, they will appear here for coordination.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredTasks.map((t) => {
                  const pBadge = getPriorityBadge(t.priority);
                  const sBadge = getStatusBadge(t.status);
                  const isPending = t.status === 'PENDING_COORDINATION' || !t.employeeId;

                  return (
                    <div
                      key={t.id}
                      className="p-6 rounded-3xl bg-white border shadow-md flex flex-col justify-between hover:shadow-lg transition-all"
                      style={{
                        borderColor: isPending ? '#FF2E63' : 'rgba(37, 42, 52, 0.12)',
                      }}
                    >
                      <div>
                        {/* Header with Client Info & Badges */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <span
                              className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider"
                              style={{ backgroundColor: '#FFF5F7', color: '#FF2E63' }}
                            >
                              Client #{t.clientId} • {t.clientName || 'Agency Partner'}
                            </span>
                            <h3 className="text-base font-extrabold text-[#252A34] mt-1.5 leading-snug">
                              {t.taskTitle}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                              <span className="font-semibold text-gray-500">{t.taskCategory || 'General'}</span>
                              {t.campaignId && <span>• Campaign #{t.campaignId}</span>}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5">
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
                            <span
                              className="text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase border"
                              style={{
                                backgroundColor: pBadge.bg,
                                color: pBadge.text,
                                borderColor: pBadge.border,
                              }}
                            >
                              {t.priority} Priority
                            </span>
                          </div>
                        </div>

                        {/* Task Details / Requirements from Client */}
                        <div
                          className="p-3.5 rounded-2xl mb-4 border text-xs text-[#252A34] leading-relaxed"
                          style={{
                            backgroundColor: '#F9FAFB',
                            borderColor: 'rgba(37, 42, 52, 0.1)',
                          }}
                        >
                          <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                            Client Requirements:
                          </span>
                          <p>{t.taskDetails}</p>
                        </div>

                        {/* Deadlines info */}
                        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-[#08D9D6]" />
                            <div>
                              <div className="text-[9px] text-gray-400 font-bold uppercase">Client Requested</div>
                              <span className="font-bold text-[#252A34]">{t.clientDeadline || 'Flexible'}</span>
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-[#FF2E63]" />
                            <div>
                              <div className="text-[9px] text-gray-400 font-bold uppercase">Coordinator Deadline</div>
                              <span className="font-bold" style={{ color: t.deadline ? '#FF2E63' : '#252A34' }}>
                                {t.deadline || 'Pending Set'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Assigned Employee & Notes */}
                        <div
                          className="p-3 rounded-2xl mb-4 border flex flex-col gap-1 text-xs"
                          style={{
                            backgroundColor: t.employeeName ? 'rgba(8, 217, 214, 0.08)' : '#FFF5F7',
                            borderColor: t.employeeName ? 'rgba(8, 217, 214, 0.3)' : 'rgba(255, 46, 99, 0.3)',
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase text-gray-500">
                              Assigned Production Staff:
                            </span>
                            <span
                              className="font-extrabold text-xs"
                              style={{ color: t.employeeName ? '#252A34' : '#FF2E63' }}
                            >
                              {t.employeeName ? `Staff: ${t.employeeName}` : 'Unassigned (Action Required)'}
                            </span>
                          </div>
                          {t.coordinatorNotes && (
                            <p className="text-[11px] text-gray-600 mt-1 italic pt-1 border-t border-gray-200/60">
                              <span className="font-bold not-italic text-gray-500">Coordinator Guidance: </span>
                              "{t.coordinatorNotes}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-gray-400">Task #{t.id}</span>

                        <div className="flex items-center gap-2">
                          {t.employeeId && t.status !== 'Completed' && t.status !== 'Cancelled' && (
                            <button
                              type="button"
                              onClick={() => {
                                setReassigningTask(t);
                                setNewEmployeeId(String(employees.find((e) => e.id !== t.employeeId)?.id || ''));
                              }}
                              className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                            >
                              Reassign
                            </button>
                          )}

                          {t.status !== 'Completed' && t.status !== 'Cancelled' ? (
                            <button
                              type="button"
                              onClick={() => openCoordinationModal(t)}
                              className="px-4 py-2 rounded-xl text-xs font-bold shadow-xs hover:opacity-95 transition-opacity flex items-center gap-1.5 cursor-pointer"
                              style={{
                                backgroundColor: isPending ? '#FF2E63' : '#252A34',
                                color: '#ffffff',
                              }}
                            >
                              <UserCheck className="w-3.5 h-3.5 text-[#08D9D6]" />
                              <span>{isPending ? 'Coordinate & Assign' : 'Adjust Coordination'}</span>
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-gray-400">Archived</span>
                          )}

                          {/* Delete Task Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(t.id)}
                            disabled={deletingTaskId === t.id}
                            className="p-2 rounded-xl border border-rose-200 text-[#FF2E63] hover:bg-rose-50 transition-colors flex items-center justify-center cursor-pointer"
                            title="Delete / cancel task and permanently remove from database"
                          >
                            {deletingTaskId === t.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PRODUCTION STAFF & WORKLOADS */}
        {/* ========================================================================= */}
        {activeTab === 'employees' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-[#252A34]">Agency Production Staff Roster</h3>
                <p className="text-xs text-gray-500">
                  Inspect employee specialties, current task burdens, and manage active capacity.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddEmployeeModal(true)}
                className="px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm text-[#252A34] shadow-md flex items-center gap-2 hover:opacity-95 cursor-pointer"
                style={{ backgroundColor: '#08D9D6' }}
              >
                <UserPlus className="w-4 h-4 text-[#252A34]" />
                <span>Add Production Staff</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employees.map((emp) => {
                const percent = Math.min(100, Math.round((emp.currentWorkload / (emp.maxWorkload || 5)) * 100));
                const isOverloaded = emp.currentWorkload >= emp.maxWorkload;

                return (
                  <div
                    key={emp.id}
                    className="p-6 rounded-3xl bg-white border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                    style={{ borderColor: 'rgba(37, 42, 52, 0.12)' }}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs text-base"
                            style={{ backgroundColor: '#252A34' }}
                          >
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm sm:text-base text-[#252A34]">{emp.name}</h4>
                            <span className="text-xs font-semibold text-[#FF2E63]">
                              {emp.role}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            emp.status === 'AVAILABLE'
                              ? 'bg-[#08D9D6]/20 text-[#252A34] border border-[#08D9D6]/40'
                              : emp.status === 'BUSY'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}
                        >
                          {emp.status}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-gray-500 mb-4">
                        <p>Email: <span className="font-semibold text-gray-700">{emp.email}</span></p>
                        <p>Contact: <span className="font-semibold text-gray-700">{emp.contactNumber || 'N/A'}</span></p>
                      </div>

                      {/* Workload Meter */}
                      <div className="mb-4 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="font-bold text-gray-600">Active Task Workload:</span>
                          <span className="font-black text-[#252A34]">
                            {emp.currentWorkload} / {emp.maxWorkload} tasks ({percent}%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${percent}%`,
                              backgroundColor: isOverloaded
                                ? '#FF2E63'
                                : percent > 60
                                ? '#FF2E63'
                                : '#08D9D6',
                            }}
                          />
                        </div>
                        {isOverloaded && (
                          <span className="text-[10px] text-[#FF2E63] font-bold mt-1 block">
                            At maximum capacity! Coordinator should avoid allocating further tasks.
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveStaffId(String(emp.id));
                          setActiveTab('staff-workbench');
                        }}
                        className="font-bold underline text-[#252A34] hover:text-[#08D9D6] flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Assigned Tasks ({tasks.filter((t) => t.employeeId === emp.id).length})</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#08D9D6]" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(emp)}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 cursor-pointer"
                      >
                        {emp.status === 'ON_LEAVE' ? 'Mark Available' : 'Mark On Leave'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: EMPLOYEE EXECUTION WORKBENCH */}
        {/* ========================================================================= */}
        {activeTab === 'staff-workbench' && (
          <div>
            {/* Employee Selector Banner */}
            <div
              className="p-5 rounded-3xl bg-white border shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              style={{ borderColor: 'rgba(37, 42, 52, 0.12)' }}
            >
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase">Interactive Simulation Mode</span>
                <h3 className="text-base font-extrabold text-[#252A34] flex items-center gap-2 mt-0.5">
                  <Shield className="w-4 h-4 text-[#08D9D6]" />
                  Logged-in Production Staff Member:
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={activeStaffId}
                  onChange={(e) => setActiveStaffId(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-gray-300 font-bold text-xs bg-white text-[#252A34] focus:outline-none focus:ring-2 focus:ring-[#08D9D6]"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={String(e.id)}>
                      {e.name} — {e.role} ({e.currentWorkload}/{e.maxWorkload} tasks)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Employee Profile and Availability Widget */}
            {activeEmployee && (
              <div
                className="p-6 rounded-3xl bg-white border shadow-sm mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                style={{ borderColor: 'rgba(37, 42, 52, 0.12)' }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-md flex-shrink-0"
                    style={{ backgroundColor: '#252A34' }}
                  >
                    {activeEmployee.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-extrabold text-[#252A34]">{activeEmployee.name}</h3>
                      <span
                        className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border"
                        style={{
                          backgroundColor: activeEmployee.status === 'AVAILABLE' ? 'rgba(8, 217, 214, 0.15)' : '#FFF5F7',
                          color: activeEmployee.status === 'AVAILABLE' ? '#08D9D6' : '#FF2E63',
                          borderColor: activeEmployee.status === 'AVAILABLE' ? '#08D9D6' : '#FF2E63',
                        }}
                      >
                        {activeEmployee.status === 'AVAILABLE' ? 'Available for Assignment' : 'On Leave / Unavailable'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-500 mt-0.5">
                      {activeEmployee.role} • {activeEmployee.department || 'Creative Operations'}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {activeEmployee.email} • {activeEmployee.contactNumber || 'Contact N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto justify-between">
                  {/* Workload Meter */}
                  <div className="w-full sm:w-44">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-500 text-[11px]">Workload Capacity</span>
                      <span className="font-bold text-[#252A34] text-[11px]">
                        {activeEmployee.currentWorkload} / {activeEmployee.maxWorkload} tasks
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (activeEmployee.currentWorkload / activeEmployee.maxWorkload) * 100)}%`,
                          backgroundColor:
                            activeEmployee.currentWorkload >= activeEmployee.maxWorkload ? '#FF2E63' : '#08D9D6',
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleAvailability(activeEmployee)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer"
                    style={{
                      borderColor: activeEmployee.status === 'AVAILABLE' ? '#FF2E63' : '#08D9D6',
                      color: activeEmployee.status === 'AVAILABLE' ? '#FF2E63' : '#252A34',
                      backgroundColor: activeEmployee.status === 'AVAILABLE' ? '#FFF5F7' : 'rgba(8, 217, 214, 0.15)',
                    }}
                  >
                    {activeEmployee.status === 'AVAILABLE' ? 'Set to On Leave' : 'Set to Available'}
                  </button>
                </div>
              </div>
            )}

            {/* Staff Assigned Tasks Header & Sub-Tab Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h4 className="font-bold text-sm text-[#252A34]">
                  Tasks Assigned to {activeEmployee?.name || 'Employee'} ({rawStaffTasks.length})
                </h4>
                <p className="text-xs text-gray-500">
                  Update task status from To Do / Assigned → In Progress → Completed
                </p>
              </div>

              {/* Sub-tab Filter Buttons matching /pending and /completed backend APIs */}
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200 shadow-xs">
                <button
                  type="button"
                  onClick={() => setWorkbenchFilter('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    workbenchFilter === 'ALL'
                      ? 'bg-[#252A34] text-[#08D9D6]'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  All ({rawStaffTasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setWorkbenchFilter('PENDING')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    workbenchFilter === 'PENDING'
                      ? 'bg-[#252A34] text-[#08D9D6]'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Active / Pending ({staffPendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setWorkbenchFilter('COMPLETED')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    workbenchFilter === 'COMPLETED'
                      ? 'bg-[#252A34] text-[#08D9D6]'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Completed ({staffCompletedCount})
                </button>
              </div>
            </div>

            {staffTasks.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-gray-300">
                <CheckCircle2 className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <h4 className="font-bold text-sm text-[#252A34]">No Tasks Assigned</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                  This production staff member has 0 active tasks. The Task Coordinator can assign tasks from the Coordination Desk.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {staffTasks.map((task) => {
                  const sBadge = getStatusBadge(task.status);
                  const isDone = task.status === 'Completed';

                  return (
                    <div
                      key={task.id}
                      className="p-5 sm:p-6 rounded-3xl bg-white border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                      style={{ borderColor: 'rgba(37, 42, 52, 0.12)' }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border"
                            style={{
                              backgroundColor: sBadge.bg,
                              color: sBadge.text,
                              borderColor: sBadge.border,
                            }}
                          >
                            {task.status}
                          </span>
                          <span className="text-xs font-bold text-gray-500">
                            Client: {task.clientName}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-gray-400">Category: {task.taskCategory}</span>
                        </div>

                        <h4 className="font-extrabold text-base text-[#252A34]">{task.taskTitle}</h4>
                        <p className="text-xs text-gray-600 mt-1 max-w-2xl">{task.taskDetails}</p>

                        {task.coordinatorNotes && (
                          <div className="mt-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900">
                            <span className="font-bold">Coordinator Instruction: </span>
                            "{task.coordinatorNotes}"
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Assigned Deadline: <strong className="text-gray-700">{task.deadline || 'Open'}</strong></span>
                          <span>Priority: <strong className="text-[#FF2E63]">{task.priority}</strong></span>
                        </div>
                      </div>

                      {/* Status Transition Control Buttons */}
                      <div className="flex items-center gap-2 self-end md:self-center">
                        {task.status !== 'In Progress' && !isDone && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(task.id, 'In Progress')}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#08D9D6]/15 text-[#252A34] border border-[#08D9D6]/30 hover:bg-[#08D9D6]/25 transition-colors cursor-pointer"
                          >
                            Start Task
                          </button>
                        )}

                        {!isDone && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(task.id, 'Completed')}
                            className="px-4 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 hover:opacity-95 transition-opacity cursor-pointer"
                            style={{ backgroundColor: '#252A34', color: '#08D9D6' }}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#08D9D6]" />
                            <span>Mark Completed</span>
                          </button>
                        )}

                        {isDone && (
                          <span className="text-xs font-bold text-[#08D9D6] flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-[#08D9D6]" /> Finished
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: STRATEGY PATTERN ENGINE */}
        {/* ========================================================================= */}
        {activeTab === 'strategy-engine' && (
          <StrategyPatternEngine
            tasks={tasks}
            employees={displayEmployees}
            onApplyStaffToTask={(staffId, taskId) => {
              const targetTask = taskId
                ? tasks.find((t) => t.id === taskId)
                : tasks.find((t) => !t.employeeId || t.status === 'PENDING_COORDINATION') || tasks[0];
              if (targetTask) {
                openCoordinationModal(targetTask, staffId);
              } else {
                setActiveTab('coordination');
              }
            }}
          />
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: COORDINATE & ASSIGN TASK */}
      {/* ========================================================================= */}
      {coordinatingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div
            className="w-full max-w-lg rounded-3xl p-6 sm:p-7 bg-white border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            style={{ borderColor: 'rgba(37, 42, 52, 0.2)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-base text-[#252A34]">
                  Coordinate Task #{coordinatingTask.id}
                </h3>
                <p className="text-xs text-gray-500 truncate max-w-sm">
                  Client: {coordinatingTask.clientName} • "{coordinatingTask.taskTitle}"
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCoordinatingTask(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCoordinateSubmit} className="space-y-3.5 text-xs sm:text-sm">
              {/* Client specifications preview */}
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs">
                <span className="font-bold text-gray-500 block mb-1">Client Requirements:</span>
                <p className="text-gray-700">{coordinatingTask.taskDetails}</p>
                <div className="mt-2 text-gray-500">
                  Client Requested Deadline: <strong>{coordinatingTask.clientDeadline || 'None'}</strong>
                </div>
              </div>

              {/* 1. GoF Strategy Pattern Smart Recommendation Assistant */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#161B26] via-[#252A34] to-[#1F2430] text-white border border-[#08D9D6]/30 shadow-md space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-[#FF2E63] text-white text-[10px] font-black uppercase tracking-wider">
                      GoF Strategy
                    </span>
                    <span className="font-bold text-xs text-[#08D9D6] flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5" />
                      Smart Assignment Engine
                    </span>
                  </div>
                  {isLoadingStrategySuggestion ? (
                    <RefreshCw className="w-3.5 h-3.5 text-[#08D9D6] animate-spin" />
                  ) : (
                    <span className="text-[10px] text-gray-400">
                      Category: <span className="text-gray-200 font-semibold">{coordinatingTask.taskCategory || 'General'}</span>
                    </span>
                  )}
                </div>

                {/* Strategy Selector Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { key: 'role-match', label: 'Role Match', icon: '🎯' },
                    { key: 'least-workload', label: 'Least Load', icon: '⚖️' },
                    { key: 'most-capacity', label: 'Most Free', icon: '🔋' },
                    { key: 'first-available', label: 'First Avail', icon: '⏱️' },
                  ].map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => handleModalStrategyChange(s.key)}
                      className={`px-2 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 border ${
                        modalStrategyKey === s.key
                          ? 'bg-[#08D9D6] text-[#252A34] border-[#08D9D6] shadow-xs'
                          : 'bg-white/10 text-gray-300 border-white/10 hover:bg-white/20'
                      }`}
                    >
                      <span>{s.icon}</span>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>

                {/* Recommendation Banner */}
                {modalStrategySuggestion?.eligible ? (
                  <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between gap-2 text-xs">
                    <div className="truncate">
                      <div className="text-[10px] text-gray-400">
                        {modalStrategySuggestion.strategy} recommends:
                      </div>
                      <div className="font-bold text-white flex items-center gap-1.5 truncate">
                        <span>{modalStrategySuggestion.suggestedStaffName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#08D9D6]/20 text-[#08D9D6] font-semibold truncate">
                          {modalStrategySuggestion.role}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-300 mt-0.5">
                        Workload: {modalStrategySuggestion.currentWorkload}/{modalStrategySuggestion.maxWorkload} • Free: +{modalStrategySuggestion.remainingCapacity} slots
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleApplyStrategySuggestion}
                      className="px-2.5 py-1.5 rounded-xl bg-[#08D9D6] hover:bg-[#07c2bf] text-[#252A34] font-black text-xs shrink-0 flex items-center gap-1 shadow-xs cursor-pointer transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#252A34]" />
                      <span>Apply</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] text-gray-400 p-2 rounded-xl bg-white/5">
                    {modalStrategySuggestion?.message || 'Select an assignment strategy above to get an algorithm-driven recommendation.'}
                  </div>
                )}
              </div>

              {/* 2. Select Production Staff Employee */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-gray-700">
                    Assign to Production Staff Member <span className="text-[#FF2E63]">*</span>
                  </label>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#08D9D6]/15 text-[#252A34]">
                    {displayEmployees.length} Sample Staff Members
                  </span>
                </div>
                <select
                  value={coordinationForm.employeeId}
                  onChange={(e) => setCoordinationForm({ ...coordinationForm, employeeId: e.target.value })}
                  required
                  className="w-full p-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#08D9D6] bg-white text-xs"
                >
                  <option value="">Select Employee...</option>
                  {displayEmployees.map((emp) => (
                    <option key={emp.id} value={String(emp.id)} disabled={emp.status === 'ON_LEAVE'}>
                      {emp.name} — {emp.role} (Workload: {emp.currentWorkload}/{emp.maxWorkload})
                      {emp.status === 'BUSY' ? ' [BUSY]' : emp.status === 'ON_LEAVE' ? ' [ON LEAVE]' : ' [AVAILABLE]'}
                    </option>
                  ))}
                </select>

                {/* Selected staff detail card preview */}
                {(() => {
                  const selectedEmp = displayEmployees.find((e) => String(e.id) === String(coordinationForm.employeeId));
                  if (!selectedEmp) return null;
                  return (
                    <div className="mt-2.5 p-3 rounded-2xl bg-gradient-to-r from-[#08D9D6]/10 to-[#FF2E63]/10 border border-[#08D9D6]/25 flex items-center justify-between gap-3 text-xs animate-fade-in">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shadow-xs bg-[#252A34]">
                          {selectedEmp.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-[#252A34] flex items-center gap-1.5">
                            {selectedEmp.name}
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#FFF5F7] text-[#FF2E63]">
                              {selectedEmp.role}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                            <span>📧 {selectedEmp.email}</span>
                            <span>📞 {selectedEmp.contactNumber || selectedEmp.phone || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-gray-500 block">Workload</span>
                        <span className="font-bold text-[#252A34]">
                          {selectedEmp.currentWorkload} / {selectedEmp.maxWorkload} tasks
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 2. Priority and Deadline */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Coordinator Deadline
                  </label>
                  <input
                    type="date"
                    value={coordinationForm.deadline}
                    onChange={(e) => setCoordinationForm({ ...coordinationForm, deadline: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#08D9D6] text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={coordinationForm.priority}
                    onChange={(e) => setCoordinationForm({ ...coordinationForm, priority: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#08D9D6] bg-white text-xs"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              {/* 3. Coordinator Notes & Guidance */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Coordinator Instructions to Employee
                </label>
                <textarea
                  rows="3"
                  value={coordinationForm.coordinatorNotes}
                  onChange={(e) => setCoordinationForm({ ...coordinationForm, coordinatorNotes: e.target.value })}
                  placeholder="e.g. Ensure responsive mobile layouts, use official brand color tokens, prioritize for Friday morning sprint."
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#08D9D6] text-xs"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCoordinatingTask(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCoordination}
                  className="px-5 py-2 rounded-xl font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                  style={{ backgroundColor: '#08D9D6', color: '#252A34' }}
                >
                  {isSubmittingCoordination ? <Loader2 className="w-4 h-4 animate-spin text-[#252A34]" /> : <UserCheck className="w-4 h-4 text-[#252A34]" />}
                  <span>Confirm Assignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REASSIGN TASK */}
      {/* ========================================================================= */}
      {reassigningTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-3xl p-6 bg-white border shadow-2xl space-y-4" style={{ borderColor: 'rgba(37, 42, 52, 0.2)' }}>
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-base text-[#252A34]">
                Reassign Task #{reassigningTask.id}
              </h3>
              <button
                type="button"
                onClick={() => setReassigningTask(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReassignSubmit} className="space-y-3 text-xs">
              <div>
                <span className="text-gray-500">Currently Assigned: </span>
                <strong className="text-gray-800">{reassigningTask.employeeName || 'None'}</strong>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-gray-700">New Production Staff Member</label>
                  <span className="text-[10px] font-semibold text-gray-500">Sample Staff Members</span>
                </div>
                <select
                  value={newEmployeeId}
                  onChange={(e) => setNewEmployeeId(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-gray-300 bg-white"
                >
                  <option value="">Select new employee...</option>
                  {displayEmployees
                    .filter((e) => e.id !== reassigningTask.employeeId)
                    .map((emp) => (
                      <option key={emp.id} value={String(emp.id)} disabled={emp.status === 'ON_LEAVE'}>
                        {emp.name} — {emp.role} (Workload: {emp.currentWorkload}/{emp.maxWorkload})
                        {emp.status === 'BUSY' ? ' [BUSY]' : emp.status === 'ON_LEAVE' ? ' [ON LEAVE]' : ' [AVAILABLE]'}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Reason for Reassignment (Optional)</label>
                <input
                  type="text"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="e.g. Workload balancing, specialized skill set required"
                  className="w-full p-2.5 rounded-xl border border-gray-300"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReassigningTask(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReassign}
                  className="px-5 py-2 rounded-xl font-bold text-white shadow-xs cursor-pointer"
                  style={{ backgroundColor: '#FF2E63' }}
                >
                  {isSubmittingReassign ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Reassign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD PRODUCTION STAFF MEMBER */}
      {/* ========================================================================= */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-3xl p-6 bg-white border shadow-2xl space-y-4" style={{ borderColor: 'rgba(37, 42, 52, 0.2)' }}>
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-base text-[#252A34]">
                Register Production Staff
              </h3>
              <button
                type="button"
                onClick={() => setShowAddEmployeeModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployeeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newEmployeeForm.name}
                  onChange={(e) => setNewEmployeeForm({ ...newEmployeeForm, name: e.target.value })}
                  placeholder="e.g. Liam Torres"
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#08D9D6]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newEmployeeForm.email}
                  onChange={(e) => setNewEmployeeForm({ ...newEmployeeForm, email: e.target.value })}
                  placeholder="e.g. liam@agency.com"
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#08D9D6]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Role / Specialization</label>
                <select
                  value={newEmployeeForm.role}
                  onChange={(e) => setNewEmployeeForm({ ...newEmployeeForm, role: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-gray-300 bg-white"
                >
                  <option value="Lead Graphic Designer">Lead Graphic Designer</option>
                  <option value="Senior Video Editor & Motion Artist">Senior Video Editor & Motion Artist</option>
                  <option value="Creative Copywriter & Strategist">Creative Copywriter & Strategist</option>
                  <option value="Front-End Web & Landing Page Specialist">Front-End Web & Landing Page Specialist</option>
                  <option value="Social Media Content Creator">Social Media Content Creator</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Contact Number</label>
                  <input
                    type="text"
                    value={newEmployeeForm.contactNumber}
                    onChange={(e) => setNewEmployeeForm({ ...newEmployeeForm, contactNumber: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#08D9D6]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Max Concurrent Workload</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newEmployeeForm.maxWorkload}
                    onChange={(e) => setNewEmployeeForm({ ...newEmployeeForm, maxWorkload: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#08D9D6]"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEmployeeModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEmployee}
                  className="px-5 py-2 rounded-xl font-bold shadow-xs cursor-pointer"
                  style={{ backgroundColor: '#08D9D6', color: '#252A34' }}
                >
                  {isSubmittingEmployee ? <Loader2 className="w-4 h-4 animate-spin text-[#252A34]" /> : 'Register Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
