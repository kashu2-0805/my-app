'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { TimeEntry, Person, Category } from './types'
import { DEFAULT_PEOPLE } from './types'

interface StoreContextType {
  entries: TimeEntry[]
  people: Person[]
  addEntry: (entry: Omit<TimeEntry, 'id' | 'createdAt'>) => void
  updateEntry: (id: string, entry: Partial<TimeEntry>) => void
  deleteEntry: (id: string) => void
  addPerson: (name: string) => Person
  removePerson: (id: string) => void
  getEntriesForDate: (date: string) => TimeEntry[]
  getEntriesForDateRange: (startDate: string, endDate: string) => TimeEntry[]
}

const StoreContext = createContext<StoreContextType | null>(null)

const PERSON_COLORS = [
  'oklch(0.65 0.15 340)',
  'oklch(0.6 0.12 240)',
  'oklch(0.8 0.1 160)',
  'oklch(0.75 0.15 60)',
  'oklch(0.7 0.12 280)',
  'oklch(0.78 0.12 120)',
]

// Helper to get date string in local timezone
function getLocalDateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Demo data for visualization
const generateDemoData = (): TimeEntry[] => {
  const entries: TimeEntry[] = []
  const today = new Date()
  const emotions: ('joy' | 'anger' | 'sorrow' | 'happiness')[] = ['joy', 'anger', 'sorrow', 'happiness']
  const categories: Category[] = ['self-investment', 'self-reward', 'living-cost', 'waste']
  const people = ['自分', '仕事', '家族', '友人']
  const activities = [
    { content: '朝の読書', category: 'self-investment' as Category },
    { content: 'ジムで運動', category: 'self-investment' as Category },
    { content: 'オンライン学習', category: 'self-investment' as Category },
    { content: 'カフェでリラックス', category: 'self-reward' as Category },
    { content: '好きなスイーツ', category: 'self-reward' as Category },
    { content: '映画鑑賞', category: 'self-reward' as Category },
    { content: 'ランチ', category: 'living-cost' as Category },
    { content: '通勤', category: 'living-cost' as Category },
    { content: '夕食の買い物', category: 'living-cost' as Category },
    { content: 'つい衝動買い', category: 'waste' as Category },
    { content: '使わないアプリ課金', category: 'waste' as Category },
  ]

  for (let i = 0; i < 14; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = getLocalDateString(date)

    const numEntries = Math.floor(Math.random() * 4) + 2
    for (let j = 0; j < numEntries; j++) {
      const startHour = Math.floor(Math.random() * 16) + 6
      const activity = activities[Math.floor(Math.random() * activities.length)]
      const emotion = emotions[Math.floor(Math.random() * emotions.length)]
      
      // Adjust emotion intensity based on category
      let baseIntensity = Math.floor(Math.random() * 5) + 1
      if (activity.category === 'self-reward') {
        baseIntensity = Math.max(3, baseIntensity) // Self-reward tends to be positive
      } else if (activity.category === 'waste') {
        baseIntensity = Math.min(3, baseIntensity) // Waste tends to be less satisfying
      }
      
      entries.push({
        id: `demo-${i}-${j}`,
        date: dateStr,
        startHour,
        endHour: Math.min(startHour + Math.floor(Math.random() * 3) + 1, 23),
        content: activity.content,
        people: Math.random() > 0.4 ? [people[Math.floor(Math.random() * people.length)]] : [],
        amount: Math.floor(Math.random() * 5000),
        amountType: Math.random() > 0.85 ? 'received' : 'spent',
        category: activity.category,
        emotion,
        emotionIntensity: baseIntensity,
        createdAt: new Date().toISOString(),
      })
    }
  }

  return entries
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [people, setPeople] = useState<Person[]>(() => 
    DEFAULT_PEOPLE.map((p, i) => ({
      ...p,
      color: PERSON_COLORS[i % PERSON_COLORS.length],
      isDefault: true,
    }))
  )

  // Generate demo data only on client side to avoid hydration mismatch
  useEffect(() => {
    setEntries(generateDemoData())
  }, [])

  const addEntry = useCallback((entry: Omit<TimeEntry, 'id' | 'createdAt'>) => {
    const newEntry: TimeEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    setEntries((prev) => [...prev, newEntry])
  }, [])

  const updateEntry = useCallback((id: string, updates: Partial<TimeEntry>) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry))
    )
  }, [])

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id))
  }, [])

  const addPerson = useCallback((name: string): Person => {
    const newPerson: Person = {
      id: crypto.randomUUID(),
      name,
      color: PERSON_COLORS[people.length % PERSON_COLORS.length],
      isDefault: false,
    }
    setPeople((prev) => [...prev, newPerson])
    return newPerson
  }, [people.length])

  const removePerson = useCallback((id: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== id || p.isDefault))
  }, [])

  const getEntriesForDate = useCallback(
    (date: string) => entries.filter((entry) => entry.date === date),
    [entries]
  )

  const getEntriesForDateRange = useCallback(
    (startDate: string, endDate: string) =>
      entries.filter((entry) => entry.date >= startDate && entry.date <= endDate),
    [entries]
  )

  return (
    <StoreContext.Provider
      value={{
        entries,
        people,
        addEntry,
        updateEntry,
        deleteEntry,
        addPerson,
        removePerson,
        getEntriesForDate,
        getEntriesForDateRange,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}
