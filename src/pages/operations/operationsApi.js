/**
 * Add-an-Ad Advertising Agency Platform
 * Operations, Client Tasks & Coordinator Task Assignment API Services
 * Matches Spring Boot ClientTaskController (/api/client_tasks),
 * TaskAssignmentController (/api/coordinator_tasks), and
 * TaskTrackingController (/api/employee_tasks).
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

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

let demoEmployees = [...SAMPLE_EMPLOYEES];

// Demo Client-submitted & Coordinated Tasks
let demoTasks = [
  {
    id: 1,
    clientId: 1,
    clientName: 'Nova Marketing Agency',
    campaignId: 1,
    taskTitle: 'Design Instagram Story Ad Carousel & Banners',
    taskDetails: 'Need 5 high-converting vertical 1080x1920 story slides for summer sale discount blitz with bold CTA buttons.',
    taskCategory: 'Graphic Design',
    priority: 'HIGH',
    taskManagerId: 1,
    coordinatorNotes: 'Follow brand style guide with soft rose and deep slate blue accents. Ensure mobile readability.',
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
    taskDetails: 'Produce a punchy 15s bumper ad showcasing client mobile app features with sound design and upbeat music.',
    taskCategory: 'Video Production',
    priority: 'URGENT',
    taskManagerId: 1,
    coordinatorNotes: 'First 3 seconds must have instant hook and sound effects. Render in 4K and 1080p.',
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
    taskDetails: 'Deliver 10 headline variations and short-form ad copies for Google search ads and LinkedIn sponsored feed.',
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
    taskDetails: 'Optimize conversion funnels, fix responsiveness on tablet layouts, and integrate analytics pixel.',
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

let nextTaskId = 5;
let nextEmployeeId = 5;

// =========================================================================
// 1. CLIENT TASK ENDPOINTS (/api/client_tasks)
// =========================================================================

/**
 * Client gives / submits a new task to the agency.
 * POST /api/client_tasks/submit
 */
export async function submitClientTask(taskData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/client_tasks/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    });
    if (response.ok) {
      return await response.json();
    }
    const errText = await response.text();
    throw new Error(errText || 'Failed to submit client task');
  } catch (err) {
    console.warn('Backend unavailable, submitting task locally:', err.message);

    const newTask = {
      id: nextTaskId++,
      clientId: Number(taskData.clientId),
      clientName: taskData.clientName || 'Agency Client',
      campaignId: taskData.campaignId ? Number(taskData.campaignId) : null,
      taskTitle: taskData.taskTitle,
      taskDetails: taskData.taskDetails,
      taskCategory: taskData.taskCategory || 'General Marketing',
      priority: taskData.priority || 'MEDIUM',
      taskManagerId: null,
      coordinatorNotes: null,
      employeeId: null,
      employeeName: null,
      status: 'PENDING_COORDINATION',
      clientDeadline: taskData.clientDeadline || null,
      deadline: null,
      createdAt: new Date().toISOString(),
      coordinatedAt: null,
      completedAt: null,
    };

    demoTasks.unshift(newTask);
    return newTask;
  }
}

/**
 * Retrieve all tasks given/submitted by a specific client.
 * GET /api/client_tasks/client/{clientId}
 */
export async function getClientTasks(clientId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/client_tasks/client/${clientId}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn(`Backend unavailable, retrieving local tasks for client #${clientId}:`, err.message);
  }

  return demoTasks.filter((t) => Number(t.clientId) === Number(clientId));
}

/**
 * Retrieve tasks submitted by a client filtered by status.
 * GET /api/client_tasks/client/{clientId}/status/{status}
 */
export async function getClientTasksByStatus(clientId, status) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/client_tasks/client/${clientId}/status/${status}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Backend unavailable, filtering local client tasks by status:', err.message);
  }

  return demoTasks.filter(
    (t) => Number(t.clientId) === Number(clientId) && t.status?.toLowerCase() === status.toLowerCase()
  );
}

/**
 * Client cancels a task if it has not yet been completed.
 * PUT /api/client_tasks/{taskId}/cancel
 */
