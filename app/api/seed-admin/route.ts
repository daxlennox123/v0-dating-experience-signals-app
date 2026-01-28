import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// This route creates the initial admin user
// DELETE THIS FILE AFTER USE for security
export async function POST(request: Request) {
  try {
    // Use service role key to bypass RLS and create user
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { email, password } = await request.json()

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)
    
    if (existingUser) {
      // Update the profile to be admin and verified
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: existingUser.id,
          display_name: 'Admin',
          role: 'admin',
          is_verified: true,
          verification_selfie_url: 'admin-seed',
          accepted_guidelines: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Existing user updated to admin',
        userId: existingUser.id 
      })
    }

    // Create the user with email confirmed
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        display_name: 'Admin'
      }
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Create the admin profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        display_name: 'Admin',
        role: 'admin',
        is_verified: true,
        verification_selfie_url: 'admin-seed',
        accepted_guidelines: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Admin user created successfully',
      userId: authData.user.id 
    })

  } catch (error) {
    console.error('Seed admin error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
