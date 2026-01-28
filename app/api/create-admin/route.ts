import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// This endpoint creates the initial admin user
// Visit /api/create-admin to create the admin account
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ 
      error: 'Missing environment variables',
      details: {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!serviceRoleKey
      }
    }, { status: 500 })
  }

  // Create admin client with service role key
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const email = 'daxlennox1@gmail.com'
  const password = 'Scrunches1'

  try {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    if (existingUser) {
      // Update the profile to be admin if not already
      await supabase
        .from('profiles')
        .update({ 
          role: 'admin', 
          is_verified: true,
          verification_status: 'approved'
        })
        .eq('id', existingUser.id)

      return NextResponse.json({ 
        success: true, 
        message: 'User already exists - updated to admin',
        userId: existingUser.id
      })
    }

    // Create the user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        invited_by: null,
        invite_code: 'ADMIN_SEED'
      }
    })

    if (authError) {
      return NextResponse.json({ 
        error: 'Failed to create auth user', 
        details: authError.message 
      }, { status: 500 })
    }

    if (!authData.user) {
      return NextResponse.json({ 
        error: 'No user returned from auth creation' 
      }, { status: 500 })
    }

    // Create the profile with admin role
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        role: 'admin',
        is_verified: true,
        verification_status: 'approved',
        invite_count: 999, // Unlimited invites for admin
        selfie_url: null,
        created_at: new Date().toISOString()
      })

    if (profileError) {
      return NextResponse.json({ 
        error: 'Failed to create profile', 
        details: profileError.message,
        userId: authData.user.id
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Admin account created successfully!',
      email,
      userId: authData.user.id,
      loginUrl: '/auth/login'
    })

  } catch (err) {
    return NextResponse.json({ 
      error: 'Unexpected error', 
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}
