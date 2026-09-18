import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const API_BASE = '/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('auth_token') || null)
  const loading = ref(false)
  const error = ref(null)

  // Computed
  const isLoggedIn = computed(() => !!user.value && !!token.value)
  const isSuperAdmin = computed(() => user.value?.role === 'SUPER_ADMIN')
  const isAdminBidang = computed(() => user.value?.role === 'ADMIN_BIDANG')
  const isViewer = computed(() => user.value?.role === 'VIEWER')
  const isAdminOrAbove = computed(() => isSuperAdmin.value || isAdminBidang.value)

  function canEditBidang(bidangId) {
    if (isSuperAdmin.value) return true
    if (isAdminBidang.value && user.value?.bidang_id === bidangId) return true
    return false
  }

  // Set axios default header
  function setAuthHeader(t) {
    if (t) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${t}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }

  // Initialize from localStorage
  async function init() {
    if (!token.value) return
    setAuthHeader(token.value)
    try {
      const res = await axios.get(`${API_BASE}/auth/me`)
      user.value = res.data.user
    } catch {
      logout()
    }
  }

  async function login(email, password) {
    loading.value = true
    error.value = null
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password })
      token.value = res.data.token
      user.value = res.data.user
      localStorage.setItem('auth_token', res.data.token)
      setAuthHeader(res.data.token)
      return { success: true }
    } catch (err) {
      error.value = err.response?.data?.error || 'Gagal login. Periksa koneksi server.'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
    setAuthHeader(null)
  }

  return { user, token, loading, error, isLoggedIn, isSuperAdmin, isAdminBidang, isViewer, isAdminOrAbove, canEditBidang, init, login, logout }
})
