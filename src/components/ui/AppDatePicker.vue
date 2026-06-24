<template>
  <div class="dp-wrap" ref="wrapRef">
    <!-- Trigger -->
    <button class="dp-trigger" @click="toggle">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      <span>{{ modelValue ? fmt(modelValue) : todayLabel }}</span>
    </button>

    <!-- Calendar panel -->
    <transition name="cal">
      <div v-if="open" class="dp-panel">

        <!-- Calendar -->
        <div class="dp-calendar">
          <!-- Date info strip -->
          <div class="dp-date-strip">
            <span class="dp-strip-num">{{ tempDay }}</span>
            <span class="dp-strip-day">{{ tempDayName }}</span>
            <span class="dp-strip-sep">·</span>
            <span class="dp-strip-month">{{ tempMonthName }}</span>
            <span class="dp-strip-year">{{ tempYear }}</span>
          </div>
          <div class="dp-nav">
            <div class="dp-nav-group">
              <button class="dp-nav-btn" @click="prevMonth">‹</button>
              <span class="dp-nav-label">{{ monthNames[viewMonth] }}</span>
              <button class="dp-nav-btn" @click="nextMonth">›</button>
            </div>
            <div class="dp-nav-group">
              <button class="dp-nav-btn" @click="prevYear">‹</button>
              <span class="dp-nav-label">{{ viewYear }}</span>
              <button class="dp-nav-btn" @click="nextYear">›</button>
            </div>
          </div>

          <div class="dp-weekdays">
            <span v-for="d in weekDays" :key="d">{{ d }}</span>
          </div>

          <div class="dp-grid">
            <button
              v-for="(cell, i) in cells"
              :key="i"
              class="dp-cell"
              :class="{
                'other-month': !cell.current,
                'is-today': cell.isToday,
                'is-selected': cell.isSelected,
              }"
              @click="selectCell(cell)"
            >{{ cell.day }}</button>
          </div>

          <div class="dp-footer">
            <button class="dp-footer-btn clear" @click="clear">Clear</button>
            <div class="dp-footer-right">
              <button class="dp-footer-btn cancel" @click="cancel">Cancel</button>
              <button class="dp-footer-btn ok" @click="confirm">OK</button>
            </div>
          </div>
        </div>

      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' }, // YYYY-MM-DD or ''
})
const emit = defineEmits(['update:modelValue'])

// ─── State ────────────────────────────────────────────────────────────────
const open    = ref(false)
const wrapRef = ref(null)

const today     = new Date()
const todayY    = today.getFullYear()
const todayM    = today.getMonth()
const todayD    = today.getDate()

// The month/year currently displayed in the grid
const viewMonth = ref(todayM)
const viewYear  = ref(todayY)

// The currently "hovered" / pending selection (before OK)
const pendingDate = ref(props.modelValue || toISO(today))

// Sync pending date when model changes externally
watch(() => props.modelValue, (v) => { if (v) pendingDate.value = v })

// ─── Static data ──────────────────────────────────────────────────────────
const weekDays  = ['S','M','T','W','T','F','S']
const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
const dayNames   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

// ─── Today label for trigger ──────────────────────────────────────────────
const todayLabel = computed(() => fmt(toISO(today)))

// ─── Sidebar shows the pending selection ──────────────────────────────────
const pendingParsed = computed(() => pendingDate.value ? parseISO(pendingDate.value) : today)
const tempDayName  = computed(() => dayNames[pendingParsed.value.getDay()])
const tempDay      = computed(() => pendingParsed.value.getDate())
const tempMonthName = computed(() => monthNames[pendingParsed.value.getMonth()])
const tempYear     = computed(() => pendingParsed.value.getFullYear())

// ─── Calendar grid cells ──────────────────────────────────────────────────
const cells = computed(() => {
  const first = new Date(viewYear.value, viewMonth.value, 1)
  const startOffset = first.getDay() // 0=Sun
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const daysInPrev  = new Date(viewYear.value, viewMonth.value, 0).getDate()

  const result = []

  // Trailing days from prev month
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = daysInPrev - i
    result.push(makeCell(d, viewYear.value, viewMonth.value - 1, false))
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    result.push(makeCell(d, viewYear.value, viewMonth.value, true))
  }

  // Leading days from next month to fill grid (always 42 cells = 6 rows)
  let next = 1
  while (result.length < 42) {
    result.push(makeCell(next++, viewYear.value, viewMonth.value + 1, false))
  }

  return result
})

function makeCell(day, year, month, current) {
  // Normalise month overflow
  const d = new Date(year, month, day)
  const iso = toISO(d)
  return {
    day,
    iso,
    current,
    isToday:    d.getFullYear() === todayY && d.getMonth() === todayM && d.getDate() === todayD,
    isSelected: iso === pendingDate.value,
  }
}

