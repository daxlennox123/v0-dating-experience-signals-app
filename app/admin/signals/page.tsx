import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { SignalModerationCard } from '@/components/signal-moderation-card'
import { Button } from '@/components/ui/button'

interface SignalsPageProps {
  searchParams: Promise<{
    status?: string
  }>
}

export default async function AdminSignalsPage({ searchParams }: SignalsPageProps) {
  const params = await searchParams
  const filterStatus = params.status || 'under_review'
  const supabase = await createClient()

  // Map filter to actual DB status values
  const dbStatus = filterStatus === 'pending' ? 'under_review' : filterStatus

  // Get signals with the selected status
  const { data: signals, error } = await supabase
    .from('signals')
    .select(`
      *,
      author:profiles!author_id(id, email, account_status, role)
    `)
    .eq('status', dbStatus)
    .order('created_at', { ascending: dbStatus === 'under_review' })
    .limit(50)

  if (error) {
    console.error('[v0] Error fetching signals:', error)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Signal Moderation</h1>
        <p className="text-muted-foreground text-sm">
          Review and moderate submitted signals
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin/signals?status=under_review">
          <Button variant={dbStatus === 'under_review' ? 'default' : 'outline'} size="sm">
            Pending Review
          </Button>
        </Link>
        <Link href="/admin/signals?status=active">
          <Button variant={dbStatus === 'active' ? 'default' : 'outline'} size="sm">
            Active
          </Button>
        </Link>
        <Link href="/admin/signals?status=hidden">
          <Button variant={dbStatus === 'hidden' ? 'default' : 'outline'} size="sm">
            Hidden
          </Button>
        </Link>
        <Link href="/admin/signals?status=removed">
          <Button variant={dbStatus === 'removed' ? 'default' : 'outline'} size="sm">
            Removed
          </Button>
        </Link>
      </div>

      {/* Signals List */}
      <div className="space-y-4">
        {signals && signals.length > 0 ? (
          signals.map((signal) => (
            <SignalModerationCard key={signal.id} signal={signal} />
          ))
        ) : (
          <div className="glass-card rounded-xl p-8 text-center">
            <p className="text-muted-foreground">No {status} signals found</p>
          </div>
        )}
      </div>
    </div>
  )
}
