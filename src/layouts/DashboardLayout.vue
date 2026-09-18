<template>
  <div class="dashboard-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
          <rect width="36" height="36" rx="9" fill="var(--color-primary)"/>
          <path d="M10 12h16M10 18h10M10 24h12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
        <div>
          <div class="sidebar-logo-title">Bapperida</div>
          <div class="sidebar-logo-sub">Pusat Data</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-label">MODUL</div>

        <router-link to="/dashboard/perencanaan" class="nav-item" active-class="nav-item--active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
          </svg>
          Perencanaan
        </router-link>

        <router-link to="/dashboard/palev" class="nav-item" active-class="nav-item--active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          Palev
          <span class="nav-sublabel">Pengendalian & Evaluasi</span>
        </router-link>

        <!-- Super Admin Only -->
        <template v-if="authStore.isSuperAdmin">
          <div class="nav-section-label" style="margin-top:1rem;">ADMINISTRASI</div>
          <router-link to="/dashboard/admin" class="nav-item" active-class="nav-item--active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Manajemen User
          </router-link>
          <router-link to="/dashboard/logs" class="nav-item" active-class="nav-item--active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Log Aktivitas
          </router-link>
        </template>

        <!-- Sidebar Bottom Action (sesuai wireframe: + Tambah / edit) -->
        <div v-if="authStore.isSuperAdmin" class="sidebar-bottom-action">
          <router-link to="/dashboard/admin" class="btn-sidebar-add" title="Kelola Bidang & User">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>+ Tambah / Edit</span>
          </router-link>
        </div>
      </nav>

      <!-- User Profile -->
      <div class="sidebar-user">
        <div class="sidebar-user-info">
          <div class="sidebar-avatar">{{ userInitials }}</div>
          <div class="sidebar-user-details">
            <div class="sidebar-user-name">{{ authStore.user?.nama }}</div>
            <div>
              <span class="badge" :class="roleBadgeClass">{{ roleLabel }}</span>
            </div>
          </div>
        </div>
        <button class="btn-icon" @click="handleLogout" title="Keluar">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const userInitials = computed(() => {
  const nama = authStore.user?.nama || ''
  return nama.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
})

const roleLabel = computed(() => {
  const map = { SUPER_ADMIN: 'Super Admin', ADMIN_BIDANG: 'Admin Bidang', VIEWER: 'Viewer' }
  return map[authStore.user?.role] || authStore.user?.role
})

const roleBadgeClass = computed(() => {
  const map = { SUPER_ADMIN: 'badge-super', ADMIN_BIDANG: 'badge-admin', VIEWER: 'badge-viewer' }
  return map[authStore.user?.role] || 'badge-viewer'
})

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
}

/* ---- Sidebar ---- */
.sidebar {
  width: var(--sidebar-width);
  min-height: 100vh;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  box-shadow: var(--shadow-sidebar);
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 1.1rem 1rem;
  border-bottom: 1px solid var(--color-border);
}
.sidebar-logo-title {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--color-text-primary);
  line-height: 1.2;
}
.sidebar-logo-sub {
  font-size: 0.7rem;
  color: var(--color-text-caption);
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0.6rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-section-label {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--color-text-caption);
  letter-spacing: 0.07em;
  padding: 0.4rem 0.5rem 0.3rem;
  text-transform: uppercase;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.75rem;
  border-radius: var(--radius-md);
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: background var(--transition), color var(--transition);
  position: relative;
  flex-wrap: wrap;
}
.nav-item:hover {
  background: var(--color-bg);
  color: var(--color-text-primary);
}
.nav-item--active {
  background: var(--color-primary-light) !important;
  color: var(--color-primary-dark) !important;
  font-weight: 600;
}
.nav-item--active svg { color: var(--color-primary); }

.nav-sublabel {
  font-size: 0.68rem;
  color: var(--color-text-caption);
  font-weight: 400;
  width: 100%;
  margin-left: 1.6rem;
  margin-top: -4px;
}

.sidebar-bottom-action {
  margin-top: auto;
  padding-top: 1rem;
}
.btn-sidebar-add {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.75rem;
  border-radius: var(--radius-md);
  border: 1.5px dashed var(--color-border);
  color: var(--color-text-secondary);
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
  transition: all var(--transition);
  background: var(--color-bg);
}
.btn-sidebar-add:hover {
  border-color: var(--color-primary);
  color: var(--color-primary-dark);
  background: var(--color-primary-light);
}

/* User Profile at bottom */
.sidebar-user {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 0.75rem;
  border-top: 1px solid var(--color-border);
  gap: 0.5rem;
}
.sidebar-user-info {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
  flex: 1;
}
.sidebar-avatar {
  width: 32px;
  height: 32px;
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  font-weight: 700;
  flex-shrink: 0;
}
.sidebar-user-details { min-width: 0; }
.sidebar-user-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Main content */
.main-content {
  flex: 1;
  margin-left: var(--sidebar-width);
  min-height: 100vh;
  padding: 0;
  overflow: auto;
}
</style>