export async function cancelClientTask(taskId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/client_tasks/${taskId}/cancel`, {
      method: 'PUT',
    });
    if (response.ok) {
      return await response.json();
    }
    const errText = await response.text();
    throw new Error(errText || 'Failed to cancel task');
  } catch (err) {
    console.warn(`Backend unavailable, cancelling local task #${taskId}:`, err.message);

    const task = demoTasks.find((t) => Number(t.id) === Number(taskId));
    if (!task) throw new Error(`Task #${taskId} not found.`);
    if (task.status === 'Completed') throw new Error('Cannot cancel a task that has already been completed.');

    task.status = 'Cancelled';
    return task;
  }
}

// =========================================================================
// 2. TASK COORDINATOR ENDPOINTS (/api/coordinator_tasks)
// =========================================================================

/**
 * Retrieve available Production Staff and their current workload before assignment.
 * GET /api/coordinator_tasks/available_employees
 */
export async function getAvailableEmployees() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/coordinator_tasks/available_employees`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
      // If backend table is empty, auto-seed with sample production staff
      console.info('Backend production_staff table is empty. Auto-seeding sample employees...');
      const seeded = [];
      for (const emp of SAMPLE_EMPLOYEES) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/coordinator_tasks/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: emp.name,
              email: emp.email,
              role: emp.role,
              contactNumber: emp.contactNumber,
              currentWorkload: 0,
              maxWorkload: emp.maxWorkload || 5,
              status: emp.status || 'AVAILABLE',
            }),
          });
          if (res.ok) {
            seeded.push(await res.json());
          }
        } catch {
          // ignore individual seed error
        }
      }
      if (seeded.length > 0) return seeded;
    }
  } catch (err) {
    console.warn('Backend unavailable, returning sample employee list:', err.message);
  }

  return [...demoEmployees];
}

/**
 * Coordinator registers a new Production Staff employee.
 * POST /api/coordinator_tasks/employees
 */
export async function addEmployee(employeeData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/coordinator_tasks/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employeeData),
    });
    if (response.ok) {
      return await response.json();
    }
    const errText = await response.text();
    throw new Error(errText || 'Failed to add employee');
  } catch (err) {
    if (!err.message?.includes('Failed to fetch') && !err.message?.includes('NetworkError')) {
      throw err;
    }
    console.warn('Backend unavailable, adding local employee:', err.message);
  }

  const newEmp = {
    id: nextEmployeeId++,
    adminId: employeeData.adminId ? Number(employeeData.adminId) : null,
    name: employeeData.name,
    email: employeeData.email,
    role: employeeData.role || 'Production Staff',
    contactNumber: employeeData.contactNumber || '',
    currentWorkload: 0,
    maxWorkload: employeeData.maxWorkload ? Number(employeeData.maxWorkload) : 5,
    status: 'AVAILABLE',
  };

  demoEmployees.push(newEmp);
  return newEmp;
}

/**
 * Retrieve all tasks given/submitted by clients.
 * GET /api/coordinator_tasks/client-tasks?status=...
 */
export async function getAllClientTasks(status) {
  try {
    const url = status && status !== 'ALL'
      ? `${API_BASE_URL}/api/coordinator_tasks/client-tasks?status=${encodeURIComponent(status)}`
      : `${API_BASE_URL}/api/coordinator_tasks/client-tasks`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend unavailable, returning local client tasks:', err.message);
  }

  if (status && status !== 'ALL') {
    return demoTasks.filter((t) => t.status?.toLowerCase() === status.toLowerCase());
  }
  return [...demoTasks];
}

/**
 * Retrieve all unassigned client tasks awaiting coordination.
 * GET /api/coordinator_tasks/unassigned
 */
export async function getUnassignedClientTasks() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/coordinator_tasks/unassigned`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend unavailable, returning unassigned local tasks:', err.message);
  }

  return demoTasks.filter((t) => !t.employeeId || t.status === 'PENDING_COORDINATION');
}

