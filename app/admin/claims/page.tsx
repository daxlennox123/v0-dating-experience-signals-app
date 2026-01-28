'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserCheck, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Claim {
  id: string
  signal_id: string
  claimant_id: string
  evidence_description: string
  status: string
  created_at: string
  resolved_at: string | null
  resolved_by: string | null
  resolution_notes: string | null
  signals?: {
    id: string
    subject_name_hash: string
    signal_type: string
    narrative: string
  }
}

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchClaims()
  }, [statusFilter])

  async function fetchClaims() {
    setLoading(true)
    let query = supabase
      .from('subject_claims')
      .select(`
        *,
        signals (
          id,
          subject_name_hash,
          signal_type,
          narrative
        )
      `)
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query

    if (error) {
      toast({ title: 'Failed to fetch claims', variant: 'destructive' })
    } else {
      setClaims(data || [])
    }
    setLoading(false)
  }

  async function resolveClaim(claimId: string, action: 'verified' | 'rejected', notes?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('subject_claims')
      .update({
        status: action,
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
        resolution_notes: notes || null
      })
      .eq('id', claimId)

    if (error) {
      toast({ title: 'Failed to resolve claim', variant: 'destructive' })
    } else {
      toast({ title: action === 'verified' ? 'Claim verified - signal will be reviewed' : 'Claim rejected' })
      fetchClaims()
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pending Review</Badge>
      case 'verified': return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"><CheckCircle className="h-3 w-3" /> Verified</Badge>
      case 'rejected': return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Subject Claims</h1>
        <p className="text-muted-foreground">Review claims from people who say a signal is about them</p>
      </div>

      <Card className="glass-card border-amber-500/30 bg-amber-500/5">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Handle with care</p>
              <p className="text-muted-foreground">Subject claims require careful verification. If verified, the signal author may be notified and the signal may be removed or modified.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Claims</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading claims...</div>
      ) : claims.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No {statusFilter !== 'all' ? statusFilter : ''} claims</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <Card key={claim.id} className="glass-card">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-base">Subject Identity Claim</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Submitted {new Date(claim.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(claim.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Evidence Description</p>
                  <p className="text-sm">{claim.evidence_description}</p>
                </div>

                {claim.signals && (
                  <div className="border border-border rounded-lg p-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Claimed Signal</p>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={claim.signals.signal_type === 'green' ? 'default' : claim.signals.signal_type === 'yellow' ? 'secondary' : 'destructive'}>
                        {claim.signals.signal_type.toUpperCase()}
                      </Badge>
                      <span className="text-sm font-mono text-muted-foreground">
                        #{claim.signals.subject_name_hash.slice(0, 8)}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-3">{claim.signals.narrative}</p>
                  </div>
                )}

                {claim.resolution_notes && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Resolution Notes</p>
                    <p className="text-sm">{claim.resolution_notes}</p>
                  </div>
                )}

                {claim.status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => resolveClaim(claim.id, 'verified', 'Claim verified after review')}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify Claim
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => resolveClaim(claim.id, 'rejected', 'Insufficient evidence')}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
