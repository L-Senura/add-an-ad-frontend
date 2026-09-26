/**
 * Add-an-Ad Advertising Agency Platform
 * Communication & Messaging API Services
 * Matches Spring Boot AdminChatController (/api/admin_chat) & ClientChatController (/api/client_chat)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// In-memory demo store for fallback/offline testing
let demoClientMessages = [
  {
    clientMessageID: 1,
    clientID: 1,
    clientMessage: 'Hello, our agency would like to review the YouTube ad placement schedule for Q3.',
    clientMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    clientMessageID: 2,
    clientID: 1,
    clientMessage: 'Could you also confirm the exact billing cycle for the on-site pin ad campaign?',
    clientMessageTime: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
];

let demoAdminMessages = [
  {
    adminMessageID: 101,
    adminID: 1,
    clientID: 1,
    clientMessageID: 1,
    adminMessage: 'Welcome to Add-an-Ad! Your YouTube campaign package is queued with production and will launch within 24 hours of approval.',
    adminMessageTime: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
  },
  {
    adminMessageID: 102,
    adminID: 1,
    clientID: 1,
    clientMessageID: 2,
    adminMessage: 'The on-site pin is billed at Rs. 1,000 as per our rate card and charged upon creative activation.',
    adminMessageTime: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
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
        data = { message: text };
      }
    }

    if (!response.ok) {
      const errorMessage = data?.message || data?.error || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      const connectionError = new Error('Backend not reachable; utilizing local communication store.');
      connectionError.isNetworkError = true;
      throw connectionError;
    }
    throw err;
  }
}

// -------------------------------------------------------------
// CLIENT CHAT ENDPOINTS (ClientChatController: /api/client_chat)
// -------------------------------------------------------------

/**
 * Client sends a message
 * POST /api/client_chat/{clientId}/send
 */
export async function sendClientMessage(clientId, messageText) {
  try {
    return await request(`/api/client_chat/${clientId}/send`, {
      method: 'POST',
      body: JSON.stringify({ clientMessage: messageText }),
    });
  } catch {
    // Offline fallback
    const newMsg = {
      clientMessageID: Date.now(),
      clientID: clientId,
      clientMessage: messageText,
      clientMessageTime: new Date().toISOString(),
    };
    demoClientMessages.push(newMsg);
    return newMsg;
  }
}

/**
 * View all messages sent by a client
 * GET /api/client_chat/{clientId}/messages
 */
export async function getClientMessages(clientId) {
  try {
    return await request(`/api/client_chat/${clientId}/messages`);
  } catch {
    // Offline fallback
    return demoClientMessages.filter((m) => String(m.clientID) === String(clientId));
  }
}

/**
 * Update client's own message
 * PUT /api/client_chat/{clientId}/update/{id}
 */
