<template>
  <div class="logs-view">
    <div class="page-header">
      <div>
        <h1>Log Aktivitas</h1>
        <p class="caption">Riwayat semua aktivitas CRUD di sistem — 200 aktivitas terbaru</p>
      </div>
      <button class="btn btn-outline btn-sm" @click="fetchLogs">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.57-5.67"/></svg>
        Refresh
      </button>
    </div>

    <section class="section">
      <div v-if="loading" class="empty-state"><div class="spinner"></div><p>Memuat log...</p></div>
      <div v-else-if="logs.length === 0" class="empty-state">
        <p>Belum ada aktivitas tercatat.</p>
      </div>
      <div v-else style="overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Waktu</th>
              <th>User</th>
              <th>Aksi</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td class="caption" style="white-space:nowrap;">{{ formatDateTime(log.timestamp) }}</td>
              <td><strong>{{ log.user_nama }}</strong></td>
              <td>
                <span class="action-badge" :class="getActionClass(log.aksi)">{{ log.aksi }}</span>
              </td>
              <td class="caption">{{ log.detail || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div class="toast-container">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="t.type">{{ t.message }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const API = '/api'
const logs = ref([])
const loading = ref(true)
const toasts = ref([])

async function fetchLogs() {
  loading.value = true
  try {
    const res = await axios.get(`${API}/activity-logs`)
    logs.value = res.data.logs
  } catch { showToast('Gagal memuat log.', 'error') }
  finally { loading.value = false }
}

function formatDateTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getActionClass(aksi) {
  if (aksi?.includes('HAPUS')) return 'action-danger'
  if (aksi?.includes('TAMBAH')) return 'action-success'
  if (aksi?.includes('EDIT') || aksi?.includes('RESET')) return 'action-warning'
  return 'action-default'
}

function showToast(message, type = 'success') {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id) }, 3000)
}

onMounted(fetchLogs)
</script>

<style scoped>
.logs-view {
  padding: 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}
.page-header h1 { font-size: 1.3rem; margin-bottom: 0.2rem; }
.section {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  padding: 1.2rem;
}

.action-badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-pill);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.action-danger { background: var(--color-danger-light); color: var(--color-danger); }
.action-success { background: #DCFCE7; color: var(--color-success); }
.action-warning { background: #FEF3C7; color: var(--color-warning); }
.action-default { background: var(--color-bg); color: var(--color-text-secondary); }
</style>
