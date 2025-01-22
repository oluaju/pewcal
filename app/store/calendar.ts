import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CalendarStore {
  selectedCalendarId: string | null
  setSelectedCalendarId: (id: string | null) => void
}

export const useCalendarStore = create<CalendarStore>()(
  persist(
    (set) => ({
      selectedCalendarId: null,
      setSelectedCalendarId: (id) => set({ selectedCalendarId: id }),
    }),
    { name: 'calendar-store' }
  )
) 