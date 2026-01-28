import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PostSignalForm } from '@/components/post-signal-form'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function PostPage() {
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Post a Signal</h1>
        <p className="text-muted-foreground text-sm">
          Share your experience to help others stay informed
        </p>
      </div>

      {isVerified ? (
        <PostSignalForm userId={user.id} />
      ) : (
        <div className="glass-card rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">Posting Locked</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You must be verified to post signals. Your account is currently pending verification.
          </p>
          <Link href="/feed">
            <Button variant="outline">Back to Feed</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
