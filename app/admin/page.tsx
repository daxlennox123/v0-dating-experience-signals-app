import React from "react"
import { createClient } from '@/lib/supabase/server'
import { FileText, Users, Flag, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Get counts for overview
  const [
    { count: totalSignals },
    { count: pendingSignals },
    { count: totalUsers },
    { count: pendingUsers },
    { count: pendingReports }
  ] = await Promise.all([
    supabase.from('signals').select('*', { count: 'exact', head: true }),
    supabase.from('signals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('account_status', 'pending'),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending')
  ])

  // Get recent pending signals
  const { data: recentPendingSignals } = await supabase
    .from('signals')
    .select('id, subject_first_name, subject_last_initial, overall_signal, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5)

  // Get recent pending users
  const { data: recentPendingUsers } = await supabase
    .from('profiles')
    .select('id, email, created_at')
    .eq('account_status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Overview of moderation queue and platform stats
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<FileText className="w-5 h-5" />}
          label="Total Signals"
          value={totalSignals || 0}
          href="/admin/signals"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Pending Signals"
          value={pendingSignals || 0}
          href="/admin/signals?status=pending"
          highlight={pendingSignals ? pendingSignals > 0 : false}
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Total Users"
          value={totalUsers || 0}
          href="/admin/users"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Pending Verifications"
          value={pendingUsers || 0}
          href="/admin/users?status=pending"
          highlight={pendingUsers ? pendingUsers > 0 : false}
        />
      </div>

      {/* Pending Queues */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Pending Signals */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Pending Signals
            </h2>
            <Link href="/admin/signals?status=pending" className="text-xs text-primary hover:underline">
              View All
            </Link>
          </div>
          
          {recentPendingSignals && recentPendingSignals.length > 0 ? (
            <div className="space-y-3">
              {recentPendingSignals.map((signal) => (
                <Link
                  key={signal.id}
                  href={`/admin/signals/${signal.id}`}
                  className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        signal.overall_signal === 'positive' ? 'bg-[var(--signal-green)]' :
                        signal.overall_signal === 'neutral' ? 'bg-[var(--signal-yellow)]' :
                        'bg-[var(--signal-red)]'
                      }`} />
                      <span className="font-mono text-sm">{signal.subject_first_name} {signal.subject_last_initial}.</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(signal.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No pending signals
            </div>
          )}
        </div>

        {/* Pending Users */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Pending Verifications
            </h2>
            <Link href="/admin/users?status=pending" className="text-xs text-primary hover:underline">
              View All
            </Link>
          </div>
          
          {recentPendingUsers && recentPendingUsers.length > 0 ? (
            <div className="space-y-3">
              {recentPendingUsers.map((user) => (
                <Link
                  key={user.id}
                  href={`/admin/users/${user.id}`}
                  className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{user.email?.split('@')[0] || 'No name'}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No pending verifications
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  icon, 
  label, 
  value, 
  href, 
  highlight = false 
}: { 
  icon: React.ReactNode
  label: string
  value: number
  href: string
  highlight?: boolean
}) {
  return (
    <Link href={href}>
      <div className={`glass-card rounded-xl p-4 hover:shadow-md transition-shadow ${
        highlight ? 'ring-2 ring-primary/50' : ''
      }`}>
        <div className={`mb-2 ${highlight ? 'text-primary' : 'text-muted-foreground'}`}>
          {icon}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </Link>
  )
}
