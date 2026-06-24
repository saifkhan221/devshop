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
        <span class="logo-name">DevShop</span>
      </div>
      <p class="tagline">Your frontend workspace, all in one place.</p>

      <div class="tab-switcher">
        <button class="tab-btn" :class="{ active: tab === 'login' }" @click="tab = 'login'">Login</button>
        <button class="tab-btn" :class="{ active: tab === 'signup' }" @click="tab = 'signup'">Sign Up</button>
      </div>

      <!-- Error -->
      <div v-if="error" class="error-box">{{ error }}</div>

      <!-- Login form -->
      <form v-if="tab === 'login'" @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Email address</label>
          <input type="email" v-model="email" placeholder="you@example.com" required />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" v-model="password" placeholder="Enter your password" required />
        </div>
        <button type="submit" class="btn-primary" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Sign in to DevShop</span>
        </button>
      </form>

      <!-- Signup form -->
      <form v-if="tab === 'signup'" @submit.prevent="handleSignup">
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" v-model="name" placeholder="Saif Khan" required />
        </div>
        <div class="form-group">
          <label>Email address</label>
          <input type="email" v-model="email" placeholder="you@example.com" required />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" v-model="password" placeholder="Create a password" required />
        </div>
        <div class="form-group">
          <label>Confirm Password</label>
          <input type="password" v-model="confirmPassword" placeholder="Confirm password" required />
        </div>
        <button type="submit" class="btn-primary" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Create Account →</span>
        </button>
      </form>

      <div class="toggle-link" v-if="tab === 'login'">
        Don't have an account? <a @click="tab = 'signup'">Create one free</a>
      </div>
      <div class="toggle-link" v-else>
        Already have an account? <a @click="tab = 'login'">Sign in</a>
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
const loading = ref(false)

const particles = [
  { id: 1, style: 'left:10%;width:6px;height:6px;background:#7c3aed;animation-duration:12s;animation-delay:0s;' },
  { id: 2, style: 'left:25%;width:4px;height:4px;background:#a78bfa;animation-duration:15s;animation-delay:3s;' },
  { id: 3, style: 'left:60%;width:5px;height:5px;background:#7c3aed;animation-duration:10s;animation-delay:1s;' },
  { id: 4, style: 'left:80%;width:3px;height:3px;background:#c4b5fd;animation-duration:18s;animation-delay:6s;' },
  { id: 5, style: 'left:45%;width:4px;height:4px;background:#a78bfa;animation-duration:14s;animation-delay:9s;' },
]

async function handleLogin() {
  if (loading.value) return
  error.value = ''
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
</style>
