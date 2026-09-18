<template>
  <div class="login-page">
    <div class="login-card">
      <!-- Logo / Header -->
      <div class="login-header">
        <div class="login-logo">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="10" fill="var(--color-primary)"/>
            <path d="M10 12h16M10 18h10M10 24h12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
          <span class="login-logo-text">Bapperida</span>
        </div>
        <h1>Pusat Data Dokumen Perencanaan</h1>
        <p class="caption">Masuk untuk mengakses sistem dokumen perencanaan daerah</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="email@bapperida.go.id"
            autocomplete="email"
            required
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <div class="password-wrap">
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              autocomplete="current-password"
              required
              :disabled="loading"
            />
            <button type="button" class="toggle-password" @click="showPassword = !showPassword">
              <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
        </div>

        <div v-if="errorMsg" class="error-alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {{ errorMsg }}
        </div>

        <button type="submit" class="btn btn-primary w-full login-btn" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span>{{ loading ? 'Memproses...' : 'Masuk' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({ email: '', password: '' })
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  errorMsg.value = ''
  loading.value = true
  const result = await authStore.login(form.value.email, form.value.password)
  loading.value = false
  if (result.success) {
    router.push('/dashboard/perencanaan')
  } else {
    errorMsg.value = result.error
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #E8F8F2 0%, #F4F7F5 50%, #EFF6F2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.login-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 32px rgba(91,200,168,0.12), 0 0 0 1px var(--color-border);
  padding: 2rem 2rem 1.5rem;
  width: 100%;
  max-width: 420px;
}

.login-header {
  text-align: center;
  margin-bottom: 1.8rem;
}
.login-logo {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.9rem;
}
.login-logo-text {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-primary-dark);
}
.login-header h1 {
  font-size: 1.15rem;
  color: var(--color-text-primary);
  margin-bottom: 0.35rem;
}

.password-wrap {
  position: relative;
}
.password-wrap input { padding-right: 2.8rem; width: 100%; }
.toggle-password {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-caption);
  padding: 2px;
  display: flex;
  align-items: center;
}
.toggle-password:hover { color: var(--color-primary); }

.error-alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-danger-light);
  border: 1px solid #fca5a5;
  border-radius: var(--radius-md);
  padding: 0.6rem 0.9rem;
  font-size: 0.83rem;
  color: var(--color-danger);
  margin-bottom: 0.5rem;
}

.login-btn {
  margin-top: 0.5rem;
  justify-content: center;
  padding: 0.7rem;
  font-size: 0.95rem;
}
</style>
