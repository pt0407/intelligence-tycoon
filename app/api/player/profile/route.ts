import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const player = await prisma.player.findUnique({
      where: { userId: user.id },
    })

    if (!player) {
      return NextResponse.json(
        { error: 'Player profile not found' },
        { status: 404 }
      )
    }

    // Update last active timestamp
    await prisma.player.update({
      where: { id: player.id },
      data: { lastActive: new Date() },
    })

    return NextResponse.json({ player })
  } catch (error) {
    console.error('Error fetching player profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
