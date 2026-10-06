/**
 * Add-an-Ad Advertising Agency Platform
 * Operations, Client Tasks & Coordinator Task Assignment API Services
 * Matches Spring Boot:
 * 1. ClientTaskController (/api/client_tasks)
 * 2. TaskAssignmentController (/api/coordinator_tasks)
 * 3. TaskTrackingController (/api/employee_tasks)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const TASKS_STORAGE_KEY = 'add_an_ad_operations_tasks';
const EMPLOYEES_STORAGE_KEY = 'add_an_ad_operations_employees';

// Sample Production Staff Members for offline/local simulation and fallback
export const SAMPLE_EMPLOYEES = [
  {
    id: 1,
    adminId: 2,
    name: 'Sarah Jenkins',
    email: 'sarah.j@agency.com',
    role: 'Lead Graphic Designer',
    department: 'Creative & Visual Design',
    contactNumber: '+1 (555) 234-5678',
    currentWorkload: 2,
    maxWorkload: 5,
    status: 'AVAILABLE',
  },
  {
    id: 2,
    adminId: 3,
    name: 'Liam Torres',
    email: 'liam.t@agency.com',
    role: 'Senior Video Editor & Motion Artist',
    department: 'Video Production & Animation',
    contactNumber: '+1 (555) 345-6789',
    currentWorkload: 3,
    maxWorkload: 5,
    status: 'AVAILABLE',
  },
  {
    id: 3,
    adminId: 4,
    name: 'Elena Rostova',
    email: 'elena.r@agency.com',
    role: 'Creative Copywriter & Strategist',
    department: 'Content & Campaign Copy',
    contactNumber: '+1 (555) 456-7890',
    currentWorkload: 1,
    maxWorkload: 5,
    status: 'AVAILABLE',
  },
  {
    id: 4,
    adminId: 5,
    name: 'David Chen',
    email: 'david.c@agency.com',
    role: 'Front-End Web & Landing Page Specialist',
    department: 'Digital & Web Engineering',
    contactNumber: '+1 (555) 567-8901',
    currentWorkload: 4,
    maxWorkload: 5,
    status: 'BUSY',
  },
  {
    id: 5,
    adminId: 6,
    name: 'Marcus Bennett',
    email: 'marcus.b@agency.com',
    role: 'Social Media Producer & Reels Creator',
    department: 'Social Media & Influencer Content',
    contactNumber: '+1 (555) 678-9012',
    currentWorkload: 1,
    maxWorkload: 5,
    status: 'AVAILABLE',
  },
  {
    id: 6,
    adminId: 7,
    name: 'Aria Montgomery',
    email: 'aria.m@agency.com',
    role: '3D Visualizer & Brand Animator',
    department: '3D CGI & Brand Visuals',
    contactNumber: '+1 (555) 789-0123',
    currentWorkload: 2,
    maxWorkload: 5,
    status: 'AVAILABLE',
  },
];

// Initial demo tasks
export const INITIAL_DEMO_TASKS = [
  {
    id: 1,
    clientId: 1,
    clientName: 'Nova Marketing Agency',
    campaignId: 1,
    taskTitle: 'Design Instagram Story Ad Carousel & Banners',
    taskDetails:
      'Need 5 high-converting vertical 1080x1920 story slides for summer sale discount blitz with bold CTA buttons.',
    taskCategory: 'Graphic Design',
    priority: 'HIGH',
    taskManagerId: 1,
    coordinatorNotes:
      'Follow brand style guide with soft rose and deep slate blue accents. Ensure mobile readability.',
    employeeId: 1,
    employeeName: 'Sarah Jenkins',
    status: 'In Progress',
    clientDeadline: '2026-06-10',
    deadline: '2026-06-08',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    coordinatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    completedAt: null,
  },
  {
    id: 2,
    clientId: 1,
    clientName: 'Nova Marketing Agency',
    campaignId: 1,
    taskTitle: '15-Second YouTube Bumper Promo Reel',
    taskDetails:
      'Produce a punchy 15s bumper ad showcasing client mobile app features with sound design and upbeat music.',
    taskCategory: 'Video Production',
    priority: 'URGENT',
    taskManagerId: 1,
    coordinatorNotes:
      'First 3 seconds must have instant hook and sound effects. Render in 4K and 1080p.',
    employeeId: 2,
    employeeName: 'Liam Torres',
    status: 'ASSIGNED',
    clientDeadline: '2026-06-15',
    deadline: '2026-06-12',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    coordinatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    completedAt: null,
  },
  {
    id: 3,
    clientId: 1,
    clientName: 'Nova Marketing Agency',
    campaignId: 2,
    taskTitle: 'Catchy Campaign Slogans & Ad Copywriting',
    taskDetails:
      'Deliver 10 headline variations and short-form ad copies for Google search ads and LinkedIn sponsored feed.',
    taskCategory: 'Copywriting',
    priority: 'MEDIUM',
    taskManagerId: null,
    coordinatorNotes: null,
    employeeId: null,
    employeeName: null,
    status: 'PENDING_COORDINATION',
    clientDeadline: '2026-06-25',
    deadline: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    coordinatedAt: null,
    completedAt: null,
  },
  {
    id: 4,
    clientId: 101,
    clientName: 'OmniVanguard Digital',
    campaignId: 3,
    taskTitle: 'Promotional Product Landing Page Optimization',
    taskDetails:
      'Optimize conversion funnels, fix responsiveness on tablet layouts, and integrate analytics pixel.',
    taskCategory: 'Web Development',
    priority: 'HIGH',
    taskManagerId: 1,
    coordinatorNotes: 'Tested across mobile breakpoints. High fidelity completed.',
    employeeId: 4,
    employeeName: 'David Chen',
    status: 'Completed',
    clientDeadline: '2026-05-28',
    deadline: '2026-05-26',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    coordinatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
];

function getStoredTasks() {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse stored tasks:', e);
  }
  return [...INITIAL_DEMO_TASKS];
}

function saveStoredTasks(list) {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to save tasks to localStorage:', e);
  }
}

function getStoredEmployees() {
  try {
    const raw = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse stored employees:', e);
  }
  return [...SAMPLE_EMPLOYEES];
}

function saveStoredEmployees(list) {
  try {
    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to save employees to localStorage:', e);
  }
}

let demoTasks = getStoredTasks();
let demoEmployees = getStoredEmployees();

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const config = {
    ...options,
    credentials: 'include',
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const errorMessage =
        (typeof data === 'object' && (data?.message || data?.error)) ||
        (typeof data === 'string' && data) ||
        `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      const connectionError = new Error(
        'Backend server not connected; running in local operations storage mode.'
      );
      connectionError.isNetworkError = true;
      throw connectionError;
    }
    throw err;
  }
}

// =========================================================================
// 1. CLIENT TASK ENDPOINTS (/api/client_tasks) - ClientTaskController
// =========================================================================

/**
 * Client gives / submits a new task to the agency.
 * POST /api/client_tasks/submit
 */
