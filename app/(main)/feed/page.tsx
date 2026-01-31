import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SignalCard } from '@/components/signal-card'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface FeedPageProps {
  searchParams: Promise<{
    filter?: string
    sort?: string
  }>
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const params = await searchParams
  const filter = params.filter || 'all'
  const sort = params.sort || 'engagement'
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
    .limit(50)

  // Apply signal type filter
  if (filter === 'positive') {
    query = query.eq('overall_signal', 'green')
  } else if (filter === 'neutral') {
    query = query.eq('overall_signal', 'yellow')
  } else if (filter === 'negative') {
    query = query.eq('overall_signal', 'red')
  }

  // Apply sorting
  if (sort === 'engagement') {
    // Order by total engagement (votes + comments + views)
    query = query.order('green_flag_votes', { ascending: false })
      .order('red_flag_votes', { ascending: false })
      .order('comment_count', { ascending: false })
      .order('created_at', { ascending: false })
  } else if (sort === 'newest') {
    query = query.order('created_at', { ascending: false })
  } else if (sort === 'oldest') {
    query = query.order('created_at', { ascending: true })
  }

  const { data: signals, error } = await query

  if (error) {
    console.error('[v0] Error fetching signals:', error)
  }

  // Sort by engagement score client-side for more accurate ordering
  const sortedSignals = signals?.sort((a, b) => {
    if (sort === 'engagement') {
      const scoreA = (a.green_flag_votes || 0) + (a.red_flag_votes || 0) + (a.comment_count || 0) * 2 + (a.view_count || 0) * 0.1
      const scoreB = (b.green_flag_votes || 0) + (b.red_flag_votes || 0) + (b.comment_count || 0) * 2 + (b.view_count || 0) * 0.1
      return scoreB - scoreA
    }
    return 0
  }) || []

  const filters = [
    { key: 'all', label: 'All', color: 'bg-primary' },
    { key: 'positive', label: 'Positive', color: 'bg-[var(--signal-green)]' },
    { key: 'neutral', label: 'Neutral', color: 'bg-[var(--signal-yellow)]' },
    { key: 'negative', label: 'Negative', color: 'bg-[var(--signal-red)]' },
  ]

  const sortOptions = [
    { key: 'engagement', label: 'Trending' },
    { key: 'newest', label: 'Newest' },
    { key: 'oldest', label: 'Oldest' },
  ]

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
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Signal Type Filters */}
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <Link
              key={f.key}
              href={`/feed?filter=${f.key}&sort=${sort}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.key
                  ? `${f.color} text-white`
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex gap-2 sm:ml-auto">
          {sortOptions.map((s) => (
            <Link
              key={s.key}
              href={`/feed?filter=${filter}&sort=${s.key}`}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                sort === s.key
                  ? 'bg-foreground text-background'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Signals List */}
      <div className="space-y-4">
        {sortedSignals && sortedSignals.length > 0 ? (
          sortedSignals.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              currentUserId={user.id}
              isVerified={isVerified}
            />
          ))
        ) : (
          <div className="glass-card rounded-xl p-8 text-center">
            <p className="text-muted-foreground">
              {filter !== 'all' 
                ? `No ${filter} signals yet.`
                : 'No signals yet. Be the first to post!'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
