import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    
    // Create a more descriptive error message
    const errorMessage = error.response?.data?.error 
      || error.message 
      || 'An unexpected error occurred'
    
    const enhancedError = new Error(errorMessage) as Error & {
      status?: number
      data?: unknown
    }
    if (error.response) {
      enhancedError.status = error.response.status
      enhancedError.data = error.response.data
    }
    
    return Promise.reject(enhancedError)
  }
)

export default api

