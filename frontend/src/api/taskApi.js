import axiosInstance from './axiosInstance';

export const createTask = async (taskData) => {
  try {
    const response = await axiosInstance.post('/api/tasks', {
      ...taskData,
      assignedTo: taskData.assignedTo || null
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Error creating task');
  }
};

export const getTasks = async (timeRange) => {
  try {
    const response = await axiosInstance.get('/api/tasks', { params: { timeRange } });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Error fetching tasks');
  }
};

export const updateTask = async (taskId, taskData) => {
  try {
    const response = await axiosInstance.put(`/api/tasks/${taskId}`, {
      ...taskData,
      assignedTo: taskData.assignedTo || null
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Error updating task');
  }
};

export const deleteTask = async (taskId) => {
  try {
    const response = await axiosInstance.delete(`/api/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Error deleting task');
  }
};

export const getTaskStats = async () => {
  try {
    const response = await axiosInstance.get('/api/tasks/stats');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Error fetching task statistics');
  }
};

export const getAllUsers = async () => {
  try {
    const response = await axiosInstance.get('/api/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const bulkUpdateTasks = async (tasks) => {
  try {
    const response = await axiosInstance.put('/api/tasks/bulk?isBulk=true', { tasks });
    return response.data;
  } catch (error) {
    console.error('Bulk update error:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : new Error('Error updating tasks in bulk');
  }
};


export const shareTask = async (taskId) => {
  try {
    const response = await axiosInstance.post(`/api/tasks/${taskId}/share`);
    const baseUrl = process.env.REACT_APP_FRONTEND_URL || window.location.origin;
    return {
      ...response.data,
      shareUrl: `${baseUrl}/share/${response.data.shareId}`
    };
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getSharedTask = async (shareId) => {
  try {
    const response = await axiosInstance.get(`/api/share/tasks/share/${shareId}`);
    return response.data;
  } catch (error) {
    console.error('Get shared task error:', error.response?.data || error);
    throw error.response?.data || new Error('Error fetching shared task');
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await axiosInstance.get('/api/users/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
};
