<template>
  <div class="feedback-page">
    <AppNavbar :showUsername="false">
      <template #right>
        <button class="nav-back" @click="$router.push('/dashboard')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Dashboard
        </button>
      </template>
    </AppNavbar>

    <main class="fb-main">
      <!-- Header -->
      <div class="fb-header">
        <div>
          <h1 class="fb-title">Feedback</h1>
          <p class="fb-sub">{{ isAdmin ? 'Review feedback from all users' : 'Share your thoughts and help us improve' }}</p>
        </div>
      </div>

      <!-- Submit Form -->
      <section class="fb-form-card">
        <h2 class="fb-section-title">Submit Feedback</h2>

        <div class="fg">
          <label>Title</label>
          <input type="text" v-model="form.title" placeholder="Brief summary of your feedback" />
        </div>

        <div class="fg">
          <label>Description</label>
          <textarea v-model="form.description" rows="4" placeholder="Describe in detail..."></textarea>
        </div>

        <!-- Tags -->
        <div class="fg">
          <label>Tags</label>
          <div class="tag-row">
            <button
              v-for="t in PRESET_TAGS" :key="t"
              class="tag-chip"
              :class="{ active: form.tags.includes(t) }"
              @click="toggleTag(t)"
            >{{ t }}</button>
            <button
              v-for="t in customTags" :key="'c-' + t"
              class="tag-chip tag-custom active"
              @click="removeCustomTag(t)"
            >{{ t }} <span class="tag-x">&times;</span></button>
            <div class="tag-add" v-if="!showTagInput">
              <button class="tag-chip tag-add-btn" @click="showTagInput = true">+ Add tag</button>
            </div>
            <div class="tag-input-wrap" v-else>
              <input
                ref="tagInputRef"
                v-model="tagInput"
                class="tag-input"
                placeholder="Type & press Enter"
                @keydown.enter.prevent="addCustomTag"
                @keydown.escape="showTagInput = false; tagInput = ''"
                @blur="addCustomTag"
              />
            </div>
          </div>
        </div>

        <!-- Images -->
        <div class="fg">
          <label>Attachments <span class="opt">(optional)</span></label>
          <div
            class="img-drop"
            :class="{ dragover }"
            @dragover.prevent="dragover = true"
            @dragleave="dragover = false"
            @drop.prevent="onDrop"
            @click="$refs.fileInput.click()"
          >
            <input ref="fileInput" type="file" accept="image/*" multiple hidden @change="onFileSelect" />
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
            <span>Drop images here or click to browse</span>
          </div>
          <div v-if="form.images.length" class="img-previews">
            <div v-for="(img, i) in form.images" :key="i" class="img-thumb">
              <img :src="img" alt="" />
              <button class="img-remove" @click="form.images.splice(i, 1)">&times;</button>
            </div>
          </div>
        </div>

        <button class="btn-submit" @click="submitFeedback" :disabled="!form.title.trim() || submitting">
          <span v-if="submitting" class="spinner"></span>
          <span v-else>Submit Feedback</span>
        </button>
      </section>

      <!-- Feedback List -->
      <section class="fb-list-section">
        <div class="fb-list-header">
          <h2 class="fb-section-title">{{ isAdmin ? 'All Feedback' : 'Your Feedback' }}</h2>
          <span class="fb-count">{{ feedbackList.length }} item{{ feedbackList.length !== 1 ? 's' : '' }}</span>
        </div>

        <div v-if="loadingList" class="fb-loading">Loading...</div>

        <div v-else-if="feedbackList.length === 0" class="fb-empty">
          <div class="fb-empty-icon">💬</div>
          <div class="fb-empty-title">No feedback yet</div>
          <div class="fb-empty-sub">{{ isAdmin ? 'No feedback has been submitted' : 'Submit your first feedback above' }}</div>
        </div>

        <div v-else class="fb-cards">
          <div v-for="fb in feedbackList" :key="fb.id" class="fb-card">
            <div class="fb-card-top">
              <div>
                <div class="fb-card-title">{{ fb.title }}</div>
                <div v-if="isAdmin" class="fb-card-user">
                  <span class="fb-user-avatar">{{ (fb.userName || fb.userEmail || '?')[0].toUpperCase() }}</span>
                  {{ fb.userName || fb.userEmail }}
                </div>
              </div>
              <div class="fb-card-date">{{ formatDate(fb.createdAt) }}</div>
            </div>
            <p class="fb-card-desc">{{ fb.description }}</p>
            <div v-if="fb.tags?.length" class="fb-card-tags">
              <span v-for="t in fb.tags" :key="t" class="fb-tag">{{ t }}</span>
            </div>
            <div v-if="fb.images?.length" class="fb-card-images">
              <img
                v-for="(img, i) in fb.images" :key="i"
                :src="img"
                alt=""
                class="fb-card-img"
                @click="openLightbox(img)"
              />
            </div>
            <div v-if="isAdmin" class="fb-card-actions">
              <button class="fb-delete-btn" @click="deleteFeedback(fb)" :disabled="deleting === fb.id">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Lightbox -->
    <teleport to="body">
      <transition name="modal">
        <div v-if="lightboxImg" class="lightbox-overlay" @click="lightboxImg = null">
          <img :src="lightboxImg" class="lightbox-img" @click.stop />
          <button class="lightbox-close" @click="lightboxImg = null">&times;</button>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useStore } from 'vuex'
