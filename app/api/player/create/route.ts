import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createPlayerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  companyName: z.string()
    .min(3, 'Company name must be at least 3 characters')
    .max(50, 'Company name must be at most 50 characters'),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if player already exists
    const existingPlayer = await prisma.player.findUnique({
      where: { userId: user.id },
    })

    if (existingPlayer) {
      return NextResponse.json(
        { error: 'Player profile already exists' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validation = createPlayerSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { username, companyName } = validation.data

    // Check username uniqueness
    const usernameExists = await prisma.player.findUnique({
      where: { username },
    })

    if (usernameExists) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      )
    }

    // Create player profile
    const player = await prisma.player.create({
      data: {
        userId: user.id,
        email: user.email!,
        username,
        companyName,
      },
    })

    // Log player creation action
    await prisma.playerAction.create({
      data: {
        playerId: player.id,
        actionType: 'PLAYER_CREATED',
        parameters: { username, companyName },
        afterState: { 
          player: {
            ...player,
            capital: player.capital.toString(),
          }
        },
      },
    })

    return NextResponse.json({ 
      player: {
        ...player,
        capital: player.capital.toString(),
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating player profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
