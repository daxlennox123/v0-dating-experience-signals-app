'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, CheckCircle, AlertCircle } from 'lucide-react'

export default function SetupPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const seedAdmin = async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/seed-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'daxlennox1@gmail.com',
          password: 'Scrunches1'
        })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setStatus('success')
        setMessage(data.message)
      } else {
        setStatus('error')
        setMessage(data.error)
      }
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md glass-card-elevated">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-foreground">SideNote Setup</CardTitle>
          <CardDescription className="text-muted-foreground">
            Create the initial admin account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'idle' && (
            <>
              <p className="text-sm text-muted-foreground text-center">
                This will create an admin account with:
              </p>
              <div className="bg-muted/50 rounded-lg p-3 text-sm font-mono text-foreground">
                <p>Email: daxlennox1@gmail.com</p>
                <p>Role: Admin (verified)</p>
              </div>
              <Button onClick={seedAdmin} className="w-full">
                Create Admin Account
              </Button>
            </>
          )}
          
          {status === 'loading' && (
            <div className="text-center py-4">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="mt-2 text-sm text-muted-foreground">Creating account...</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <p className="mt-2 font-medium text-foreground">{message}</p>
              <p className="text-sm text-muted-foreground mt-1">
                You can now log in at /auth/login
              </p>
              <Button asChild className="mt-4">
                <a href="/auth/login">Go to Login</a>
              </Button>
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-center py-4">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
              <p className="mt-2 font-medium text-foreground">Error</p>
              <p className="text-sm text-destructive mt-1">{message}</p>
              <Button onClick={seedAdmin} variant="outline" className="mt-4 bg-transparent">
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
