'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export default function AdminSettingsPage() {
  const [requireInvite, setRequireInvite] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'require_invite_code')
        .single()
      
      if (data) {
        setRequireInvite(data.value === 'true')
      }
      setLoading(false)
    }
    fetchSettings()
  }, [supabase])

  async function toggleInviteRequirement(checked: boolean) {
    setSaving(true)
    
    const { error } = await supabase
      .from('app_settings')
      .upsert({ 
        key: 'require_invite_code', 
        value: checked ? 'true' : 'false' 
      }, { 
        onConflict: 'key' 
      })

    if (error) {
      toast({ title: 'Failed to update setting', variant: 'destructive' })
    } else {
      setRequireInvite(checked)
      toast({ title: checked ? 'Invite codes now required' : 'Open signup enabled' })
    }
    
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Configure app-wide settings</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Signup Settings</CardTitle>
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
                <span className="text-signal-yellow">Invite codes required - Only users with valid codes can sign up</span>
              ) : (
                <span className="text-signal-green">Open signup - Anyone can create an account</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Admin Account</CardTitle>
          <CardDescription>Special admin privileges</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The email <strong>daxlennox1@gmail.com</strong> is automatically granted admin privileges when signing up, regardless of invite code settings.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
