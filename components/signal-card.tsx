'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, MoreHorizontal, Flag, MapPin, Smartphone, ThumbsUp, ThumbsDown, MessageCircle, Eye, ChevronDown, ChevronUp, Send, AtSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  signal: Signal & {
    image_url?: string | null
    subject_full_name?: string | null
    subject_social_handle?: string | null
    green_flag_votes?: number
    red_flag_votes?: number
    view_count?: number
    comment_count?: number
  }
  currentUserId: string
  isVerified: boolean
}

interface Comment {
  id: string
  user_id: string
  content: string
  created_at: string
  user_email?: string
}

const signalInfo = {
  green: { label: 'Positive', color: 'text-[var(--signal-green)]', bg: 'bg-[var(--signal-green)]/10', emoji: '✓' },
  yellow: { label: 'Mixed', color: 'text-[var(--signal-yellow)]', bg: 'bg-[var(--signal-yellow)]/10', emoji: '~' },
  red: { label: 'Negative', color: 'text-[var(--signal-red)]', bg: 'bg-[var(--signal-red)]/10', emoji: '!' },
}

export function SignalCard({ signal, currentUserId, isVerified }: SignalCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [userVote, setUserVote] = useState<'green_flag' | 'red_flag' | null>(null)
  const [greenVotes, setGreenVotes] = useState(signal.green_flag_votes || 0)
  const [redVotes, setRedVotes] = useState(signal.red_flag_votes || 0)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const info = signalInfo[signal.overall_signal as keyof typeof signalInfo] || signalInfo.yellow
  const displayName = signal.subject_full_name || `${signal.subject_first_name} ${signal.subject_last_initial || ''}.`

  // Fetch user's existing vote
  useEffect(() => {
    async function fetchUserVote() {
      const { data } = await supabase
        .from('signal_votes')
        .select('vote_type')
        .eq('signal_id', signal.id)
        .eq('user_id', currentUserId)
        .single()
      
      if (data) {
        setUserVote(data.vote_type as 'green_flag' | 'red_flag')
      }
    }
    if (isVerified) {
      fetchUserVote()
    }
  }, [signal.id, currentUserId, isVerified, supabase])

  async function handleVote(voteType: 'green_flag' | 'red_flag') {
    if (!isVerified) {
      toast({ title: 'You must be verified to vote', variant: 'destructive' })
      return
    }
    
    setIsLoading(true)
    try {
      if (userVote === voteType) {
        // Remove vote
        await supabase
          .from('signal_votes')
          .delete()
          .eq('signal_id', signal.id)
          .eq('user_id', currentUserId)
        
        if (voteType === 'green_flag') {
          setGreenVotes(prev => Math.max(0, prev - 1))
        } else {
          setRedVotes(prev => Math.max(0, prev - 1))
        }
        setUserVote(null)
      } else {
        // Add or change vote
        const { error } = await supabase
          .from('signal_votes')
          .upsert({
            signal_id: signal.id,
            user_id: currentUserId,
            vote_type: voteType,
          }, { onConflict: 'signal_id,user_id' })
        
        if (error) throw error
        
        // Update counts
        if (userVote) {
          if (userVote === 'green_flag') {
            setGreenVotes(prev => Math.max(0, prev - 1))
          } else {
            setRedVotes(prev => Math.max(0, prev - 1))
          }
        }
        
        if (voteType === 'green_flag') {
          setGreenVotes(prev => prev + 1)
        } else {
          setRedVotes(prev => prev + 1)
        }
        setUserVote(voteType)
      }
    } catch (error) {
      console.error('[v0] Vote error:', error)
      toast({ title: 'Failed to vote', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  async function loadComments() {
    setLoadingComments(true)
    try {
      const { data, error } = await supabase
        .from('signal_comments')
        .select('*, profiles:user_id(email)')
        .eq('signal_id', signal.id)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      setComments(data?.map(c => ({
        ...c,
        user_email: (c.profiles as { email: string } | null)?.email
      })) || [])
    } catch (error) {
      console.error('[v0] Load comments error:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  async function handleSubmitComment() {
    if (!newComment.trim() || !isVerified) return
    
    setSubmittingComment(true)
    try {
      const { data, error } = await supabase
        .from('signal_comments')
        .insert({
          signal_id: signal.id,
          user_id: currentUserId,
          content: newComment.trim(),
        })
        .select('*, profiles:user_id(email)')
        .single()
      
      if (error) throw error
      
      setComments(prev => [...prev, {
        ...data,
        user_email: (data.profiles as { email: string } | null)?.email
      }])
      setNewComment('')
      toast({ title: 'Comment added' })
    } catch (error) {
      console.error('[v0] Submit comment error:', error)
      toast({ title: 'Failed to add comment', variant: 'destructive' })
    } finally {
      setSubmittingComment(false)
    }
  }

  async function handleReport() {
    if (!isVerified) {
      toast({ title: 'You must be verified to report signals', variant: 'destructive' })
      return
    }
    
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: currentUserId,
          signal_id: signal.id,
          reason: 'other',
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

  function toggleComments() {
    if (!showComments) {
      loadComments()
    }
    setShowComments(!showComments)
  }

  return (
    <div className="glass-card rounded-xl p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${info.bg} ${info.color}`}>
            {info.emoji}
          </div>
          
          <div>
            <p className={`font-medium ${!isVerified ? 'blur-sm select-none' : ''}`}>
              {displayName}
            </p>
            {signal.subject_social_handle && isVerified && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AtSign className="w-3 h-3" />
                {signal.subject_social_handle.replace('@', '')}
              </p>
            )}
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

      {/* Image */}
      {signal.image_url && isVerified && (
        <div className="relative w-full h-48 rounded-lg overflow-hidden mb-3">
          <Image src={signal.image_url || "/placeholder.svg"} alt="Signal image" fill className="object-cover" />
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

      {/* Voting & Engagement */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-4">
          {/* Green Flag Vote */}
          <button
            onClick={() => handleVote('green_flag')}
            disabled={isLoading || !isVerified}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
              userVote === 'green_flag' 
                ? 'bg-emerald-500 text-white' 
                : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
            } disabled:opacity-50`}
          >
            <ThumbsUp className={`w-4 h-4 ${userVote === 'green_flag' ? 'fill-current' : ''}`} />
            <span>Green Flag</span>
            <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">{greenVotes}</span>
          </button>
          
          {/* Red Flag Vote */}
          <button
            onClick={() => handleVote('red_flag')}
            disabled={isLoading || !isVerified}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
              userVote === 'red_flag' 
                ? 'bg-red-500 text-white' 
                : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
            } disabled:opacity-50`}
          >
            <ThumbsDown className={`w-4 h-4 ${userVote === 'red_flag' ? 'fill-current' : ''}`} />
            <span>Red Flag</span>
            <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">{redVotes}</span>
          </button>
          
          {/* Comments */}
          <button
            onClick={toggleComments}
            disabled={!isVerified}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{signal.comment_count || 0}</span>
            {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
        
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {signal.experience_type && <span className="capitalize">{signal.experience_type.replace('_', ' ')}</span>}
          {(signal.view_count ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {signal.view_count}
            </span>
          )}
        </div>
      </div>

      {/* Comments Section */}
      {showComments && isVerified && (
        <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
          {loadingComments ? (
            <p className="text-sm text-muted-foreground text-center">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center">No comments yet</p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      Anonymous
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
          
          {/* Add Comment */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value.slice(0, 500))}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
              disabled={submittingComment}
              className="flex-1"
            />
            <Button
              size="icon"
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || submittingComment}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
