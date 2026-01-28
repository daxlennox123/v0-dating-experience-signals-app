'use client'

import React from "react"

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Shield, Loader2, ArrowLeft, ArrowRight, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'

type Step = 'invite' | 'account' | 'guidelines' | 'selfie'

export default function InvitePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialCode = searchParams.get('code') || ''
  const { toast } = useToast()
  
  const [step, setStep] = useState<Step>('invite')
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  
  // Form data
  const [inviteCode, setInviteCode] = useState(initialCode)
  const [inviteValid, setInviteValid] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [acceptedGuidelines, setAcceptedGuidelines] = useState(false)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)

  // Validate invite code
  async function validateInviteCode() {
    if (!inviteCode.trim()) return
    
    setIsValidating(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .eq('code', inviteCode.toUpperCase().trim())
        .is('used_by', null)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error || !data) {
        toast({ title: 'Invalid or expired invite code', variant: 'destructive' })
        setInviteValid(false)
      } else {
        setInviteValid(true)
        toast({ title: 'Valid invite code!' })
      }
    } catch {
      toast({ title: 'Failed to validate code', variant: 'destructive' })
    } finally {
      setIsValidating(false)
    }
  }

  // Handle selfie selection
  function handleSelfieChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Image must be less than 5MB', variant: 'destructive' })
        return
      }
      setSelfieFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelfiePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Final submission
  async function handleSubmit() {
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' })
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      
      // 1. Create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || 
            `${window.location.origin}/auth/callback`,
          data: {
            display_name: displayName,
            invite_code: inviteCode.toUpperCase().trim(),
          }
        }
      })

      if (authError) {
        toast({ title: authError.message, variant: 'destructive' })
        setIsLoading(false)
        return
      }

      if (!authData.user) {
        toast({ title: 'Failed to create account', variant: 'destructive' })
        setIsLoading(false)
        return
      }

      // 2. Mark invite as used (using server action or edge function in production)
      // For now, we rely on the database trigger

      toast({ title: 'Account created! Please check your email to verify.' })
      router.push('/auth/sign-up-success')
    } catch (error) {
      console.error('[v0] Sign up error:', error)
      toast({ title: 'Something went wrong. Please try again.', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted" />
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 blur-3xl rounded-full" />
      </div>

      {/* Header */}
      <header className="p-4">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </header>

      {/* Progress */}
      <div className="px-4 py-2">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center gap-2">
            {(['invite', 'account', 'guidelines', 'selfie'] as Step[]).map((s, i) => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= ['invite', 'account', 'guidelines', 'selfie'].indexOf(step) 
                    ? 'bg-primary' 
                    : 'bg-muted'
                }`} />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Invite</span>
            <span>Account</span>
            <span>Guidelines</span>
            <span>Verify</span>
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4">
              <Shield className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">
              {step === 'invite' && 'Enter Invite Code'}
              {step === 'account' && 'Create Account'}
              {step === 'guidelines' && 'Community Guidelines'}
              {step === 'selfie' && 'Verify Identity'}
            </h1>
            <p className="text-muted-foreground text-sm mt-1 text-center">
              {step === 'invite' && 'You need a valid invite code to join'}
              {step === 'account' && 'Set up your SideNote account'}
              {step === 'guidelines' && 'Please read and accept our guidelines'}
              {step === 'selfie' && 'Upload a selfie for manual verification'}
            </p>
          </div>

          {/* Step: Invite Code */}
          {step === 'invite' && (
            <div className="glass-card rounded-2xl p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteCode">Invite Code</Label>
                  <Input
                    id="inviteCode"
                    placeholder="ABCD1234"
                    value={inviteCode}
                    onChange={(e) => {
                      setInviteCode(e.target.value.toUpperCase())
                      setInviteValid(false)
                    }}
                    className="text-center text-lg tracking-widest font-mono"
                    maxLength={8}
                  />
                </div>

                {inviteValid && (
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Check className="w-4 h-4" />
                    Invite code verified
                  </div>
                )}

                <div className="flex gap-2">
                  {!inviteValid && (
                    <Button 
                      onClick={validateInviteCode} 
                      variant="secondary"
                      disabled={isValidating || !inviteCode.trim()}
                      className="flex-1"
                    >
                      {isValidating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Verify Code'
                      )}
                    </Button>
                  )}
                  <Button 
                    onClick={() => setStep('account')} 
                    disabled={!inviteValid}
                    className="flex-1"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step: Account Details */}
          {step === 'account' && (
            <div className="glass-card rounded-2xl p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    placeholder="How you'll appear to others"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={20}
                  />
                  <p className="text-xs text-muted-foreground">This can be anonymous (e.g., "CityGuy42")</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setStep('invite')}>
                    Back
                  </Button>
                  <Button 
                    onClick={() => setStep('guidelines')} 
                    disabled={!email || !password || password !== confirmPassword || !displayName}
                    className="flex-1"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step: Guidelines */}
          {step === 'guidelines' && (
            <div className="glass-card rounded-2xl p-6">
              <div className="space-y-4">
                <div className="max-h-64 overflow-y-auto text-sm text-muted-foreground space-y-3 pr-2">
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p><strong>No Full Names:</strong> Never include full names of subjects. Use first names or initials only.</p>
                  </div>
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p><strong>No Addresses:</strong> Do not share specific addresses, workplaces, or other identifying locations.</p>
                  </div>
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p><strong>Keep It Factual:</strong> Share your genuine experience without exaggeration or false claims.</p>
                  </div>
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p><strong>No Harassment:</strong> This platform is for safety, not revenge. Malicious posts will result in a ban.</p>
                  </div>
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p><strong>No Screenshots:</strong> Sharing signals outside the platform violates trust and will result in removal.</p>
                  </div>
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p><strong>Respect Privacy:</strong> All content is confidential. Violations are tracked and may have consequences.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-4 border-t border-border">
                  <Checkbox 
                    id="guidelines" 
                    checked={acceptedGuidelines}
                    onCheckedChange={(checked) => setAcceptedGuidelines(checked === true)}
                  />
                  <Label htmlFor="guidelines" className="text-sm font-normal cursor-pointer">
                    I have read and agree to follow the community guidelines. I understand that violations may result in removal.
                  </Label>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setStep('account')}>
                    Back
                  </Button>
                  <Button 
                    onClick={() => setStep('selfie')} 
                    disabled={!acceptedGuidelines}
                    className="flex-1"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step: Selfie Verification */}
          {step === 'selfie' && (
            <div className="glass-card rounded-2xl p-6">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">Upload a clear selfie for manual verification. This helps us maintain a trusted community.</p>
                  <p className="text-xs">Your selfie is reviewed by admins only and never shared.</p>
                </div>

                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
                  {selfiePreview ? (
                    <div className="space-y-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={selfiePreview || "/placeholder.svg"} 
                        alt="Selfie preview" 
                        className="w-32 h-32 object-cover rounded-full mx-auto"
                      />
                      <Button variant="ghost" size="sm" onClick={() => {
                        setSelfieFile(null)
                        setSelfiePreview(null)
                      }}>
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleSelfieChange}
                      />
                      <div className="py-4">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                          <Shield className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">Click to upload selfie</p>
                        <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 5MB</p>
                      </div>
                    </label>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setStep('guidelines')}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isLoading || !selfieFile}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
