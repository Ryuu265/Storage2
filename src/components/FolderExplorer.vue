<template>
  <div class="folder-explorer">
    <!-- Breadcrumb Navigasi -->
    <nav class="breadcrumb-nav" aria-label="Navigasi folder">
      <template v-for="(crumb, idx) in breadcrumbs" :key="crumb.id">
        <button
          class="breadcrumb-item"
          :class="{ 'breadcrumb-item--active': idx === breadcrumbs.length - 1 }"
          @click="navigateToCrumb(idx)"
          :disabled="idx === breadcrumbs.length - 1"
          :title="crumb.name"
        >
          <span class="breadcrumb-icon">{{ idx === 0 ? '🏠' : '📁' }}</span>
          <span class="breadcrumb-label">{{ crumb.name }}</span>
        </button>
        <span v-if="idx < breadcrumbs.length - 1" class="breadcrumb-separator">&rsaquo;</span>
      </template>
    </nav>

    <!-- Error State -->
    <div v-if="error" class="explorer-error">
      <div class="explorer-error-content">
        <strong>⚠️ Folder Belum Dapat Diakses</strong>
        <p class="explorer-error-msg">{{ error }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="loading" class="explorer-loading">
      <div class="explorer-spinner"></div>
      <p>Memuat isi folder dari Google Drive...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="items.length === 0 && !canWrite" class="explorer-empty">
      <span class="explorer-empty-icon">📂</span>
      <p>Folder ini kosong atau belum ada file di dalamnya.</p>
    </div>

    <!-- Isi Folder -->
    <div v-else class="explorer-content">
      <div v-if="isMock" class="mock-notice">
        🎭 Mode Demo &mdash; Data simulasi bawaan.
      </div>

      <!-- Info bar: jumlah item + akses editor -->
      <div class="explorer-info-bar">
        <span class="caption">{{ folderCount }} folder &middot; {{ fileCount }} file</span>
        <span v-if="accessLevel === 'editor'" class="badge-editor">✏️ Akses Editor</span>
        <span v-else-if="accessLevel === 'viewer'" class="badge-viewer">👁️ Akses Viewer</span>
        <span v-else-if="checkingAccess" class="caption">Mengecek akses...</span>
      </div>

      <!-- Toolbar: tambah subfolder & upload (hanya kalau editor + canWrite) -->
      <div v-if="canWrite && accessLevel === 'editor'" class="explorer-toolbar">
        <button class="btn btn-outline btn-sm" @click="openCreateFolderModal" :disabled="creating">
          📁 Subfolder Baru
        </button>
        <label class="btn btn-primary btn-sm upload-btn" :class="{ disabled: uploading }">
          <span v-if="uploading">⏳ Mengupload...</span>
          <span v-else>⬆️ Upload File</span>
          <input type="file" multiple @change="handleUploadFiles" style="display:none" :disabled="uploading" />
        </label>
      </div>
      <div v-else-if="canWrite && accessLevel === 'viewer'" class="access-hint">
        🔒 Untuk bisa tambah/upload, ubah akses folder ke <strong>Editor</strong> di Google Drive untuk email service account.
      </div>

      <!-- Upload progress -->
      <div v-if="uploadProgress.length > 0" class="upload-progress-list">
        <div v-for="p in uploadProgress" :key="p.name" class="upload-progress-item">
          <span class="up-name">📎 {{ p.name }}</span>
          <span class="up-status" :class="p.status">{{ p.label }}</span>
        </div>
      </div>

      <!-- Subfolder -->
      <div v-if="folders.length > 0" class="explorer-group">
        <div class="explorer-group-label">Folder</div>
        <div
          v-for="folder in folders"
          :key="folder.id"
          class="explorer-row explorer-row--folder"
          @click="enterFolder(folder)"
          role="button"
          tabindex="0"
          @keydown.enter="enterFolder(folder)"
          :title="'Buka folder: ' + folder.name"
        >
          <div class="explorer-icon">📁</div>
          <div class="explorer-info">
            <div class="explorer-name">{{ folder.name }}</div>
            <div class="caption">Folder &middot; {{ formatDate(folder.modifiedTime) }}</div>
          </div>
          <div class="explorer-chevron">&rsaquo;</div>
        </div>
      </div>

      <!-- File -->
      <div v-if="files.length > 0" class="explorer-group">
        <div class="explorer-group-label">File</div>
        <div
          v-for="file in files"
          :key="file.id"
          class="explorer-row explorer-row--file"
        >
          <div class="explorer-icon">{{ getFileIcon(file.mimeType) }}</div>
          <div class="explorer-info">
            <div class="explorer-name">{{ file.name }}</div>
            <div class="caption">{{ file.size || 'Dokumen' }} &middot; {{ formatDate(file.modifiedTime) }}</div>
          </div>
          <div class="explorer-file-actions">
            <a :href="file.webViewLink" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-xs" @click.stop>Lihat ↗</a>
            <a v-if="file.webContentLink && file.webContentLink !== '#'" :href="file.webContentLink" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-xs" @click.stop>Unduh ↓</a>
          </div>
        </div>
      </div>

      <!-- Empty dengan tombol tambah -->
      <div v-if="items.length === 0 && canWrite" class="explorer-empty">
        <span class="explorer-empty-icon">📂</span>
        <p>Folder ini kosong. Mulai tambahkan subfolder atau upload file!</p>
      </div>
    </div>

    <!-- MODAL: Buat Subfolder Baru -->
    <Teleport to="body">
      <div v-if="showCreateFolderModal" class="modal-overlay" @click.self="closeCreateFolderModal">
        <div class="modal-box modal-box--sm">
          <div class="modal-header">
            <h3>📁 Buat Subfolder Baru</h3>
            <button class="btn-icon" @click="closeCreateFolderModal">✕</button>
          </div>
          <form @submit.prevent="submitCreateFolder">
            <div class="form-group">
              <label>Nama Subfolder <span class="text-danger">*</span></label>
              <input
                v-model="newFolderName"
                type="text"
                placeholder="Contoh: Dokumen 2025"
                required
                autofocus
                class="form-input"
              />
            </div>
            <div v-if="createError" class="error-alert">{{ createError }}</div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline" @click="closeCreateFolderModal">Batal</button>
              <button type="submit" class="btn btn-primary" :disabled="creating">
                {{ creating ? 'Membuat...' : 'Buat Folder' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'

const props = defineProps({
  rootFolderId: { type: String, required: true },
  rootFolderName: { type: String, default: 'Folder' },
  serviceAccountEmail: { type: String, default: '' },
  canWrite: { type: Boolean, default: false }, // true jika user adalah admin bidang/super admin
})

const emit = defineEmits(['copy-sa-email', 'toast'])

const API = '/api'

// State navigasi
const loading = ref(false)
const error = ref('')
const isMock = ref(false)
const items = ref([])
const breadcrumbs = ref([])

// State akses
const accessLevel = ref('unknown') // 'editor' | 'viewer' | 'unknown'
const checkingAccess = ref(false)

// State create folder
const showCreateFolderModal = ref(false)
const newFolderName = ref('')
const createError = ref('')
const creating = ref(false)

// State upload
const uploading = ref(false)
const uploadProgress = ref([]) // [{ name, status, label }]

// Computed
const folders = computed(() => items.value.filter(i => i.isFolder))
const files = computed(() => items.value.filter(i => !i.isFolder))
const folderCount = computed(() => folders.value.length)
const fileCount = computed(() => files.value.length)
const currentFolderId = computed(() =>
  breadcrumbs.value.length > 0 ? breadcrumbs.value[breadcrumbs.value.length - 1].id : props.rootFolderId
)

// Navigasi masuk ke subfolder
async function enterFolder(folder) {
  breadcrumbs.value.push({ id: folder.id, name: folder.name })
  await loadFolder(folder.id)
  // Re-cek akses di subfolder kalau admin
  if (props.canWrite) checkAccess(folder.id)
}

// Navigasi breadcrumb
async function navigateToCrumb(idx) {
  if (idx === breadcrumbs.value.length - 1) return
  breadcrumbs.value = breadcrumbs.value.slice(0, idx + 1)
  await loadFolder(breadcrumbs.value[idx].id)
  if (props.canWrite) checkAccess(breadcrumbs.value[idx].id)
}

// Load isi folder
async function loadFolder(folderId) {
  loading.value = true
  error.value = ''
  items.value = []
  try {
    const res = await axios.get(API + '/drive/folders/' + folderId)
    items.value = res.data.files || []
    isMock.value = !!res.data.isMock
  } catch (err) {
    items.value = []
    error.value = err.response?.data?.error || 'Gagal membaca isi folder dari Google Drive.'
    isMock.value = false
  } finally {
    loading.value = false
  }
}

// Cek akses editor/viewer ke folder ini
async function checkAccess(folderId) {
  if (!props.canWrite) return
  checkingAccess.value = true
  accessLevel.value = 'unknown'
  try {
    const res = await axios.get(API + '/drive/folders/' + folderId + '/access')
    accessLevel.value = res.data.accessLevel || 'unknown'
  } catch (_) {
    accessLevel.value = 'unknown'
  } finally {
    checkingAccess.value = false
  }
}

// Modal create folder
function openCreateFolderModal() {
  newFolderName.value = ''
  createError.value = ''
  showCreateFolderModal.value = true
}
function closeCreateFolderModal() {
  showCreateFolderModal.value = false
}

async function submitCreateFolder() {
  if (!newFolderName.value.trim()) return
  creating.value = true
  createError.value = ''
  try {
    const res = await axios.post(API + '/drive/folders/' + currentFolderId.value + '/create-folder', {
      name: newFolderName.value.trim()
    })
    // Tambahkan ke daftar lokal tanpa reload penuh
    items.value.unshift({ ...res.data.folder, isFolder: true })
    closeCreateFolderModal()
    emit('toast', { message: 'Subfolder "' + res.data.folder.name + '" berhasil dibuat' + (res.data.isMock ? ' (Demo)' : '') + '.', type: 'success' })
  } catch (err) {
    createError.value = err.response?.data?.error || 'Gagal membuat subfolder.'
  } finally {
    creating.value = false
  }
}

// Handle upload banyak file sekaligus
async function handleUploadFiles(event) {
  const fileList = Array.from(event.target.files)
  if (!fileList.length) return
  event.target.value = '' // reset input

  uploading.value = true
  uploadProgress.value = fileList.map(f => ({ name: f.name, status: 'pending', label: 'Menunggu...' }))

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i]
    uploadProgress.value[i].status = 'uploading'
    uploadProgress.value[i].label = 'Mengupload...'

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await axios.post(
        API + '/drive/folders/' + currentFolderId.value + '/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      // Tambah file baru ke daftar
      items.value.push({ ...res.data.file, isFolder: false })
      uploadProgress.value[i].status = 'done'
      uploadProgress.value[i].label = '✓ Berhasil'
    } catch (err) {
      uploadProgress.value[i].status = 'error'
      uploadProgress.value[i].label = '✗ ' + (err.response?.data?.error?.split('\n')[0] || 'Gagal')
    }
  }

  uploading.value = false
  emit('toast', { message: 'Upload selesai: ' + fileList.length + ' file diproses.', type: 'success' })
  // Hapus progress setelah 4 detik
  setTimeout(() => { uploadProgress.value = [] }, 4000)
}

// Icon helper
function getFileIcon(mimeType) {
  if (!mimeType) return '📄'
  if (mimeType.includes('pdf')) return '📄'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊'
  if (mimeType.includes('wordprocessing') || mimeType.includes('word')) return '📝'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📑'
  if (mimeType.includes('image')) return '🖼️'
  if (mimeType.includes('video')) return '🎬'
  if (mimeType.includes('audio')) return '🎵'
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return '📦'
  return '📄'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Init
async function init() {
  breadcrumbs.value = [{ id: props.rootFolderId, name: props.rootFolderName }]
  await loadFolder(props.rootFolderId)
  if (props.canWrite) checkAccess(props.rootFolderId)
}

onMounted(init)
watch(() => props.rootFolderId, init)
</script>

<style scoped>
.folder-explorer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 200px;
}

/* ── Breadcrumb ── */
.breadcrumb-nav {
  display: flex; align-items: center; flex-wrap: wrap;
  gap: 0.1rem; padding: 0.35rem 0;
  border-bottom: 1px solid var(--color-border);
}
.breadcrumb-item {
  display: inline-flex; align-items: center; gap: 0.2rem;
  background: none; border: none; cursor: pointer;
  padding: 0.18rem 0.4rem; border-radius: var(--radius-sm);
  font-size: 0.82rem; color: var(--color-primary-dark);
  font-weight: 500; transition: background 0.13s; max-width: 180px;
}
.breadcrumb-item:hover:not(:disabled) { background: var(--color-primary-light); }
.breadcrumb-item:disabled,
.breadcrumb-item--active { color: var(--color-text-primary); font-weight: 600; cursor: default; pointer-events: none; }
.breadcrumb-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 130px; }
.breadcrumb-icon { font-size: 0.9rem; flex-shrink: 0; }
.breadcrumb-separator { color: var(--color-text-caption); font-size: 1rem; padding: 0 0.15rem; }

