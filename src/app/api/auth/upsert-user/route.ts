import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../prisma/prisma';

export async function POST(request: NextRequest) {
  try {
    const { name, email, image, role } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const userData = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        image,
      },
      create: {
        name,
        email,
        image,
        role,
      },
      select: {
        id: true,
        role: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      user: {
        id: userData.id,
        role: userData.role,
      }
    });

  } catch (error) {
    console.error('Error during user upsert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}