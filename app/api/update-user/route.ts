import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, phoneNumber, preferredName, interests, isWhatsapp, isTelegram, isEmail } = await request.json();

    if (!email && !phoneNumber) {
      return NextResponse.json(
        { error: 'Either email or phoneNumber is required' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const response = await fetch(`${backendUrl}/subscriptions/update-user-signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      body: JSON.stringify({
        email,
        phoneNumber,
        preferredName,
        interests,
        isWhatsapp,
        isTelegram,
        isEmail
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: result.message || 'Failed to update user' },
        { status: response.status }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}