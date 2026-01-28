'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollText, Shield, FileText, User, AlertTriangle, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AuditLog {
  id: string
  actor_id: string
  action: string
  target_type: string
  target_id: string
  details: Record<string, unknown>
  ip_address: string | null
  created_at: string
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState<string>('all')
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchLogs()
  }, [actionFilter])

  async function fetchLogs() {
    setLoading(true)
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (actionFilter !== 'all') {
      query = query.ilike('action', `%${actionFilter}%`)
    }

    const { data, error } = await query

    if (error) {
      toast({ title: 'Failed to fetch audit logs', variant: 'destructive' })
    } else {
      setLogs(data || [])
    }
    setLoading(false)
  }

  const getActionIcon = (action: string) => {
    if (action.includes('signal')) return <FileText className="h-4 w-4 text-primary" />
    if (action.includes('user') || action.includes('role')) return <User className="h-4 w-4 text-blue-500" />
    if (action.includes('report') || action.includes('claim')) return <AlertTriangle className="h-4 w-4 text-amber-500" />
    if (action.includes('verify') || action.includes('approve')) return <CheckCircle className="h-4 w-4 text-emerald-500" />
    return <Shield className="h-4 w-4 text-muted-foreground" />
  }

  const getActionBadge = (action: string) => {
    const actionColors: Record<string, string> = {
      'create': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      'update': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      'delete': 'bg-red-500/10 text-red-600 border-red-500/20',
      'approve': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      'reject': 'bg-red-500/10 text-red-600 border-red-500/20',
    }
    
    const actionType = Object.keys(actionColors).find(key => action.toLowerCase().includes(key))
    const colorClass = actionType ? actionColors[actionType] : 'bg-muted text-muted-foreground'
    
    return <Badge className={colorClass}>{action.replace(/_/g, ' ')}</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Audit Log</h1>
        <p className="text-muted-foreground">Track all administrative actions</p>
      </div>

      <div className="flex gap-4">
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="signal">Signal Actions</SelectItem>
            <SelectItem value="user">User Actions</SelectItem>
            <SelectItem value="report">Report Actions</SelectItem>
            <SelectItem value="claim">Claim Actions</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading audit logs...</div>
      ) : logs.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <ScrollText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No audit logs found</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                  <div className="mt-1">{getActionIcon(log.action)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getActionBadge(log.action)}
                      <span className="text-sm text-muted-foreground">on</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {log.target_type}:{log.target_id.slice(0, 8)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      by <span className="font-mono">{log.actor_id.slice(0, 8)}...</span>
                      {log.ip_address && <span> from {log.ip_address}</span>}
                    </p>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <pre className="mt-2 text-xs bg-muted/30 rounded p-2 overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
