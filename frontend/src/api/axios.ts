import axios from 'axios'

const api = axios.create({
  baseURL: 'https://localhost:7296',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}> = []

function processQueue(error: unknown) {
  for (const { resolve, reject } of failedQueue) {
    if (error) reject(error)
    else resolve(undefined)
  }
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status !== 401 || originalRequest._retry) {
      throw error;
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then(() => api(originalRequest))
        .catch((error_) => { throw error_; })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      await axios.post('http://localhost:5000/api/auth/refresh', {}, { withCredentials: true })
      processQueue(null)
      return api(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError)
      window.location.href = '/login'
      throw refreshError
    } finally {
      isRefreshing = false
    }
  },
)

export default api
