'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { FaWhatsapp, FaTelegram } from 'react-icons/fa'
import { US, CA, IN, CN, JP, EU, HK } from 'country-flag-icons/react/3x2'

interface Interest {
  id: string;
  name: string;
}

interface InterestGroup {
  parentType: string;
  subcategories: Interest[];
}

export default function Home() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [fullName, setFullName] = useState('')
  const [broadcastPrefs, setBroadcastPrefs] = useState({ whatsapp: false, telegram: false })
  const [interestGroups, setInterestGroups] = useState<InterestGroup[]>([])
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isExistingUser, setIsExistingUser] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchInterests()
  }, [])

  const fetchInterests = async () => {
    try {
      const response = await fetch('/api/interests')
      const data = await response.json()
      if (response.ok) {
        // Filter out 'Custom' parentType groups
        const filteredData = data.filter((group: InterestGroup) => group.parentType !== 'Custom')
        setInterestGroups(filteredData)
      }
    } catch (error) {
      console.error('Failed to fetch interests:', error)
    }
  }

  const checkUserExists = async (phone: string) => {
    if (!phone || phone.length < 12) {
      // Reset form when phone is cleared or too short
      setIsExistingUser(false)
      setMessage('')
      setFullName('')
      setBroadcastPrefs({ whatsapp: false, telegram: false })
      setSelectedInterests([])
      return
    }
    
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`
      const response = await fetch(`/api/check-user?phoneNumber=${encodeURIComponent(formattedPhone)}`)
      const result = await response.json()
      
      if (response.ok && result.exists) {
        setIsExistingUser(true)
        setMessage(result.message)
        setFullName(result.user.fullName || '')
        setBroadcastPrefs({
          whatsapp: result.user.whatsappStatus,
          telegram: result.user.telegramStatus
        })
        
        // Auto-select user's interests
        if (result.user.interests && result.user.interests.length > 0) {
          setSelectedInterests(result.user.interests)
        }
      } else {
        setIsExistingUser(false)
        setMessage('')
      }
    } catch (error) {
      console.error('Error checking user:', error)
    }
  }

  if (!mounted) return null

  const handleInterestChange = (interestId: string, checked: boolean) => {
    setSelectedInterests(prev => 
      checked 
        ? [...prev, interestId]
        : prev.filter(id => id !== interestId)
    )
  }

  const handleGroupChange = (groupType: string, checked: boolean) => {
    const group = interestGroups.find(g => g.parentType === groupType)
    if (!group) return
    
    const groupInterestIds = group.subcategories.map(sub => sub.id)
    setSelectedInterests(prev => 
      checked 
        ? [...prev.filter(id => !groupInterestIds.includes(id)), ...groupInterestIds]
        : prev.filter(id => !groupInterestIds.includes(id))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!phoneNumber) {
      setMessage('Phone number is required')
      return
    }
    
    if (!broadcastPrefs.whatsapp && !broadcastPrefs.telegram) {
      setMessage('Please select at least one broadcast preference')
      return
    }
    
    setLoading(true)
    setMessage('')
    
    try {
      const channelPreference = 
        broadcastPrefs.whatsapp && broadcastPrefs.telegram ? 'both' :
        broadcastPrefs.whatsapp ? 'whatsapp' : 'telegram'
      
      // Ensure phone number has + prefix
      const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`
      
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formattedPhoneNumber,
          fullName,
          channelPreference,
          interests: selectedInterests
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setMessage('Signup successful! Welcome to Median Edge.')
        // Reset form
        setPhoneNumber('')
        setFullName('')
        setBroadcastPrefs({ whatsapp: false, telegram: false })
        setSelectedInterests([])
      } else {
        setMessage(result.error || 'Signup failed')
      }
    } catch (error) {
      setMessage('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen px-4 py-12 ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={`p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
            theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'
          }`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className={`rounded-2xl shadow-2xl overflow-hidden ${
          theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          {/* Header Section */}
          <div className={`px-12 py-10 text-center ${
            theme === 'dark' ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-gray-50 to-white'
          }`}>
            {/* Logo */}
            <div className="flex items-center justify-center mb-6 gap-4">
              <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl w-20 h-20 flex items-center justify-center shadow-lg">
                <span className="text-white text-4xl font-bold tracking-wide">ME</span>
              </div>
              <h1 className={`text-4xl font-bold ${
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
              <p className="text-teal-600 text-lg font-semibold">
                Get the edge over all other investors
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="px-12 py-10 space-y-10">

        {/* Contact Information */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">1</span>
            </div>
            <h3 className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              Contact Information
            </h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Phone Number */}
            <div className="space-y-2">
              <label className={`block text-sm font-semibold ${
                theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
              }`}>
                WhatsApp Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <PhoneInput
                  country={'us'}
                  value={phoneNumber}
                  onChange={(value) => {
                    setPhoneNumber(value)
                    checkUserExists(value)
                  }}
                  onBlur={() => checkUserExists(phoneNumber)}
                  inputStyle={{
                    width: '100%',
                    height: '52px',
                    fontSize: '16px',
                    border: `2px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                    color: theme === 'dark' ? '#ffffff' : '#000000',
                    paddingLeft: '60px',
                    transition: 'all 0.2s ease'
                  }}
                  buttonStyle={{
                    border: `2px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '12px 0 0 12px',
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                    borderRight: 'none'
                  }}
                  dropdownStyle={{
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                    color: theme === 'dark' ? '#ffffff' : '#000000',
                    border: `2px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }}
                  searchStyle={{
                    backgroundColor: theme === 'dark' ? '#111827' : '#f9fafb',
                    color: theme === 'dark' ? '#ffffff' : '#000000',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                    borderRadius: '8px'
                  }}
                />
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <label className={`block text-sm font-semibold ${
                theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Full Name <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isExistingUser}
                className={`w-full h-[52px] px-4 text-base border-2 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                  theme === 'dark' 
                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                } ${isExistingUser ? 'cursor-not-allowed bg-opacity-50' : 'hover:border-gray-400'}`}
              />
            </div>
          </div>
        </div>

        {/* Broadcast Preference */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">2</span>
            </div>
            <h3 className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              Broadcast Preference
            </h3>
          </div>
          <p className={`text-base mb-6 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Choose how you'd like to receive our market insights
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <label className={`group relative flex items-center gap-4 p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
              theme === 'dark' ? 'border-gray-600 hover:border-teal-500' : 'border-gray-300 hover:border-teal-500'
            } ${broadcastPrefs.whatsapp ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : ''}`}>
              <input
                type="checkbox"
                checked={broadcastPrefs.whatsapp}
                onChange={(e) => setBroadcastPrefs(prev => ({ ...prev, whatsapp: e.target.checked }))}
                disabled={isExistingUser}
                className="w-5 h-5 text-teal-600 border-2 border-gray-300 rounded focus:ring-teal-500"
              />
              <div className="flex items-center gap-3">
                <FaWhatsapp className="text-green-500 text-2xl" />
                <div>
                  <div className={`font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>WhatsApp</div>
                  <div className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>Instant notifications</div>
                </div>
              </div>
            </label>
            <label className={`group relative flex items-center gap-4 p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
              theme === 'dark' ? 'border-gray-600 hover:border-teal-500' : 'border-gray-300 hover:border-teal-500'
            } ${broadcastPrefs.telegram ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : ''}`}>
              <input
                type="checkbox"
                checked={broadcastPrefs.telegram}
                onChange={(e) => setBroadcastPrefs(prev => ({ ...prev, telegram: e.target.checked }))}
                disabled={isExistingUser}
                className="w-5 h-5 text-teal-600 border-2 border-gray-300 rounded focus:ring-teal-500"
              />
              <div className="flex items-center gap-3">
                <FaTelegram className="text-blue-500 text-2xl" />
                <div>
                  <div className={`font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Telegram</div>
                  <div className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>Secure messaging</div>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Areas of Interest */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">3</span>
            </div>
            <h3 className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              Choose Your Areas of Interest
            </h3>
          </div>
          <p className={`text-base leading-relaxed mb-8 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            We screen all the markets and deliver only the top events/news, top 5 leading stocks, crypto, ETFs, Mutual Funds worth your attention. Skip the noise, focus on what matters.
          </p>

          <div className="grid gap-6">
            {interestGroups.map((group) => {
              const isGroupSelected = group.subcategories.every(sub => selectedInterests.includes(sub.id))
              const getGroupIcon = (parentType: string) => {
                switch (parentType) {
                  case 'Crypto': return <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">₿</span>
                  case 'United States': return <US className="w-8 h-6 rounded shadow-sm" />
                  case 'Canada': return <CA className="w-8 h-6 rounded shadow-sm" />
                  case 'India': return <IN className="w-8 h-6 rounded shadow-sm" />
                  case 'Waitlist': return <span className="bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">W</span>
                  default: return <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">{parentType[0]}</span>
                }
              }
              
              return (
                <div key={group.parentType} className={`border-2 rounded-xl p-6 transition-all duration-200 ${
                  theme === 'dark' ? 'border-gray-600 bg-gray-700/30' : 'border-gray-200 bg-gray-50/50'
                } ${isGroupSelected ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'hover:border-gray-400'}`}>
                  <label className="flex items-center gap-4 cursor-pointer mb-6 group">
                    <input
                      type="checkbox"
                      checked={isGroupSelected}
                      onChange={(e) => handleGroupChange(group.parentType, e.target.checked)}
                      disabled={isExistingUser}
                      className="w-5 h-5 text-teal-600 border-2 border-gray-300 rounded focus:ring-teal-500"
                    />
                    {getGroupIcon(group.parentType)}
                    <strong className={`text-xl ${
                      theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}>{group.parentType}</strong>
                  </label>
                  <div className="grid md:grid-cols-2 gap-3 ml-9">
                    {group.subcategories.map((interest) => (
                      <label key={interest.id} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-white/50 dark:hover:bg-gray-600/30 transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedInterests.includes(interest.id)}
                          onChange={(e) => handleInterestChange(interest.id, e.target.checked)}
                          disabled={isExistingUser}
                          className="w-4 h-4 text-teal-600 border border-gray-300 rounded focus:ring-teal-500"
                        />
                        <span className={`text-base ${
                          theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                          {interest.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-xl text-center font-medium ${
            message.includes('successful') 
              ? 'bg-green-100 text-green-800 border-2 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700'
              : message.includes('registered')
              ? 'bg-blue-100 text-blue-800 border-2 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
              : 'bg-red-100 text-red-800 border-2 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-3">
          <button
            type="submit"
            disabled={loading || isExistingUser}
            className={`w-full py-4 px-8 rounded-xl text-lg font-bold transition-all duration-300 transform hover:scale-[1.02] focus:scale-[0.98] ${
              loading || isExistingUser
                ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Signing up...
              </div>
            ) : isExistingUser ? (
              'Already Registered'
            ) : (
              'Join Median Edge'
            )}
          </button>
        </div>
      </div>
    </form>
  </div>
</div>
  )
}