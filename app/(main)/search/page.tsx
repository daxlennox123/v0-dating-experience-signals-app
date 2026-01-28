import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SearchForm } from '@/components/search-form'
import { SignalCard } from '@/components/signal-card'
import { Search as SearchIcon, Lock } from 'lucide-react'
import { hashIdentifier } from '@/lib/signal-utils'

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
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
  const query = params.q?.trim()

  let signals: Awaited<ReturnType<typeof supabase.from<'signals'>>>['data'] = null
  let searchPerformed = false

  if (query && isVerified) {
    searchPerformed = true
    
    // Hash the search query to match against stored hashes
    const queryHash = await hashIdentifier(query)
    
    const { data, error } = await supabase
      .from('signals')
      .select('*')
      .eq('moderation_status', 'approved')
      .eq('subject_identifier_hash', queryHash)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('[v0] Search error:', error)
    } else {
      signals = data
    }
  }

  // Get user's claims for these signals
  const signalIds = signals?.map(s => s.id) || []
  const { data: claims } = signalIds.length > 0 
    ? await supabase
        .from('claims')
        .select('signal_id, claim_type')
        .eq('user_id', user.id)
        .in('signal_id', signalIds)
    : { data: [] }

  const claimsMap = new Map(claims?.map(c => [c.signal_id, c.claim_type]))

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Search Signals</h1>
        <p className="text-muted-foreground text-sm">
          Look up signals by phone number or Instagram handle
        </p>
      </div>

      {/* Search Form */}
      <SearchForm initialQuery={query} disabled={!isVerified} />

      {/* Gated Message for Unverified */}
      {!isVerified && (
        <div className="glass-card rounded-xl p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">Search Locked</h3>
          <p className="text-sm text-muted-foreground">
            Search functionality is available after your account is verified. This helps protect our community.
          </p>
        </div>
      )}

      {/* Results */}
      {isVerified && (
        <>
          {searchPerformed ? (
            <div className="space-y-4">
              {signals && signals.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Found {signals.length} signal{signals.length !== 1 ? 's' : ''} matching your search
                  </p>
                  {signals.map((signal) => (
                    <SignalCard
                      key={signal.id}
                      signal={signal}
                      currentUserId={user.id}
                      isVerified={isVerified}
                      userClaim={claimsMap.get(signal.id) as 'confirm' | 'dispute' | null}
                    />
                  ))}
                </>
              ) : (
                <div className="glass-card rounded-xl p-8 text-center">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <SearchIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">No Signals Found</h3>
                  <p className="text-sm text-muted-foreground">
                    No signals match this identifier. This could mean no one has posted about them yet.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card rounded-xl p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Search by Identifier</h3>
              <p className="text-sm text-muted-foreground">
                Enter a phone number or Instagram handle to see if there are any signals about that person.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
