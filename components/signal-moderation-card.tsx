'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, X, Loader2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatRelativeTime } from '@/lib/signal-utils'
import { useToast } from '@/hooks/use-toast'

interface SignalModerationCardProps {
  signal: {
    id: string
    subject_first_name: string
    subject_last_initial: string
    subject_platform: string | null
    overall_signal: 'green' | 'yellow' | 'red'
    experience_type: string
    description: string
    status: string
    created_at: string
    author?: {
      id: string
      email: string
      account_status: string
      role: string
    }
  }
}

export function SignalModerationCard({ signal }: SignalModerationCardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const { toast } = useToast()

  const signalInfo = {
    green: { emoji: '👍', label: 'Positive', color: 'var(--signal-green)' },
    yellow: { emoji: '👋', label: 'Neutral', color: 'var(--signal-yellow)' },
    red: { emoji: '⚠️', label: 'Negative', color: 'var(--signal-red)' },
  }
  
  const info = signalInfo[signal.overall_signal] || signalInfo.yellow

  async function handleApprove() {
    setIsLoading(true)
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('signals')
        .update({ status: 'active' })
        .eq('id', signal.id)

      if (error) throw error

      toast({ title: 'Signal approved' })
      router.refresh()
    } catch (error) {
      console.error('[v0] Approve error:', error)
      toast({ title: 'Failed to approve signal', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      toast({ title: 'Please provide a reason for rejection', variant: 'destructive' })
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('signals')
        .update({ status: 'removed' })
        .eq('id', signal.id)

      if (error) throw error

      toast({ title: 'Signal rejected' })
      router.refresh()
    } catch (error) {
      console.error('[v0] Reject error:', error)
      toast({ title: 'Failed to reject signal', variant: 'destructive' })
    } finally {
      setIsLoading(false)
      setShowRejectForm(false)
    }
  }

  return (
    <div className="glass-card rounded-xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
            signal.overall_signal === 'green' ? 'bg-signal-green/10 text-[var(--signal-green)]' :
            signal.overall_signal === 'yellow' ? 'bg-signal-yellow/10 text-[var(--signal-yellow)]' :
            'bg-signal-red/10 text-[var(--signal-red)]'
          }`}>
            {info.emoji}
          </div>
          <div>
            <p className="font-medium">{signal.subject_first_name} {signal.subject_last_initial}.</p>
            {signal.subject_platform && (
              <p className="text-xs text-muted-foreground">via {signal.subject_platform}</p>
            )}
            <p className={`text-xs font-medium ${
              signal.overall_signal === 'green' ? 'text-[var(--signal-green)]' :
              signal.overall_signal === 'yellow' ? 'text-[var(--signal-yellow)]' :
              'text-[var(--signal-red)]'
            }`}>
              {info.label} - {signal.experience_type}
            </p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(signal.created_at)}
        </span>
      </div>

      {/* Author Info */}
      {signal.author && (
        <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-muted/50">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">{signal.author.email?.split('@')[0] || 'Anonymous'}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            signal.author.account_status === 'approved' 
              ? 'bg-primary/10 text-primary' 
              : 'bg-yellow-500/10 text-yellow-600'
          }`}>
            {signal.author.account_status}
          </span>
          {signal.author.role === 'admin' && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600">
              admin
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="mb-4 p-3 rounded-lg bg-muted/30">
        <p className="text-sm leading-relaxed">{signal.description}</p>
      </div>

      {/* Actions */}
      {signal.status === 'under_review' && (
        <>
          {showRejectForm ? (
            <div className="space-y-3">
              <Textarea
                placeholder="Reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={2}
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowRejectForm(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleReject}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Reject'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button 
                onClick={handleApprove}
                disabled={isLoading}
                size="sm"
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Approve
                  </>
                )}
              </Button>
              <Button 
                variant="destructive"
                onClick={() => setShowRejectForm(true)}
                disabled={isLoading}
                size="sm"
                className="flex-1"
              >
                <X className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </div>
          )}
        </>
      )}

      {signal.status !== 'under_review' && (
        <div className={`text-center text-sm font-medium py-2 rounded-lg ${
          signal.status === 'active' 
            ? 'bg-primary/10 text-primary' 
            : 'bg-destructive/10 text-destructive'
        }`}>
          {signal.status === 'active' ? 'Active' : signal.status === 'hidden' ? 'Hidden' : 'Removed'}
        </div>
      )}
    </div>
  )
}
