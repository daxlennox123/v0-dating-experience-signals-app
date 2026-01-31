'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Settings, Users, Shield } from 'lucide-react'

export default function AdminSettingsPage() {
  const [requireInvite, setRequireInvite] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data, error: fetchError } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'require_invite_code')
          .single()
        
        if (fetchError) {
          console.error('[v0] Settings fetch error:', fetchError)
          // If no settings found, default to true
          if (fetchError.code === 'PGRST116') {
            setRequireInvite(true)
          } else {
            setError('Failed to load settings')
          }
        } else if (data) {
          setRequireInvite(data.value === 'true')
        }
      } catch (err) {
        console.error('[v0] Settings error:', err)
        setError('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [supabase])

  async function toggleInviteRequirement(checked: boolean) {
    setSaving(true)
    
    try {
      const { error: updateError } = await supabase
        .from('app_settings')
        .upsert({ 
          key: 'require_invite_code', 
          value: checked ? 'true' : 'false',
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'key' 
        })

      if (updateError) {
        console.error('[v0] Settings update error:', updateError)
        toast({ title: 'Failed to update setting', variant: 'destructive' })
      } else {
        setRequireInvite(checked)
        toast({ title: checked ? 'Invite codes now required' : 'Open signup enabled' })
      }
    } catch (err) {
      console.error('[v0] Settings update error:', err)
      toast({ title: 'Failed to update setting', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-2">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-sm text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground text-sm">Configure app-wide settings</p>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            <CardTitle>Signup Settings</CardTitle>
          </div>
          <CardDescription>Control how new users can join SideNote</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="require-invite" className="text-base font-medium">
                Require Invite Code
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, new users need a valid invite code to sign up.
                When disabled, anyone can create an account.
              </p>
            </div>
            <Switch
              id="require-invite"
              checked={requireInvite}
              onCheckedChange={toggleInviteRequirement}
              disabled={saving}
            />
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <strong>Current status:</strong>{' '}
              {requireInvite ? (
                <span className="text-[var(--signal-yellow)]">Invite codes required - Only users with valid codes can sign up</span>
              ) : (
                <span className="text-[var(--signal-green)]">Open signup - Anyone can create an account</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <CardTitle>Admin Account</CardTitle>
          </div>
          <CardDescription>Special admin privileges</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The email <strong className="text-foreground">daxlennox1@gmail.com</strong> is automatically granted admin privileges when signing up, regardless of invite code settings.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
