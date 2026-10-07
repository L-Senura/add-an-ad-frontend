/**
 * Add-an-Ad Advertising Agency Platform
 * Communication Module - Notification & Observer Pattern API
 *
 * Interacts with Spring Boot NotificationController (/api/notifications)
 * powered by the GoF Observer Design Pattern.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Fallback in-memory demo notifications when backend is starting or offline
let demoNotifications = [
  {
    notificationID: 1001,
    recipientRole: 'CLIENT',
    recipientID: 1,
    senderRole: 'ADMIN',
    senderID: 1,
    senderName: 'Agency Administrator',
    title: 'Ad Campaign Approved & Activated',
    message: 'Your In-Site Ad Hype campaign package has been approved and is now live on our agency showcase.',
    notificationType: 'SYSTEM_ALERT',
    relatedEntityId: 1,
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    notificationID: 1002,
    recipientRole: 'CLIENT',
    recipientID: 1,
    senderRole: 'VISITOR',
    senderID: null,
    senderName: 'Sophia Chen',
    title: 'New 5-Star Public Review from Sophia Chen',
    message: 'Outstanding promotional deliverables. Really impressed by the creative output and fast turnaround!',
    notificationType: 'PUBLIC_REVIEW',
    relatedEntityId: 2,
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    notificationID: 1003,
    recipientRole: 'CLIENT',
    recipientID: 1,
    senderRole: 'ADMIN',
    senderID: 1,
    senderName: 'Agency Administrator',
    title: 'Agency Administrator replied to your message',
    message: 'The on-site pin is billed at Rs. 1,000 as per our rate card and charged upon creative activation.',
    notificationType: 'CHAT_REPLY',
    relatedEntityId: 102,
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    notificationID: 2001,
    recipientRole: 'ADMIN',
    recipientID: null,
    senderRole: 'CLIENT',
    senderID: 1,
    senderName: 'Nova Marketing Agency',
    title: 'New message from Nova Marketing Agency',
    message: 'Could you also confirm the exact billing cycle for the on-site pin ad campaign?',
    notificationType: 'CHAT_MESSAGE',
    relatedEntityId: 2,
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    notificationID: 2002,
    recipientRole: 'ADMIN',
    recipientID: null,
    senderRole: 'CLIENT',
    senderID: 1,
    senderName: 'Nova Marketing Agency',
    title: 'New Agency Review (5 Stars) from Nova Marketing Agency',
    message: 'Exceptional coordination and fast ad turnarounds! Very satisfied with the agency results.',
    notificationType: 'CLIENT_REVIEW',
    relatedEntityId: 1,
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
];

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
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
    const res = await fetch(url, config);
    if (!res.ok) {
      const errText = await res.text();
      let parsedError = errText;
      try {
        parsedError = JSON.parse(errText);
      } catch {}
      throw new Error(parsedError?.message || parsedError?.error || `HTTP ${res.status}: ${res.statusText}`);
    }

    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch (err) {
    console.warn(`[notificationApi] Request to ${endpoint} failed, falling back to local simulation:`, err.message);
    throw err;
  }
}

/**
 * Fetch all notifications for a specific client (newest first).
 */
export async function getClientNotifications(clientId = 1) {
  try {
    const data = await request(`/api/notifications/client/${clientId}`);
    if (Array.isArray(data)) {
      return data;
    }
  } catch {}

  // Fallback demo filtering
  return demoNotifications.filter(
    (n) => n.recipientRole === 'CLIENT' && (!n.recipientID || Number(n.recipientID) === Number(clientId))
  );
}

/**
 * Fetch unread notification count for a client.
 */
export async function getClientUnreadCount(clientId = 1) {
  try {
    const data = await request(`/api/notifications/client/${clientId}/unread-count`);
    if (data && typeof data.unreadCount === 'number') {
      return data.unreadCount;
    }
  } catch {}

  return demoNotifications.filter(
    (n) => n.recipientRole === 'CLIENT' && (!n.recipientID || Number(n.recipientID) === Number(clientId)) && !n.isRead
  ).length;
}

/**
 * Mark all notifications for a client as read.
 */
