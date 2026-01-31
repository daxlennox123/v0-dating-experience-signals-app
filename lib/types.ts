export type SignalColor = 'green' | 'yellow' | 'red'
export type UserRole = 'user' | 'mod' | 'admin'
export type VerificationStatus = 'pending' | 'verified' | 'rejected'
export type ModerationStatus = 'pending' | 'approved' | 'rejected'
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed'

export interface Profile {
  id: string
  email: string
  phone: string | null
  phone_verified: boolean
  selfie_url: string | null
  selfie_verified: boolean
  account_status: 'pending' | 'approved' | 'suspended' | 'banned'
  role: UserRole
  has_contributed: boolean
  never_dated: boolean
  terms_accepted_at: string | null
  guidelines_accepted_at: string | null
  invited_by: string | null
  invite_code: string | null
  invites_remaining: number
  watermark_hash: string
  created_at: string
  updated_at: string
}

export interface Signal {
  id: string
  author_id: string
  subject_first_name: string
  subject_last_initial: string | null
  subject_full_name: string | null
  subject_social_handle: string | null
  subject_platform: string | null
  subject_location: string | null
  experience_type: string | null
  overall_signal: 'green' | 'yellow' | 'red'
  green_flags: string[]
  red_flags: string[]
  description: string
  image_url: string | null
  status: 'active' | 'under_review' | 'hidden' | 'removed'
  flagged_count: number
  green_flag_votes: number
  red_flag_votes: number
  view_count: number
  comment_count: number
  claimed_by: string | null
  claim_status: string | null
  claim_response: string | null
  created_at: string
  updated_at: string
  // Joined data
  author?: Profile
}

export interface Report {
  id: string
  reporter_id: string
  signal_id: string | null
  reported_user_id: string | null
  reason: string
  details: string | null
  status: ReportStatus
  resolved_by: string | null
  resolution_notes: string | null
  created_at: string
  updated_at: string
  // Joined data
  reporter?: Profile
  signal?: Signal
  reported_user?: Profile
}

export interface Claim {
  id: string
  user_id: string
  signal_id: string
  claim_type: 'confirm' | 'dispute'
  created_at: string
}

export interface Invite {
  id: string
  code: string
  created_by: string
  used_by: string | null
  expires_at: string
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  target_type: string | null
  target_id: string | null
  metadata: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

// Form types
export interface SignUpFormData {
  email: string
  password: string
  confirmPassword: string
  inviteCode: string
  displayName: string
  acceptedTerms: boolean
  acceptedGuidelines: boolean
}

export interface SignalFormData {
  subjectIdentifier: string
  signalColor: SignalColor
  contextText: string
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// Search types
export interface SearchFilters {
  query: string
  colors: SignalColor[]
  dateRange: 'all' | 'week' | 'month' | 'year'
}