export async function updateClientMessage(clientId, messageId, updatedText) {
  try {
    return await request(`/api/client_chat/${clientId}/update/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ clientMessage: updatedText }),
    });
  } catch {
    // Offline fallback
    demoClientMessages = demoClientMessages.map((m) =>
      m.clientMessageID === messageId ? { ...m, clientMessage: updatedText } : m
    );
    return { clientMessageID: messageId, clientMessage: updatedText };
  }
}

/**
 * Delete client's own message
 * DELETE /api/client_chat/{clientId}/delete/{id}
 */
export async function deleteClientMessage(clientId, messageId) {
  try {
    return await request(`/api/client_chat/${clientId}/delete/${messageId}`, {
      method: 'DELETE',
    });
  } catch {
    // Offline fallback
    demoClientMessages = demoClientMessages.filter((m) => m.clientMessageID !== messageId);
    return { success: true, message: 'Deleted locally' };
  }
}

// -------------------------------------------------------------
// ADMIN CHAT ENDPOINTS (AdminChatController: /api/admin_chat)
// -------------------------------------------------------------

/**
 * Admin gets client messages
 * GET /api/admin_chat/{adminId}/client/{clientId}
 */
export async function getAdminClientMessages(adminId, clientId) {
  try {
    return await request(`/api/admin_chat/${adminId}/client/${clientId}`);
  } catch {
    return demoClientMessages.filter((m) => String(m.clientID) === String(clientId));
  }
}

/**
 * Admin sends a message to client
 * POST /api/admin_chat/{adminId}/send/{clientId}
 */
export async function sendAdminMessageToClient(adminId, clientId, messageText) {
  try {
    return await request(`/api/admin_chat/${adminId}/send/${clientId}`, {
      method: 'POST',
      body: JSON.stringify({ adminMessage: messageText }),
    });
  } catch {
    const newMsg = {
      adminMessageID: Date.now(),
      adminID: adminId,
      clientID: clientId,
      adminMessage: messageText,
      adminMessageTime: new Date().toISOString(),
    };
    demoAdminMessages.push(newMsg);
    return newMsg;
  }
}

/**
 * Admin replies to specific client message
 * POST /api/admin_chat/{adminId}/{clientId}/reply/{clientMessageID}
 */
export async function replyAdminMessage(adminId, clientId, clientMessageID, messageText) {
  try {
    return await request(`/api/admin_chat/${adminId}/${clientId}/reply/${clientMessageID}`, {
      method: 'POST',
      body: JSON.stringify({ adminMessage: messageText }),
    });
  } catch {
    const newMsg = {
      adminMessageID: Date.now(),
      adminID: adminId,
      clientID: clientId,
      clientMessageID: clientMessageID,
      adminMessage: messageText,
      adminMessageTime: new Date().toISOString(),
    };
    demoAdminMessages.push(newMsg);
    return newMsg;
  }
}

/**
 * View messages sent by an Admin
 * GET /api/admin_chat/admin/{adminId}
 */
export async function getMessagesByAdminId(adminId) {
  try {
    return await request(`/api/admin_chat/admin/${adminId}`);
  } catch {
    return demoAdminMessages.filter((m) => String(m.adminID) === String(adminId));
  }
}

/**
 * Admin updates his own sent message
 * PUT /api/admin_chat/{adminId}/update/{id}
 */
export async function updateAdminMessage(adminId, messageId, updatedText) {
  try {
    return await request(`/api/admin_chat/${adminId}/update/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ adminMessage: updatedText }),
    });
  } catch {
    demoAdminMessages = demoAdminMessages.map((m) =>
      m.adminMessageID === messageId ? { ...m, adminMessage: updatedText } : m
    );
    return { adminMessageID: messageId, adminMessage: updatedText };
  }
}

/**
 * Admin deletes his own sent message
 * DELETE /api/admin_chat/{adminId}/delete/{id}
 */
export async function deleteAdminMessage(adminId, messageId) {
  try {
    return await request(`/api/admin_chat/${adminId}/delete/${messageId}`, {
      method: 'DELETE',
    });
  } catch {
    demoAdminMessages = demoAdminMessages.filter((m) => m.adminMessageID !== messageId);
    return { success: true, message: 'Deleted locally' };
  }
}

/**
 * Combined conversation thread getter for a given client
 */
export async function getFullConversationThread(clientId, adminId = 1) {
  try {
    const [clientMsgs, adminMsgs] = await Promise.all([
      getClientMessages(clientId),
      getMessagesByAdminId(adminId),
    ]);

    const relevantAdminMsgs = (adminMsgs || []).filter(
      (m) => String(m.clientID) === String(clientId)
    );

    // Merge and sort chronologically
    const thread = [
      ...(clientMsgs || []).map((m) => ({ ...m, sender: 'CLIENT' })),
      ...relevantAdminMsgs.map((m) => ({ ...m, sender: 'ADMIN' })),
    ].sort((a, b) => {
      const timeA = new Date(a.clientMessageTime || a.adminMessageTime || 0).getTime();
      const timeB = new Date(b.clientMessageTime || b.adminMessageTime || 0).getTime();
      return timeA - timeB;
    });

    return thread;
  } catch {
    const relevantClient = demoClientMessages.filter(
      (m) => String(m.clientID) === String(clientId)
    );
    const relevantAdmin = demoAdminMessages.filter(
      (m) => String(m.clientID) === String(clientId)
    );

    return [
      ...relevantClient.map((m) => ({ ...m, sender: 'CLIENT' })),
      ...relevantAdmin.map((m) => ({ ...m, sender: 'ADMIN' })),
    ].sort((a, b) => {
      const timeA = new Date(a.clientMessageTime || a.adminMessageTime || 0).getTime();
      const timeB = new Date(b.clientMessageTime || b.adminMessageTime || 0).getTime();
      return timeA - timeB;
    });
  }
}
