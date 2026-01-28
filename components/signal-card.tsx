'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, MoreHorizontal, Flag, MapPin, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatRelativeTime } from '@/lib/signal-utils'
import type { Signal } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

interface SignalCardProps {
  signal: Signal
  currentUserId: string
  isVerified: boolean
}

const signalInfo = {
  positive: { label: 'Positive', color: 'text-[var(--signal-green)]', bg: 'bg-[var(--signal-green)]/10', emoji: '✓' },
  neutral: { label: 'Mixed', color: 'text-[var(--signal-yellow)]', bg: 'bg-[var(--signal-yellow)]/10', emoji: '~' },
  negative: { label: 'Negative', color: 'text-[var(--signal-red)]', bg: 'bg-[var(--signal-red)]/10', emoji: '!' },
}

export function SignalCard({ signal, currentUserId, isVerified }: SignalCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const info = signalInfo[signal.overall_signal] || signalInfo.neutral
  const displayName = `${signal.subject_first_name} ${signal.subject_last_initial}.`

  async function handleReport() {
    if (!isVerified) {
      toast({ title: 'You must be verified to report signals', variant: 'destructive' })
      return
    }
    
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: currentUserId,
          signal_id: signal.id,
          reason: 'user_report',
        })
      
      if (error) throw error
      toast({ title: 'Signal reported. Our team will review it.' })
    } catch (error) {
      console.error('[v0] Report error:', error)
      toast({ title: 'Failed to report signal', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="glass-card rounded-xl p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {/* Signal Type Badge */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${info.bg} ${info.color}`}>
            {info.emoji}
          </div>
          
          <div>
            <p className={`font-medium ${!isVerified ? 'blur-sm select-none' : ''}`}>
              {displayName}
            </p>
            <p className={`text-xs font-medium ${info.color}`}>
              {info.label} Experience
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(signal.created_at)}
          </span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleReport} disabled={isLoading} className="text-destructive">
                <Flag className="w-4 h-4 mr-2" />
                Report Signal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Location & Platform */}
      {(signal.subject_platform || signal.subject_location) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {signal.subject_platform && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Smartphone className="w-3 h-3" />
              {signal.subject_platform}
            </Badge>
          )}
          {signal.subject_location && (
            <Badge variant="secondary" className="text-xs gap-1">
              <MapPin className="w-3 h-3" />
              {signal.subject_location}
            </Badge>
          )}
        </div>
      )}

      {/* Description */}
      <div className={`mb-4 ${!isVerified ? 'blur-sm select-none pointer-events-none' : ''}`}>
        <p className="text-sm leading-relaxed">{signal.description}</p>
      </div>

      {/* Flags */}
      {isVerified && (
        <div className="space-y-2 mb-4">
          {signal.green_flags && signal.green_flags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {signal.green_flags.map((flag, i) => (
                <Badge key={i} variant="outline" className="text-xs text-[var(--signal-green)] border-[var(--signal-green)]/30 bg-[var(--signal-green)]/5">
                  {flag}
                </Badge>
              ))}
            </div>
          )}
          {signal.red_flags && signal.red_flags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {signal.red_flags.map((flag, i) => (
                <Badge key={i} variant="outline" className="text-xs text-[var(--signal-red)] border-[var(--signal-red)]/30 bg-[var(--signal-red)]/5">
                  {flag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {!isVerified && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 mb-4">
          <AlertTriangle className="w-4 h-4" />
          <span>Full details visible after account approval</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="text-xs text-muted-foreground">
          {signal.experience_type && <span className="capitalize">{signal.experience_type}</span>}
        </div>
        
        {signal.flagged_count > 0 && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            {signal.flagged_count} reports
          </Badge>
        )}
      </div>
    </div>
  )
}
