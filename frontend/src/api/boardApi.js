import axiosInstance from './axiosInstance';

export const updateDefaultAssignee = async (defaultAssignee) => {
  try {
    if (!defaultAssignee) {
      throw new Error('Default assignee is required');
    }
    
    const response = await axiosInstance.put('/api/board/default-assignee', {
      defaultAssignee
    });
    return response.data;
  } catch (error) {
    console.error('Error updating default assignee:', error);
    throw error.response?.data || error;
  }
};

export const getBoardSettings = async () => {
  try {
    const response = await axiosInstance.get('/api/board');
    return response.data;
  } catch (error) {
    console.error('Error getting board settings:', error);
    return { defaultAssignee: null };
  }
}; 