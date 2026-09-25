<template>
  <div class="auth-page">
    <!-- Background glows -->
    <div class="glow glow--top"></div>
    <div class="glow glow--bottom"></div>

    <!-- Particles -->
    <div class="particle" v-for="p in particles" :key="p.id" :style="p.style"></div>

    <div class="card">
      <div class="logo-row">
        <div class="logo-icon">⚡</div>
        <span class="logo-name">Dev Kit</span>
      </div>
      <p class="tagline">Your frontend workspace, all in one place.</p>

      <div class="tab-switcher">
        <button class="tab-btn" :class="{ active: tab === 'login' }" @click="!loading && (tab = 'login')" :disabled="loading">Login</button>
        <button class="tab-btn" :class="{ active: tab === 'signup' }" @click="!loading && (tab = 'signup')" :disabled="loading">Sign Up</button>
      </div>

      <!-- Error -->
      <div v-if="error" class="error-box">{{ error }}</div>

      <!-- Success -->
      <div v-if="success" class="success-box">{{ success }}</div>

      <!-- Account-linking prompt (Google email already has a password account) -->
      <div v-if="linkPending" class="link-box">
        <p class="link-msg">
          <strong>{{ linkPending.email }}</strong> already has a password account.
          Enter your password once to connect Google sign-in — they'll share the same workspace.
        </p>
        <div class="form-group">
          <input type="password" v-model="linkPassword" placeholder="Your password"
                 :disabled="loading" @keydown.enter.prevent="handleCompleteLink" autofocus />
        </div>
        <button type="button" class="btn-primary" :disabled="loading || !linkPassword" @click="handleCompleteLink">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Connect &amp; sign in</span>
        </button>
        <a class="link-cancel" @click="cancelLink">Cancel</a>
      </div>

      <template v-else>
      <!-- Login form -->
      <form v-if="tab === 'login'" @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Email address</label>
          <input type="email" v-model="email" placeholder="you@example.com" required :disabled="loading" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" v-model="password" placeholder="Enter your password" required :disabled="loading" />
          <a class="forgot-link" @click="handleForgotPassword" :class="{ disabled: loading }">Forgot password?</a>
        </div>
        <button type="submit" class="btn-primary" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Sign in to Dev Kit</span>
        </button>
      </form>

      <!-- Signup form -->
      <form v-if="tab === 'signup'" @submit.prevent="handleSignup">
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" v-model="name" placeholder="Saif Khan" required :disabled="loading" />
        </div>
        <div class="form-group">
          <label>Email address</label>
          <input type="email" v-model="email" placeholder="you@example.com" required :disabled="loading" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" v-model="password" placeholder="Create a password" required :disabled="loading" />
        </div>
        <div class="form-group">
          <label>Confirm Password</label>
          <input type="password" v-model="confirmPassword" placeholder="Confirm password" required :disabled="loading" />
        </div>
        <button type="submit" class="btn-primary" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Create Account →</span>
        </button>
      </form>

      <div class="divider"><span>or</span></div>

      <button type="button" class="btn-google" :disabled="loading" @click="handleGoogle">
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
          <path fill="#FBBC05" d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"/>
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
        </svg>
        Continue with Google
      </button>
      </template>

      <div v-if="!linkPending" class="toggle-link">
        <template v-if="tab === 'login'">Don't have an account? <a @click="tab = 'signup'">Create one free</a></template>
        <template v-else>Already have an account? <a @click="tab = 'login'">Sign in</a></template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

const store = useStore()
const router = useRouter()

const tab = ref('login')
const email = ref('')
const password = ref('')
const name = ref('')
const confirmPassword = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)
const linkPending = ref(null)   // { email, pendingCred } when Google needs linking
const linkPassword = ref('')

const particles = [
  { id: 1, style: 'left:10%;width:6px;height:6px;background:#7c3aed;animation-duration:12s;animation-delay:0s;' },
  { id: 2, style: 'left:25%;width:4px;height:4px;background:#a78bfa;animation-duration:15s;animation-delay:3s;' },
  { id: 3, style: 'left:60%;width:5px;height:5px;background:#7c3aed;animation-duration:10s;animation-delay:1s;' },
  { id: 4, style: 'left:80%;width:3px;height:3px;background:#c4b5fd;animation-duration:18s;animation-delay:6s;' },
  { id: 5, style: 'left:45%;width:4px;height:4px;background:#a78bfa;animation-duration:14s;animation-delay:9s;' },
]

async function handleForgotPassword() {
  if (loading.value) return
  if (!email.value) {
    error.value = 'Enter your email address first'
    return
  }
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    const { auth, sendPasswordResetEmail } = await import('firebase/auth').then(async (mod) => {
      const { auth } = await import('@/services/firebase')
      return { auth, sendPasswordResetEmail: mod.sendPasswordResetEmail }
    })
    await sendPasswordResetEmail(auth, email.value)
    success.value = 'Password reset email sent! Check your inbox.'
  } catch {
    error.value = 'Could not send reset email. Check your email and try again.'
  } finally {
    loading.value = false
  }
}

async function handleLogin() {
  if (loading.value) return
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    const ok = await store.dispatch('auth/login', { email: email.value, password: password.value })
    if (ok) {
      router.push('/dashboard')
    } else {
      error.value = store.state.auth.error || 'Login failed'
    }
  } finally {
    loading.value = false
  }
}