/**
 * Task Coordinator coordinates a client's task among employees.
 * PUT /api/coordinator_tasks/{taskId}/coordinate
 */
export async function coordinateTask(taskId, coordinationData) {
  const payload = {
    coordinatorId: coordinationData.coordinatorId ? Number(coordinationData.coordinatorId) : null,
    employeeId: Number(coordinationData.employeeId),
    deadline: coordinationData.deadline && String(coordinationData.deadline).trim() !== '' ? coordinationData.deadline : null,
    priority: coordinationData.priority || 'MEDIUM',
    coordinatorNotes: coordinationData.coordinatorNotes || '',
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/coordinator_tasks/${taskId}/coordinate`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      return await response.json();
    }
    const errText = await response.text();
    throw new Error(errText || 'Failed to coordinate task');
  } catch (err) {
    if (!err.message?.includes('Failed to fetch') && !err.message?.includes('NetworkError')) {
      throw err;
    }
    console.warn(`Backend unavailable, coordinating local task #${taskId}:`, err.message);

    const task = demoTasks.find((t) => Number(t.id) === Number(taskId));
    if (!task) throw new Error(`Task #${taskId} not found.`);

    const employee = demoEmployees.find((e) => Number(e.id) === Number(coordinationData.employeeId));
    if (!employee) throw new Error(`Employee #${coordinationData.employeeId} not found.`);

    // If reassigning, decrement previous employee's workload
    if (task.employeeId && Number(task.employeeId) !== Number(employee.id)) {
      const oldEmp = demoEmployees.find((e) => Number(e.id) === Number(task.employeeId));
      if (oldEmp && oldEmp.currentWorkload > 0) {
        oldEmp.currentWorkload--;
        if (oldEmp.currentWorkload < oldEmp.maxWorkload) oldEmp.status = 'AVAILABLE';
      }
    }

    // Increment assigned employee's workload
    if (!task.employeeId || Number(task.employeeId) !== Number(employee.id)) {
      employee.currentWorkload++;
      if (employee.currentWorkload >= employee.maxWorkload) {
        employee.status = 'BUSY';
      }
    }

    task.employeeId = employee.id;
    task.employeeName = employee.name;
    if (coordinationData.coordinatorId) task.taskManagerId = Number(coordinationData.coordinatorId);
    if (payload.deadline) task.deadline = payload.deadline;
    if (coordinationData.priority) task.priority = coordinationData.priority;
    if (coordinationData.coordinatorNotes) task.coordinatorNotes = coordinationData.coordinatorNotes;
    task.status = 'ASSIGNED';
    task.coordinatedAt = new Date().toISOString();

    return task;
  }
}

/**
 * Coordinator reassigns an existing task from one employee to another.
 * PUT /api/coordinator_tasks/{taskId}/reassign/{newEmployeeId}?reason=...
 */
export async function reassignTask(taskId, newEmployeeId, reason = '') {
  try {
    const url = reason
      ? `${API_BASE_URL}/api/coordinator_tasks/${taskId}/reassign/${newEmployeeId}?reason=${encodeURIComponent(reason)}`
      : `${API_BASE_URL}/api/coordinator_tasks/${taskId}/reassign/${newEmployeeId}`;
    const response = await fetch(url, { method: 'PUT' });
    if (response.ok) {
      return await response.json();
    }
    const errText = await response.text();
    throw new Error(errText || 'Failed to reassign task');
  } catch (err) {
    if (!err.message?.includes('Failed to fetch') && !err.message?.includes('NetworkError')) {
      throw err;
    }
    console.warn(`Backend unavailable, reassigning local task #${taskId}:`, err.message);
  }

  const task = demoTasks.find((t) => Number(t.id) === Number(taskId));
  if (!task) throw new Error(`Task #${taskId} not found.`);

  const newEmp = demoEmployees.find((e) => Number(e.id) === Number(newEmployeeId));
  if (!newEmp) throw new Error(`New employee #${newEmployeeId} not found.`);

  if (task.employeeId) {
    const oldEmp = demoEmployees.find((e) => Number(e.id) === Number(task.employeeId));
    if (oldEmp && oldEmp.currentWorkload > 0) {
      oldEmp.currentWorkload--;
      if (oldEmp.currentWorkload < oldEmp.maxWorkload) oldEmp.status = 'AVAILABLE';
    }
  }

  newEmp.currentWorkload++;
  if (newEmp.currentWorkload >= newEmp.maxWorkload) newEmp.status = 'BUSY';

  task.employeeId = newEmp.id;
  task.employeeName = newEmp.name;
  task.coordinatedAt = new Date().toISOString();
  if (reason) {
    task.coordinatorNotes = (task.coordinatorNotes ? task.coordinatorNotes + '\n' : '') + `[Reassigned: ${reason}]`;
  }

  return task;
}

