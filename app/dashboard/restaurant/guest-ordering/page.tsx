'use client'

import { GuestOrderingPage } from '@/components/restaurant/ordering/guest-ordering-page'

// Single property setup - hardcoded property ID
const PROPERTY_ID = '571da531-4a8e-4e37-89e9-78667ec52847'

export default function GuestOrderingDashboardPage() {
  return (
    <GuestOrderingPage 
      // These would typically come from URL params or context
      guestName="Demo Guest"
      roomNumber="101"
    />
  )
}