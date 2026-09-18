<template>
  <div class="admin-view">
    <div class="page-header">
      <div>
        <h1>Manajemen Administrasi</h1>
        <p class="caption">Kelola bidang, user, dan akun admin — Super Admin Only</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="admin-tabs">
      <button
        v-for="tab in tabs" :key="tab.key"
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab: Bidang -->
    <section v-if="activeTab === 'bidang'" class="section">
      <div class="section-title-row">
        <h2>Daftar Bidang</h2>
        <button class="btn btn-primary btn-sm" @click="openBidangModal()">+ Tambah Bidang</button>
      </div>
      <div v-if="loadingBidang" class="empty-state"><div class="spinner"></div></div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Nama Bidang</th>
            <th>Jumlah Folder</th>
            <th>Dibuat</th>
            <th style="text-align:right;">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in bidangs" :key="b.id">
            <td><strong>{{ b.nama_bidang }}</strong></td>
            <td><span class="badge badge-admin">{{ b.jumlah_folder }} folder</span></td>
            <td class="caption">{{ formatDate(b.created_at) }}</td>
            <td style="text-align:right;">
              <button class="btn-icon" @click="openBidangModal(b)" title="Edit">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="btn-icon danger" @click="deleteBidang(b)" title="Hapus">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Tab: Users -->
    <section v-if="activeTab === 'users'" class="section">
      <div class="section-title-row">
        <h2>Daftar User</h2>
        <button class="btn btn-primary btn-sm" @click="openUserModal()">+ Tambah User</button>
      </div>
      <div v-if="loadingUsers" class="empty-state"><div class="spinner"></div></div>
      <div v-else style="overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Email</th>
              <th>Role</th>
              <th>Bidang</th>
              <th>Status</th>
              <th style="text-align:right;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td><strong>{{ u.nama }}</strong></td>
              <td class="caption">{{ u.email }}</td>
              <td>
                <span class="badge" :class="roleBadgeClass(u.role)">{{ roleLabel(u.role) }}</span>
              </td>
              <td class="caption">{{ u.nama_bidang || '—' }}</td>
              <td>
                <span class="badge" :class="u.active ? 'badge-admin' : 'badge-viewer'">
                  {{ u.active ? 'Aktif' : 'Nonaktif' }}
                </span>
              </td>
              <td style="text-align:right;white-space:nowrap;">
                <button class="btn-icon" @click="openUserModal(u)" title="Edit">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button class="btn-icon" @click="openResetPassword(u)" title="Reset Password">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </button>
                <button class="btn-icon danger" @click="deleteUser(u)" title="Hapus">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Tab: Auto-Reset / Keep-Alive -->
    <section v-if="activeTab === 'keepalive'" class="section">
      <div class="section-title-row">
        <div>
          <h2>Kontrol Auto-Reset / Keep-Alive Backend</h2>
          <p class="caption">Mekanisme pencegah mode sleep/idle server di hosting cloud (Render, Railway, Replit, dll)</p>
        </div>
        <button class="btn btn-outline btn-sm" @click="fetchKeepAliveStatus" :disabled="loadingKeepalive">
          🔄 Refresh
        </button>
      </div>

      <div v-if="loadingKeepalive" class="empty-state"><div class="spinner"></div></div>
      <div v-else class="keepalive-grid">
        <!-- Status Card -->
        <div class="ka-card stat-card">
          <div class="stat-header">
            <span class="stat-label">Status Keep-Alive</span>
            <span class="badge" :class="keepaliveData.effective_running ? 'badge-super' : 'badge-viewer'">
              {{ keepaliveData.effective_running ? '● SEDANG AKTIF' : '○ NONAKTIF / STANDBY' }}
            </span>
          </div>
          <div class="stat-desc">
            <p><strong>Kondisi Saat Ini:</strong> {{ keepaliveData.status_summary }}</p>
            <p class="caption">Waktu Server: <strong>{{ keepaliveData.current_time }}</strong></p>
          </div>
          <div class="stat-metrics">
            <div class="metric-box">
              <span class="metric-title">Terakhir Ping</span>
              <span class="metric-val">{{ formatDateTime(keepaliveData.last_ping) || 'Belum Ada' }}</span>
            </div>
            <div class="metric-box">
              <span class="metric-title">Status Ping Terakhir</span>
              <span class="metric-val" style="color:var(--color-primary-dark)">{{ keepaliveData.last_status || '-' }}</span>
            </div>
            <div class="metric-box">
              <span class="metric-title">Total Ping Berhasil</span>
              <span class="metric-val">{{ keepaliveData.ping_count || 0 }} kali</span>
            </div>
          </div>
          <div style="margin-top:1rem;">
            <button class="btn btn-primary btn-sm" @click="triggerPing" :disabled="pinging">
              <span v-if="pinging" class="spinner" style="width:12px;height:12px;border-width:2px;"></span>
              💓 Test Ping Sekarang
            </button>
          </div>
        </div>

        <!-- Form Settings Card -->
        <div class="ka-card form-card">
          <h3>⚙️ Pengaturan Jadwal & Persistensi</h3>
          <p class="caption" style="margin-bottom:1rem;">Pengaturan disimpan persisten di database SQLite (tidak hilang saat restart server).</p>
          
          <form @submit.prevent="saveKeepAliveConfig">
            <div class="switch-row">
              <label class="switch-label">
                <input type="checkbox" v-model="keepaliveForm.active" />
                <span class="switch-title">Aktifkan Auto-Reset (Keep-Alive)</span>
              </label>
              <p class="caption">Master switch untuk mengaktifkan atau menonaktifkan seluruh mekanisme ping.</p>
            </div>

            <div class="switch-row" style="margin-top:0.8rem;">
              <label class="switch-label">
                <input type="checkbox" v-model="keepaliveForm.schedule_enabled" />
                <span class="switch-title">Gunakan Penjadwalan Jam Kerja</span>
              </label>
              <p class="caption">Bila aktif, ping otomatis hanya berjalan saat jam kerja. Di luar jam kerja, server dibiarkan idle untuk hemat kuota/resource.</p>
            </div>

            <div v-if="keepaliveForm.schedule_enabled" class="workhours-row">
              <div class="form-group" style="margin-bottom:0;">
                <label>Jam Mulai Kerja</label>
                <input type="time" v-model="keepaliveForm.work_start" required />
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label>Jam Selesai Kerja</label>
                <input type="time" v-model="keepaliveForm.work_end" required />
              </div>
            </div>

            <div class="form-group" style="margin-top:0.8rem;">
              <label>Interval Ping (Menit)</label>
              <input type="number" v-model="keepaliveForm.interval_minutes" min="1" max="60" required />
              <span class="caption">Rekomendasi: 10 menit (di bawah batas sleep 14-15 menit penyedia hosting).</span>
            </div>

            <div style="margin-top:1.2rem;">
              <button type="submit" class="btn btn-primary" :disabled="savingKeepalive">
                <span v-if="savingKeepalive" class="spinner" style="width:14px;height:14px;border-width:2px;"></span>
                💾 Simpan Konfigurasi
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>

    <!-- Tab: Demo Accounts / Testing -->
    <section v-if="activeTab === 'demo'" class="section">
      <div class="section-title-row">
        <div>
          <h2>🎯 Akun Testing & Demo (Internal)</h2>
          <p class="caption">Daftar kredensial akun bawaan untuk keperluan verifikasi dan testing internal sistem.</p>
        </div>
      </div>
      <div class="demo-admin-grid">
        <div v-for="acc in internalDemoAccounts" :key="acc.email" class="demo-admin-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
            <strong>{{ acc.role }}</strong>
            <span class="badge" :class="acc.badgeClass">{{ acc.role }}</span>
          </div>
          <p class="caption" style="margin-bottom:0.3rem;">Email: <code>{{ acc.email }}</code></p>
          <p class="caption" style="margin-bottom:0.8rem;">Password: <code>{{ acc.password }}</code></p>
          <button class="btn btn-outline btn-sm" @click="copyCredentials(acc)">
            📋 Salin Kredensial
          </button>
        </div>
      </div>
    </section>

    <!-- Modal: Bidang -->
    <Teleport to="body">
      <div v-if="showBidangModal" class="modal-overlay" @click.self="showBidangModal=false">
        <div class="modal-box">
          <div class="modal-header">
            <h3>{{ editingBidang ? 'Edit Bidang' : 'Tambah Bidang Baru' }}</h3>
            <button class="btn-icon" @click="showBidangModal=false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
          <form @submit.prevent="submitBidang">
            <div class="form-group">
              <label>Nama Bidang <span style="color:var(--color-danger)">*</span></label>
              <input v-model="bidangForm.nama_bidang" placeholder="contoh: Bidang Infrastruktur" required />
            </div>
            <div v-if="formError" class="error-alert" style="margin-bottom:0.8rem;font-size:0.82rem;">{{ formError }}</div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline" @click="showBidangModal=false">Batal</button>
              <button type="submit" class="btn btn-primary" :disabled="formLoading">
                <span v-if="formLoading" class="spinner" style="width:14px;height:14px;border-width:2px;"></span>
                {{ editingBidang ? 'Simpan' : 'Tambah' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Modal: User -->
    <Teleport to="body">
      <div v-if="showUserModal" class="modal-overlay" @click.self="showUserModal=false">
        <div class="modal-box">
          <div class="modal-header">
            <h3>{{ editingUser ? 'Edit User' : 'Tambah User Baru' }}</h3>
            <button class="btn-icon" @click="showUserModal=false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
          <form @submit.prevent="submitUser">
            <div class="form-group">
              <label>Nama Lengkap *</label>
              <input v-model="userForm.nama" placeholder="Nama Lengkap" required />
            </div>
            <div class="form-group">
              <label>Email *</label>
              <input v-model="userForm.email" type="email" placeholder="email@bapperida.go.id" required />
            </div>
            <div v-if="!editingUser" class="form-group">
              <label>Password *</label>
              <input v-model="userForm.password" type="password" placeholder="Min. 6 karakter" required minlength="6" />
            </div>
            <div class="form-group">
              <label>Role *</label>
              <select v-model="userForm.role" required>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN_BIDANG">Admin Bidang</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
            <div v-if="userForm.role === 'ADMIN_BIDANG'" class="form-group">
              <label>Bidang *</label>
              <select v-model="userForm.bidang_id" required>
                <option value="">— Pilih Bidang —</option>
                <option v-for="b in bidangs" :key="b.id" :value="b.id">{{ b.nama_bidang }}</option>
              </select>
            </div>
            <div v-if="editingUser" class="form-group">
              <label>Status</label>
              <select v-model="userForm.active">
                <option :value="true">Aktif</option>
                <option :value="false">Nonaktif</option>
              </select>
            </div>
            <div v-if="formError" class="error-alert" style="margin-bottom:0.8rem;font-size:0.82rem;">{{ formError }}</div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline" @click="showUserModal=false">Batal</button>
              <button type="submit" class="btn btn-primary" :disabled="formLoading">
                <span v-if="formLoading" class="spinner" style="width:14px;height:14px;border-width:2px;"></span>
                {{ editingUser ? 'Simpan' : 'Buat User' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Modal: Reset Password -->
    <Teleport to="body">
      <div v-if="resetPasswordUser" class="modal-overlay" @click.self="resetPasswordUser=null">
        <div class="modal-box">
          <div class="modal-header">
            <h3>Reset Password</h3>
            <button class="btn-icon" @click="resetPasswordUser=null"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
          <p class="caption" style="margin-bottom:1rem;">Reset password untuk: <strong>{{ resetPasswordUser.email }}</strong></p>
          <form @submit.prevent="submitResetPassword">
            <div class="form-group">
              <label>Password Baru *</label>
              <input v-model="newPassword" type="password" placeholder="Min. 6 karakter" required minlength="6" />
            </div>
            <div v-if="formError" class="error-alert" style="margin-bottom:0.8rem;font-size:0.82rem;">{{ formError }}</div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline" @click="resetPasswordUser=null">Batal</button>
              <button type="submit" class="btn btn-primary" :disabled="formLoading">
                <span v-if="formLoading" class="spinner" style="width:14px;height:14px;border-width:2px;"></span>
                Reset Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Toast -->
    <div class="toast-container">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="t.type">
        {{ t.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const API = '/api'

const tabs = [
  { key: 'bidang', label: 'Manajemen Bidang' },
  { key: 'users', label: 'Manajemen User' },
  { key: 'keepalive', label: 'Auto-Reset / Keep-Alive' },
  { key: 'demo', label: 'Akun Testing' },
]
const activeTab = ref('bidang')

// Data
const bidangs = ref([])
const users = ref([])
const loadingBidang = ref(true)
const loadingUsers = ref(true)
const toasts = ref([])

// KeepAlive state
const loadingKeepalive = ref(false)
const savingKeepalive = ref(false)
const pinging = ref(false)
const keepaliveData = ref({
  active: true,
  effective_running: true,
  status_summary: '',
  interval_minutes: 10,
  schedule_enabled: true,
  work_start: '08:00',
  work_end: '17:00',
  last_ping: null,
  last_status: '',
  ping_count: 0,
  current_time: '',
})
const keepaliveForm = ref({
  active: true,
  schedule_enabled: true,
  work_start: '08:00',
  work_end: '17:00',
  interval_minutes: 10,
})

const internalDemoAccounts = [
  { role: 'Super Admin', email: 'superadmin@bapperida.go.id', password: 'superadmin123', badgeClass: 'badge-super' },
  { role: 'Admin Perencanaan', email: 'admin.perencanaan@bapperida.go.id', password: 'admin123', badgeClass: 'badge-admin' },
  { role: 'Admin Palev', email: 'admin.palev@bapperida.go.id', password: 'admin123', badgeClass: 'badge-admin' },
  { role: 'Viewer', email: 'pegawai@bapperida.go.id', password: 'viewer123', badgeClass: 'badge-viewer' },
]

// Modal state
const showBidangModal = ref(false)
const editingBidang = ref(null)
const bidangForm = ref({ nama_bidang: '' })

const showUserModal = ref(false)
const editingUser = ref(null)
const userForm = ref({ nama: '', email: '', password: '', role: 'VIEWER', bidang_id: '', active: true })

const resetPasswordUser = ref(null)
const newPassword = ref('')

const formLoading = ref(false)
const formError = ref('')

// Fetch
async function fetchBidangs() {
  loadingBidang.value = true
  try {
    const res = await axios.get(`${API}/bidang`)
    bidangs.value = res.data.bidangs
  } catch { showToast('Gagal memuat bidang.', 'error') }
  finally { loadingBidang.value = false }
}

async function fetchUsers() {
  loadingUsers.value = true
  try {
    const res = await axios.get(`${API}/users`)
    users.value = res.data.users
  } catch { showToast('Gagal memuat user.', 'error') }
  finally { loadingUsers.value = false }
}

async function fetchKeepAliveStatus() {
  loadingKeepalive.value = true
  try {
    const res = await axios.get(`${API}/admin/keepalive/status`)
    if (res.data.success) {
      keepaliveData.value = res.data.data
      keepaliveForm.value = {
        active: !!res.data.data.active,
        schedule_enabled: !!res.data.data.schedule_enabled,
        work_start: res.data.data.work_start || '08:00',
        work_end: res.data.data.work_end || '17:00',
        interval_minutes: res.data.data.interval_minutes || 10,
      }
    }
  } catch (e) {
    showToast('Gagal memuat status keep-alive: ' + (e.response?.data?.error || e.message), 'error')
  } finally {
    loadingKeepalive.value = false
  }
}

async function saveKeepAliveConfig() {
  savingKeepalive.value = true
  try {
    const res = await axios.post(`${API}/admin/keepalive/config`, keepaliveForm.value)
    if (res.data.success) {
      keepaliveData.value = res.data.data
      showToast('Konfigurasi Auto-Reset berhasil disimpan!', 'success')
    }
  } catch (e) {
    showToast('Gagal menyimpan konfigurasi: ' + (e.response?.data?.error || e.message), 'error')
  } finally {
    savingKeepalive.value = false
  }
}

async function triggerPing() {
  pinging.value = true
  try {
    const res = await axios.post(`${API}/admin/keepalive/ping`)
    if (res.data.success) {
      keepaliveData.value = res.data.data
      showToast('💓 Self-ping berhasil! Server merespons 200 OK.', 'success')
    } else {
      showToast('Ping gagal: ' + (res.data.pingResult?.error || 'Unknown error'), 'error')
    }
  } catch (e) {
    showToast('Gagal mengirim ping: ' + (e.response?.data?.error || e.message), 'error')
  } finally {
    pinging.value = false
  }
}

function copyCredentials(acc) {
  navigator.clipboard.writeText(`Email: ${acc.email}\nPassword: ${acc.password}`)
  showToast(`Kredensial ${acc.role} disalin ke clipboard!`, 'success')
}

// Bidang CRUD
function openBidangModal(b = null) {
  editingBidang.value = b
  bidangForm.value = { nama_bidang: b?.nama_bidang || '' }
  formError.value = ''
  showBidangModal.value = true
}
async function submitBidang() {
  formError.value = ''
  formLoading.value = true
  try {
    if (editingBidang.value) {
      await axios.put(`${API}/bidang/${editingBidang.value.id}`, bidangForm.value)
      showToast('Bidang diperbarui.', 'success')
    } else {
      await axios.post(`${API}/bidang`, bidangForm.value)
      showToast('Bidang ditambahkan.', 'success')
    }
    showBidangModal.value = false
    await fetchBidangs()
  } catch (e) {
    formError.value = e.response?.data?.error || 'Gagal menyimpan bidang.'
  } finally { formLoading.value = false }
}
async function deleteBidang(b) {
  if (!confirm(`Hapus bidang "${b.nama_bidang}"? Semua folder di bidang ini juga akan dihapus.`)) return
  try {
    await axios.delete(`${API}/bidang/${b.id}`)
    showToast('Bidang dihapus.', 'success')
    await fetchBidangs()
  } catch (e) { showToast(e.response?.data?.error || 'Gagal menghapus.', 'error') }
}

// User CRUD
function openUserModal(u = null) {
  editingUser.value = u
  userForm.value = u
    ? { nama: u.nama, email: u.email, password: '', role: u.role, bidang_id: u.bidang_id || '', active: !!u.active }
    : { nama: '', email: '', password: '', role: 'VIEWER', bidang_id: '', active: true }
  formError.value = ''
  showUserModal.value = true
}
async function submitUser() {
  formError.value = ''
  formLoading.value = true
  try {
    const payload = { ...userForm.value }
    if (!payload.bidang_id || payload.role !== 'ADMIN_BIDANG') payload.bidang_id = null
    if (editingUser.value) {
      await axios.put(`${API}/users/${editingUser.value.id}`, payload)
      showToast('User diperbarui.', 'success')
    } else {
      await axios.post(`${API}/users`, payload)
      showToast('User dibuat.', 'success')
    }
    showUserModal.value = false
    await fetchUsers()
  } catch (e) {
    formError.value = e.response?.data?.error || 'Gagal menyimpan user.'
  } finally { formLoading.value = false }
}
async function deleteUser(u) {
  if (!confirm(`Hapus user "${u.nama}" (${u.email})?`)) return
  try {
    await axios.delete(`${API}/users/${u.id}`)
    showToast('User dihapus.', 'success')
    await fetchUsers()
  } catch (e) { showToast(e.response?.data?.error || 'Gagal menghapus user.', 'error') }
}

// Reset Password
function openResetPassword(u) {
  resetPasswordUser.value = u
  newPassword.value = ''
  formError.value = ''
}
async function submitResetPassword() {
  formError.value = ''
  formLoading.value = true
  try {
    await axios.post(`${API}/users/${resetPasswordUser.value.id}/reset-password`, { new_password: newPassword.value })
    showToast('Password berhasil direset.', 'success')
    resetPasswordUser.value = null
  } catch (e) {
    formError.value = e.response?.data?.error || 'Gagal reset password.'
  } finally { formLoading.value = false }
}

// Helpers
function roleLabel(role) {
  return { SUPER_ADMIN: 'Super Admin', ADMIN_BIDANG: 'Admin Bidang', VIEWER: 'Viewer' }[role] || role
}
function roleBadgeClass(role) {
  return { SUPER_ADMIN: 'badge-super', ADMIN_BIDANG: 'badge-admin', VIEWER: 'badge-viewer' }[role] || ''
}
function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
function formatDateTime(d) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' })
  } catch {
    return d
  }
}
function showToast(message, type = 'success') {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id) }, 3000)
}

onMounted(() => {
  fetchBidangs()
  fetchUsers()
  fetchKeepAliveStatus()
})
</script>

<style scoped>
.admin-view {
  padding: 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}
.page-header {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}
.page-header h1 { font-size: 1.3rem; margin-bottom: 0.2rem; }

.admin-tabs {
  display: flex;
  gap: 0.4rem;
  border-bottom: 2px solid var(--color-border);
  padding-bottom: 0;
  flex-wrap: wrap;
}
.tab-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  font-family: var(--font-family);
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color var(--transition), border-color var(--transition);
}
.tab-btn:hover { color: var(--color-text-primary); }
.tab-btn--active { color: var(--color-primary-dark); border-bottom-color: var(--color-primary); }