import { dbService } from '@/services/db'
import AppNavbar from '@/components/layout/AppNavbar.vue'

const ADMIN_EMAIL = 'saif@radix.email'
const PRESET_TAGS = ['Desktop', 'Mobile', 'Bug', 'Feature', 'UI/UX']

const store = useStore()
const user = computed(() => store.getters['auth/currentUser'])
const isAdmin = computed(() => user.value?.email === ADMIN_EMAIL)

// ─── Form ────────────────────────────────────────────────────────
const form = ref({ title: '', description: '', tags: [], images: [] })
const customTags = ref([])
const showTagInput = ref(false)
const tagInput = ref('')
const tagInputRef = ref(null)
const submitting = ref(false)
const dragover = ref(false)

function toggleTag(tag) {
  const idx = form.value.tags.indexOf(tag)
  if (idx === -1) form.value.tags.push(tag)
  else form.value.tags.splice(idx, 1)
}

function addCustomTag() {
  const val = tagInput.value.trim()
  if (val && !form.value.tags.includes(val) && !customTags.value.includes(val)) {
    customTags.value.push(val)
    form.value.tags.push(val)
  }
  tagInput.value = ''
  showTagInput.value = false
}

function removeCustomTag(tag) {
  customTags.value = customTags.value.filter(t => t !== tag)
  form.value.tags = form.value.tags.filter(t => t !== tag)
}

// ─── Image handling ──────────────────────────────────────────────
function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_W = 1200
        let w = img.width, h = img.height
        if (w > MAX_W) { h = (MAX_W / w) * h; w = MAX_W }
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

async function processFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue
    const compressed = await compressImage(file)
    form.value.images.push(compressed)
  }
}

function onFileSelect(e) { processFiles(e.target.files); e.target.value = '' }
function onDrop(e) { dragover.value = false; processFiles(e.dataTransfer.files) }

// ─── Submit ──────────────────────────────────────────────────────
async function submitFeedback() {
  if (!form.value.title.trim() || submitting.value) return
  submitting.value = true
  try {
    await dbService.submitFeedback(user.value.uid, {
      title: form.value.title.trim(),
      description: form.value.description.trim(),
      tags: form.value.tags,
      images: form.value.images,
      userEmail: user.value.email || '',
      userName: user.value.name || user.value.displayName || '',
    })
    form.value = { title: '', description: '', tags: [], images: [] }
    customTags.value = []
    store.dispatch('ui/toast', { message: 'Feedback submitted!', type: 'success' })
    await loadFeedback()
  } catch (e) {
    store.dispatch('ui/toast', { message: 'Failed to submit feedback', type: 'error' })
  } finally {
    submitting.value = false
  }
}

// ─── List ────────────────────────────────────────────────────────
const feedbackList = ref([])
const loadingList = ref(true)
const lightboxImg = ref(null)
const deleting = ref(null)

async function loadFeedback() {
  loadingList.value = true
  try {
    if (isAdmin.value) {
      feedbackList.value = await dbService.getAllFeedback()
    } else {
      feedbackList.value = await dbService.getUserFeedback(user.value.uid)
    }
  } catch {
    feedbackList.value = []
  } finally {
    loadingList.value = false
  }
}

