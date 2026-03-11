import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

/**
 * Classify audio file using the backend API
 * @param {Blob|File} audioFile - The audio file to classify
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise<Object>} Classification result
 */
export async function classifyAudio(audioFile, onProgress) {
  const formData = new FormData();
  formData.append('audio', audioFile);

  try {
    const response = await apiClient.post('/classify', formData, {
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });

    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw new Error(
      error.response?.data?.error || 
      error.message || 
      'Failed to classify audio'
    );
  }
}

/**
 * Check API health status
 * @returns {Promise<Object>} Health status
 */
export async function checkHealth() {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    return { status: 'error', error: error.message };
  }
}
