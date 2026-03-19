'use client'

import { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStore } from '@/lib/store'
import type { Category } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts'

type DateRange = 'week' | 'month'

const CATEGORY_COLORS: Record<Category, string> = {
  'self-investment': 'oklch(0.6 0.12 240)',
  'self-reward': 'oklch(0.72 0.15 340)',
  'living-cost': 'oklch(0.55 0.02 0)',
  'waste': 'oklch(0.85 0.15 85)',
}

const CATEGORY_LABELS: Record<Category, string> = {
  'self-investment': 'じぶん投資',
  'self-reward': 'じぶんご褒美',
  'living-cost': '生存コスト',
  'waste': '無駄遣い',
}

const CATEGORY_ICONS: Record<Category, string> = {
  'self-investment': '📚',
  'self-reward': '✨',
  'living-cost': '🏠',
  'waste': '💸',
}

// Avatar colors based on person name
const AVATAR_COLORS = [
  'oklch(0.65 0.15 340)',
  'oklch(0.6 0.12 240)',
  'oklch(0.72 0.15 160)',
  'oklch(0.7 0.12 280)',
  'oklch(0.75 0.15 60)',
  'oklch(0.6 0.12 200)',
]

function getAvatarColor(name: string, index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

function getInitials(name: string): string {
  if (name === '自分') return '私'
  if (name === '会社') return '社'
  if (name.length <= 2) return name
  return name.charAt(0)
}

// Helper to get date string in local timezone
function getLocalDateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function Dashboard() {
  const [dateRange, setDateRange] = useState<DateRange>('week')
  const [isClient, setIsClient] = useState(false)
  const { entries } = useStore()

  useEffect(() => {
    setIsClient(true)
  }, [])

  const dateRangeData = useMemo(() => {
    if (!isClient) return []
    const today = new Date()
    const days = dateRange === 'week' ? 7 : 30
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - days + 1)

    const dates: string[] = []
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      dates.push(getLocalDateString(date))
    }

    return dates
  }, [dateRange, isClient])

  // Satisfaction trend data - single thick line
  const satisfactionTrendData = useMemo(() => {
    return dateRangeData.map((date) => {
      const dayEntries = entries.filter((e) => e.date === date)
      
      if (dayEntries.length === 0) {
        return {
          date,
          displayDate: date.slice(5).replace('-', '/'),
          satisfaction: null,
        }
      }

      // Calculate satisfaction: emotion * intensity
      const totalSatisfaction = dayEntries.reduce((sum, entry) => {
        const emotionWeight = 
          entry.emotion === 'joy' ? 1 :
          entry.emotion === 'happiness' ? 1 :
          entry.emotion === 'anger' ? -0.7 :
          entry.emotion === 'sorrow' ? -0.5 : 0
        
        return sum + (emotionWeight * entry.emotionIntensity)
      }, 0)
      
      const avgSatisfaction = totalSatisfaction / dayEntries.length
      const normalizedSatisfaction = Math.max(0, Math.min(100, (avgSatisfaction + 5) * 10))

      const d = new Date(date)
      return {
        date,
        displayDate: `${d.getMonth() + 1}/${d.getDate()}`,
        satisfaction: Math.round(normalizedSatisfaction),
      }
    })
  }, [dateRangeData, entries])

  // Life balance data - 4 categories
  const lifeBalanceData = useMemo(() => {
    const rangeEntries = entries.filter((e) =>
      dateRangeData.includes(e.date)
    )

    const timeByCategory: Record<Category, number> = {
      'self-investment': 0,
      'self-reward': 0,
      'living-cost': 0,
      'waste': 0,
    }

    rangeEntries.forEach((entry) => {
      const duration = entry.endHour - entry.startHour
      timeByCategory[entry.category] += duration
    })

    const totalTime = Object.values(timeByCategory).reduce((a, b) => a + b, 0)

    return (['self-investment', 'self-reward', 'living-cost', 'waste'] as Category[]).map((cat) => ({
      name: CATEGORY_LABELS[cat],
      icon: CATEGORY_ICONS[cat],
      value: timeByCategory[cat],
      percentage: totalTime > 0 ? Math.round((timeByCategory[cat] / totalTime) * 100) : 0,
      color: CATEGORY_COLORS[cat],
    })).filter(item => item.value > 0)
  }, [dateRangeData, entries])

  // Person resource data with percentage for bar chart
  const personResourceData = useMemo(() => {
    const rangeEntries = entries.filter((e) =>
      dateRangeData.includes(e.date)
    )

    const personStats: Record<
      string,
      { timeSpent: number; moneySpent: number; moneyReceived: number }
    > = {}

    rangeEntries.forEach((entry) => {
      const duration = entry.endHour - entry.startHour
      entry.people.forEach((person) => {
        if (!personStats[person]) {
          personStats[person] = { timeSpent: 0, moneySpent: 0, moneyReceived: 0 }
        }
        personStats[person].timeSpent += duration
        if (entry.amountType === 'spent') {
          personStats[person].moneySpent += entry.amount
        } else {
          personStats[person].moneyReceived += entry.amount
        }
      })
    })

    const sorted = Object.entries(personStats)
      .map(([name, stats]) => ({
        name,
        ...stats,
        net: stats.moneyReceived - stats.moneySpent,
      }))
      .sort((a, b) => b.timeSpent - a.timeSpent)
    
    const totalTime = sorted.reduce((sum, p) => sum + p.timeSpent, 0)
    
    return sorted.map((person, index) => ({
      ...person,
      percentage: totalTime > 0 ? Math.round((person.timeSpent / totalTime) * 100) : 0,
      color: getAvatarColor(person.name, index),
      initials: getInitials(person.name),
    }))
  }, [dateRangeData, entries])

  // Calculate average satisfaction
  const avgSatisfaction = useMemo(() => {
    const validData = satisfactionTrendData.filter(d => d.satisfaction !== null)
    if (validData.length === 0) return 0
    return Math.round(validData.reduce((sum, d) => sum + (d.satisfaction || 0), 0) / validData.length)
  }, [satisfactionTrendData])

  // Get satisfaction message
  const satisfactionMessage = useMemo(() => {
    if (avgSatisfaction >= 70) return { text: '素晴らしい調子です!', emoji: '🌟' }
    if (avgSatisfaction >= 50) return { text: 'いい感じですね', emoji: '😊' }
    if (avgSatisfaction >= 30) return { text: '少しリフレッシュを', emoji: '🌿' }
    return { text: '自分を労わりましょう', emoji: '💝' }
  }, [avgSatisfaction])

  if (!isClient) {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="p-5 border-b border-border bg-card sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-card-foreground mb-1">あなたの分析</h2>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background">
      {/* Header */}
      <div className="p-5 border-b border-border bg-card sticky top-0 z-10">
        <h2 className="text-xl font-semibold text-card-foreground mb-1">あなたの分析</h2>
        <p className="text-sm text-muted-foreground">自分を客観的に見つめてみましょう</p>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setDateRange('week')}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all',
              dateRange === 'week'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            )}
          >
            1週間
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all',
              dateRange === 'month'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            )}
          >
            1ヶ月
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Satisfaction Trend - Single thick line with gradient background */}
        <Card className="overflow-hidden border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">心の満足度</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{satisfactionMessage.emoji}</span>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">{avgSatisfaction}</p>
                  <p className="text-xs text-muted-foreground">{satisfactionMessage.text}</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-48 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={satisfactionTrendData}>
                  <defs>
                    <linearGradient id="satisfactionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.72 0.15 340)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="oklch(0.72 0.15 340)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 11, fill: 'oklch(0.5 0.02 340)' }}
                    axisLine={false}
                    tickLine={false}
                    dy={8}
                  />
                  <YAxis
                    domain={[0, 100]}
                    hide
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length && payload[0].value !== null) {
                        return (
                          <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
                            <p className="text-sm font-medium text-foreground">
                              満足度: {payload[0].value}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="satisfaction"
                    stroke="oklch(0.65 0.15 340)"
                    strokeWidth={4}
                    fill="url(#satisfactionGradient)"
                    connectNulls
                    dot={false}
                    activeDot={{ r: 6, fill: 'oklch(0.65 0.15 340)', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Life Balance - Pie Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">人生のバランス</CardTitle>
            <p className="text-xs text-muted-foreground">時間の使い方を振り返ろう</p>
          </CardHeader>
          <CardContent>
            {lifeBalanceData.length > 0 ? (
              <div className="flex items-center gap-4">
                <div className="h-40 w-40 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={lifeBalanceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {lifeBalanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
                                <p className="text-sm font-medium text-foreground">
                                  {data.icon} {data.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {data.value}時間 ({data.percentage}%)
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {lifeBalanceData.map((cat) => (
                    <div key={cat.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm flex-shrink-0">{cat.icon}</span>
                      <span className="text-sm text-foreground flex-1 truncate">{cat.name}</span>
                      <span className="text-sm font-semibold text-foreground">{cat.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                データがありません
              </p>
            )}
          </CardContent>
        </Card>

        {/* Person Resource - Horizontal Bar Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">時間を共にした人</CardTitle>
            <p className="text-xs text-muted-foreground">大切な人との時間を可視化</p>
          </CardHeader>
          <CardContent>
            {personResourceData.length > 0 ? (
              <div className="space-y-4">
                {personResourceData.slice(0, 6).map((person, index) => (
                  <div key={person.name} className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div 
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium text-white flex-shrink-0"
                        style={{ backgroundColor: person.color }}
                      >
                        {person.initials}
                      </div>
                      {/* Name and percentage */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground truncate">{person.name}</span>
                          <span className="text-sm font-semibold text-foreground ml-2">{person.percentage}%</span>
                        </div>
                        {/* Bar */}
                        <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${person.percentage}%`,
                              backgroundColor: person.color,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    {/* Time and money details */}
                    <div className="ml-12 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{person.timeSpent}時間</span>
                      {person.moneySpent > 0 && (
                        <span>¥{person.moneySpent.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                データがありません
              </p>
            )}
          </CardContent>
        </Card>

        {/* Encouraging message */}
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            毎日の記録が、自分をもっと好きになる第一歩
          </p>
        </div>
      </div>
    </div>
  )
}