/* ── States ── */
.explorer-loading {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 0.6rem; padding: 2rem 1rem;
  color: var(--color-text-caption); font-size: 0.85rem;
}
.explorer-spinner {
  width: 24px; height: 24px;
  border: 2.5px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.explorer-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 0.4rem; padding: 2rem 1rem;
  color: var(--color-text-caption); font-size: 0.85rem;
}
.explorer-empty-icon { font-size: 2rem; }
.explorer-error {
  background: #FFF1F2; border: 1px solid #FECDD3;
  border-radius: var(--radius-sm); padding: 0.85rem;
}
.explorer-error-content strong { color: var(--color-danger); font-size: 0.88rem; }
.explorer-error-msg { font-size: 0.8rem; color: var(--color-text-secondary); white-space: pre-line; margin-top: 4px; }

/* ── Info bar ── */
.explorer-info-bar {
  display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
}
.badge-editor {
  font-size: 0.7rem; font-weight: 600; padding: 1px 7px;
  border-radius: var(--radius-pill);
  background: #D1FAE5; color: #065F46; border: 1px solid #A7F3D0;
}
.badge-viewer {
  font-size: 0.7rem; font-weight: 600; padding: 1px 7px;
  border-radius: var(--radius-pill);
  background: #F1F5F9; color: #475569; border: 1px solid #CBD5E1;
}