/**
 * Coordinator overview summary of all client tasks and employee workloads.
 * GET /api/coordinator_tasks/coordination-summary
 */
export async function getCoordinationSummary() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/coordinator_tasks/coordination-summary`);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Backend unavailable, calculating local coordination summary:', err.message);
  }

  const unassigned = demoTasks.filter((t) => !t.employeeId || t.status === 'PENDING_COORDINATION').length;
  const inProgress = demoTasks.filter((t) => t.status === 'In Progress' || t.status === 'ASSIGNED' || t.status === 'To Do').length;
  const completed = demoTasks.filter((t) => t.status === 'Completed').length;
  const pendingCoord = demoTasks.filter((t) => t.status === 'PENDING_COORDINATION').length;

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

// =========================================================================
// 3. EMPLOYEE PRODUCTION STAFF TASK TRACKING (/api/employee_tasks)
// =========================================================================

/**
 * Employee views all tasks currently assigned to them.
 * GET /api/employee_tasks/{employeeId}
 */
export async function getEmployeeAssignedTasks(employeeId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/employee_tasks/${employeeId}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn(`Backend unavailable, retrieving local tasks for employee #${employeeId}:`, err.message);
  }

  return demoTasks.filter((t) => Number(t.employeeId) === Number(employeeId));
}

/**
 * Employee updates status of an assigned task (e.g. "To Do" -> "In Progress" -> "Completed").
 * PUT /api/employee_tasks/{employeeId}/{taskId}/status?status=...
 */
export async function updateTaskStatus(employeeId, taskId, status) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/employee_tasks/${employeeId}/${taskId}/status?status=${encodeURIComponent(status)}`,
      { method: 'PUT' }
    );
    if (response.ok) {
      return await response.json();
    }
    const errText = await response.text();
    throw new Error(errText || 'Failed to update task status');
  } catch (err) {
    console.warn(`Backend unavailable, updating local task status #${taskId}:`, err.message);

    const task = demoTasks.find((t) => Number(t.id) === Number(taskId));
    if (!task) throw new Error(`Task #${taskId} not found.`);

    const oldStatus = task.status;
    task.status = status;

    if (status.toLowerCase() === 'completed' && oldStatus.toLowerCase() !== 'completed') {
      task.completedAt = new Date().toISOString();
      const emp = demoEmployees.find((e) => Number(e.id) === Number(employeeId));
      if (emp && emp.currentWorkload > 0) {
        emp.currentWorkload--;
        if (emp.currentWorkload < emp.maxWorkload && emp.status !== 'ON_LEAVE') {
          emp.status = 'AVAILABLE';
        }
      }
    }

    return task;
  }
}

/**
 * Employee updates availability status ("AVAILABLE", "BUSY", "ON_LEAVE").
 * PUT /api/employee_tasks/{employeeId}/availability?status=...
 */
export async function updateEmployeeAvailability(employeeId, status) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/employee_tasks/${employeeId}/availability?status=${encodeURIComponent(status)}`,
      { method: 'PUT' }
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn(`Backend unavailable, updating local employee #${employeeId} availability:`, err.message);
  }

  const emp = demoEmployees.find((e) => Number(e.id) === Number(employeeId));
  if (!emp) throw new Error(`Employee #${employeeId} not found.`);

  emp.status = status.toUpperCase();
  return emp;
}
