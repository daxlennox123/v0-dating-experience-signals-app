'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Shield, ShieldAlert, ShieldOff, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Profile } from '@/lib/types'

export default function AdminUsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [roleFilter])

  async function fetchUsers() {
    setLoading(true)
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (roleFilter !== 'all') {
      query = query.eq('role', roleFilter)
    }

    const { data, error } = await query

    if (error) {
      toast({ title: 'Failed to fetch users', variant: 'destructive' })
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  async function updateUserRole(userId: string, newRole: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      toast({ title: 'Failed to update role', variant: 'destructive' })
    } else {
      toast({ title: 'Role updated' })
      fetchUsers()
    }
  }

  async function updateAccountStatus(userId: string, status: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ account_status: status })
      .eq('id', userId)

    if (error) {
      toast({ title: 'Failed to update account status', variant: 'destructive' })
    } else {
      toast({ title: 'Account status updated' })
      fetchUsers()
    }
  }

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(search.toLowerCase()) ||
    user.id.toLowerCase().includes(search.toLowerCase())
  )

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <ShieldAlert className="h-4 w-4 text-red-500" />
      case 'mod': return <Shield className="h-4 w-4 text-amber-500" />
      default: return <User className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Approved</Badge>
      case 'pending': return <Badge variant="secondary">Pending</Badge>
      case 'suspended': return <Badge variant="destructive">Suspended</Badge>
      case 'banned': return <Badge variant="destructive">Banned</Badge>
      default: return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">User Management</h1>
        <p className="text-muted-foreground">Manage user roles and verification status</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="mod">Moderators</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading users...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invites</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <span className="font-medium">{user.email?.split('@')[0] || 'Anonymous'}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value) => updateUserRole(user.id, value)}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="mod">Mod</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{getStatusBadge(user.account_status)}</TableCell>
                    <TableCell>{user.invites_remaining || 0}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {user.account_status !== 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateAccountStatus(user.id, 'approved')}
                          >
                            Approve
                          </Button>
                        )}
                        {user.account_status !== 'suspended' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => updateAccountStatus(user.id, 'suspended')}
                          >
                            <ShieldOff className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
