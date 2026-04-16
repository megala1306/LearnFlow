// frontend/src/api/apiClient.js

import axios from 'axios';

// Base API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create Axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --------------------------------------------------
// Add Authorization token to every request
// --------------------------------------------------
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token'); // token stored in sessionStorage

    if (token) {
      // Use standard Authorization header
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// --------------------------------------------------
// LESSONS
// --------------------------------------------------
export const fetchLessonById = (lessonId) => {
  return apiClient.get(`/lessons/${lessonId}`);
};

export const fetchUnitsByLessonTitle = (lessonTitle) => {
  return apiClient.get(`/lessons/${lessonTitle}/units`);
};

// --------------------------------------------------
// USER / PROGRESS
// --------------------------------------------------
export const recordLessonCompletion = (subjectId, lessonId) => {
  return apiClient.post('/users/me/complete-lesson', { subjectId, lessonId });
};

export const recordUnitCompletion = (
  unitId,
  accuracy = 1,
  recommended_action = 'no_review',
  modality = null,
  time_spent = null
) => {
  return apiClient.post('/units/record', { 
    unit_id: unitId, 
    accuracy, 
    recommended_action,
    modality,
    time_spent
  });
};

// --------------------------------------------------
// ASSESSMENT
// --------------------------------------------------
export const fetchAssessment = (lessonId) => {
  return apiClient.get(`/assessment/${lessonId}`);
};

export const submitAssessment = (lessonId, answers) => {
  return apiClient.post('/assessment/submit', { lessonId, answers });
};

// --------------------------------------------------
// SUBJECTS
// --------------------------------------------------
export const fetchSubjects = () => {
  return apiClient.get('/subjects');
};

// --------------------------------------------------
// INTERACTIONS
// --------------------------------------------------
export const fetchInteractions = () => {
  return apiClient.get('/interactions');
};

// --------------------------------------------------
// USERS
// --------------------------------------------------
export const fetchCurrentUser = () => {
  return apiClient.get('/users/me');
};

// --------------------------------------------------
// EXPORT DEFAULT
// --------------------------------------------------
export default apiClient;