async function handleGoogle() {
  if (loading.value) return
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    const res = await store.dispatch('auth/loginWithGoogle')
    if (res.ok) {
      router.push('/dashboard')
    } else if (res.linkRequired) {
      linkPending.value = { email: res.email, pendingCred: res.pendingCred }
      linkPassword.value = ''
    } else {
      error.value = store.state.auth.error || ''
    }
  } finally {
    loading.value = false
  }
}

async function handleCompleteLink() {
  if (loading.value || !linkPassword.value) return
  error.value = ''
  loading.value = true
  try {
    const ok = await store.dispatch('auth/completeGoogleLink', {
      email: linkPending.value.email,
      password: linkPassword.value,
      pendingCred: linkPending.value.pendingCred,
    })
    if (ok) {
      linkPending.value = null
      router.push('/dashboard')
    } else {
      error.value = store.state.auth.error || 'Could not connect the account'
    }
  } finally {
    loading.value = false
  }
}

function cancelLink() {
  linkPending.value = null
  linkPassword.value = ''
  error.value = ''
}

async function handleSignup() {
  if (loading.value) return
  error.value = ''
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }
  loading.value = true
  try {
    const ok = await store.dispatch('auth/signup', { name: name.value, email: email.value, password: password.value })
    if (ok) {
      router.push('/dashboard')
    } else {
      error.value = store.state.auth.error || 'Signup failed'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  background: $bg-primary;
}

.glow {
  position: fixed;
  pointer-events: none;
  z-index: 0;
  &--top {
    top: -200px; left: 50%; transform: translateX(-50%);
    width: 800px; height: 600px;
    background: radial-gradient(ellipse, var(--accent-subtle) 0%, transparent 70%);
  }
  &--bottom {
    bottom: -200px; right: -100px;
    width: 500px; height: 500px;
    background: radial-gradient(ellipse, rgba(76,44,153,0.12) 0%, transparent 70%);
  }
}

.particle {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  opacity: 0.15;
  animation: float linear infinite;
  z-index: 0;
}

@keyframes float {
  0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
  10% { opacity: 0.15; }
  90% { opacity: 0.15; }
  100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
}

.card {
  position: relative;
  z-index: 1;
  background: $bg-surface;
  border: 1px solid rgba(44, 26, 98, 0.9);
  border-radius: $radius-2xl;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px var(--accent-subtle);
}

.logo-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 8px;
}

.logo-icon {
  width: 36px; height: 36px;
  background: linear-gradient(135deg, $brand-600, $brand-500);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  box-shadow: 0 4px 16px var(--accent-glow);
}

.logo-name {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
}

.tagline {
  text-align: center;
  font-size: 13px;
  color: $brand-400;
  margin-bottom: 28px;
}

.tab-switcher {
  display: flex;
  background: $bg-elevated;
  border-radius: $radius-md;
  padding: 4px;
  margin-bottom: 28px;
  gap: 4px;
}

.tab-btn {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 7px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
  color: $brand-400;
  &.active {
    background: $brand-600;
    color: #fff;
    box-shadow: 0 2px 8px var(--accent-glow);
  }
}

.error-box {
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.3);
  border-radius: $radius-md;
  padding: 10px 14px;
  font-size: 13px;
  color: #fca5a5;
  margin-bottom: 16px;
}

.success-box {
  background: rgba(16,185,129,0.1);
  border: 1px solid rgba(16,185,129,0.3);
  border-radius: $radius-md;
  padding: 10px 14px;
  font-size: 13px;
  color: #6ee7b7;
  margin-bottom: 16px;
}

.forgot-link {
  display: block;
  text-align: right;
  font-size: 12px;
  color: $brand-400;
  margin-top: 6px;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.15s;
  &:hover { color: $brand-300; }
  &.disabled { opacity: 0.5; pointer-events: none; }
}

.form-group {
  margin-bottom: 16px;
  label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: $brand-300;
    margin-bottom: 6px;
    letter-spacing: 0.02em;
  }
  input {
    width: 100%;
    background: $bg-elevated;
    border: 1px solid var(--border-subtle);
    border-radius: $radius-md;
    padding: 11px 14px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: #fff;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    &:focus {
      border-color: $brand-500;
      box-shadow: 0 0 0 3px var(--accent-subtle);
    }
    &::placeholder { color: rgba(167,139,250,0.4); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, $brand-600, $brand-500);
  border: none;
  border-radius: $radius-md;
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  transition: all 0.2s;
  box-shadow: 0 4px 16px var(--accent-glow);
  display: flex; align-items: center; justify-content: center; gap: 8px;
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px var(--accent-glow);
  }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.toggle-link {
  text-align: center;
  font-size: 13px;
  color: $brand-400;
  margin-top: 20px;
  a {
    color: $brand-300;
    text-decoration: none;
    font-weight: 500;
    cursor: pointer;
    &:hover { color: #fff; }
  }
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0 16px;
  color: $brand-500;
  font-size: 12px;
  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border-subtle);
  }
}

.btn-google {
  width: 100%;
  padding: 11px;
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  &:hover:not(:disabled) { border-color: var(--accent); background: var(--accent-subtle); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.link-box {
  .link-msg {
    font-size: 13px;
    color: $brand-300;
    line-height: 1.55;
    margin-bottom: 16px;
    strong { color: #fff; }
  }
  .link-cancel {
    display: block;
    text-align: center;
    font-size: 13px;
    color: $brand-400;
    margin-top: 14px;
    cursor: pointer;
    &:hover { color: #fff; }
  }
}
</style>
