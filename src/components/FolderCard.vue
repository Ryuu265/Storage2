<template>
  <div class="folder-card card" @click="$emit('click-folder')">
    <!-- Header Card dengan ikon folder dan ikon edit di pojok (admin only) -->
    <div class="fc-header">
      <div class="fc-icon-wrap">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
      </div>

      <!-- Ikon edit & hapus di pojok kanan kartu (sesuai wireframe: admin only) -->
      <div v-if="canEdit" class="fc-actions" @click.stop>
        <button class="btn-icon" title="Edit folder" @click.stop="$emit('edit')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="btn-icon danger" title="Hapus folder" @click.stop="$emit('delete')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Content Card -->
    <div class="fc-body">
      <div class="fc-name">{{ link.nama_folder }}</div>
      <div class="fc-meta">
        <!-- Indikator kepemilikan bidang -->
        <span class="bidang-tag" title="Bidang Pemilik">{{ link.nama_bidang }}</span>
        <!-- Indikator kategori tahapan penggolongan -->
        <span class="tahapan-tag" :class="{ 'tahapan-tag--umum': !link.nama_tahapan }">
          {{ link.nama_tahapan || 'Umum' }}
        </span>
      </div>
    </div>

    <!-- Footer Card -->
    <div class="fc-footer">
      <span class="caption">Oleh {{ link.dibuat_oleh }}</span>
      <a :href="link.drive_folder_url" target="_blank" class="btn-icon" title="Buka di Google Drive" @click.stop>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
      </a>
    </div>
  </div>
</template>

<script setup>
defineProps({
  link: { type: Object, required: true },
  canEdit: { type: Boolean, default: false },
})
defineEmits(['click-folder', 'edit', 'delete'])
</script>

<style scoped>
.folder-card {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  transition: all var(--transition);
}
.folder-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}

.fc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 0.9rem 0.4rem;
}
.fc-icon-wrap {
  background: var(--color-primary-light);
  border-radius: var(--radius-sm);
  padding: 0.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fc-actions {
  display: flex;
  gap: 3px;
}

.fc-body {
  padding: 0.35rem 0.9rem 0.75rem;
  flex: 1;
}
.fc-name {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.4rem;
  line-height: 1.35;
  word-break: break-word;
}
.fc-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.bidang-tag {
  font-size: 0.72rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  padding: 0.15rem 0.55rem;
  color: var(--color-text-secondary);
  font-weight: 600;
}
.tahapan-tag {
  font-size: 0.72rem;
  background: var(--color-primary-light);
  border: 1px solid rgba(91, 200, 168, 0.4);
  border-radius: var(--radius-pill);
  padding: 0.15rem 0.55rem;
  color: var(--color-primary-dark);
  font-weight: 600;
}
.tahapan-tag--umum {
  background: #F1F5F9;
  border-color: #CBD5E1;
  color: #64748B;
}

.fc-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0.9rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);
}
.fc-footer .caption {
  font-size: 0.72rem;
  color: var(--color-text-caption);
}
</style>
