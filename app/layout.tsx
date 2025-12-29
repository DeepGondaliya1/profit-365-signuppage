import { ThemeProvider } from './providers'
import './globals.css'

export const metadata = {
  title: 'Median Edge Signup Page',
  description: 'Join Median Edge for curated market insights from global exchanges. Get top 5 stocks, ETFs, crypto updates, and market-moving news delivered to WhatsApp, Telegram, or email. Skip the noise, get the edge.',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}