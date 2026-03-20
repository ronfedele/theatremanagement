import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Backstage Manager — Costume · Props · Inventory',
  description: 'Multi-tier costume, props and equipment inventory platform for theatres and schools',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg"/>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Mono:wght@300;400;500&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300&display=swap" rel="stylesheet"/>
      </head>
      <body style={{backgroundColor:'#181410',color:'#f0ead8',margin:0,fontFamily:"'Crimson Pro',Georgia,serif"}}>
        {children}
      </body>
    </html>
  )
}
