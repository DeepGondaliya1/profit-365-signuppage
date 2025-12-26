'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { FaWhatsapp, FaTelegram } from 'react-icons/fa'
import { MdEmail } from 'react-icons/md'
import { US, CA, IN, CN, JP, HK, KR, GB, EU } from 'country-flag-icons/react/3x2'

interface Interest {
  id: string;
  name: string;
  broadcastTag: string;
  interestTag: string;
}

interface ParentType {
  parentType: string;
  subcategories: Interest[];
}

interface GroupedInterest {
  mainType: string;
  parentTypes: ParentType[];
}

export default function Home() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([])
  const [selectedInterestIds, setSelectedInterestIds] = useState<string[]>([])
  const [showWaitlist, setShowWaitlist] = useState(false)
  const [subscriptionPrefs, setSubscriptionPrefs] = useState<string[]>([])
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [popup, setPopup] = useState<{ isOpen: boolean; title: string; content: string }>({ isOpen: false, title: '', content: '' })
  const [backendInterests, setBackendInterests] = useState<GroupedInterest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    setMounted(true)
    fetchInterests()
  }, [])

  const fetchInterests = async () => {
    try {
      console.log('Fetching interests...')
      const response = await fetch('/api/interests')
      const data = await response.json()
      
      console.log('API Response:', { status: response.status, data })
      
      if (response.ok && Array.isArray(data)) {
        console.log('Raw backend data:', data)
        
        const allowedParentTypes = ['Canada', 'United States', 'Crypto', 'India', 'Waitlist']
        
        // Transform the data to match expected structure
        const processedData = [{
          mainType: 'List',
          parentTypes: data.filter((item: ParentType) => 
            allowedParentTypes.includes(item.parentType)
          )
        }]
        
        console.log('Final processed data:', processedData)
        setBackendInterests(processedData)
      } else {
        console.error('API Error:', data)
        setBackendInterests([])
      }
    } catch (error) {
      console.error('Failed to fetch interests:', error)
      setBackendInterests([])
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || loading) return <div>Loading...</div>

  const getMarketData = () => {
    if (backendInterests.length === 0) return { markets: [], waitlistMarkets: [] }
    
    const listGroup = backendInterests.find(group => group.mainType === 'List')
    if (!listGroup) return { markets: [], waitlistMarkets: [] }
    
    const markets: any[] = []
    const waitlistMarkets: any[] = []
    
    listGroup.parentTypes.forEach(parent => {
      const marketData = {
        id: parent.parentType.toLowerCase().replace(/\s+/g, '-'),
        name: getMarketDisplayName(parent.parentType),
        parentType: parent.parentType,
        interests: parent.subcategories,
        description: getMarketDescription(parent.parentType)
      }
      
      if (parent.parentType === 'Waitlist') {
        // Split waitlist items into separate markets
        parent.subcategories.forEach(interest => {
          waitlistMarkets.push({
            id: interest.name.toLowerCase().replace(/\s+/g, '-'),
            name: interest.name,
            parentType: parent.parentType,
            interests: [interest],
            description: 'Leading Stocks, ETFs, Forex & Market News',
            flag: getMarketFlag(interest.name)
          })
        })
      } else {
        markets.push({
          ...marketData,
          flag: getMarketFlag(parent.parentType),
          icon: parent.parentType === 'Crypto' ? '₿' : undefined,
          color: parent.parentType === 'Crypto' ? 'from-orange-500 to-orange-600' : undefined
        })
      }
    })
    
    return { markets, waitlistMarkets }
  }
  
  const getMarketDisplayName = (parentType: string) => {
    switch (parentType) {
      case 'India': return 'India - NSE & BSE'
      case 'United States': return 'United States - NASDAQ & NYSE'
      case 'Crypto': return 'Crypto'
      case 'Canada': return 'Canada - TSX'
      default: return parentType
    }
  }
  
  const getMarketDescription = (parentType: string) => {
    switch (parentType) {
      case 'Crypto': return 'Leading Crypto & Crypto Sector Moving News'
      case 'United States': return 'Leading Stocks, ETFs, Forex & Market News'
      case 'India': return 'Leading Stocks, ETFs, Forex & Market News'
      case 'Canada': return 'Leading Stocks, ETFs, Forex & Market News'
      default: return 'Leading Stocks, ETFs, Forex & Market News'
    }
  }
  
  const getMarketFlag = (name: string) => {
    switch (name) {
      case 'United States': return <US className="w-10 h-8 rounded shadow-sm" />
      case 'India': return <IN className="w-10 h-8 rounded shadow-sm" />
      case 'Canada': return <CA className="w-10 h-8 rounded shadow-sm" />
      case 'China': return <CN className="w-10 h-8 rounded shadow-sm" />
      case 'Japan': return <JP className="w-10 h-8 rounded shadow-sm" />
      case 'Hong Kong': return <HK className="w-10 h-8 rounded shadow-sm" />
      case 'South Korea': return <KR className="w-10 h-8 rounded shadow-sm" />
      case 'United Kingdom': return <GB className="w-10 h-8 rounded shadow-sm" />
      case 'Euro': return <EU className="w-10 h-8 rounded shadow-sm" />
      default: return null
    }
  }
  
  const { markets, waitlistMarkets } = getMarketData()

  const handleMarketToggle = (marketId: string) => {
    setSelectedMarkets(prev => {
      const newSelected = prev.includes(marketId) 
        ? prev.filter(id => id !== marketId)
        : [...prev, marketId]
      
      // Update interest IDs based on selected markets
      updateInterestIds(newSelected)
      return newSelected
    })
  }
  
  const updateInterestIds = (selectedMarketIds: string[]) => {
    const allInterestIds: string[] = []
    
    selectedMarketIds.forEach(marketId => {
      // Find market in both regular and waitlist markets
      const market = [...markets, ...waitlistMarkets].find(m => m.id === marketId)
      if (market && market.interests) {
        const ids = market.interests.map((interest: Interest) => interest.id)
        allInterestIds.push(...ids)
      }
    })
    
    setSelectedInterestIds(allInterestIds)
  }

  const handleSubscriptionToggle = (pref: string) => {
    setSubscriptionPrefs(prev => 
      prev.includes(pref) 
        ? prev.filter(p => p !== pref)
        : [...prev, pref]
    )
  }

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    if (submitting) return
    
    setSubmitting(true)
    setSubmitError('')
    
    try {
      const formData = {
        selectedMarkets,
        selectedInterestIds,
        subscriptionPrefs,
        phoneNumber,
        email,
        fullName
      }
      
      console.log('Form submitted with interest IDs:', formData)
      
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setSuccessMessage(result.message || 'Signup successful! Welcome to Median Edge.')
        setSubmitSuccess(true)
        // Reset form fields
        setSelectedMarkets([])
        setSelectedInterestIds([])
        setSubscriptionPrefs([])
        setPhoneNumber('')
        setEmail('')
        setFullName('')
      } else {
        setSubmitError(result.error || 'Something went wrong. Please try again.')
      }
      
    } catch (error) {
      console.error('Submission error:', error)
      setSubmitError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="text-center mb-4">
        <span className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          Step {currentStep} of 3
        </span>
      </div>
      <div className={`w-full rounded-full h-3 ${
        theme === 'dark' ? 'bg-gray-700' : 'bg-teal-900/20'
      }`}>
        <div 
          className={`h-3 rounded-full transition-all duration-300 ${
            theme === 'dark' ? 'bg-teal-400' : 'bg-teal-900/70'
          }`}
          style={{ width: `${(currentStep / 3) * 100}%` }}
        ></div>
      </div>
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-8">
      {renderProgressBar()}
      
      <div className="text-center">
        <h2 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          Which markets are you interested in?
        </h2>
        <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Skip the noise. Top 5 stocks. Top events. Every market
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {markets.map((market) => (
          <div
            key={market.id}
            onClick={() => handleMarketToggle(market.id)}
            className={`rounded-xl p-6 cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg h-40 ${
              selectedMarkets.includes(market.id)
                ? 'bg-teal-200/20 border-2 border-teal-500 dark:bg-teal-900/20'
                : theme === 'dark' 
                  ? 'bg-gray-800 hover:bg-gray-700' 
                  : 'bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between h-full gap-4">
              <div className="flex items-start gap-3">
                {market.flag || (
                  <span className={`bg-gradient-to-r ${market.color} text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold shadow-lg`}>
                    {market.icon}
                  </span>
                )}
                <div>
                  <h3 className={`font-semibold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    {market.name}
                  </h3>
                  <p className={`text-base mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {market.description}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={selectedMarkets.includes(market.id)}
                onChange={() => handleMarketToggle(market.id)}
                className="w-6 h-6 text-teal-600 border-2 border-teal-400 rounded focus:ring-teal-500 accent-teal-600"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={() => setShowWaitlist(!showWaitlist)}
          className={`font-medium flex items-center gap-2 mx-auto mb-2 ${
            theme === 'dark' ? 'text-teal-400' : 'text-green-900/70'
          }`}
        >
          <span className={`border-b-2 ${
            theme === 'dark' ? 'border-teal-400' : 'border-green-700/30'
          }`}>Join waitlist</span> for other markets
          <span className={`transform transition-transform ${showWaitlist ? 'rotate-180' : ''}`}>▼</span>
        </button>
        <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          China, Japan, Euro, Hong Kong
        </p>
      </div>

      {showWaitlist && (
        <div className="grid md:grid-cols-2 gap-4">
          {waitlistMarkets.map((market) => (
            <div
              key={market.id}
              onClick={() => handleMarketToggle(market.id)}
              className={`rounded-xl p-6 cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg h-40 ${
                selectedMarkets.includes(market.id)
                  ? 'bg-teal-200/20 border-2 border-teal-500 dark:bg-teal-900/20'
                  : theme === 'dark' 
                    ? 'bg-gray-800 hover:bg-gray-700' 
                    : 'bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between h-full gap-4">
                <div className="flex items-start gap-3">
                  {market.flag}
                  <div>
                    <h3 className={`font-semibold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                      {market.name}
                    </h3>
                    <p className={`text-base mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {market.description}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={selectedMarkets.includes(market.id)}
                  onChange={() => handleMarketToggle(market.id)}
                  className="w-6 h-6 text-teal-600 border-2 border-teal-300 rounded focus:ring-teal-500 accent-teal-600"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={nextStep}
          className="bg-teal-900/70 hover:bg-teal-800 text-white px-8 py-3 rounded-full font-medium transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-8">
      {renderProgressBar()}
      
      <div className="text-center">
        <h2 className={`text-3xl font-bold mb-8 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          Subscription Preference?
        </h2>
      </div>

      <div className="flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl w-full">
          <div
            onClick={() => handleSubscriptionToggle('whatsapp')}
            className={`relative rounded-xl p-12 cursor-pointer transition-all duration-200 text-center shadow-lg hover:shadow-xl min-h-[200px] ${
              subscriptionPrefs.includes('whatsapp')
                ? 'bg-teal-200/20 border-2 border-teal-500 dark:bg-teal-900/20'
                : theme === 'dark' 
                  ? 'bg-gray-800 hover:bg-gray-700' 
                  : 'bg-gray-100 hover:bg-gray-50'
            }`}
          >
            <input
              type="checkbox"
              checked={subscriptionPrefs.includes('whatsapp')}
              onChange={() => handleSubscriptionToggle('whatsapp')}
              className="absolute top-4 right-4 w-6 h-6 text-teal-600 border-2 border-teal-300 rounded focus:ring-teal-500 accent-teal-600"
            />
            <div className="flex flex-col items-center gap-6">
              <FaWhatsapp className="text-6xl text-green-500" />
              <h3 className={`font-semibold text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                WhatsApp
              </h3>
            </div>
          </div>

          <div
            onClick={() => handleSubscriptionToggle('telegram')}
            className={`relative rounded-xl p-12 cursor-pointer transition-all duration-200 text-center shadow-lg hover:shadow-xl min-h-[200px] ${
              subscriptionPrefs.includes('telegram')
                ? 'bg-teal-200/20 border-2 border-teal-500 dark:bg-teal-900/20'
                : theme === 'dark' 
                  ? 'bg-gray-800 hover:bg-gray-700' 
                  : 'bg-gray-100 hover:bg-gray-50'
            }`}
          >
            <input
              type="checkbox"
              checked={subscriptionPrefs.includes('telegram')}
              onChange={() => handleSubscriptionToggle('telegram')}
              className="absolute top-4 right-4 w-6 h-6 text-teal-600 border-2 border-teal-300 rounded focus:ring-teal-500 accent-teal-600"
            />
            <div className="flex flex-col items-center gap-6">
              <FaTelegram className="text-6xl text-blue-500" />
              <h3 className={`font-semibold text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                Telegram
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={prevStep}
          className={`px-8 py-3 rounded-full font-medium transition-colors border ${
            theme === 'dark' 
              ? 'border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white' 
              : 'border-teal-700 text-teal-700 hover:border-teal-600 hover:text-teal-600'
          }`}
        >
          Back
        </button>
        <button
          onClick={nextStep}
          className="bg-teal-900/70 hover:bg-teal-800 text-white px-8 py-3 rounded-full font-medium transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  )

  const renderStep3 = () => {
    if (submitSuccess) {
      return (
        <div className="space-y-8 text-center">
          <div className={`rounded-xl p-8 ${
            theme === 'dark' 
              ? 'bg-teal-900/20 border border-teal-700' 
              : 'bg-gray-100 border border-teal-800'
          }`}>
            <div className="text-6xl mb-4">🎉</div>
            <h2 className={`text-3xl font-bold mb-4 ${
              theme === 'dark' ? 'text-teal-300' : 'text-teal-800'
            }`}>
              Welcome to Median Edge!
            </h2>
            <p className={`text-lg ${
              theme === 'dark' ? 'text-teal-400' : 'text-teal-700'
            }`}>
              {successMessage}
            </p>
          </div>
        </div>
      )
    }
    
    return (
      <div className="space-y-8">
        {renderProgressBar()}
        
        <div>
          <h2 className={`text-4xl font-bold mb-8 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            Let's connect
          </h2>
        </div>

        {submitError && (
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-xl p-4">
            <p className="text-red-800 dark:text-red-300">{submitError}</p>
          </div>
        )}

        <div className="space-y-6">
          {(subscriptionPrefs.includes('whatsapp') || subscriptionPrefs.includes('telegram')) && (
            <div className="space-y-2">
              <label className={`block text-lg font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                Phone Number <span className="text-red-500">*</span>
              </label>
              <PhoneInput
                country={'us'}
                value={phoneNumber}
                onChange={setPhoneNumber}
                inputStyle={{
                  width: '100%',
                  height: '52px',
                  fontSize: '16px',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  color: theme === 'dark' ? '#ffffff' : '#000000',
                  paddingLeft: '60px'
                }}
                buttonStyle={{
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '12px 0 0 12px',
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  borderRight: 'none'
                }}
              />
            </div>
          )}

          {subscriptionPrefs.includes('email') && (
            <div className="space-y-2">
              <label className={`block text-lg font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full h-[52px] px-4 text-base border rounded-xl transition-all duration-200 ${
                  theme === 'dark' 
                    ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400' 
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className={`block text-lg font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
              Full Name <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="Your name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`w-full h-[52px] px-4 text-base border rounded-xl transition-all duration-200 ${
                theme === 'dark' 
                  ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400' 
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`w-full text-white py-4 px-8 rounded-xl text-lg font-bold transition-colors ${
              submitting
                ? 'bg-gray-400 cursor-not-allowed'
                : theme === 'dark' 
                  ? 'bg-teal-600 hover:bg-teal-500' 
                  : 'bg-teal-900/70 hover:bg-teal-900'
            }`}
          >
            {submitting ? 'Submitting...' : 'Get Started For Free'}
          </button>
        </div>

        <div className="flex justify-between">
          <button
            onClick={prevStep}
            className={`px-8 py-3 rounded-full font-medium transition-colors border ${
              theme === 'dark' 
                ? 'border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white' 
                : 'border-teal-700 text-teal-700 hover:border-teal-600 hover:text-teal-600'
            }`}
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen px-4 py-12 ${theme === 'dark' ? 'bg-gray-900' : 'bg-custom-bg'}`}>
      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={`p-3 rounded-full transition-all duration-300 hover:scale-110 ${
            theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400'
          }`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto">
        <div>
          {/* Header Section */}
          <div className="px-6 md:px-12 py-6 md:py-10 text-center">
            {/* Logo */}
            <div className="flex items-center justify-center mb-6 gap-4">
              <div className="bg-teal-900/70 rounded-2xl w-20 h-20 flex items-center justify-center">
                <span className="text-white text-5xl font-bold tracking-wide">ME</span>
              </div>
              <h1 className={`text-4xl font-bold whitespace-nowrap ${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}>
                Median Edge
              </h1>
            </div>

            {/* Subtitle */}
            <div className="space-y-2">
              <p className={`text-xl ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Market insights curated and sent to your inbox
              </p>
              <p className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-teal-300' : 'text-teal-900/70'
              }`}>
                Get the edge over all other investors
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="px-6 md:px-12 py-6 md:py-10">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </div>

          {/* Footer */}
          <div className={`px-12 py-6 border-t text-center ${theme === 'dark' ? 'border-gray-700' : 'border-gray-400'}`}>
            <div className="flex items-center justify-center gap-6 text-base">
              <button
                type="button"
                onClick={() => setPopup({ 
                  isOpen: true, 
                  title: 'Terms of Service', 
                  content: 'Last updated: December 2025\n\nBy using Median Edge, you agree to these terms. We deliver market insights via WhatsApp and Telegram—no spam, just what matters.\n\nYour Rights\n• You can opt out anytime (no questions asked)\n• Your data is never sold\n• We respect your inbox and your time\n\nOur Promise\nWe screen markets 24/7 and only send you top-tier insights. If it\'s noise, we cut it.\n\nFor full legal details, contact us at support@medianedge.com' 
                })}
                className={`hover:text-teal-600 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
              >
                Terms
              </button>
              <span className={`${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>•</span>
              <button
                type="button"
                onClick={() => setPopup({ 
                  isOpen: true, 
                  title: 'Privacy Policy', 
                  content: 'TL;DR: We collect your phone number and preferences to send you market insights. That\'s it.\n\nWhat We Collect\n• Phone number (for WhatsApp/Telegram delivery)\n• Name (optional, helps us personalize)\n• Your market interests (crypto, stocks, ETFs, etc.)\n\nWhat We Do NOT Do\n• ❌ Sell your data\n• ❌ Share with third parties\n• ❌ Send spam or marketing emails\n• ❌ Track your browsing\n\nQuestions? Hit us up at privacy@medianedge.com' 
                })}
                className={`hover:text-teal-600 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
              >
                Privacy
              </button>
              <span className={`${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>•</span>
              <button
                type="button"
                onClick={() => setPopup({ 
                  isOpen: true, 
                  title: 'Get in Touch', 
                  content: 'Got questions? Feature requests? Just wanna chat? We\'re here for it.\n\nReach Us\nEmail: support@medianedge.com\nResponse time: 24-48 hours (we\'re human too 😊)\n\nWhat We Love Hearing\n• Bug reports (help us ship better)\n• Feature ideas (your feedback drives our roadmap)\n• Random thoughts (seriously, we read everything)\n\nFor urgent issues, mention "URGENT" in subject line' 
                })}
                className={`hover:text-teal-600 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
              >
                Contact
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Popup Modal */}
      {popup.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-sm sm:max-w-2xl w-full rounded-xl ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className={`px-4 md:px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg md:text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {popup.title}
                </h3>
                <button
                  onClick={() => setPopup({ isOpen: false, title: '', content: '' })}
                  className={`text-2xl md:text-3xl hover:text-red-500 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  ×
                </button>
              </div>
            </div>
            <div className="px-4 md:px-6 py-4 md:py-6">
              <div className={`text-sm md:text-base leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                {popup.title === 'Terms of Service' ? (
                  <div>
                    <p className="mb-4"><strong>Last updated:</strong> December 2025</p>
                    <p className="mb-4">By using Median Edge, you agree to these terms. We deliver market insights via WhatsApp and Telegram—no spam, just what matters. Reply with UNSUBSCRIBE anytime on your broadcast preference (WhatsApp, Telegram or Email) to stop broadcast.</p>
                    
                    <h4 className="text-teal-600 font-bold text-lg mb-3">Your Rights</h4>
                    <ul className="list-disc pl-10 mb-6 space-y-1">
                      <li>You can opt out anytime (no questions asked)</li>
                      <li>Your data is never sold</li>
                      <li>We respect your inbox and your time</li>
                    </ul>
                    
                    <h4 className="text-teal-600 font-bold text-lg mb-3">Our Promise</h4>
                    <p className="mb-6">We screen markets 24/7 and only send you top-tier insights. If it's noise, we cut it.</p>
                    
                    <p>For full legal details, contact us at <a href="mailto:insights@medianedge.com" className="text-teal-600 hover:underline">insights@medianedge.com</a></p>
                  </div>
                ) : popup.title === 'Privacy Policy' ? (
                  <div>
                    <p className="mb-4"><strong>TL;DR:</strong> We collect your phone number and preferences to send you market insights. That's it.</p>
                    
                    <h4 className="text-teal-600 font-bold text-lg mb-3">What We Collect</h4>
                    <ul className="list-disc pl-10 mb-6 space-y-1">
                      <li>Phone number (for WhatsApp/Telegram delivery)</li>
                      <li>Name (optional, helps us personalize)</li>
                      <li>Your market interests (crypto, stocks, ETFs, etc.)</li>
                    </ul>
                    
                    <h4 className="text-teal-600 font-bold text-lg mb-3">What We Do NOT Do</h4>
                    <ul className="list-none mb-6 pl-4 space-y-1">
                      <li className="flex items-center gap-2"><span className="text-red-500">❌</span> Sell your data</li>
                      <li className="flex items-center gap-2"><span className="text-red-500">❌</span> Share with third parties</li>
                      <li className="flex items-center gap-2"><span className="text-red-500">❌</span> Send spam or marketing emails</li>
                      <li className="flex items-center gap-2"><span className="text-red-500">❌</span> Track your browsing</li>
                    </ul>
                    
                    <p>Questions? Hit us up at <a href="mailto:insights@medianedge.com" className="text-teal-600 hover:underline">insights@medianedge.com</a></p>
                  </div>
                ) : (
                  <div>
                    <p className="mb-6">Got questions? Feature requests? Just wanna chat? We're here for it.</p>
                    
                    <h4 className="text-teal-600 font-bold text-lg mb-3">Reach Us</h4>
                    <p className="mb-2"><strong>Email:</strong> <a href="mailto:insights@medianedge.com" className="text-teal-600 hover:underline">insights@medianedge.com</a></p>
                    <p className="mb-6"><strong>Response time:</strong> 24-48 hours (we're human too 😊)</p>
                    
                    <h4 className="text-teal-600 font-bold text-lg mb-3">What We Love Hearing</h4>
                    <ul className="list-disc pl-10 mb-6 space-y-1">
                      <li>Bug reports (help us ship better)</li>
                      <li>Feature ideas (your feedback drives our roadmap)</li>
                      <li>Random thoughts (seriously, we read everything)</li>
                    </ul>
                    
                    <p>For urgent issues, mention "URGENT" in subject line</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}