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
    
    // Validate phone number for WhatsApp/Telegram
    if (body.subscriptionPrefs.includes('whatsapp') || body.subscriptionPrefs.includes('telegram')) {
      if (!body.phoneNumber) {
        return NextResponse.json(
          { error: 'Phone number is required for WhatsApp/Telegram subscription' },
          { status: 400 }
        )
      }
      // Validate phone number format (more flexible for international numbers)
      const phoneRegex = /^\+?[1-9]\d{7,14}$/
      const cleanPhone = body.phoneNumber.replace(/\s|-|\(|\)/g, '')
      if (!phoneRegex.test(cleanPhone)) {
        return NextResponse.json(
          { error: 'Please enter a valid phone number with country code' },
          { status: 400 }
        )
      }
    }

    // Validate email for email preference
    if (body.subscriptionPrefs.includes('email')) {
      if (!body.email) {
        return NextResponse.json(
          { error: 'Email is required for email subscription' },
          { status: 400 }
        )
      }
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { error: 'Please enter a valid email address' },
          { status: 400 }
        )
      }
    }

    // Transform data to match new backend format with boolean flags
    const isWhatsapp = body.subscriptionPrefs.includes('whatsapp')
    const isTelegram = body.subscriptionPrefs.includes('telegram')
    const isEmail = body.subscriptionPrefs.includes('email')
    
    let phoneNumber = body.phoneNumber
    
    // Use dummy phone number for email-only users
    if (isEmail && !isWhatsapp && !isTelegram) {
      phoneNumber = '+99900000000'
    }

    const backendData = {
      preferredName: body.fullName || undefined,
      email: body.email || undefined,
      phoneNumber: phoneNumber ? (phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`) : '+99900000000',
      isWhatsapp,
      isTelegram,
      isEmail,
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