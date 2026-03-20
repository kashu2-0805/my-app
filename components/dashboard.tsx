'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from '@/lib/store'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Users, Heart, PieChart as PieIcon, Smile, Frown, Angry, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Dashboard() {
  const { entries = [] } = useStore()

  const EMOTION_CONFIG: any = {
    anger: { label: '怒', color: '#BC8F8F', icon: Angry },
    sorrow: { label: '哀', color: '#6495ED', icon: Frown },
    joy: { label: '喜', color: '#FBBF24', icon: Smile },
    happiness: { label: '楽', color: '#F472B6', icon: Zap },
  }

  const categoryData = useMemo(() => {
    if (!entries.length) return []
    const stats: Record<string, number> = {}
    entries.forEach(e => {
      const cat = e.category || 'living-cost'
      stats[cat] = (stats[cat] || 0) + (e.amount || 0)
    })
    const labels: Record<string, string> = {
      'self-investment': '自己投資', 'self-reward': 'ご褒美', 'living-cost': '生活費', 'waste': '浪費'
    }
    return Object.entries(stats).map(([id, value]) => ({ name: labels[id] || id, value }))
  }, [entries])

  const personStats = useMemo(() => {
    if (!entries.length) return []
    const stats: Record<string, { spent: number; received: number; hours: number; emotions: Record<string, number> }> = {}
    
    entries.forEach(e => {
      const duration = Math.max(1, (e.endHour || 0) - (e.startHour || 0))
      const entryPeople = e.people || []
      const entryEmotion = e.emotion || 'joy'
      const amt = e.amount || 0
      
      entryPeople.forEach(p => {
        if (!stats[p]) {
          stats[p] = { spent: 0, received: 0, hours: 0, emotions: { joy: 0, anger: 0, sorrow: 0, happiness: 0 } }
        }
        if (e.amountType === 'received') {
          stats[p].received += amt
        } else {
          stats[p].spent += amt
        }
        stats[p].hours += duration
        if (stats[p].emotions[entryEmotion] !== undefined) {
          stats[p].emotions[entryEmotion] += 1
        }
      })
    })

    return Object.entries(stats).map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => (b.spent + b.received) - (a.spent + a.received))
  }, [entries])

  const maxHours = useMemo(() => {
    if (!personStats.length) return 1
    return Math.max(...personStats.map(s => s.hours))
  }, [personStats])

  const totalSpent = entries.filter(e => e.amountType !== 'received').reduce((sum, e) => sum + (e.amount || 0), 0)
  const totalReceived = entries.filter(e => e.amountType === 'received').reduce((sum, e) => sum + (e.amount || 0), 0)

  if (!entries.length) return null

  return (
    <div className="p-6 space-y-12 h-full overflow-y-auto bg-slate-50 pb-40">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight text-center sm:text-left">エネルギー分析</h2>
        <p className="text-slate-500 font-medium tracking-tight text-center sm:text-left">人との間に流れた「豊かさ」の記録</p>
      </div>

      {/* A. 円グラフ */}
      <Card className="rounded-[40px] border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-0 pt-8 text-center">
          <CardTitle className="text-slate-700 text-base font-bold flex justify-center items-center gap-2">
            <PieIcon className="w-5 h-5 text-primary" /> カテゴリー別の割合
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({name}) => name}>
                {categoryData.map((_, i) => <Cell key={i} fill={['#6366f1', '#f472b6', '#10b981', '#f59e0b'][i % 4]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* B. 対人関係の個別分析 */}
      <div className="space-y-6">
        <h4 className="flex items-center gap-2 text-lg font-bold text-slate-700 ml-2">
          <Users className="w-5 h-5 text-primary" /> 対人関係の個別分析
        </h4>
        <div className="grid grid-cols-1 gap-8">
          {personStats.map((stat) => (
            <div key={stat.name} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-10">
              {/* 上段：名前と時間 */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                <div className="w-full lg:w-1/4">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block">Person</span>
                  <div className="text-3xl font-bold text-slate-800">{stat.name} さん</div>
                </div>

                <div className="w-full lg:flex-1 space-y-3">
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-black text-slate-700 leading-none">{stat.hours}</span>
                    <span className="text-xs font-bold text-slate-400 leading-none uppercase tracking-widest">Total Hours</span>
                  </div>
                  <div className="h-5 bg-slate-100 rounded-full overflow-hidden w-full">
                    <div 
                      className="h-full bg-indigo-300 rounded-full transition-all duration-1000" 
                      style={{ width: `${(stat.hours / maxHours) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 中段：収支の個別表示 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-y border-slate-50 py-8">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-[0.2em]">Spent (GIVE)</span>
                  <div className="text-5xl font-black text-rose-500 tracking-tighter italic">
                    ¥{stat.spent.toLocaleString()}
                  </div>
                </div>
                <div className="space-y-1 text-center sm:text-right">
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-[0.2em]">Received (GIFT)</span>
                  <div className="text-5xl font-black text-sky-500 tracking-tighter italic">
                    ¥{stat.received.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* 下段：感情比率 */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase ml-1">Emotion Balance</span>
                <div className="h-8 bg-slate-100 rounded-2xl overflow-hidden flex w-full border border-slate-50">
                  {Object.entries(stat.emotions).map(([id, count]) => {
                    const config = EMOTION_CONFIG[id];
                    if (!config || count === 0) return null;
                    const total = Object.values(stat.emotions).reduce((a, b: any) => a + b, 0);
                    const width = (count / total) * 100;
                    return (
                      <div 
                        key={id} 
                        className="h-full flex items-center justify-center text-white text-[13px] font-bold transition-all"
                        style={{ width: `${width}%`, backgroundColor: config.color }}
                      >
                        {width > 10 && config.label}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* C. 総額カード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-rose-500 text-white border-none shadow-xl rounded-[40px] p-8 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-2">Total Give (支出)</p>
          <h3 className="text-4xl font-black italic">¥{totalSpent.toLocaleString()}</h3>
        </Card>
        <Card className="bg-sky-500 text-white border-none shadow-xl rounded-[40px] p-8 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-2">Total Gift (収入)</p>
          <h3 className="text-4xl font-black italic">¥{totalReceived.toLocaleString()}</h3>
        </Card>
      </div>
    </div>
  )
}