.section {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  padding: 1.2rem;
}
.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
  flex-wrap: wrap;
}
.section-title-row h2 { font-size: 0.95rem; }

/* Keep-Alive Styles */
.keepalive-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;
}
@media (max-width: 768px) {
  .keepalive-grid {
    grid-template-columns: 1fr;
  }
}
.ka-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.2rem;
}
.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}
.stat-label {
  font-weight: 600;
  font-size: 0.95rem;
}
.stat-desc {
  font-size: 0.86rem;
  margin-bottom: 1rem;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid var(--color-border);
}
.stat-metrics {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.metric-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.84rem;
  background: var(--color-surface);
  padding: 0.5rem 0.8rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}
.metric-title {
  color: var(--color-text-secondary);
}
.metric-val {
  font-weight: 600;
}
.switch-row {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.switch-label {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.88rem;
}
.switch-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}
.workhours-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
  margin-top: 0.8rem;
  background: var(--color-surface);
  padding: 0.8rem;
  border-radius: var(--radius-sm);
  border: 1px dashed var(--color-border);
}

/* Demo Accounts Admin Grid */
.demo-admin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}
.demo-admin-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem;
  display: flex;
  flex-direction: column;
}
.demo-admin-card code {
  background: var(--color-surface);
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  font-size: 0.78rem;
}

.error-alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-danger-light);
  border: 1px solid #fca5a5;
  border-radius: var(--radius-md);
  padding: 0.55rem 0.8rem;
  color: var(--color-danger);
}
</style>