export async function submitClientTask(taskData) {
  const payload = {
    clientId: Number(taskData.clientId),
    clientName: taskData.clientName || 'Agency Client',
    campaignId: taskData.campaignId ? Number(taskData.campaignId) : null,
    taskTitle: taskData.taskTitle?.trim(),
    taskDetails: taskData.taskDetails?.trim(),
    taskCategory: taskData.taskCategory || 'General Marketing',
    priority: taskData.priority || 'MEDIUM',
    clientDeadline: taskData.clientDeadline || null,
  };

  try {
    return await request('/api/client_tasks/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch {
    const newTask = {
      id: Date.now(),
      ...payload,
      taskManagerId: null,
      coordinatorNotes: null,
      employeeId: null,
      employeeName: null,
      status: 'PENDING_COORDINATION',
      deadline: null,
      createdAt: new Date().toISOString(),
      coordinatedAt: null,
      completedAt: null,
    };

    demoTasks.unshift(newTask);
    saveStoredTasks(demoTasks);
    return newTask;
  }
}

/**
 * Retrieve all tasks given/submitted by a specific client.
 * GET /api/client_tasks/client/{clientId}
 */
export async function getClientTasks(clientId) {
  try {
    const data = await request(`/api/client_tasks/client/${clientId}`);
    return Array.isArray(data) ? data : [];
  } catch {
    return demoTasks.filter((t) => Number(t.clientId) === Number(clientId));
  }
}

/**
 * Retrieve all tasks submitted by a client filtered by status.
 * GET /api/client_tasks/client/{clientId}/status/{status}
 */
export async function getClientTasksByStatus(clientId, status) {
  try {
    const data = await request(
      `/api/client_tasks/client/${clientId}/status/${encodeURIComponent(status)}`
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return demoTasks.filter(
      (t) =>
        Number(t.clientId) === Number(clientId) &&
        t.status?.toLowerCase() === status.toLowerCase()
    );
  }
}

/**
 * View details and current progress of a specific task submitted by a client.
 * GET /api/client_tasks/{taskId}
 */
export async function getTaskDetails(taskId) {
  try {
    return await request(`/api/client_tasks/${taskId}`);
  } catch {
    const task = demoTasks.find((t) => Number(t.id) === Number(taskId));
    if (!task) throw new Error(`Task with ID ${taskId} not found.`);
    return task;
  }
}

/**
 * Client updates / edits their submitted task before it is assigned to an employee by admin.
 * PUT /api/client_tasks/{taskId}
 */
export async function updateClientTask(taskId, taskData) {
  const payload = {
    clientId: taskData.clientId ? Number(taskData.clientId) : undefined,
    clientName: taskData.clientName || undefined,
    campaignId: taskData.campaignId ? Number(taskData.campaignId) : null,
    taskTitle: taskData.taskTitle?.trim(),
    taskDetails: taskData.taskDetails?.trim(),
    taskCategory: taskData.taskCategory || 'General Marketing',
    priority: taskData.priority || 'MEDIUM',
    clientDeadline: taskData.clientDeadline || null,
  };

  try {
    return await request(`/api/client_tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    if (!err.isNetworkError) {
      throw err;
    }

    // Local/offline fallback simulation
    const taskIndex = demoTasks.findIndex((t) => Number(t.id) === Number(taskId));
    if (taskIndex === -1) {
      throw new Error(`Task with ID ${taskId} not found.`);
    }

    const task = demoTasks[taskIndex];
    if (task.employeeId) {
      throw new Error(
        `Cannot edit task: It has already been assigned to an employee (${task.employeeName || 'ID: ' + task.employeeId}).`
      );
    }
    const status = String(task.status || '').toUpperCase();
    if (
      status === 'ASSIGNED' ||
      status === 'IN PROGRESS' ||
      status === 'COMPLETED' ||
      status === 'CANCELLED'
    ) {
      throw new Error(`Cannot edit task: Current status is ${task.status}.`);
    }

    demoTasks[taskIndex] = {
      ...task,
      ...payload,
      id: task.id,
      clientId: task.clientId,
      status: task.status,
      createdAt: task.createdAt,
    };
    saveStoredTasks(demoTasks);
    return demoTasks[taskIndex];
  }
}

/**
 * Client cancels a task if it has not yet been completed.
 * PUT /api/client_tasks/{taskId}/cancel
 */
export async function cancelClientTask(taskId) {
  try {
    return await request(`/api/client_tasks/${taskId}/cancel`, {
      method: 'PUT',
    });
  } catch {
    const task = demoTasks.find((t) => Number(t.id) === Number(taskId));
    if (!task) throw new Error(`Task with ID ${taskId} not found.`);
    if (String(task.status).toLowerCase() === 'completed') {
      throw new Error('Cannot cancel a task that has already been completed.');
    }

    task.status = 'Cancelled';
    saveStoredTasks(demoTasks);
    return task;
  }
}

// =========================================================================
// 2. TASK COORDINATOR ENDPOINTS (/api/coordinator_tasks) - TaskAssignmentController
// =========================================================================

/**
 * Retrieve available Production Staff and their current workload.
 * GET /api/coordinator_tasks/available_employees (also /employees)
 */
export async function getAvailableEmployees() {
  try {
    const data = await request('/api/coordinator_tasks/available_employees');
    if (Array.isArray(data) && data.length > 0) return data;
  } catch {
    // fallback
  }

  try {
    const data = await request('/api/coordinator_tasks/employees');
    if (Array.isArray(data) && data.length > 0) return data;
  } catch {
    // fallback
  }

  return [...demoEmployees];
}

/**
 * Coordinator registers a new Production Staff employee.
 * POST /api/coordinator_tasks/employees
 */
export async function addEmployee(employeeData) {
  const payload = {
    adminId: employeeData.adminId ? Number(employeeData.adminId) : null,
    name: employeeData.name?.trim(),
    email: employeeData.email?.trim(),
    role: employeeData.role || 'Production Staff',
    department: employeeData.department || 'Production Team',
    contactNumber: employeeData.contactNumber || '',
    currentWorkload: 0,
    maxWorkload: employeeData.maxWorkload ? Number(employeeData.maxWorkload) : 5,
    status: employeeData.status || 'AVAILABLE',
  };

  try {
    return await request('/api/coordinator_tasks/employees', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch {
    const newEmp = {
      id: Date.now(),
      ...payload,
    };
    demoEmployees.push(newEmp);
    saveStoredEmployees(demoEmployees);
    return newEmp;
  }
}

/**
 * Retrieve all tasks given/submitted by clients.
 * Optionally filter by status.
 * GET /api/coordinator_tasks/client-tasks?status={status}
 */
export async function getAllClientTasks(status) {
  const query =
    status && status !== 'ALL' ? `?status=${encodeURIComponent(status)}` : '';
  try {
    const data = await request(`/api/coordinator_tasks/client-tasks${query}`);
    if (Array.isArray(data)) return data;
  } catch {
    // fallback
  }

  if (status && status !== 'ALL') {
    return demoTasks.filter(
      (t) => String(t.status).toLowerCase() === status.toLowerCase()
    );
  }
  return [...demoTasks];
}

/**
 * Retrieve all tasks given by clients awaiting coordination (unassigned).
 * GET /api/coordinator_tasks/unassigned
 */
export async function getUnassignedClientTasks() {
  try {
    const data = await request('/api/coordinator_tasks/unassigned');
    if (Array.isArray(data)) return data;
  } catch {
    // fallback
  }

  return demoTasks.filter(
    (t) => !t.employeeId || t.status === 'PENDING_COORDINATION'
  );
}

/**
 * Retrieve all tasks given by a specific client for coordinator.
 * GET /api/coordinator_tasks/client/{clientId}
 */
export async function getCoordinatorTasksByClient(clientId) {
  try {
    const data = await request(`/api/coordinator_tasks/client/${clientId}`);
    if (Array.isArray(data)) return data;
  } catch {
    // fallback
  }
  return demoTasks.filter((t) => Number(t.clientId) === Number(clientId));
}

/**
 * Task Coordinator coordinates a client's task among employees.
 * Assigns employee, deadline, priority, coordinator notes, sets status to ASSIGNED.
 * PUT /api/coordinator_tasks/{taskId}/coordinate
 */
export async function coordinateTask(taskId, coordinationData) {
  const payload = {
    employeeId: Number(coordinationData.employeeId),
    coordinatorId: coordinationData.coordinatorId
      ? Number(coordinationData.coordinatorId)
      : null,
    deadline: coordinationData.deadline || null,
    priority: coordinationData.priority || 'MEDIUM',
    coordinatorNotes: coordinationData.coordinatorNotes || '',
  };

  try {
    return await request(`/api/coordinator_tasks/${taskId}/coordinate`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  } catch {
    const task = demoTasks.find((t) => Number(t.id) === Number(taskId));
    if (!task) throw new Error(`Task with ID ${taskId} not found.`);

    const employee = demoEmployees.find(
      (e) => Number(e.id) === Number(coordinationData.employeeId)
    );
    if (!employee) {
      throw new Error(`Employee with ID ${coordinationData.employeeId} not found.`);
    }

    // Decrement previous employee workload if reassigning
    if (task.employeeId && Number(task.employeeId) !== Number(employee.id)) {
      const oldEmp = demoEmployees.find(
        (e) => Number(e.id) === Number(task.employeeId)
      );
      if (oldEmp && oldEmp.currentWorkload > 0) {
        oldEmp.currentWorkload--;
        if (oldEmp.currentWorkload < oldEmp.maxWorkload) oldEmp.status = 'AVAILABLE';
      }
    }

    // Increment new employee workload
    if (!task.employeeId || Number(task.employeeId) !== Number(employee.id)) {
      employee.currentWorkload = (employee.currentWorkload || 0) + 1;
      if (employee.currentWorkload >= (employee.maxWorkload || 5)) {
        employee.status = 'BUSY';
      }
    }

    task.employeeId = employee.id;
    task.employeeName = employee.name;
    if (payload.coordinatorId) task.taskManagerId = payload.coordinatorId;
    if (payload.deadline) task.deadline = payload.deadline;
    if (payload.priority) task.priority = payload.priority;
    if (payload.coordinatorNotes) task.coordinatorNotes = payload.coordinatorNotes;
    task.status = 'ASSIGNED';
    task.coordinatedAt = new Date().toISOString();

    saveStoredTasks(demoTasks);
    saveStoredEmployees(demoEmployees);
    return task;
  }
}

/**
 * Coordinator reassigns an existing task from one employee to another.
 * PUT /api/coordinator_tasks/{taskId}/reassign/{newEmployeeId}?reason={reason}
 */
export async function reassignTask(taskId, newEmployeeId, reason = '') {
  const query = reason ? `?reason=${encodeURIComponent(reason)}` : '';
  try {
    return await request(
      `/api/coordinator_tasks/${taskId}/reassign/${newEmployeeId}${query}`,
      {
        method: 'PUT',
      }
    );
  } catch {
    const task = demoTasks.find((t) => Number(t.id) === Number(taskId));
    if (!task) throw new Error(`Task with ID ${taskId} not found.`);

    const newEmp = demoEmployees.find(
      (e) => Number(e.id) === Number(newEmployeeId)
    );
    if (!newEmp) throw new Error(`Employee with ID ${newEmployeeId} not found.`);

    // Decrement old employee
    if (task.employeeId) {
      const oldEmp = demoEmployees.find(
        (e) => Number(e.id) === Number(task.employeeId)
      );
      if (oldEmp && oldEmp.currentWorkload > 0) {
        oldEmp.currentWorkload--;
        if (oldEmp.currentWorkload < oldEmp.maxWorkload) oldEmp.status = 'AVAILABLE';
      }
    }

    newEmp.currentWorkload = (newEmp.currentWorkload || 0) + 1;
    if (newEmp.currentWorkload >= (newEmp.maxWorkload || 5)) newEmp.status = 'BUSY';

    task.employeeId = newEmp.id;
    task.employeeName = newEmp.name;
    task.coordinatedAt = new Date().toISOString();
    if (reason) {
      task.coordinatorNotes =
        (task.coordinatorNotes ? task.coordinatorNotes + '\n' : '') +
        `[Reassigned: ${reason}]`;
    }

    saveStoredTasks(demoTasks);
    saveStoredEmployees(demoEmployees);
    return task;
  }
}

/**
 * Coordinator overview summary of all client tasks and employee workloads.
 * GET /api/coordinator_tasks/coordination-summary
 */
export async function getCoordinationSummary() {
  try {
    return await request('/api/coordinator_tasks/coordination-summary');
  } catch {
    const unassigned = demoTasks.filter(
      (t) => !t.employeeId || t.status === 'PENDING_COORDINATION'
    ).length;
    const inProgress = demoTasks.filter(
      (t) =>
        t.status === 'In Progress' ||
        t.status === 'ASSIGNED' ||
        t.status === 'To Do'
    ).length;
    const completed = demoTasks.filter((t) => t.status === 'Completed').length;
    const pendingCoord = demoTasks.filter(
      (t) => t.status === 'PENDING_COORDINATION'
    ).length;

    return {
      totalClientTasks: demoTasks.length,
      unassignedTasksAwaitingCoordination: unassigned,
      pendingCoordinationTasks: pendingCoord,
      inProgressTasks: inProgress,
      completedTasks: completed,
      totalEmployees: demoEmployees.length,
      employees: [...demoEmployees],
    };
  }
}

/**
 * Legacy / Campaign creation endpoints preserved for compatibility:
 */
export async function createCampaignTask(coordinatorId, campaignId, taskData) {
  try {
    return await request(
      `/api/coordinator_tasks/${coordinatorId}/campaign/${campaignId}/create`,
      {
        method: 'POST',
        body: JSON.stringify(taskData),
      }
    );
  } catch {
    const newTask = {
      id: Date.now(),
      taskManagerId: Number(coordinatorId),
      campaignId: Number(campaignId),
      status: taskData.status || 'To Do',
      ...taskData,
    };
    demoTasks.unshift(newTask);
    saveStoredTasks(demoTasks);
    return newTask;
  }
}

export async function getTasksByCampaign(campaignId) {
  try {
    const data = await request(`/api/coordinator_tasks/campaign/${campaignId}`);
    if (Array.isArray(data)) return data;
  } catch {
    // fallback
  }
  return demoTasks.filter((t) => Number(t.campaignId) === Number(campaignId));
}

// =========================================================================
// 3. EMPLOYEE PRODUCTION STAFF TASK TRACKING (/api/employee_tasks) - TaskTrackingController
// =========================================================================

/**
 * Employee views all tasks currently assigned to them.
 * GET /api/employee_tasks/{employeeId}
 */
export async function getEmployeeAssignedTasks(employeeId) {
  try {
    const data = await request(`/api/employee_tasks/${employeeId}`);
    if (Array.isArray(data)) return data;
  } catch {
    // fallback
  }
  return demoTasks.filter((t) => Number(t.employeeId) === Number(employeeId));
}

/**
 * Employee views only pending or active tasks (not yet completed).
 * GET /api/employee_tasks/{employeeId}/pending
 */
export async function getEmployeePendingTasks(employeeId) {
  try {
    const data = await request(`/api/employee_tasks/${employeeId}/pending`);
    if (Array.isArray(data)) return data;
  } catch {
    // fallback
  }
  return demoTasks.filter(
    (t) =>
      Number(t.employeeId) === Number(employeeId) &&
      t.status?.toLowerCase() !== 'completed' &&
      t.status?.toLowerCase() !== 'cancelled'
  );
}

/**
 * Employee views their completed tasks.
 * GET /api/employee_tasks/{employeeId}/completed
 */
export async function getEmployeeCompletedTasks(employeeId) {
  try {
    const data = await request(`/api/employee_tasks/${employeeId}/completed`);
    if (Array.isArray(data)) return data;
  } catch {
    // fallback
  }
  return demoTasks.filter(
    (t) =>
      Number(t.employeeId) === Number(employeeId) &&
      t.status?.toLowerCase() === 'completed'
  );
}

/**
 * Employee updates status of an assigned task (e.g. "To Do" -> "In Progress" -> "Completed").
 * PUT /api/employee_tasks/{employeeId}/{taskId}/status?status={status}
 */
export async function updateTaskStatus(employeeId, taskId, status) {
  try {
    return await request(
      `/api/employee_tasks/${employeeId}/${taskId}/status?status=${encodeURIComponent(status)}`,
      { method: 'PUT' }
    );
  } catch {
    const task = demoTasks.find((t) => Number(t.id) === Number(taskId));
    if (!task) throw new Error(`Task with ID ${taskId} not found.`);

    const oldStatus = task.status;
    task.status = status;

    if (
      status.toLowerCase() === 'completed' &&
      oldStatus.toLowerCase() !== 'completed'
    ) {
      task.completedAt = new Date().toISOString();
      const emp = demoEmployees.find((e) => Number(e.id) === Number(employeeId));
      if (emp && emp.currentWorkload > 0) {
        emp.currentWorkload--;
        if (emp.currentWorkload < emp.maxWorkload && emp.status !== 'ON_LEAVE') {
          emp.status = 'AVAILABLE';
        }
      }
    }

    saveStoredTasks(demoTasks);
    saveStoredEmployees(demoEmployees);
    return task;
  }
}

/**
 * Employee checks their own profile, assigned role, availability, and active workload.
 * GET /api/employee_tasks/profile/{employeeId}
 */
export async function getEmployeeProfile(employeeId) {
  try {
    return await request(`/api/employee_tasks/profile/${employeeId}`);
  } catch {
    const emp = demoEmployees.find((e) => Number(e.id) === Number(employeeId));
    if (!emp) throw new Error(`Employee with ID ${employeeId} not found.`);
    return emp;
  }
}

/**
 * Employee updates availability status ("AVAILABLE", "BUSY", "ON_LEAVE").
 * PUT /api/employee_tasks/{employeeId}/availability?status={status}
 */
export async function updateEmployeeAvailability(employeeId, status) {
  try {
    return await request(
      `/api/employee_tasks/${employeeId}/availability?status=${encodeURIComponent(status)}`,
      { method: 'PUT' }
    );
  } catch {
    const emp = demoEmployees.find((e) => Number(e.id) === Number(employeeId));
    if (!emp) throw new Error(`Employee with ID ${employeeId} not found.`);

    emp.status = status.toUpperCase();
    saveStoredEmployees(demoEmployees);
    return emp;
  }
}
