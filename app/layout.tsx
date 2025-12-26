import { ThemeProvider } from './providers'
import './globals.css'

export const metadata = {
  title: 'Profit 365 Signup Page',
  description: 'Profit 365 Signup page',
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