function openLightbox(img) { lightboxImg.value = img }

async function deleteFeedback(fb) {
  if (deleting.value) return
  deleting.value = fb.id
  try {
    await dbService.deleteFeedback(fb.id)
    feedbackList.value = feedbackList.value.filter(f => f.id !== fb.id)
    store.dispatch('ui/toast', { message: 'Feedback deleted', type: 'info' })
  } catch {
    store.dispatch('ui/toast', { message: 'Failed to delete', type: 'error' })
  } finally {
    deleting.value = null
  }
}

function formatDate(d) {
  if (!d) return ''
  const date = d?.toDate ? d.toDate() : d?.seconds ? new Date(d.seconds * 1000) : new Date(d)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  nextTick(() => {
    if (showTagInput.value && tagInputRef.value) tagInputRef.value.focus()
  })
  loadFeedback()
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.feedback-page { min-height: 100vh; background: $bg-primary; }

.fb-main {
  padding: 32px 32px 80px;
  max-width: 820px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

// ── Header ──────────────────────────────────────────────────────────
.fb-header { margin-bottom: 4px; }
.fb-title {
  font-size: 26px; font-weight: 700; color: $text-heading;
  letter-spacing: -0.5px; line-height: 1.2;
}
.fb-sub { font-size: 13px; color: $brand-400; margin-top: 4px; }

// ── Back button ─────────────────────────────────────────────────────
.nav-back {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px;
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  font-family: 'Inter', sans-serif;
  font-size: 12px; font-weight: 500;
  color: $brand-300;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: var(--accent); color: $text-heading; }
}

// ── Section title ───────────────────────────────────────────────────
.fb-section-title {
  font-size: 16px; font-weight: 700; color: $text-heading;
  letter-spacing: -0.3px; margin-bottom: 20px;
}

// ── Form Card ───────────────────────────────────────────────────────
.fb-form-card {
  background: $bg-surface;
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  padding: 28px;
}

.fg {
  margin-bottom: 18px;
  label {
    display: block; font-size: 12px; font-weight: 500;
    color: $brand-300; margin-bottom: 6px; letter-spacing: 0.02em;
  }
  input, textarea {
    width: 100%;
    background: $bg-elevated;
    border: 1px solid var(--border-subtle);
    border-radius: $radius-md;
    padding: 10px 13px;
    font-family: 'Inter', sans-serif;
    font-size: 13px; color: #fff;
    outline: none;
    transition: border-color 0.2s;
    resize: vertical;
    &:focus { border-color: $brand-500; }
    &::placeholder { color: rgba(167,139,250,.35); }
  }
}

.opt { color: $brand-600; font-size: 11px; }

// ── Tags ────────────────────────────────────────────────────────────
.tag-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }

.tag-chip {
  padding: 6px 14px;
  border-radius: 20px;
  font-family: 'Inter', sans-serif;
  font-size: 12px; font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--border-subtle);
  background: $bg-elevated;
  color: $brand-300;
  transition: all 0.15s;
  display: flex; align-items: center; gap: 4px;
  &:hover { border-color: var(--accent); color: $text-heading; }
  &.active {
    background: var(--accent-subtle);
    border-color: $brand-500;
    color: var(--accent);
  }
}

.tag-custom .tag-x {
  font-size: 14px; line-height: 1; margin-left: 2px;
  opacity: 0.6;
}

.tag-add-btn {
  border-style: dashed;
  color: $brand-400;
  &:hover { color: var(--accent); border-color: var(--accent); }
}

.tag-input-wrap {
  .tag-input {
    width: 140px;
    padding: 6px 12px;
    border-radius: 20px;
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    background: $bg-elevated;
    border: 1px solid $brand-500;
    color: #fff;
    outline: none;
    &::placeholder { color: rgba(167,139,250,.35); }
  }
}

// ── Image Upload ────────────────────────────────────────────────────
.img-drop {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 8px;
  padding: 28px 20px;
  border: 2px dashed var(--border-subtle);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
  color: $brand-400;
  span { font-size: 12px; }
  &:hover, &.dragover {
    border-color: $brand-500;
    background: rgba(124,58,237,.04);
    color: var(--accent);
  }
}

