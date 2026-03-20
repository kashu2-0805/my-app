'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from '@/lib/store'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Users, Heart, PieChart as PieIcon, Smile, Frown, Angry, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Dashboard() {
  const { entries = [] } = useStore()

  // 🎨 感情の色設定（ソフトなトーンに統一）
  const EMOTION_CONFIG: any = {
    anger: { label: '怒', color: '#BC8F8F', icon: Angry },     // ソフトなテラコッタ（RosyBrown）
    sorrow: { label: '哀', color: '#6495ED', icon: Frown },     // 落ち着いた青（CornflowerBlue）
    joy: { label: '喜', color: '#FBBF24', icon: Smile },       // 鮮やかな黄
    happiness: { label: '楽', color: '#F472B6', icon: Zap },   // 幸福のピンク
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

  // 2. 対人分析集計（収入と支出を分けて集計）
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

  // 🛠️ 棒グラフの最大値を計算
  const maxHours = useMemo(() => {
    if (!personStats.length) return 1
    return Math.max(...personStats.map(s => s.hours))
  }, [personStats])

  // 総額の計算（支出・収入それぞれ）
  const totalSpent = entries.filter(e => e.amountType !== 'received').reduce((sum, e) => sum + (e.amount || 0), 0)
  const totalReceived = entries.filter(e => e.amountType === 'received').reduce((sum, e) => sum + (e.amount || 0), 0)

  if (!entries.length) return null

  return (
    <div className="p-6 space-y-12 h-full overflow-y-auto bg-slate-50 pb-40">
      <div className="space-y-2 text-center sm:text-left">
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
        <div className="grid grid-cols-1 gap-8">
          {personStats.map((stat) => (
            <div key={stat.name} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-8 transición-transform hover:scale-[1.01]">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                
                {/* 1. 名前と感情アイコン */}
                <div className="w-full lg:w-1/4 space-y-4">
                  <div>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Person</span>
                    <div className="text-3xl font-bold text-slate-800">{stat.name} さん</div>
                  </div>
                  <div className="flex justify-start sm:justify-start gap-3 pt-2">
                    {Object.entries(stat.emotions).map(([id, count]) => {
                      const config = EMOTION_CONFIG[id as keyof typeof EMOTION_CONFIG];
                      if (!config || count === 0) return null;
                      const Icon = config.icon;
                      return (
                        <div key={id} className="flex flex-col items-center">
                          <div className="p-2 rounded-full" style={{ backgroundColor: `${config.color}15`, color: config.color }}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold mt-1" style={{ color: config.color }}>{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 2. 時間：藤色（パステルパープル）の棒グラフ */}
                <div className="w-full lg:flex-1 space-y-3 px-4">
                  <div className="flex items-end gap-2 px-1">
                    <span className="text-2xl font-black text-slate-700 leading-none">{stat.hours}</span>
                    <span className="text-xs font-bold text-slate-400 leading-none uppercase tracking-widest">Time Spent</span>
                  </div>
                  <div className="h-6 bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner w-full">
                    <div 
                      className="h-full bg-indigo-300 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.3)]" 
                      style={{ width: `${(stat.hours / maxHours) * 100}%` }} // 最大時間に対する割合
                    />
                  </div>
                </div>

                {/* 🛠️ 3. 金額：上下2行でフラットに表示（色を統一） */}
                <div className="w-full lg:w-1/3 space-y-5 text-left lg:text-right border-t lg:border-t-0 pt-4 lg:pt-0">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block leading-none">Spent (GIVE)</span>
                    <span className="text-5xl font-black text-indigo-500 tracking-tighter italic block leading-none">
                      ¥{stat.spent.toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block leading-none">Received (GIFT)</span>
                    <span className="text-5xl font-black text-indigo-500 tracking-tighter italic block leading-none">
                      ¥{stat.received.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 🌈 感情比率バー（文字サイズ調整） */}
              <div className="pt-6 border-t border-slate-50 space-y-3 bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-inner leading-none">
                <div className="flex justify-between items-center px-1 leading-none">
                  <Label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase leading-none">Emotion Balance (喜怒哀楽の比率)</Label>
                </div>
                
                <div className="h-6 bg-white rounded-xl overflow-hidden flex w-full border border-slate-100 shadow-sm leading-none">
                  {Object.entries(stat.emotions).map(([id, count]) => {
                    const config = EMOTION_CONFIG[id as keyof typeof EMOTION_CONFIG];
                    if (!config || count === 0) return null;
                    const total = Object.values(stat.emotions).reduce((a, b: any) => a + b, 0);
                    const width = (count / total) * 100;
                    
                    return (
                      <div 
                        key={id} 
                        className="h-full transition-all duration-1000 ease-out flex items-center justify-center text-[12px] font-bold text-white shadow-inner leading-none" // 文字サイズをtext-[12px]へアップ
                        style={{ width: `${width}%`, backgroundColor: config.color }}
                        title={`${config.label}: ${count}回 (${width.toFixed(1)}%)`}
                      >
                        {width > 12 && config.label} {/* 12%以上の場合のみラベルを表示 */}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* C. 総額カード（文字を大きくゆったりと） */}
      <Card className="bg-slate-900 text-white border-none shadow-2xl rounded-[45px] mt-10">
        <CardContent className="p-12 text-center space-y-4">
          <Heart className="w-10 h-10 mx-auto text-pink-500 opacity-80 animate-pulse" />
          <h3 className="text-6xl font-black italic tracking-tighterLEADING-NONE leading-none">¥{(totalSpent + totalReceived).toLocaleString()}</h3>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em]LEADING-NONE leading-none">Total Energy Flow</p>
        </CardContent>
      </Card>
    </div>
  )
}