// ─── Interaction ──────────────────────────────────────────────────────────
function toggle() {
  open.value = !open.value
  if (open.value) {
    // Navigate view to the current pending/model date
    const d = pendingDate.value ? parseISO(pendingDate.value) : today
    viewMonth.value = d.getMonth()
    viewYear.value  = d.getFullYear()
  }
}

function selectCell(cell) {
  pendingDate.value = cell.iso
  // Navigate view if clicked an other-month cell
  const d = parseISO(cell.iso)
  viewMonth.value = d.getMonth()
  viewYear.value  = d.getFullYear()
}

function confirm() {
  emit('update:modelValue', pendingDate.value)
  open.value = false
}

function cancel() {
  // Reset pending to current model value
  pendingDate.value = props.modelValue || toISO(today)
  open.value = false
}

function clear() {
  pendingDate.value = toISO(today)
  emit('update:modelValue', '')
  open.value = false
}

function prevMonth() {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- }
  else viewMonth.value--
}
function nextMonth() {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ }
  else viewMonth.value++
}
function prevYear() { viewYear.value-- }
function nextYear() { viewYear.value++ }

// ─── Outside click ────────────────────────────────────────────────────────
function onOutside(e) {
  if (wrapRef.value && !wrapRef.value.contains(e.target)) open.value = false
}
onMounted(() => document.addEventListener('mousedown', onOutside))
onUnmounted(() => document.removeEventListener('mousedown', onOutside))

// ─── Helpers ──────────────────────────────────────────────────────────────
function toISO(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function fmt(iso) {
  if (!iso) return ''
  const d = parseISO(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.dp-wrap { position: relative; }

// ── Trigger ────────────────────────────────────────────────────────────────
.dp-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: $brand-300;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s;
  &:hover { border-color: var(--accent); color: $text-heading; }
}

// ── Panel ──────────────────────────────────────────────────────────────────
.dp-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px var(--border-subtle);
  z-index: 200;
}

// ── Calendar ───────────────────────────────────────────────────────────────
.dp-calendar {
  background: $bg-surface;
  padding: 20px;
  min-width: 300px;
}

// ── Date info strip (top of calendar) ─────────────────────────────────────
.dp-date-strip {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-subtle);
}

.dp-strip-num   { font-size: 32px; font-weight: 800; color: var(--accent); line-height: 1; letter-spacing: -1px; }
.dp-strip-day   { font-size: 13px; font-weight: 600; color: $text-heading; }
.dp-strip-sep   { font-size: 13px; color: $brand-400; }
.dp-strip-month { font-size: 13px; font-weight: 600; color: $text-heading; }
.dp-strip-year  { font-size: 13px; font-weight: 500; color: $brand-400; margin-left: 2px; }

.dp-nav {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.dp-nav-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dp-nav-btn {
  width: 24px; height: 24px;
  background: transparent;
  border: none;
  color: $brand-400;
  font-size: 16px;
  cursor: pointer;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
  &:hover { background: $bg-elevated; color: var(--accent); }
}

.dp-nav-label {
  font-size: 13px;
  font-weight: 600;
  color: $text-heading;
  min-width: 70px;
  text-align: center;
}

.dp-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 8px;
  span {
    text-align: center;
    font-size: 11px;
    font-weight: 600;
    color: var(--accent);
    padding: 4px 0;
  }
}

.dp-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.dp-cell {
  aspect-ratio: 1;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px;
  font-weight: 500;
  color: $text-heading;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.12s;
  &:hover { background: var(--accent-subtle); color: var(--accent); }

  &.other-month { color: $brand-400; opacity: 0.4; }

  &.is-today {
    background: $bg-elevated;
    color: var(--accent);
    font-weight: 700;
  }

  &.is-selected {
    background: var(--accent) !important;
    color: #fff !important;
    font-weight: 700;
  }
}

.dp-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
}

.dp-footer-right { display: flex; gap: 8px; }

.dp-footer-btn {
  background: transparent;
  border: none;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s;

  &.clear  { color: #f87171; &:hover { background: rgba(239,68,68,0.1); } }
  &.cancel { color: $brand-400; &:hover { color: $text-heading; background: $bg-elevated; } }
  &.ok     { color: var(--accent); &:hover { background: var(--accent-subtle); } }
}

// ── Open/close animation ───────────────────────────────────────────────────
.cal-enter-active, .cal-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.cal-enter-from, .cal-leave-to { opacity: 0; transform: translateY(-8px) scale(0.97); }
</style>
