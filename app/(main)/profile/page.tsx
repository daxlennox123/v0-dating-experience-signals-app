import React from "react"
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Shield, CheckCircle, Clock, Users, TrendingUp, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateInviteCode } from '@/lib/signal-utils'
import { InviteGenerator } from '@/components/invite-generator'

export default async function ProfilePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  // Get user's signals count
  const { count: signalsCount } = await supabase
    .from('signals')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', user.id)
    .eq('status', 'approved')

  // Get user's active invite
  const { data: activeInvite } = await supabase
    .from('invites')
    .select('*')
    .eq('created_by', user.id)
    .is('used_by', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const isVerified = profile.account_status === 'approved'
  const isAdmin = profile.role === 'admin'

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header Card */}
      <div className="glass-card rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{profile.email?.split('@')[0] || 'Anonymous User'}</h1>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <div className="flex items-center gap-2 mt-2">
              {isVerified ? (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-medium">
                  <Clock className="w-3 h-3" />
                  Pending Verification
                </div>
              )}
              <span className="text-xs text-muted-foreground">
                Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Signals Posted"
          value={signalsCount || 0}
        />
        <StatCard
          icon={<Users className="w-4 h-4" />}
          label="Invites Left"
          value={profile.invites_remaining || 0}
        />
      </div>

      {/* Invite Section - show for verified users or admins */}
      {(isVerified || isAdmin) && (
        <div className="glass-card rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Invite a Friend</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Help grow our trusted community by inviting someone you know. You can have one active invite at a time.
          </p>
          <InviteGenerator 
            userId={user.id} 
            existingInvite={activeInvite}
          />
        </div>
      )}

      {/* Account Actions */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="font-semibold mb-4">Account</h2>
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
            <a href="/settings">Account Settings</a>
          </Button>
          <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive bg-transparent" asChild>
            <a href="/auth/login">Sign Out</a>
          </Button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="glass-card rounded-xl p-4 text-center">
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