export async function markAllClientNotificationsRead(clientId = 1) {
  try {
    await request(`/api/notifications/client/${clientId}/mark-all-read`, {
      method: 'PUT',
    });
  } catch {}

  demoNotifications = demoNotifications.map((n) => {
    if (n.recipientRole === 'CLIENT' && (!n.recipientID || Number(n.recipientID) === Number(clientId))) {
      return { ...n, isRead: true };
    }
    return n;
  });

  return { success: true };
}

/**
 * Fetch all administrator notifications.
 */
export async function getAllAdminNotifications() {
  try {
    const data = await request('/api/notifications/admin/all');
    if (Array.isArray(data)) {
      return data;
    }
  } catch {}

  return demoNotifications.filter((n) => n.recipientRole === 'ADMIN');
}

/**
 * Fetch notifications for a specific admin ID.
 */
export async function getAdminNotifications(adminId) {
  if (!adminId) return getAllAdminNotifications();
  try {
    const data = await request(`/api/notifications/admin/${adminId}`);
    if (Array.isArray(data)) {
      return data;
    }
  } catch {}

  return demoNotifications.filter(
    (n) => n.recipientRole === 'ADMIN' && (!n.recipientID || Number(n.recipientID) === Number(adminId))
  );
}

/**
 * Fetch unread notification count for administrators.
 */
export async function getAdminUnreadCount(adminId) {
  const endpoint = adminId ? `/api/notifications/admin/${adminId}/unread-count` : '/api/notifications/admin/unread-count';
  try {
    const data = await request(endpoint);
    if (data && typeof data.unreadCount === 'number') {
      return data.unreadCount;
    }
  } catch {}

  return demoNotifications.filter((n) => n.recipientRole === 'ADMIN' && !n.isRead).length;
}

/**
 * Mark all administrator notifications as read.
 */
export async function markAllAdminNotificationsRead() {
  try {
    await request('/api/notifications/admin/mark-all-read', {
      method: 'PUT',
    });
  } catch {}

  demoNotifications = demoNotifications.map((n) => {
    if (n.recipientRole === 'ADMIN') {
      return { ...n, isRead: true };
    }
    return n;
  });

  return { success: true };
}

/**
 * Mark a single notification as read by ID.
 */
export async function markNotificationAsRead(id) {
  try {
    const updated = await request(`/api/notifications/${id}/read`, {
      method: 'PUT',
    });
    if (updated) return updated;
  } catch {}

  const target = demoNotifications.find((n) => n.notificationID === Number(id));
  if (target) {
    target.isRead = true;
    return target;
  }
  return { notificationID: id, isRead: true };
}

/**
 * Delete a notification by ID.
 */
export async function deleteNotification(id) {
  try {
    await request(`/api/notifications/${id}`, {
      method: 'DELETE',
    });
  } catch {}

  demoNotifications = demoNotifications.filter((n) => n.notificationID !== Number(id));
  return { success: true };
}

/**
 * Send custom notification via the Observer pattern.
 */
export async function sendCustomNotification(notificationData) {
  try {
    const result = await request('/api/notifications/send', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
    if (result) return result;
  } catch {}

  const newObj = {
    ...notificationData,
    notificationID: Date.now(),
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  demoNotifications.unshift(newObj);
  return newObj;
}

/**
 * Query currently registered observers in the Observer Pattern.
 */
export async function getRegisteredObservers() {
  try {
    const list = await request('/api/notifications/observers');
    if (Array.isArray(list)) {
      return list;
    }
  } catch {}

  return [
    { name: 'AdminNotificationObserver', class: 'AdminNotificationObserver', handlesClient: false, handlesAdmin: true, handlesAll: true },
    { name: 'AuditLogNotificationObserver', class: 'AuditLogNotificationObserver', handlesClient: true, handlesAdmin: true, handlesAll: true },
    { name: 'ClientNotificationObserver', class: 'ClientNotificationObserver', handlesClient: true, handlesAdmin: false, handlesAll: true },
    { name: 'EmailDispatchObserver', class: 'EmailDispatchObserver', handlesClient: true, handlesAdmin: true, handlesAll: true },
  ];
}
