import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SignalCard } from '@/components/signal-card'
import { FeedFilters } from '@/components/feed-filters'
import { AlertTriangle } from 'lucide-react'

interface FeedPageProps {
  searchParams: Promise<{
    color?: string
    sort?: string
  }>
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const params = await searchParams
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

  const isVerified = profile.account_status === 'approved'

  // Build query for signals
  let query = supabase
    .from('signals')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50)

  // Apply signal type filter
  if (params.color && params.color !== 'all') {
    const signalTypeMap: Record<string, string> = {
      'green': 'positive',
      'yellow': 'neutral', 
      'red': 'negative'
    }
    query = query.eq('overall_signal', signalTypeMap[params.color] || params.color)
  }

  const { data: signals, error } = await query

  if (error) {
    console.error('[v0] Error fetching signals:', error)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Signal Feed</h1>
        <p className="text-muted-foreground text-sm">
          Recent signals from the community
        </p>
      </div>

      {/* Verification Warning */}
      {!isVerified && (
        <div className="glass-card rounded-xl p-4 mb-6 border-l-4 border-l-yellow-500">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Account Pending Verification</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your account is being reviewed. Some content is blurred and posting is disabled until verification is complete.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <FeedFilters />

      {/* Signals List */}
      <div className="space-y-4">
        {signals && signals.length > 0 ? (
          signals.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              currentUserId={user.id}
              isVerified={isVerified}
            />
          ))
        ) : (
          <div className="glass-card rounded-xl p-8 text-center">
            <p className="text-muted-foreground">No signals yet. Be the first to post!</p>
          </div>
        )}
      </div>
    </div>
  )
}
