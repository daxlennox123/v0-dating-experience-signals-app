'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, CheckCircle, XCircle, Clock, ImageIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Report {
  id: string
  signal_id: string
  reporter_id: string
  reason: string
  details: string | null
  status: string
  created_at: string
  resolved_at: string | null
  resolved_by: string | null
  signals?: {
    id: string
    subject_first_name: string
    subject_last_initial: string | null
    subject_full_name: string | null
    overall_signal: 'green' | 'yellow' | 'red'
    description: string
    image_url: string | null
  }
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchReports()
  }, [statusFilter])

  async function fetchReports() {
    setLoading(true)
    let query = supabase
      .from('reports')
      .select(`
        *,
        signals (
          id,
          subject_first_name,
          subject_last_initial,
          subject_full_name,
          overall_signal,
          description,
          image_url
        )
      `)
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query

    if (error) {
      console.log('[v0] Reports fetch error:', error)
      toast({ title: 'Failed to fetch reports', variant: 'destructive' })
    } else {
      setReports(data || [])
    }
    setLoading(false)
  }

  async function resolveReport(reportId: string, action: 'dismissed' | 'resolved') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('reports')
      .update({
        status: action,
        resolved_at: new Date().toISOString(),
        resolved_by: user.id
      })
      .eq('id', reportId)

    if (error) {
      toast({ title: 'Failed to resolve report', variant: 'destructive' })
    } else {
      toast({ title: action === 'resolved' ? 'Report resolved - signal will be reviewed' : 'Report dismissed' })
      fetchReports()
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>
      case 'resolved': return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"><CheckCircle className="h-3 w-3" /> Resolved</Badge>
      case 'dismissed': return <Badge variant="outline" className="gap-1"><XCircle className="h-3 w-3" /> Dismissed</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const getReasonLabel = (reason: string) => {
    const reasons: Record<string, string> = {
      'false_info': 'False Information',
      'harassment': 'Harassment',
      'doxxing': 'Doxxing Attempt',
      'spam': 'Spam',
      'other': 'Other'
    }
    return reasons[reason] || reason
  }

  const getSignalColor = (signal: 'green' | 'yellow' | 'red') => {
    switch (signal) {
      case 'green': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
      case 'yellow': return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      case 'red': return 'bg-red-500/10 text-red-600 border-red-500/20'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
        <p className="text-muted-foreground">Review and resolve user reports</p>
      </div>

      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reports</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading reports...</div>
      ) : reports.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
            <p className="text-muted-foreground">No {statusFilter !== 'all' ? statusFilter : ''} reports</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="glass-card">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <div>
                      <CardTitle className="text-base">{getReasonLabel(report.reason)}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Reported {new Date(report.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(report.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.details && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Reporter Details</p>
                    <p className="text-sm">{report.details}</p>
                  </div>
                )}

                {report.signals && (
                  <div className="border border-border rounded-lg p-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Reported Signal</p>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getSignalColor(report.signals.overall_signal)}>
                        {report.signals.overall_signal === 'green' ? 'Positive' : report.signals.overall_signal === 'yellow' ? 'Neutral' : 'Negative'}
                      </Badge>
                      <span className="text-sm font-medium">
                        {report.signals.subject_full_name || `${report.signals.subject_first_name} ${report.signals.subject_last_initial || ''}.`}
                      </span>
                    </div>
                    
                    {report.signals.image_url && (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden mb-3 border border-border">
                        <Image 
                          src={report.signals.image_url || "/placeholder.svg"} 
                          alt="Signal attachment" 
                          fill 
                          className="object-cover" 
                        />
                      </div>
                    )}
                    
                    <p className="text-sm line-clamp-3">{report.signals.description}</p>
                  </div>
                )}

                {report.status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => resolveReport(report.id, 'resolved')}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Take Action
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => resolveReport(report.id, 'dismissed')}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Dismiss
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
