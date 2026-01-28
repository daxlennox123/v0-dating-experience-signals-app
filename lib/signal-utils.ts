import type { SignalColor } from './types'

// Hash function for subject identifiers (phone/instagram)
export async function hashIdentifier(identifier: string): Promise<string> {
  // Normalize the identifier (lowercase, remove spaces)
  const normalized = identifier.toLowerCase().trim().replace(/\s+/g, '')
  
  // Use SubtleCrypto for SHA-256 hashing
  const encoder = new TextEncoder()
  const data = encoder.encode(normalized)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return hashHex
}

// Mask identifier for display (only show partial)
export function maskIdentifier(identifier: string): string {
  const normalized = identifier.trim()
  
  // Check if it looks like a phone number
  if (/^\+?[\d\s\-()]+$/.test(normalized)) {
    const digits = normalized.replace(/\D/g, '')
    if (digits.length >= 4) {
      return `***-***-${digits.slice(-4)}`
    }
  }
  
  // Check if it looks like an Instagram handle
  if (normalized.startsWith('@') || /^[a-zA-Z0-9._]+$/.test(normalized)) {
    const handle = normalized.replace('@', '')
    if (handle.length > 4) {
      return `@${handle.slice(0, 2)}***${handle.slice(-2)}`
    }
    return `@${handle.slice(0, 1)}***`
  }
  
  // Generic masking
  if (normalized.length > 4) {
    return `${normalized.slice(0, 2)}***${normalized.slice(-2)}`
  }
  return '****'
}

// Signal color descriptions
export const signalColorInfo: Record<SignalColor, { label: string; description: string; emoji: string }> = {
  green: {
    label: 'Positive',
    description: 'Generally positive experience, respectful behavior',
    emoji: '+'
  },
  yellow: {
    label: 'Caution',
    description: 'Mixed experience, some concerns noted',
    emoji: '!'
  },
  red: {
    label: 'Warning',
    description: 'Negative experience, significant concerns',
    emoji: '-'
  }
}

// Content moderation - check for prohibited content
export function checkProhibitedContent(text: string): { passed: boolean; reasons: string[] } {
  const reasons: string[] = []
  const lowerText = text.toLowerCase()
  
  // Check for full names (basic heuristic: two capitalized words together)
  const namePattern = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g
  if (namePattern.test(text)) {
    reasons.push('Text may contain a full name - please use only first names or initials')
  }
  
  // Check for specific location details
  const locationPatterns = [
    /\b\d+\s+[A-Za-z]+\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct|way|place|pl)\b/i,
    /\bapartment\s*#?\s*\d+/i,
    /\bunit\s*#?\s*\d+/i
  ]
  for (const pattern of locationPatterns) {
    if (pattern.test(text)) {
      reasons.push('Text may contain specific address details - please keep locations vague')
      break
    }
  }
  
  // Check for excessive caps (shouting)
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length
  if (capsRatio > 0.5 && text.length > 20) {
    reasons.push('Please avoid excessive capitalization')
  }
  
  // Check for URLs
  if (/https?:\/\/|www\./i.test(text)) {
    reasons.push('URLs are not allowed')
  }
  
  // Check for explicit profanity (basic list - would be more comprehensive in production)
  const profanityPatterns = [
    /\b(f+u+c+k+|s+h+i+t+|a+s+s+h+o+l+e+|b+i+t+c+h+|c+u+n+t+)\b/i
  ]
  for (const pattern of profanityPatterns) {
    if (pattern.test(lowerText)) {
      reasons.push('Please avoid explicit language')
      break
    }
  }
  
  return {
    passed: reasons.length === 0,
    reasons
  }
}

// Validate identifier format
export function validateIdentifier(identifier: string): { valid: boolean; type: 'phone' | 'instagram' | 'unknown'; message?: string } {
  const normalized = identifier.trim()
  
  // Check for phone number format
  const phoneDigits = normalized.replace(/\D/g, '')
  if (phoneDigits.length >= 10 && phoneDigits.length <= 15) {
    return { valid: true, type: 'phone' }
  }
  
  // Check for Instagram handle format
  const instagramPattern = /^@?[a-zA-Z0-9._]{1,30}$/
  if (instagramPattern.test(normalized)) {
    return { valid: true, type: 'instagram' }
  }
  
  // Invalid format
  return { 
    valid: false, 
    type: 'unknown',
    message: 'Please enter a valid phone number or Instagram handle'
  }
}

// Generate invite code
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed confusing chars (0, O, I, 1)
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Format relative time
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  
  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffWeeks < 4) return `${diffWeeks}w ago`
  return `${diffMonths}mo ago`
}
