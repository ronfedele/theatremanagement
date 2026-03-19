import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'StageWard',
  description: 'Costume Inventory Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Mono:wght@300;400;500&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300&display=swap" rel="stylesheet"/>
      </head>
      <body style={{backgroundColor:'#0e0c08',color:'#f0ead8',margin:0,fontFamily:"'Crimson Pro',Georgia,serif"}}>
        {children}
      </body>
    </html>
  )
}
