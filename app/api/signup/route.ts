import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, fullName, channelPreference, interests } = body;

    // Validate required fields
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (!channelPreference || !['whatsapp', 'telegram', 'both'].includes(channelPreference)) {
      return NextResponse.json(
        { error: 'Valid channel preference is required' },
        { status: 400 }
      );
    }

    // Prepare data for backend
    const signupData = {
      preferredName: fullName || '',
      phoneNumber: phoneNumber, // Already includes country code from react-phone-input-2
      channelPreference,
      interests: interests || []
    };

    // Call backend API
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const response = await fetch(`${backendUrl}/subscriptions/free-plan-signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signupData),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: result.message || 'Signup failed' },
        { status: response.status }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}