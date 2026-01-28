'use client'

import React from "react"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, FileText, Users, Flag, ArrowLeft, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { User } from '@supabase/supabase-js'

interface AdminNavProps {
  user: User
  profile: {
    role: string
    email: string
  }
}

export function AdminNav({ user, profile }: AdminNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="glass-card border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">Admin Panel</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/admin" active={pathname === '/admin'}>
              Overview
            </NavLink>
            <NavLink href="/admin/signals" active={pathname.startsWith('/admin/signals')}>
              <FileText className="w-4 h-4" />
              Signals
            </NavLink>
            <NavLink href="/admin/users" active={pathname.startsWith('/admin/users')}>
              <Users className="w-4 h-4" />
              Users
            </NavLink>
            <NavLink href="/admin/reports" active={pathname.startsWith('/admin/reports')}>
              <Flag className="w-4 h-4" />
              Reports
            </NavLink>
            <NavLink href="/admin/settings" active={pathname.startsWith('/admin/settings')}>
              <Settings className="w-4 h-4" />
              Settings
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/feed">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to App
            </Button>
          </Link>
          <div className="text-sm">
            <span className="text-muted-foreground">{profile.email?.split('@')[0]}</span>
            <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-primary/10 text-primary capitalize">
              {profile.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active 
          ? 'bg-primary/10 text-primary' 
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      }`}
    >
      {children}
    </Link>
  )
}
