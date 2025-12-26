import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.selectedInterestIds || body.selectedInterestIds.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one market interest' },
        { status: 400 }
      )
    }
    
    if (!body.subscriptionPrefs || body.subscriptionPrefs.length === 0) {
      return NextResponse.json(
        { error: 'Please select a subscription preference' },
        { status: 400 }
      )
    }
    
    if ((body.subscriptionPrefs.includes('whatsapp') || body.subscriptionPrefs.includes('telegram')) && !body.phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required for WhatsApp/Telegram subscription' },
        { status: 400 }
      )
    }

    // Transform data to match backend format
    let channelPreference: 'whatsapp' | 'telegram' | 'both'
    if (body.subscriptionPrefs.includes('whatsapp') && body.subscriptionPrefs.includes('telegram')) {
      channelPreference = 'both'
    } else if (body.subscriptionPrefs.includes('whatsapp')) {
      channelPreference = 'whatsapp'
    } else {
      channelPreference = 'telegram'
    }

    const backendData = {
      preferredName: body.fullName || undefined,
      email: body.email || undefined,
      phoneNumber: body.phoneNumber.startsWith('+') ? body.phoneNumber : `+${body.phoneNumber}`,
      channelPreference,
      interests: body.selectedInterestIds
    }
    
    console.log('Sending to backend:', backendData)
    
    // Call your backend API
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
    const backendResponse = await fetch(`${backendUrl}/subscriptions/free-plan-signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendData)
    })
    
    const result = await backendResponse.json()
    
    if (backendResponse.ok) {
      return NextResponse.json({
        message: result.message || 'Signup successful! Welcome to Median Edge.',
        success: true
      })
    } else {
      return NextResponse.json(
        { error: result.message || 'Something went wrong. Please try again.' },
        { status: backendResponse.status }
      )
    }
    
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Network error. Please check your connection and try again.' },
      { status: 500 }
    )
  }
}