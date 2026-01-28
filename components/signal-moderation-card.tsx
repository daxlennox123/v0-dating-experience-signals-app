'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, X, Loader2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { signalColorInfo, formatRelativeTime } from '@/lib/signal-utils'
import { useToast } from '@/hooks/use-toast'

interface SignalModerationCardProps {
  signal: {
    id: string
    subject_identifier: string
    signal_color: 'green' | 'yellow' | 'red'
    context_text: string
    moderation_status: string
    created_at: string
    author?: {
      id: string
      display_name: string | null
      verification_status: string
      trust_score: number
    }
  }
}

export function SignalModerationCard({ signal }: SignalModerationCardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const { toast } = useToast()

  const colorInfo = signalColorInfo[signal.signal_color]

  async function handleApprove() {
    setIsLoading(true)
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('signals')
        .update({ moderation_status: 'approved' })
        .eq('id', signal.id)

      if (error) throw error

      // Update author's trust score
      if (signal.author) {
        await supabase.rpc('increment_trust_score', { user_id: signal.author.id, amount: 1 })
      }

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
        .update({ 
          moderation_status: 'rejected',
        })
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
            signal.signal_color === 'green' ? 'bg-signal-green/10 text-[var(--signal-green)]' :
            signal.signal_color === 'yellow' ? 'bg-signal-yellow/10 text-[var(--signal-yellow)]' :
            'bg-signal-red/10 text-[var(--signal-red)]'
          }`}>
            {colorInfo.emoji}
          </div>
          <div>
            <p className="font-mono text-sm font-medium">{signal.subject_identifier}</p>
            <p className={`text-xs font-medium ${
              signal.signal_color === 'green' ? 'text-[var(--signal-green)]' :
              signal.signal_color === 'yellow' ? 'text-[var(--signal-yellow)]' :
              'text-[var(--signal-red)]'
            }`}>
              {colorInfo.label}
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
          <span className="text-sm">{signal.author.display_name || 'Anonymous'}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            signal.author.verification_status === 'verified' 
              ? 'bg-primary/10 text-primary' 
              : 'bg-yellow-500/10 text-yellow-600'
          }`}>
            {signal.author.verification_status}
          </span>
          <span className="text-xs text-muted-foreground ml-auto">
            Trust: {signal.author.trust_score}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="mb-4 p-3 rounded-lg bg-muted/30">
        <p className="text-sm leading-relaxed">{signal.context_text}</p>
      </div>

      {/* Actions */}
      {signal.moderation_status === 'pending' && (
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

      {signal.moderation_status !== 'pending' && (
        <div className={`text-center text-sm font-medium py-2 rounded-lg ${
          signal.moderation_status === 'approved' 
            ? 'bg-primary/10 text-primary' 
            : 'bg-destructive/10 text-destructive'
        }`}>
          {signal.moderation_status === 'approved' ? 'Approved' : 'Rejected'}
        </div>
      )}
    </div>
  )
}