.img-previews {
  display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px;
}

.img-thumb {
  position: relative;
  width: 80px; height: 80px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  img { width: 100%; height: 100%; object-fit: cover; }
  .img-remove {
    position: absolute; top: 2px; right: 2px;
    width: 20px; height: 20px;
    background: rgba(0,0,0,.7);
    border: none; border-radius: 50%;
    color: #fff; font-size: 14px; line-height: 1;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 0.15s;
  }
  &:hover .img-remove { opacity: 1; }
}

// ── Submit Button ───────────────────────────────────────────────────
.btn-submit {
  padding: 11px 24px;
  background: linear-gradient(135deg, $brand-600, $brand-500);
  border: none;
  border-radius: $radius-md;
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 13px; font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 14px var(--accent-glow);
  display: flex; align-items: center; gap: 8px;
  &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px var(--accent-glow); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

// ── Feedback List ───────────────────────────────────────────────────
.fb-list-section { margin-top: 8px; }

.fb-list-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px;
  .fb-section-title { margin-bottom: 0; }
}

.fb-count {
  font-size: 12px; color: $brand-400;
  background: $bg-elevated;
  padding: 4px 12px;
  border-radius: 20px;
}

.fb-loading { text-align: center; color: $brand-400; font-size: 13px; padding: 40px 0; }

.fb-empty {
  text-align: center; padding: 48px 20px;
  background: $bg-surface;
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
}
.fb-empty-icon { font-size: 36px; margin-bottom: 10px; }
.fb-empty-title { font-size: 15px; font-weight: 600; color: $text-heading; margin-bottom: 4px; }
.fb-empty-sub { font-size: 12px; color: $brand-400; }

.fb-cards { display: flex; flex-direction: column; gap: 14px; }

.fb-card {
  background: $bg-surface;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  padding: 22px;
  transition: border-color 0.2s;
  &:hover { border-color: rgba(124,58,237,.25); }
}

.fb-card-top {
  display: flex; align-items: flex-start;
  justify-content: space-between; gap: 12px;
  margin-bottom: 10px;
}

.fb-card-title {
  font-size: 15px; font-weight: 600; color: $text-heading;
  letter-spacing: -0.2px;
}

.fb-card-user {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: $brand-400; margin-top: 4px;
}

.fb-user-avatar {
  width: 20px; height: 20px;
  background: linear-gradient(135deg, $brand-600, $brand-500);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 600; color: #fff;
  flex-shrink: 0;
}

.fb-card-date { font-size: 11px; color: $text-muted; white-space: nowrap; }

.fb-card-desc {
  font-size: 13px; color: $text-secondary;
  line-height: 1.6; margin-bottom: 12px;
  white-space: pre-wrap;
}

.fb-card-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }

.fb-tag {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px; font-weight: 500;
  background: var(--accent-subtle);
  color: var(--accent);
  border: 1px solid rgba(124,58,237,.15);
}

.fb-card-actions {
  display: flex; justify-content: flex-end;
  margin-top: 12px; padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
}

.fb-delete-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 14px;
  background: transparent;
  border: 1px solid rgba(239,68,68,.25);
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 12px; font-weight: 500;
  color: #f87171;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: rgba(239,68,68,.1); border-color: rgba(239,68,68,.4); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

.fb-card-images { display: flex; flex-wrap: wrap; gap: 8px; }

.fb-card-img {
  width: 100px; height: 72px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: var(--accent); transform: scale(1.03); }
}

// ── Lightbox ────────────────────────────────────────────────────────
.lightbox-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.85);
  backdrop-filter: blur(6px);
  z-index: 200;
  display: flex; align-items: center; justify-content: center;
  padding: 40px;
  cursor: zoom-out;
}

.lightbox-img {
  max-width: 90vw; max-height: 85vh;
  border-radius: 10px;
  box-shadow: 0 20px 60px rgba(0,0,0,.5);
  cursor: default;
}

.lightbox-close {
  position: fixed; top: 20px; right: 24px;
  width: 36px; height: 36px;
  background: rgba(255,255,255,.1);
  border: none; border-radius: 50%;
  color: #fff; font-size: 20px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
  &:hover { background: rgba(255,255,255,.2); }
}

// ── Transitions ─────────────────────────────────────────────────────
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
