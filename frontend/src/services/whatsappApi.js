import { STORAGE_KEYS, API_CONFIG } from '../utils/config';

const API_BASE_URL = `${API_CONFIG.BASE_URL}/api/whatsapp-groups`;
const WHATSAPP_API_BASE_URL = `${API_CONFIG.BASE_URL}/api/whatsapp`;

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const whatsappGroupApi = {
  // Group management
  createGroup: async (groupData) => {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(groupData)
    });
    return handleResponse(response);
  },

  getAllGroups: async (params = {}) => {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${API_BASE_URL}?${queryParams}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getGroupById: async (id) => {
    // Use real WhatsApp group endpoint if id ends with @g.us
    const isRealWhatsAppGroup = id.endsWith('@g.us');
    const url = isRealWhatsAppGroup
      ? `/api/whatsapp/groups/${id}`
      : `${API_BASE_URL}/${id}`;
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  updateGroup: async (id, updateData) => {
    // Use real WhatsApp group endpoint if id ends with @g.us
    const isRealWhatsAppGroup = id.endsWith('@g.us');
    const url = isRealWhatsAppGroup
      ? `/api/whatsapp/groups/${id}`
      : `${API_BASE_URL}/${id}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData)
    });
    return handleResponse(response);
  },

  deleteGroup: async (id) => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getGroupOptions: async () => {
    console.log('🔍 Fetching group options from:', `${API_BASE_URL}/options`);
    const response = await fetch(`${API_BASE_URL}/options`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getGroupStatistics: async () => {
    const response = await fetch(`${API_BASE_URL}/statistics`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Member management
  addMember: async (memberData) => {
    const response = await fetch(`${API_BASE_URL}/members/add`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(memberData)
    });
    return handleResponse(response);
  },

  importMembersFromExcel: async (formData) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const response = await fetch(`${API_BASE_URL}/members/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type for FormData, let browser set it
      },
      body: formData
    });
    return handleResponse(response);
  },

  getAllMembers: async (params = {}) => {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/members/all?${queryParams}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getPendingMembers: async (params = {}) => {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/members/pending?${queryParams}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  searchMembers: async (params = {}) => {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/members/search?${queryParams}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getMembersByGroupId: async (groupId, params = {}) => {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/${groupId}/members?${queryParams}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getMemberById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/members/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  updateMemberStatus: async (id, status) => {
    const response = await fetch(`${API_BASE_URL}/members/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    return handleResponse(response);
  },

  // Real WhatsApp group member management
  addMembersToWhatsAppGroup: async (groupId, participants) => {
    const response = await fetch(`/api/whatsapp/groups/${groupId}/members/add`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ participants })
    });
    return handleResponse(response);
  },

  bulkUpdateMemberStatus: async (memberIds, status) => {
    const response = await fetch(`${API_BASE_URL}/members/bulk/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ member_ids: memberIds, status })
    });
    return handleResponse(response);
  },

  removeMember: async (id) => {
    const response = await fetch(`${API_BASE_URL}/members/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  bulkRemoveMembers: async (memberIds) => {
    const response = await fetch(`${API_BASE_URL}/members/bulk/remove`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ member_ids: memberIds })
    });
    return handleResponse(response);
  },

  getMemberStatistics: async (groupId = null) => {
    const params = groupId ? `?group_id=${groupId}` : '';
    const response = await fetch(`${API_BASE_URL}/members/statistics${params}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // File downloads
  downloadSampleExcel: async () => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const response = await fetch(`${API_BASE_URL}/download-sample`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to download sample file');
    }
    
    return response.blob();
  },

  // WhatsApp-specific endpoints
  getWhatsAppStatus: async () => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/whatsapp/status`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getWhatsAppQR: async () => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/whatsapp/qr`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  sendWhatsAppMessage: async (messageData) => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/whatsapp/send-message`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(messageData)
    });
    return handleResponse(response);
  },

  restartWhatsAppClient: async () => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/whatsapp/restart`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  removeMemberFromWhatsAppGroup: async (groupId, memberId) => {
    const response = await fetch(`/api/whatsapp/groups/${groupId}/members/${memberId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Get real WhatsApp groups from connected WhatsApp client
  getRealWhatsAppGroups: async () => {
    console.log('🔍 Fetching real WhatsApp groups...');
    const response = await fetch(`${WHATSAPP_API_BASE_URL}/groups`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Get all WhatsApp chats (groups + individuals)
  getWhatsAppChats: async () => {
    console.log('🔍 Fetching WhatsApp chats...');
    const response = await fetch(`${WHATSAPP_API_BASE_URL}/chats`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

export default whatsappGroupApi; 
