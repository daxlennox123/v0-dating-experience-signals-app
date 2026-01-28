'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Copy, Check, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { generateInviteCode } from '@/lib/signal-utils'

interface InviteGeneratorProps {
  userId: string
  existingInvite?: {
    code: string
    expires_at: string
  } | null
}

export function InviteGenerator({ userId, existingInvite }: InviteGeneratorProps) {
  const [invite, setInvite] = useState(existingInvite)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  async function generateNewInvite() {
    setIsGenerating(true)

    try {
      const supabase = createClient()
      const code = generateInviteCode()
      
      // Expires in 7 days
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { data, error } = await supabase
        .from('invites')
        .insert({
          code,
          created_by: userId,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('[v0] Invite generation error:', error)
        toast({ title: 'Failed to generate invite', variant: 'destructive' })
        return
      }

      setInvite(data)
      toast({ title: 'Invite code generated!' })
    } catch (error) {
      console.error('[v0] Invite generation error:', error)
      toast({ title: 'Something went wrong', variant: 'destructive' })
    } finally {
      setIsGenerating(false)
    }
  }

  function copyToClipboard() {
    if (!invite) return
    
    const inviteUrl = `${window.location.origin}/invite?code=${invite.code}`
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    toast({ title: 'Invite link copied!' })
    
    setTimeout(() => setCopied(false), 2000)
  }

  if (invite) {
    const expiresAt = new Date(invite.expires_at)
    const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-center tracking-widest">
            {invite.code}
          </div>
          <Button variant="outline" size="icon" onClick={copyToClipboard}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={generateNewInvite}
            disabled={isGenerating}
            className="h-auto py-1 px-2 text-xs"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
            Generate New
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Button onClick={generateNewInvite} disabled={isGenerating} className="w-full">
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        'Generate Invite Code'
      )}
    </Button>
  )
}
