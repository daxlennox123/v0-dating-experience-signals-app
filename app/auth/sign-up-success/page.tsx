import Link from 'next/link'
import { Shield, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted" />
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 blur-3xl rounded-full" />
      </div>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm text-center">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Check Your Email</h1>
            <p className="text-muted-foreground text-sm mt-2 max-w-xs">
              {"We've sent a verification link to your email. Please click it to activate your account."}
            </p>
          </div>

          {/* Card */}
          <div className="glass-card rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-3 text-left">
              <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">What happens next?</p>
                <ol className="text-sm text-muted-foreground mt-2 space-y-2 list-decimal list-inside">
                  <li>Click the link in your email</li>
                  <li>Your selfie will be reviewed by admins</li>
                  <li>{"Once approved, you'll have full access"}</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link href="/auth/login">
              <Button variant="outline" className="w-full bg-transparent">
                Back to Login
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground">
              {"Didn't receive the email?"}{' '}
              <button className="text-primary hover:underline">
                Resend verification
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
