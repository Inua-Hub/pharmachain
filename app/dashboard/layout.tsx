import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - PharmaChain',
  description: 'PharmaChain Dashboard',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}