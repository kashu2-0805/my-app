'use client'

import { useState } from 'react'
import { CalendarDays, BarChart3, Sparkles } from 'lucide-react'
import { Timeline } from '@/components/timeline'
import { Dashboard } from '@/components/dashboard'
import { EntryModal } from '@/components/entry-modal'
import { StoreProvider } from '@/lib/store'
import type { TimeEntry } from '@/lib/types'
import { cn } from '@/lib/utils'

type Tab = 'timeline' | 'dashboard'

function LifePortfolioApp() {
  const [activeTab, setActiveTab] = useState<Tab>('timeline')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedHour, setSelectedHour] = useState(9)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null)

  const handleAddEntry = (hour: number, date: string) => {
    setSelectedHour(hour)
    setSelectedDate(date)
    setEditEntry(null)
    setIsModalOpen(true)
  }

  const handleEditEntry = (entry: TimeEntry) => {
    setEditEntry(entry)
    setSelectedDate(entry.date)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditEntry(null)
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-center gap-2 p-4 border-b border-border bg-card">
        <Sparkles className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Life Portfolio</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'timeline' ? (
          <Timeline onAddEntry={handleAddEntry} onEditEntry={handleEditEntry} />
        ) : (
          <Dashboard />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="flex border-t border-border bg-card safe-area-bottom">
        <button
          onClick={() => setActiveTab('timeline')}
          className={cn(
            'flex-1 flex flex-col items-center gap-1 py-3.5 transition-colors',
            activeTab === 'timeline'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <CalendarDays className="h-6 w-6" />
          <span className="text-xs font-medium">タイムライン</span>
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={cn(
            'flex-1 flex flex-col items-center gap-1 py-3.5 transition-colors',
            activeTab === 'dashboard'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <BarChart3 className="h-6 w-6" />
          <span className="text-xs font-medium">分析</span>
        </button>
      </nav>

      {/* Entry Modal */}
      <EntryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        initialHour={selectedHour}
        editEntry={editEntry}
        selectedDate={selectedDate}
      />
    </div>
  )
}

export default function Page() {
  return (
    <StoreProvider>
      <LifePortfolioApp />
    </StoreProvider>
  )
}