/* ── Toolbar (Tambah Subfolder / Upload) ── */
.explorer-toolbar {
  display: flex; gap: 0.5rem; flex-wrap: wrap;
  padding: 0.5rem 0.4rem;
  background: #F8FAFC; border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}
.access-hint {
  padding: 0.4rem 0.75rem;
  background: #FFFBEB; border: 1px solid #FDE68A;
  border-radius: var(--radius-sm);
  font-size: 0.78rem; color: #92400E;
}

/* ── Upload progress ── */
.upload-progress-list {
  display: flex; flex-direction: column; gap: 3px;
  background: #F8FAFC; border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); padding: 0.5rem 0.75rem;
}
.upload-progress-item {
  display: flex; align-items: center; justify-content: space-between;
  gap: 0.5rem; font-size: 0.78rem;
}
.up-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--color-text-secondary); }
.up-status { font-weight: 600; font-size: 0.72rem; white-space: nowrap; }
.up-status.pending { color: var(--color-text-caption); }
.up-status.uploading { color: var(--color-primary-dark); }
.up-status.done { color: #065F46; }
.up-status.error { color: var(--color-danger); }

/* ── Mock notice ── */
.mock-notice {
  background: #FFFBEB; border: 1px solid #FDE68A;
  border-radius: var(--radius-sm); padding: 0.4rem 0.75rem;
  font-size: 0.78rem; color: #92400E;
}

/* ── Group items ── */
.explorer-group { display: flex; flex-direction: column; }
.explorer-group-label {
  font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.04em; color: var(--color-text-caption);
  padding: 0.3rem 0.4rem; border-bottom: 1px solid var(--color-border);
}
.explorer-row {
  display: flex; align-items: center; gap: 0.65rem;
  padding: 0.55rem 0.4rem; border-radius: var(--radius-sm);
  border-bottom: 1px solid #F1F5F9; transition: background 0.12s;
}
.explorer-row:last-child { border-bottom: none; }
.explorer-row--folder { cursor: pointer; }
.explorer-row--folder:hover { background: var(--color-primary-light); }
.explorer-icon { font-size: 1.2rem; flex-shrink: 0; width: 1.6rem; text-align: center; }
.explorer-info { flex: 1; min-width: 0; }
.explorer-name {
  font-size: 0.85rem; font-weight: 500; color: var(--color-text-primary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.explorer-chevron { font-size: 1.3rem; color: var(--color-text-caption); flex-shrink: 0; line-height: 1; }
.explorer-file-actions { display: flex; gap: 4px; flex-shrink: 0; }

/* ── Buttons ── */
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 0.82rem; font-weight: 500; border-radius: var(--radius-pill);
  cursor: pointer; padding: 0.35rem 0.9rem; border: 1px solid transparent;
  transition: background 0.15s; text-decoration: none; white-space: nowrap;
  gap: 0.25rem;
}
.btn-outline { border-color: var(--color-border); background: transparent; color: var(--color-text-primary); }
.btn-outline:hover:not(:disabled) { background: var(--color-primary-light); border-color: var(--color-primary); color: var(--color-primary-dark); }
.btn-primary { background: var(--color-primary); color: white; border-color: var(--color-primary); }
.btn-primary:hover:not(:disabled) { background: var(--color-primary-dark); }
.btn:disabled, .btn.disabled { opacity: 0.55; cursor: not-allowed; pointer-events: none; }
.btn-sm { font-size: 0.78rem !important; padding: 0.28rem 0.75rem !important; }
.btn-xs { font-size: 0.72rem !important; padding: 0.2rem 0.55rem !important; }

.upload-btn { cursor: pointer; }

/* ── Modal ── */
.modal-box--sm { max-width: 380px; }
.form-group { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 0.85rem; }
.form-group label { font-size: 0.82rem; font-weight: 600; color: var(--color-text-secondary); }
.form-input {
  padding: 0.5rem 0.75rem; border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); font-size: 0.88rem; outline: none;
  background: var(--color-surface); color: var(--color-text-primary);
}
.form-input:focus { border-color: var(--color-primary); }
.text-danger { color: var(--color-danger); }
.error-alert {
  background: #FFF1F2; border: 1px solid #FECDD3;
  border-radius: var(--radius-sm); padding: 0.5rem 0.75rem;
  font-size: 0.82rem; color: var(--color-danger); margin-bottom: 0.75rem;
}

/* ── SA email line ── */
.sa-email-line {
  display: flex; align-items: center; gap: 6px;
  background: #FFFFFF; border: 1px solid #CBD5E1;
  border-radius: 4px; padding: 3px 6px;
}
.sa-email-line code { font-family: monospace; font-size: 0.72rem; color: #0F172A; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.btn-copy { background: var(--color-primary-light); color: var(--color-primary-dark); border: 1px solid var(--color-primary); border-radius: 3px; font-size: 0.68rem; font-weight: 600; padding: 1px 6px; cursor: pointer; }

.caption { font-size: 0.75rem; color: var(--color-text-caption); }
</style>
