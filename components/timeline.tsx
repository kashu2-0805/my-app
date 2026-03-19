'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useStore } from '@/lib/store'
import type { TimeEntry, Emotion, Category } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TimelineProps {
  onAddEntry: (hour: number, date: string) => void
  onEditEntry: (entry: TimeEntry) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

const EMOTION_ICONS: Record<Emotion, string> = {
  joy: '😊',
  anger: '😠',
  sorrow: '😢',
  happiness: '😄',
}

const CATEGORY_STYLES: Record<Category, { border: string; bg: string; icon: string }> = {
  'self-investment': { border: 'border-l-self-investment', bg: 'bg-self-investment/5', icon: '📚' },
  'self-reward': { border: 'border-l-self-reward', bg: 'bg-self-reward/5', icon: '✨' },
  'living-cost': { border: 'border-l-living-cost', bg: 'bg-living-cost/5', icon: '🏠' },
  'waste': { border: 'border-l-waste', bg: 'bg-waste/5', icon: '💸' },
}

// Helper to get date string in local timezone
function getLocalDateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function Timeline({ onAddEntry, onEditEntry }: TimelineProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isClient, setIsClient] = useState(false)
  const { getEntriesForDate } = useStore()

  useEffect(() => {
    setSelectedDate(new Date())
    setIsClient(true)
  }, [])

  const dateString = selectedDate ? getLocalDateString(selectedDate) : ''
  const entries = getEntriesForDate(dateString)

  const goToPreviousDay = () => {
    setSelectedDate((prev) => {
      if (!prev) return prev
      const newDate = new Date(prev)
      newDate.setDate(newDate.getDate() - 1)
      return newDate
    })
  }

  const goToNextDay = () => {
    setSelectedDate((prev) => {
      if (!prev) return prev
      const newDate = new Date(prev)
      newDate.setDate(newDate.getDate() + 1)
      return newDate
    })
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  const formatDate = (date: Date | null) => {
    if (!date) return ''
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    const weekday = weekdays[date.getDay()]
    return `${month}月${day}日(${weekday})`
  }

  const isToday = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    return getLocalDateString(date) === getLocalDateString(today)
  }

  const getEntryForHour = (hour: number) => {
    return entries.find(
      (entry) => entry.startHour <= hour && entry.endHour > hour
    )
  }

  const isEntryStart = (hour: number) => {
    return entries.some((entry) => entry.startHour === hour)
  }

  // Calculate daily summary
  const dailySummary = {
    totalEntries: entries.length,
    totalSpent: entries.reduce((sum, e) => sum + (e.amountType === 'spent' ? e.amount : 0), 0),
    avgSatisfaction: entries.length > 0 
      ? Math.round(entries.reduce((sum, e) => {
          const weight = e.emotion === 'joy' || e.emotion === 'happiness' ? 1 : -0.5
          return sum + (weight * e.emotionIntensity)
        }, 0) / entries.length * 20 + 50)
      : 0
  }

  // Don't render date-dependent content during SSR
  if (!isClient) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="p-5 border-b border-border bg-card sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" disabled className="rounded-full hover:bg-secondary">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-center min-w-32">
              <p className="text-lg font-semibold text-foreground">&nbsp;</p>
            </div>
            <Button variant="ghost" size="icon" disabled className="rounded-full hover:bg-secondary">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Date Navigation */}
      <div className="p-5 border-b border-border bg-card sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={goToPreviousDay} className="rounded-full hover:bg-secondary">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <button
            onClick={goToToday}
            className="text-center min-w-32"
          >
            <p className="text-lg font-semibold text-foreground">
              {formatDate(selectedDate)}
            </p>
            {isToday(selectedDate) && (
              <p className="text-xs text-primary font-medium">今日</p>
            )}
          </button>
          <Button variant="ghost" size="icon" onClick={goToNextDay} className="rounded-full hover:bg-secondary">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Daily Summary */}
        {entries.length > 0 && (
          <div className="flex gap-3 pt-2">
            <div className="flex-1 bg-secondary/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{dailySummary.totalEntries}</p>
              <p className="text-xs text-muted-foreground">記録</p>
            </div>
            <div className="flex-1 bg-secondary/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-foreground">¥{dailySummary.totalSpent.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">支出</p>
            </div>
            <div className="flex-1 bg-secondary/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{dailySummary.avgSatisfaction}</p>
              <p className="text-xs text-muted-foreground">満足度</p>
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="relative">
          {HOURS.map((hour) => {
            const entry = getEntryForHour(hour)
            const isStart = isEntryStart(hour)

            return (
              <div
                key={hour}
                className="flex gap-3 min-h-14 group"
              >
                {/* Time Label */}
                <div className="w-12 flex-shrink-0 text-sm text-muted-foreground pt-1 text-right font-medium">
                  {hour.toString().padStart(2, '0')}:00
                </div>

                {/* Timeline Line */}
                <div className="relative flex flex-col items-center">
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors",
                    entry && isStart ? "bg-primary" : "bg-border group-hover:bg-primary/50"
                  )} />
                  <div className="w-0.5 flex-1 bg-border" />
                </div>

                {/* Content Area */}
                <div className="flex-1 pb-2">
                  {entry && isStart ? (
                    <Card
                      className={cn(
                        'p-3.5 cursor-pointer hover:shadow-md transition-all duration-200 border-0',
                        'border-l-4',
                        CATEGORY_STYLES[entry.category].border,
                        CATEGORY_STYLES[entry.category].bg
                      )}
                      onClick={() => onEditEntry(entry)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm">{CATEGORY_STYLES[entry.category].icon}</span>
                            <p className="font-medium text-card-foreground truncate">
                              {entry.content}
                            </p>
                          </div>
                          {entry.people.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                              {entry.people.join(', ')}
                            </p>
                          )}
                          {entry.amount > 0 && (
                            <p className={cn(
                              'text-sm font-medium mt-1',
                              entry.amountType === 'spent' 
                                ? 'text-destructive' 
                                : 'text-primary'
                            )}>
                              {entry.amountType === 'spent' ? '-' : '+'}¥{entry.amount.toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {entry.category === 'self-reward' && (
                            <Sparkles className="w-3.5 h-3.5 text-self-reward" />
                          )}
                          <span className="text-xl" role="img" aria-label={entry.emotion}>
                            {EMOTION_ICONS[entry.emotion]}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">
                            ×{entry.emotionIntensity}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ) : entry ? (
                    <div className="h-full" />
                  ) : (
                    <button
                      onClick={() => onAddEntry(hour, dateString)}
                      className="w-full h-12 rounded-xl border-2 border-dashed border-transparent hover:border-primary/30 hover:bg-primary/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Plus className="h-5 w-5 text-primary/50" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
