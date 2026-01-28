'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, AlertTriangle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { checkProhibitedContent } from '@/lib/signal-utils'

interface PostSignalFormProps {
  userId: string
}

export function PostSignalForm({ userId }: PostSignalFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [step, setStep] = useState<'form' | 'preview' | 'success'>('form')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form fields
  const [firstName, setFirstName] = useState('')
  const [lastInitial, setLastInitial] = useState('')
  const [platform, setPlatform] = useState('')
  const [experienceType, setExperienceType] = useState('dating')
  const [signalType, setSignalType] = useState<'positive' | 'neutral' | 'negative'>('neutral')
  const [description, setDescription] = useState('')
  
  // Validation
  const [contentWarnings, setContentWarnings] = useState<string[]>([])

  function handleDescriptionChange(value: string) {
    setDescription(value)
    const check = checkProhibitedContent(value)
    setContentWarnings(check.reasons)
  }

  function handlePreview() {
    if (!firstName.trim()) {
      toast({ title: 'Please enter a first name', variant: 'destructive' })
      return
    }

    if (!lastInitial.trim() || lastInitial.length !== 1) {
      toast({ title: 'Please enter a single letter for last initial', variant: 'destructive' })
      return
    }

    const contentCheck = checkProhibitedContent(description)
    if (!contentCheck.passed) {
      toast({ title: 'Please fix the content warnings before continuing', variant: 'destructive' })
      return
    }

    if (description.length < 20) {
      toast({ title: 'Please provide more context (at least 20 characters)', variant: 'destructive' })
      return
    }

    setStep('preview')
  }

  async function handleSubmit() {
    setIsSubmitting(true)

    try {
      const supabase = createClient()
      
      // Insert the signal (will go to moderation)
      const { error } = await supabase
        .from('signals')
        .insert({
          author_id: userId,
          subject_first_name: firstName.trim(),
          subject_last_initial: lastInitial.trim().toUpperCase(),
          subject_platform: platform || null,
          experience_type: experienceType,
          overall_signal: signalType,
          description: description,
          status: 'pending',
        })

      if (error) {
        console.error('[v0] Signal submission error:', error)
        toast({ title: 'Failed to submit signal. Please try again.', variant: 'destructive' })
        setIsSubmitting(false)
        return
      }

      setStep('success')
    } catch (error) {
      console.error('[v0] Signal submission error:', error)
      toast({ title: 'Something went wrong. Please try again.', variant: 'destructive' })
      setIsSubmitting(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Check className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Signal Submitted</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Your signal has been submitted for review. It will appear on the feed once approved by our moderators.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => {
            setStep('form')
            setFirstName('')
            setLastInitial('')
            setPlatform('')
            setExperienceType('dating')
            setDescription('')
            setSignalType('neutral')
          }}>
            Post Another
          </Button>
          <Button onClick={() => router.push('/feed')}>
            Back to Feed
          </Button>
        </div>
      </div>
    )
  }

  if (step === 'preview') {
    return (
      <div className="glass-card rounded-xl p-6">
        <h2 className="font-semibold mb-4">Preview Your Signal</h2>
        
        <div className="glass-card rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
              signalType === 'positive' ? 'bg-signal-green/10 text-[var(--signal-green)]' :
              signalType === 'neutral' ? 'bg-signal-yellow/10 text-[var(--signal-yellow)]' :
              'bg-signal-red/10 text-[var(--signal-red)]'
            }`}>
              {signalType === 'positive' ? '👍' : signalType === 'neutral' ? '👋' : '⚠️'}
            </div>
            <div>
              <p className="font-medium">{firstName} {lastInitial}.</p>
              {platform && <p className="text-xs text-muted-foreground">via {platform}</p>}
              <p className={`text-xs font-medium ${
                signalType === 'positive' ? 'text-[var(--signal-green)]' :
                signalType === 'neutral' ? 'text-[var(--signal-yellow)]' :
                'text-[var(--signal-red)]'
              }`}>
                {signalType === 'positive' ? 'Positive Experience' : signalType === 'neutral' ? 'Mixed/Neutral' : 'Negative Experience'}
              </p>
            </div>
          </div>
          <p className="text-sm">{description}</p>
        </div>

        <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground mb-6">
          <p><strong>Note:</strong> Once submitted, your signal will be reviewed by moderators before appearing on the feed. The identifier will be partially masked for privacy.</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep('form')} disabled={isSubmitting}>
            Edit
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Signal'
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="space-y-6">
        {/* Name */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              placeholder="e.g., John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastInitial">Last Initial</Label>
            <Input
              id="lastInitial"
              placeholder="e.g., S"
              maxLength={1}
              value={lastInitial}
              onChange={(e) => setLastInitial(e.target.value.replace(/[^a-zA-Z]/g, ''))}
            />
          </div>
        </div>

        {/* Platform */}
        <div className="space-y-2">
          <Label htmlFor="platform">Where did you meet? (optional)</Label>
          <Input
            id="platform"
            placeholder="e.g., Hinge, Tinder, Coffee Shop"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          />
        </div>

        {/* Experience Type */}
        <div className="space-y-2">
          <Label htmlFor="experienceType">Type of Experience</Label>
          <select
            id="experienceType"
            value={experienceType}
            onChange={(e) => setExperienceType(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="dating">Dating</option>
            <option value="relationship">Relationship</option>
            <option value="casual">Casual</option>
            <option value="friendship">Friendship</option>
            <option value="professional">Professional</option>
          </select>
        </div>

        {/* Signal Type */}
        <div className="space-y-2">
          <Label>Overall Experience</Label>
          <div className="grid grid-cols-3 gap-3">
            {(['positive', 'neutral', 'negative'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSignalType(type)}
                className={`p-3 rounded-xl border-2 transition-all ${
                  signalType === type 
                    ? type === 'positive' ? 'border-[var(--signal-green)] bg-signal-green/10' :
                      type === 'neutral' ? 'border-[var(--signal-yellow)] bg-signal-yellow/10' :
                      'border-[var(--signal-red)] bg-signal-red/10'
                    : 'border-border hover:border-muted-foreground/50'
                }`}
              >
                <div className={`text-lg font-bold mb-1 ${
                  type === 'positive' ? 'text-[var(--signal-green)]' :
                  type === 'neutral' ? 'text-[var(--signal-yellow)]' :
                  'text-[var(--signal-red)]'
                }`}>
                  {type === 'positive' ? '👍' : type === 'neutral' ? '👋' : '⚠️'}
                </div>
                <div className="text-xs font-medium capitalize">{type}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Your Experience</Label>
          <Textarea
            id="description"
            placeholder="Describe your experience. Be factual and avoid identifying information..."
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            rows={4}
            maxLength={500}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Keep it factual and respectful</span>
            <span>{description.length}/500</span>
          </div>
        </div>

        {/* Content Warnings */}
        {contentWarnings.length > 0 && (
          <div className="bg-destructive/10 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive mb-1">Content Warning</p>
                <ul className="text-xs text-destructive/80 space-y-1">
                  {contentWarnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Guidelines Reminder */}
        <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
          <p className="font-medium mb-1">Remember:</p>
          <ul className="space-y-0.5 list-disc list-inside">
            <li>No full names or specific addresses</li>
            <li>Be factual - no exaggeration or false claims</li>
            <li>This is for safety, not revenge</li>
          </ul>
        </div>

        {/* Submit */}
        <Button 
          onClick={handlePreview} 
          className="w-full"
          disabled={!firstName || !lastInitial || !description || contentWarnings.length > 0}
        >
          Preview Signal
        </Button>
      </div>
    </div>
  )
}
