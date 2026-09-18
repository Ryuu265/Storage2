<template>
  <div class="bidang-view">
    <!-- Header Konten: Judul & Nama Bidang yang Sedang Dilihat (Persis Sesuai Sketsa) -->
    <header class="page-header">
      <h1 class="page-title">Pusat Data Dokumen Perencanaan</h1>
      <div class="page-bidang-subtitle">
        Bidang: <strong>{{ currentBidang?.nama_bidang || 'Memuat...' }}</strong>
        <span class="user-role-text">({{ roleDisplayLabel }})</span>
      </div>
    </header>

    <!-- Section 1: Tahapan Proses Perencanaan (Alur Sederhana dengan Drag & Drop) -->
    <section class="section section-tahapan">
      <div class="section-header">
        <h2 class="section-title">Tahapan Proses Perencanaan</h2>

        <!-- Tombol + Tahapan (Hanya Admin Bidang & Super Admin) -->
        <div v-if="canEdit" class="section-header-actions">
          <button class="btn btn-primary btn-sm" @click="openAddTahapanModal">
            + Tahapan
          </button>
        </div>
      </div>

      <!-- Loading State Tahapan -->
      <div v-if="loadingTahapan" class="empty-state">
        <p>Memuat tahapan proses...</p>
      </div>

      <!-- Empty State Tahapan -->
      <div v-else-if="tahapanList.length === 0" class="empty-state">
        <p>Belum ada tahapan proses perencanaan.</p>
        <button v-if="canEdit" class="btn btn-primary btn-sm" @click="openAddTahapanModal">
          + Tambah Tahapan Baru
        </button>
      </div>

      <!-- Diagram Alur Horizontal (Drag & Drop + Tombol Panah ◀ ▶) -->
      <div v-else class="flow-wrapper">
        <div ref="flowContainerRef" class="flow-diagram">
          <div
            v-for="(step, idx) in tahapanList"
            :key="step.id"
            :data-id="step.id"
            class="flow-item"
          >
            <!-- Kotak Tahapan -->
            <div class="flow-box" :class="{ 'flow-box--editable': canEdit }">
              <!-- Bar Aksi Edit & Hapus (Admin Only) -->
              <div v-if="canEdit" class="flow-box-actions">
                <div class="flow-arrows-inline">
                  <button
                    v-if="idx > 0"
                    class="btn-flow-nav"
                    @click.stop="moveTahapan(idx, -1)"
                    title="Geser ke kiri"
                  >◀</button>
                  <button
                    v-if="idx < tahapanList.length - 1"
                    class="btn-flow-nav"
                    @click.stop="moveTahapan(idx, 1)"
                    title="Geser ke kanan"
                  >▶</button>
                </div>

                <div class="flow-crud-btns">
                  <button
                    class="btn-flow-tool"
                    @click.stop="openEditTahapanModal(step)"
                    title="Edit tahapan"
                  >
                    ✏️
                  </button>
                  <button
                    class="btn-flow-tool danger"
                    @click.stop="confirmDeleteTahapan(step)"
                    title="Hapus tahapan"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <!-- Konten Kotak -->
              <div class="flow-box-icon">{{ step.icon || '📋' }}</div>
              <div class="flow-box-label">{{ step.label }}</div>
              <div v-if="step.deskripsi" class="flow-box-desc">{{ step.deskripsi }}</div>
              <div class="flow-box-step">Tahap {{ idx + 1 }}</div>
            </div>

            <!-- Panah ke Kanan -->
            <div class="flow-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section 2: Tampilan File / Folder (Search Bar + Filter Kategori Tahapan) -->
    <section class="section section-folders">
      <div class="section-header">
        <h2 class="section-title">Tampilan File / Folder</h2>

        <!-- Filter Pencarian Kata Kunci & Filter Kategori Tahapan Berdampingan -->
        <div class="search-filter-row">
          <!-- Filter Kategori Tahapan (Dropdown) -->
          <div class="filter-select-wrap">
            <select v-model="selectedTahapanFilter" class="filter-select">
              <option value="all">Semua Kategori Tahapan</option>
              <option value="umum">Kategori: Umum</option>
              <option v-for="t in tahapanList" :key="t.id" :value="t.id">
                Kategori: {{ t.label }}
              </option>
            </select>
          </div>

          <!-- Search Bar Sederhana -->
          <div class="search-input-wrap">
            <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Cari dokumen atau folder..."
              class="search-input"
            />
          </div>
        </div>
      </div>

      <!-- Loading State Folders -->
      <div v-if="loadingLinks" class="empty-state">
        <p>Memuat daftar folder...</p>
      </div>

      <!-- Empty State Folders -->
      <div v-else-if="filteredLinks.length === 0" class="empty-state">
        <p>{{ searchQuery || selectedTahapanFilter !== 'all' ? 'Tidak ada folder yang sesuai dengan filter pencarian.' : 'Belum ada folder dokumen yang ditambahkan untuk bidang ini.' }}</p>
      </div>

      <!-- Grid Folder Card -->
      <div v-else class="folder-grid">
        <FolderCard
          v-for="link in filteredLinks"
          :key="link.id"
          :link="link"
          :can-edit="authStore.canEditBidang(link.bidang_id)"
          @click-folder="openFolderFiles(link)"
          @edit="openEditModal(link)"
          @delete="confirmDelete(link)"
        />
      </div>

      <!-- Tombol "+ Tambah" di Bagian Bawah (Sesuai Posisi di Sketsa, Admin Only) -->
      <div v-if="canAdd" class="bottom-action-area">
        <button class="btn btn-primary btn-lg" @click="openAddModal">
          + Tambah Folder
        </button>
      </div>
    </section>

    <!-- MODAL: Tambah / Edit Folder Google Drive -->
    <Teleport to="body">
      <div v-if="showFolderModal" class="modal-overlay" @click.self="closeFolderModal">
        <div class="modal-box">
          <div class="modal-header">
            <h3>{{ editingLink ? 'Edit Folder Dokumen' : 'Tambah Folder Dokumen' }}</h3>
            <button class="btn-icon" @click="closeFolderModal">✕</button>
          </div>
          <form @submit.prevent="submitFolderForm">
            <div class="form-group">
              <label>Nama Tampilan Folder <span class="text-danger">*</span></label>
              <input v-model="folderForm.nama_folder" placeholder="contoh: RPJMD 2025-2029" required />
            </div>

            <div class="form-group">
              <label>Link Folder Google Drive <span class="text-danger">*</span></label>
              <input v-model="folderForm.drive_folder_url" placeholder="https://drive.google.com/drive/folders/..." required />
            </div>

            <!-- Dropdown Pilihan Kategori Tahapan Penggolongan -->
            <div class="form-group">
              <label>Kategori Tahapan</label>
              <select v-model="folderForm.tahapan_id" class="form-select">
                <option value="">Umum</option>
                <option v-for="t in tahapanList" :key="t.id" :value="t.id">
                  {{ t.label }} {{ t.deskripsi ? `— ${t.deskripsi}` : '' }}
                </option>
              </select>
            </div>

            <div v-if="formError" class="error-alert">
              {{ formError }}
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" @click="closeFolderModal">Batal</button>
              <button type="submit" class="btn btn-primary" :disabled="formLoading">
                {{ editingLink ? 'Simpan Perubahan' : 'Tambah Folder' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- MODAL: Tambah / Edit Tahapan Perencanaan -->
    <Teleport to="body">
      <div v-if="showTahapanModal" class="modal-overlay" @click.self="closeTahapanModal">
        <div class="modal-box">
          <div class="modal-header">
            <h3>{{ editingTahapan ? 'Edit Tahapan' : 'Tambah Tahapan Perencanaan' }}</h3>
            <button class="btn-icon" @click="closeTahapanModal">✕</button>
          </div>
          <form @submit.prevent="submitTahapanForm">
            <div class="form-group">
              <label>Nama Tahapan <span class="text-danger">*</span></label>
              <input v-model="tahapanForm.label" placeholder="contoh: RPJMD, RKPD, dll." required />
            </div>

            <div class="form-group">
              <label>Keterangan Singkat</label>
              <input v-model="tahapanForm.deskripsi" placeholder="contoh: Rencana Kerja Pemerintah Daerah" />
            </div>

            <div class="form-group">
              <label>Ikon Kotak</label>
              <div class="icon-picker">
                <button
                  type="button"
                  v-for="ic in iconPresets"
                  :key="ic"
                  class="btn-icon-choice"
                  :class="{ 'active': tahapanForm.icon === ic }"
                  @click="tahapanForm.icon = ic"
                >
                  {{ ic }}
                </button>
              </div>
            </div>

            <div v-if="tahapanFormError" class="error-alert">
              {{ tahapanFormError }}
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" @click="closeTahapanModal">Batal</button>
              <button type="submit" class="btn btn-primary" :disabled="tahapanFormLoading">
                {{ editingTahapan ? 'Simpan' : 'Tambah Tahapan' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- MODAL: Hapus Tahapan -->
    <Teleport to="body">
      <div v-if="deletingTahapan" class="modal-overlay" @click.self="deletingTahapan = null">
        <div class="modal-box">
          <div class="modal-header">
            <h3>Konfirmasi Hapus Tahapan</h3>
            <button class="btn-icon" @click="deletingTahapan = null">✕</button>
          </div>
          <p class="modal-desc">
            Hapus tahapan <strong>"{{ deletingTahapan.label }}"</strong> dari alur proses?
          </p>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="deletingTahapan = null">Batal</button>
            <button class="btn btn-danger" @click="executeDeleteTahapan" :disabled="tahapanFormLoading">
              Hapus
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- MODAL: Hapus Folder -->
    <Teleport to="body">
      <div v-if="deletingLink" class="modal-overlay" @click.self="deletingLink = null">
        <div class="modal-box">
          <div class="modal-header">
            <h3>Konfirmasi Hapus Folder</h3>
            <button class="btn-icon" @click="deletingLink = null">✕</button>
          </div>
          <p class="modal-desc">
            Hapus folder <strong>"{{ deletingLink.nama_folder }}"</strong> dari sistem?
          </p>
          <p class="caption">File asli di Google Drive tidak akan terhapus.</p>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="deletingLink = null">Batal</button>
            <button class="btn btn-danger" @click="executeDelete" :disabled="formLoading">
              Hapus Folder
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- MODAL: Jelajahi Isi File Folder (In-App Navigator dengan Breadcrumb) -->
    <Teleport to="body">
      <div v-if="selectedFolder" class="modal-overlay" @click.self="selectedFolder = null">
        <div class="modal-box modal-box--large">
          <div class="modal-header">
            <div>
              <h3>{{ selectedFolder.nama_folder }}</h3>
              <div class="caption">Bidang: {{ selectedFolder.nama_bidang }} &middot; Kategori: {{ selectedFolder.nama_tahapan || 'Umum' }}</div>
            </div>
            <div class="modal-header-btns">
              <a :href="selectedFolder.drive_folder_url" target="_blank" class="btn btn-outline btn-sm">
                Buka di Drive ↗
              </a>
              <button class="btn-icon" @click="selectedFolder = null">✕</button>
            </div>
          </div>

          <!-- In-App Folder Explorer dengan Breadcrumb -->
          <FolderExplorer
            :root-folder-id="explorerRootId"
            :root-folder-name="explorerRootName"
            :service-account-email="serviceAccountEmail"
            @copy-sa-email="copyServiceAccountEmail"
          />
        </div>
      </div>
    </Teleport>

    <!-- Toast Notification -->
    <div class="toast-container">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="t.type">
        {{ t.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import Sortable from 'sortablejs'
import { useAuthStore } from '../stores/auth'
import FolderCard from '../components/FolderCard.vue'
import FolderExplorer from '../components/FolderExplorer.vue'

const props = defineProps({ slug: String })
const route = useRoute()
const authStore = useAuthStore()
const API = '/api'

const serviceAccountEmail = 'drivereader@quiet-engine-507202-a5.iam.gserviceaccount.com'
const copiedSa = ref(false)
const iconPresets = ['📋', '📅', '📄', '💰', '✅', '🔍', '📊', '📑', '💡', '🎯', '📌', '🚀']

// State Bidang & Drive Links
const bidangs = ref([])
const driveLinks = ref([])
const loadingLinks = ref(true)
const searchQuery = ref('')
const selectedTahapanFilter = ref('all')
const toasts = ref([])

// State Tahapan
const tahapanList = ref([])
const loadingTahapan = ref(true)
const flowContainerRef = ref(null)
let sortableInstance = null

// Modals Folder
const showFolderModal = ref(false)
const editingLink = ref(null)
const deletingLink = ref(null)
const selectedFolder = ref(null)
// Explorer state (navigasi in-app)
const explorerRootId = ref('')
const explorerRootName = ref('')
const formLoading = ref(false)
const formError = ref('')
const folderForm = ref({ nama_folder: '', drive_folder_url: '', tahapan_id: '' })

// Modals Tahapan
const showTahapanModal = ref(false)
const editingTahapan = ref(null)
const deletingTahapan = ref(null)
const tahapanFormLoading = ref(false)
const tahapanFormError = ref('')
const tahapanForm = ref({ label: '', deskripsi: '', icon: '📋' })

// Computed: Bidang Aktif
const currentBidang = computed(() => {
  const slug = props.slug || route.params.bidang || 'perencanaan'
  if (slug === 'perencanaan') return bidangs.value.find(b => b.nama_bidang?.toLowerCase().includes('perencanaan'))
  if (slug === 'palev') return bidangs.value.find(b => b.nama_bidang?.toLowerCase().includes('palev') || b.nama_bidang?.toLowerCase().includes('pengendalian'))
  return bidangs.value.find(b => b.id === slug) || bidangs.value[0]
})

// Hak akses mengedit bidang ini (Super Admin OR Admin Bidang pemilik)
const canEdit = computed(() => {
  if (!authStore.user) return false
  if (authStore.isSuperAdmin) return true
  if (authStore.isAdminBidang && currentBidang.value?.id) {
    return authStore.user.bidang_id === currentBidang.value.id
  }
  return false
})
const canAdd = computed(() => canEdit.value)

const roleDisplayLabel = computed(() => {
  if (authStore.isSuperAdmin) return 'Super Admin'
  if (authStore.isAdminBidang) {
    return canEdit.value ? 'Admin Bidang Ini' : 'Admin Bidang Lain'
  }
  return 'Viewer (Akses Baca)'
})

// Filter Dokumen: Gabungan Kata Kunci (searchQuery) DAN Kategori Tahapan (selectedTahapanFilter)
const filteredLinks = computed(() => {
  let links = driveLinks.value.filter(l => l.bidang_id === currentBidang.value?.id)

  // Filter Kategori Tahapan
  if (selectedTahapanFilter.value === 'umum') {
    links = links.filter(l => !l.tahapan_id)
  } else if (selectedTahapanFilter.value && selectedTahapanFilter.value !== 'all') {
    links = links.filter(l => l.tahapan_id === selectedTahapanFilter.value)
  }

  // Filter Kata Kunci
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    links = links.filter(l =>
      l.nama_folder.toLowerCase().includes(q) ||
      l.nama_bidang?.toLowerCase().includes(q) ||
      (l.nama_tahapan && l.nama_tahapan.toLowerCase().includes(q))
    )
  }

  return links
})

// Fetch API
async function fetchBidangs() {
  try {
    const res = await axios.get(`${API}/bidang`)
    bidangs.value = res.data.bidangs || []
  } catch (e) {
    showToast('Gagal memuat daftar bidang.', 'error')
  }
}

async function fetchDriveLinks() {
  loadingLinks.value = true
  try {
    const res = await axios.get(`${API}/drive-links`)
    driveLinks.value = res.data.links || []
  } catch (e) {
    showToast('Gagal memuat folder dokumen.', 'error')
  } finally {
    loadingLinks.value = false
  }
}

async function fetchTahapan() {
  if (!currentBidang.value?.id) return
  loadingTahapan.value = true
  try {
    const res = await axios.get(`${API}/tahapan`, {
      params: { bidang_id: currentBidang.value.id }
    })
    tahapanList.value = res.data.tahapan || []
  } catch (err) {
    showToast('Gagal memuat tahapan proses.', 'error')
  } finally {
    loadingTahapan.value = false
    await nextTick()
    setupSortable()
  }
}

// Inisialisasi Drag & Drop dengan SortableJS
function setupSortable() {
  if (sortableInstance) {
    sortableInstance.destroy()
    sortableInstance = null
  }

  if (!flowContainerRef.value || !canEdit.value) return

  sortableInstance = new Sortable(flowContainerRef.value, {
    animation: 250,
    draggable: '.flow-item',
    filter: 'button, a, input, select',
    preventOnFilter: false,
    ghostClass: 'sortable-ghost',
    forceFallback: true,
    fallbackTolerance: 3,
    onEnd: async (evt) => {
      if (evt.oldIndex === evt.newIndex) return

      const movedItem = tahapanList.value.splice(evt.oldIndex, 1)[0]
      tahapanList.value.splice(evt.newIndex, 0, movedItem)

      await saveReorder()
    }
  })
}

async function saveReorder() {
  const itemsToSave = tahapanList.value.map((t, index) => ({
    id: t.id,
    urutan: index
  }))

  try {
    await axios.put(`${API}/tahapan/reorder`, {
      bidang_id: currentBidang.value.id,
      items: itemsToSave
    })
    showToast('Urutan tahapan berhasil disimpan.', 'success')
  } catch (err) {
    showToast('Gagal menyimpan urutan tahapan.', 'error')
    await fetchTahapan()
  }
}

// Tombol Geser Cepat
async function moveTahapan(idx, direction) {
  const newIdx = idx + direction
  if (newIdx < 0 || newIdx >= tahapanList.value.length) return

  const item = tahapanList.value.splice(idx, 1)[0]
  tahapanList.value.splice(newIdx, 0, item)

  await saveReorder()
}

// Modal Tahapan
function openAddTahapanModal() {
  editingTahapan.value = null
  tahapanForm.value = { label: '', deskripsi: '', icon: '📋' }
  tahapanFormError.value = ''
  showTahapanModal.value = true
}

function openEditTahapanModal(step) {
  editingTahapan.value = step
  tahapanForm.value = {
    label: step.label,
    deskripsi: step.deskripsi || '',
    icon: step.icon || '📋'
  }
  tahapanFormError.value = ''
  showTahapanModal.value = true
}

function closeTahapanModal() {
  showTahapanModal.value = false
  editingTahapan.value = null
  tahapanFormError.value = ''
}

async function submitTahapanForm() {
  tahapanFormError.value = ''
  tahapanFormLoading.value = true

  try {
    if (editingTahapan.value) {
      await axios.put(`${API}/tahapan/${editingTahapan.value.id}`, tahapanForm.value)
      showToast('Tahapan berhasil diperbarui.', 'success')
    } else {
      await axios.post(`${API}/tahapan`, {
        ...tahapanForm.value,
        bidang_id: currentBidang.value?.id
      })
      showToast('Tahapan berhasil ditambahkan.', 'success')
    }
    closeTahapanModal()
    await fetchTahapan()
  } catch (err) {
    tahapanFormError.value = err.response?.data?.error || 'Gagal menyimpan tahapan.'
  } finally {
    tahapanFormLoading.value = false
  }
}

function confirmDeleteTahapan(step) {
  deletingTahapan.value = step
}

async function executeDeleteTahapan() {
  if (!deletingTahapan.value) return
  tahapanFormLoading.value = true

  try {
    await axios.delete(`${API}/tahapan/${deletingTahapan.value.id}`)
    showToast('Tahapan berhasil dihapus.', 'success')
    deletingTahapan.value = null
    await fetchTahapan()
  } catch (err) {
    showToast(err.response?.data?.error || 'Gagal menghapus tahapan.', 'error')
  } finally {
    tahapanFormLoading.value = false
  }
}

// Folder Modals
function openAddModal() {
  editingLink.value = null
  folderForm.value = { nama_folder: '', drive_folder_url: '', tahapan_id: '' }
  formError.value = ''
  showFolderModal.value = true
}

function openEditModal(link) {
  editingLink.value = link
  folderForm.value = {
    nama_folder: link.nama_folder,
    drive_folder_url: link.drive_folder_url,
    tahapan_id: link.tahapan_id || ''
  }
  formError.value = ''
  showFolderModal.value = true
}

function closeFolderModal() {
  showFolderModal.value = false
  editingLink.value = null
  formError.value = ''
}

async function submitFolderForm() {
  formError.value = ''
  formLoading.value = true

  const url = folderForm.value.drive_folder_url
  if (url && !url.includes('drive.google.com')) {
    formError.value = 'URL harus berupa tautan Google Drive.'
    formLoading.value = false
    return
  }

  try {
    if (editingLink.value) {
      await axios.put(`${API}/drive-links/${editingLink.value.id}`, folderForm.value)
      showToast('Folder berhasil diperbarui.', 'success')
    } else {
      await axios.post(`${API}/drive-links`, {
        ...folderForm.value,
        bidang_id: currentBidang.value?.id,
      })
      showToast('Folder berhasil ditambahkan.', 'success')
    }
    closeFolderModal()
    await fetchDriveLinks()
  } catch (err) {
    formError.value = err.response?.data?.error || 'Gagal menyimpan folder.'
  } finally {
    formLoading.value = false
  }
}

function confirmDelete(link) {
  deletingLink.value = link
}

async function executeDelete() {
  formLoading.value = true
  try {
    await axios.delete(`${API}/drive-links/${deletingLink.value.id}`)
    showToast('Folder berhasil dihapus.', 'success')
    deletingLink.value = null
    await fetchDriveLinks()
  } catch (err) {
    showToast(err.response?.data?.error || 'Gagal menghapus folder.', 'error')
  } finally {
    formLoading.value = false
  }
}

// File Explorer Modal (in-app navigation, breadcrumb)
function openFolderFiles(link) {
  selectedFolder.value = link
  explorerRootId.value = link.drive_folder_id
  explorerRootName.value = link.nama_folder
}

async function copyServiceAccountEmail() {
  try {
    await navigator.clipboard.writeText(serviceAccountEmail)
    copiedSa.value = true
    showToast('Email Service Account disalin.', 'success')
    setTimeout(() => { copiedSa.value = false }, 2500)
  } catch {
    showToast('Gagal menyalin email.', 'error')
  }
}

function getFileIconEmoji(mimeType) {
  if (mimeType?.includes('pdf')) return '📄'
  if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) return '📊'
  if (mimeType?.includes('wordprocessing') || mimeType?.includes('word')) return '📝'
  if (mimeType?.includes('presentation') || mimeType?.includes('powerpoint')) return '📑'
  return '📁'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function showToast(message, type = 'success') {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 3200)
}

// Lifecycle
onMounted(async () => {
  await fetchBidangs()
  await Promise.all([fetchDriveLinks(), fetchTahapan()])
})

onBeforeUnmount(() => {
  if (sortableInstance) {
    sortableInstance.destroy()
    sortableInstance = null
  }
})

watch(
  [flowContainerRef, loadingTahapan, canEdit],
  async ([el, loading, can]) => {
    if (el && !loading && can) {
      await nextTick()
      setupSortable()
    }
  },
  { flush: 'post' }
)

watch(() => [props.slug, route.params.bidang], async () => {
  selectedTahapanFilter.value = 'all'
  await Promise.all([fetchDriveLinks(), fetchTahapan()])
})
</script>

<style scoped>
/* =====================================================
   LAYOUT SESUAI WIREFRAME SEDERHANA
   ===================================================== */
.bidang-view {
  padding: 1.5rem 2rem;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Header: Judul & Nama Bidang */
.page-header {
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.8rem;
}
.page-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.2;
}
.page-bidang-subtitle {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin-top: 0.3rem;
}
.user-role-text {
  font-size: 0.8rem;
  color: var(--color-text-caption);
  margin-left: 0.3rem;
}

/* Section Utama */
.section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.2rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.section-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

/* =====================================================
   SECTION 1: TAHAPAN PROSES PERENCANAAN
   ===================================================== */
.flow-wrapper {
  overflow-x: auto;
  padding: 0.4rem 0.2rem 0.8rem;
}
.flow-diagram {
  display: flex;
  align-items: center;
  gap: 0;
  min-width: min-content;
}
.flow-item {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.flow-box {
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.75rem 0.85rem;
  width: 160px;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  user-select: none;
  -webkit-user-select: none;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  transition: all var(--transition);
}
.flow-box--editable {
  cursor: grab;
}
.flow-box--editable:active {
  cursor: grabbing;
}
.flow-box:hover {
  border-color: var(--color-primary);
}

.sortable-ghost {
  opacity: 0.3 !important;
  border: 2px dashed var(--color-primary) !important;
  background: var(--color-primary-light) !important;
}

/* Aksi dalam kotak */
.flow-box-actions {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.3rem;
}
.flow-arrows-inline {
  display: flex;
  gap: 2px;
}
.btn-flow-nav {
  background: #F1F5F9;
  border: 1px solid #CBD5E1;
  border-radius: 3px;
  font-size: 0.65rem;
  padding: 1px 4px;
  cursor: pointer;
  color: var(--color-text-secondary);
}
.btn-flow-nav:hover {
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
}
.flow-crud-btns {
  display: flex;
  gap: 3px;
}
.btn-flow-tool {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  padding: 1px 2px;
  opacity: 0.7;
}
.btn-flow-tool:hover {
  opacity: 1;
}

.flow-box-icon {
  font-size: 1.5rem;
  margin: 0.2rem 0;
}
.flow-box-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.25;
}
.flow-box-desc {
  font-size: 0.68rem;
  color: var(--color-text-secondary);
  margin-top: 3px;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.flow-box-step {
  margin-top: auto;
  font-size: 0.65rem;
  color: var(--color-primary-dark);
  font-weight: 600;
  background: var(--color-primary-light);
  padding: 2px 6px;
  border-radius: var(--radius-pill);
}

.flow-arrow {
  padding: 0 0.45rem;
  display: flex;
  align-items: center;
}
.flow-item:last-child .flow-arrow {
  display: none !important;
}

/* =====================================================
   SECTION 2: SEARCH BAR & FILTER TAHAPAN
   ===================================================== */
.search-filter-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.filter-select {
  padding: 0.45rem 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  font-size: 0.85rem;
  background: var(--color-surface);
  color: var(--color-text-primary);
  outline: none;
  cursor: pointer;
}
.filter-select:focus {
  border-color: var(--color-primary);
}
.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.search-input-wrap .search-icon {
  position: absolute;
  left: 0.75rem;
  color: var(--color-text-caption);
  pointer-events: none;
}
.search-input {
  padding: 0.45rem 0.85rem 0.45rem 2.2rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  font-size: 0.85rem;
  width: 240px;
  background: var(--color-surface);
  color: var(--color-text-primary);
  outline: none;
}
.search-input:focus {
  border-color: var(--color-primary);
}

/* Grid Folder */
.folder-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 1rem;
}

/* Tombol + Tambah di Bagian Bawah (Sesuai Sketsa) */
.bottom-action-area {
  margin-top: 1.4rem;
  padding-top: 1.2rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: center;
}

/* =====================================================
   MODAL & FORMS
   ===================================================== */
.modal-box--large {
  max-width: 600px;
}
.modal-header-btns {
  display: flex;
  align-items: center;
  gap: 6px;
}
.modal-desc {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.8rem;
}
.text-danger {
  color: var(--color-danger);
}
.form-select {
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  font-size: 0.88rem;
  outline: none;
}
.form-select:focus {
  border-color: var(--color-primary);
}

/* Service Account Info */
.sa-info-box {
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  border-radius: var(--radius-sm);
  padding: 0.6rem 0.75rem;
  margin-bottom: 0.8rem;
}
.sa-info-header {
  font-size: 0.78rem;
  font-weight: 700;
  color: #166534;
}
.sa-email-line {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #FFFFFF;
  border: 1px solid #CBD5E1;
  border-radius: 4px;
  padding: 3px 6px;
  margin-top: 4px;
}
.sa-email-line code {
  font-family: monospace;
  font-size: 0.72rem;
  color: #0F172A;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.btn-copy {
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  border: 1px solid var(--color-primary);
  border-radius: 3px;
  font-size: 0.68rem;
  font-weight: 600;
  padding: 1px 6px;
  cursor: pointer;
}

/* Drive Error */
.drive-error-container {
  background: #FFF1F2;
  border: 1px solid #FECDD3;
  border-radius: var(--radius-sm);
  padding: 0.85rem;
}
.drive-error-content strong {
  color: var(--color-danger);
  font-size: 0.88rem;
}
.drive-error-msg {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  white-space: pre-line;
  margin-top: 4px;
}

/* File list */
.file-list {
  display: flex;
  flex-direction: column;
  max-height: 360px;
  overflow-y: auto;
}
.file-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.3rem;
  border-bottom: 1px solid var(--color-border);
}
.file-item:last-child {
  border-bottom: none;
}
.file-icon-box {
  font-size: 1.25rem;
}
.file-info-col {
  flex: 1;
  min-width: 0;
}
.file-name {
  font-size: 0.85rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-action-btns {
  display: flex;
  gap: 4px;
}
.btn-xs {
  font-size: 0.72rem !important;
  padding: 0.25rem 0.6rem !important;
}

/* Icon picker */
.icon-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 4px;
}
.btn-icon-choice {
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.btn-icon-choice.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.empty-state {
  text-align: center;
  padding: 1.8rem 1rem;
  color: var(--color-text-caption);
  font-size: 0.88rem;
}
</style>
