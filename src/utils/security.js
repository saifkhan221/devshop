// Input validation
export function validateEmail(email) {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return re.test(String(email).toLowerCase())
}

export function validatePassword(password) {
  const errors = []
  if (password.length < 8) errors.push('At least 8 characters')
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter')
  if (!/[0-9]/.test(password)) errors.push('At least one number')
  return errors
}

export function sanitizeText(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
    .slice(0, 500) // max length guard
}

// Rate limiter — blocks login after N failed attempts within a window
const RATE_LIMIT_KEY = 'devshop_auth_attempts'
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

export function checkRateLimit() {
  const raw = localStorage.getItem(RATE_LIMIT_KEY)
  const data = raw ? JSON.parse(raw) : { count: 0, firstAttempt: Date.now() }

  const now = Date.now()
  // Reset window if expired
  if (now - data.firstAttempt > WINDOW_MS) {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ count: 0, firstAttempt: now }))
    return { blocked: false }
  }

  if (data.count >= MAX_ATTEMPTS) {
    const remaining = Math.ceil((WINDOW_MS - (now - data.firstAttempt)) / 60000)
    return { blocked: true, remaining }
  }

  return { blocked: false }
}

export function recordFailedAttempt() {
  const raw = localStorage.getItem(RATE_LIMIT_KEY)
  const data = raw ? JSON.parse(raw) : { count: 0, firstAttempt: Date.now() }
  data.count++
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data))
}

export function clearRateLimit() {
  localStorage.removeItem(RATE_LIMIT_KEY)
}

// Validate localStorage data shape before trusting it
export function safeParseUser(raw) {
  try {
    const user = JSON.parse(raw)
    if (
      typeof user !== 'object' || user === null ||
      typeof user.uid !== 'string' ||
      typeof user.email !== 'string' ||
      !user.uid.length || !user.email.length
    ) return null
    return user
  } catch {
    return null
  }
}
