import React from "react"
import Link from 'next/link'
import { Shield, Users, Lock, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted" />
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-accent/5 blur-3xl rounded-full" />
      </div>

      {/* Header */}
      <header className="glass-card border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">SideNote</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/invite">
              <Button size="sm">Join with Invite</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Lock className="w-3.5 h-3.5" />
            Private & Invite-Only
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance mb-6">
            Dating Signals You Can{' '}
            <span className="text-primary">Trust</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground text-pretty max-w-2xl mx-auto mb-10">
            A private community where men share anonymous experiences to help each other 
            date safer. No names, no drama - just signals.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/invite">
              <Button size="lg" className="w-full sm:w-auto">
                Enter Invite Code
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                Already a Member
              </Button>
            </Link>
          </div>

          {/* Features */}
          <div className="grid sm:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Eye className="w-5 h-5" />}
              title="Anonymous Signals"
              description="Share experiences without revealing identities. Subjects are hashed for privacy."
            />
            <FeatureCard
              icon={<Users className="w-5 h-5" />}
              title="Trusted Community"
              description="Invite-only access ensures quality members who follow community guidelines."
            />
            <FeatureCard
              icon={<Shield className="w-5 h-5" />}
              title="Moderated Content"
              description="Every signal is reviewed to prevent abuse and maintain trust."
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>SideNote - Private Dating Signals</p>
          <div className="flex items-center gap-4">
            <Link href="/guidelines" className="hover:text-foreground transition-colors">
              Community Guidelines
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="glass-card rounded-xl p-6 text-left">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
