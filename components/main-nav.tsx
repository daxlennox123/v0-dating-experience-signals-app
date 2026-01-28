'use client'

import React from "react"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Shield, Home, Search, PlusCircle, UserIcon, Settings, LogOut, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Profile } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

interface MainNavProps {
  user: User
  profile: Profile
}

export function MainNav({ user, profile }: MainNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isVerified = profile.account_status === 'approved'
  const isAdmin = profile.role === 'admin' || profile.role === 'mod'

  return (
    <>
      {/* Desktop Nav */}
      <header className="hidden md:block glass-card border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/feed" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold">SideNote</span>
            </Link>

            <nav className="flex items-center gap-1">
              <NavLink href="/feed" active={pathname === '/feed'}>
                <Home className="w-4 h-4" />
                Feed
              </NavLink>
              <NavLink href="/search" active={pathname === '/search'}>
                <Search className="w-4 h-4" />
                Search
              </NavLink>
              {isVerified && (
                <NavLink href="/post" active={pathname === '/post'}>
                  <PlusCircle className="w-4 h-4" />
                  Post Signal
                </NavLink>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {!isVerified && (
              <div className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                Pending Verification
              </div>
            )}
            
            {isAdmin && (
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ShieldCheck className="w-4 h-4 mr-1" />
                  Admin
                </Button>
              </Link>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="max-w-24 truncate">{profile.email?.split('@')[0] || 'User'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{profile.email?.split('@')[0]}</p>
                  <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <UserIcon className="w-4 h-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-card border-t border-border/50 z-50">
        <div className="flex items-center justify-around py-2">
          <MobileNavLink href="/feed" active={pathname === '/feed'}>
            <Home className="w-5 h-5" />
            <span>Feed</span>
          </MobileNavLink>
          <MobileNavLink href="/search" active={pathname === '/search'}>
            <Search className="w-5 h-5" />
            <span>Search</span>
          </MobileNavLink>
          {isVerified && (
            <MobileNavLink href="/post" active={pathname === '/post'}>
              <PlusCircle className="w-5 h-5" />
              <span>Post</span>
            </MobileNavLink>
          )}
          <MobileNavLink href="/profile" active={pathname === '/profile'}>
            <UserIcon className="w-5 h-5" />
            <span>Profile</span>
          </MobileNavLink>
        </div>
      </nav>
    </>
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

function MobileNavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors ${
        active ? 'text-primary' : 'text-muted-foreground'
      }`}
    >
      {children}
    </Link>
  )
}
