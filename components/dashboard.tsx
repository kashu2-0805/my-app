'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from '@/lib/store'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Users, Heart, PieChart as PieIcon, Smile, Frown, Angry, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Dashboard() {
  const { entries = [] } = useStore()

  // 🎨 感情の定義
  const EMOTION_CONFIG: any = {
    anger: { label: '怒', color: '#800000', icon: Angry },
    sorrow: { label: '哀', color: '#3B82F6', icon: Frown },
    joy: { label: '喜', color: '#FBBF24', icon: Smile },
    happiness: { label: '楽', color: '#F472B6', icon: Zap },
  }

  // 1. カテゴリー集計
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

  // 2. 対人分析集計（エラー回避を徹底）
  const personStats = useMemo(() => {
    if (!entries.length) return []
    const stats: Record<string, { amount: number; hours: number; emotions: Record<string, number> }> = {}
    
    entries.forEach(e => {
      const duration = Math.max(1, (e.endHour || 0) - (e.startHour || 0))
      const entryPeople = e.people || []
      const entryEmotion = e.emotion || 'joy'
      
      entryPeople.forEach(p => {
        if (!stats[p]) {
          stats[p] = { amount: 0, hours: 0, emotions: { joy: 0, anger: 0, sorrow: 0, happiness: 0 } }
        }
        stats[p].amount += (e.amount || 0)
        stats[p].hours += duration
        if (stats[p].emotions[entryEmotion] !== undefined) {
          stats[p].emotions[entryEmotion] += 1
        }
      })
    })

    return Object.entries(stats).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.amount - a.amount)
  }, [entries])

  const maxHours = useMemo(() => {
    if (!personStats.length) return 1
    return Math.max(...personStats.map(s => s.hours))
  }, [personStats])

  const totalAmount = entries.reduce((sum, e) => sum + (e.amount || 0), 0)

  if (!entries.length) return null

  return (
    <div className="p-6 space-y-12 h-full overflow-y-auto bg-slate-50 pb-40">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">エネルギー分析</h2>
        <p className="text-slate-500 font-medium tracking-tight">時間とお金、あなたのリソースの行方</p>
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
        <div className="grid grid-cols-1 gap-6">
          {personStats.map((stat) => (
            <div key={stat.name} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
                
                {/* 1. 名前 */}
                <div className="w-full sm:w-1/4">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block">Person</span>
                  <div className="text-2xl font-bold text-slate-800">{stat.name} さん</div>
                </div>

                {/* 2. 時間：ピンクの棒グラフ */}
                <div className="w-full sm:flex-1 space-y-2">
                  <div className="flex items-end gap-2 px-1">
                    <span className="text-2xl font-black text-slate-700 leading-none">{stat.hours}</span>
                    <span className="text-xs font-bold text-slate-400 leading-none uppercase">Hours</span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden w-full">
                    <div 
                      className="h-full bg-pink-400 rounded-full transition-all duration-1000" 
                      style={{ width: `${(stat.hours / maxHours) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 3. 金額：右揃え数字 */}
                <div className="w-full sm:w-1/3 text-left sm:text-right">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-widest">Total Amount</span>
                  <span className="text-5xl font-black text-primary tracking-tighter italic block leading-none">
                    ¥{stat.amount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 🌈 ここが重要：自作の感情比率グラフ */}
              <div className="pt-6 border-t border-slate-50 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Emotion Ratio (喜怒哀楽の比率)</span>
                </div>
                
                {/* 自作の1本バーグラフ（Rechartsを使わないので絶対にエラーにならない） */}
                <div className="h-6 bg-slate-100 rounded-xl overflow-hidden flex w-full shadow-inner">
                  {Object.entries(stat.emotions).map(([id, count]) => {
                    const config = EMOTION_CONFIG[id];
                    if (!config || count === 0) return null;
                    const total = Object.values(stat.emotions).reduce((a, b) => a + b, 0);
                    const width = (count / total) * 100;
                    
                    return (
                      <div 
                        key={id} 
                        className="h-full flex items-center justify-center text-white text-[10px] font-bold transition-all duration-700"
                        style={{ width: `${width}%`, backgroundColor: config.color }}
                      >
                        {width > 12 && config.label}
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
      <Card className="bg-slate-900 text-white border-none shadow-2xl rounded-[45px]">
        <CardContent className="p-12 text-center space-y-4">
          <Heart className="w-10 h-10 mx-auto text-pink-500 opacity-80 animate-pulse" />
          <h3 className="text-6xl font-black italic tracking-tighter">¥{totalAmount.toLocaleString()}</h3>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em]">Total Life Energy Flow</p>
        </CardContent>
      </Card>
    </div>
  )
}
