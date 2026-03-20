'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from '@/lib/store'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Users, Heart, PieChart as PieIcon, Smile, Frown, Angry, Zap } from 'lucide-react'

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
      'self-investment': 'じぶん投資',
      'self-reward': 'じぶんご褒美',
      'living-cost': '生存コスト',
      'waste': '無駄遣い'
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
        if (!stats[p]) stats[p] = { spent: 0, received: 0, hours: 0, emotions: { joy: 0, anger: 0, sorrow: 0, happiness: 0 } }
        if (e.amountType === 'received') stats[p].received += amt
        else stats[p].spent += amt
        stats[p].hours += duration
        if (stats[p].emotions[entryEmotion] !== undefined) stats[p].emotions[entryEmotion] += 1
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
    <div className="p-6 space-y-12 h-full overflow-y-auto bg-slate-50 pb-40 text-slate-800">
      <div className="space-y-2 text-center sm:text-left leading-none">
        <h2 className="text-3xl font-black tracking-tight leading-none">エネルギー分析</h2>
        <p className="text-slate-500 font-medium tracking-tight leading-none pt-2">リソースの循環を振り返る</p>
      </div>

      {/* A. 円グラフ（肉厚ドーナツ） */}
      <Card className="rounded-[40px] border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-0 pt-8 text-center leading-none">
          <CardTitle className="text-slate-700 text-base font-bold flex justify-center items-center gap-2 leading-none">
            <PieIcon className="w-5 h-5 text-primary" /> カテゴリー別の割合
          </CardTitle>
        </CardHeader>
        <CardContent className="h-72 leading-none pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={30} outerRadius={90} dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`} paddingAngle={2}>
                {categoryData.map((_, i) => <Cell key={i} fill={['#6366f1', '#f472b6', '#10b981', '#f59e0b'][i % 4]} stroke="none" />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* B. 対人分析セクション */}
      <div className="space-y-6">
        <h4 className="flex items-center gap-2 text-xl font-bold text-slate-700 ml-2 leading-none">
          <Users className="w-6 h-6 text-primary" /> 対人分析
        </h4>
        <div className="grid grid-cols-1 gap-10">
          {personStats.map((stat) => (
            <div key={stat.name} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-8 transition-all hover:shadow-md">
              
              <div className="flex flex-col lg:flex-row justify-between items-start gap-8 leading-none">
                
                {/* 1. 相手の名前セクション (顔アイコンを削除してスッキリ) */}
                <div className="w-full lg:w-1/4 leading-none pt-2">
                  <span className="text-[14px] font-bold text-slate-400 uppercase tracking-[0.2em] block mb-3 leading-none">相手</span>
                  <div className="text-3xl font-black leading-none">{stat.name} <span className="text-lg font-medium text-slate-400">さん</span></div>
                </div>

                {/* 2. 右側コンテンツ */}
                <div className="flex flex-col lg:flex-row lg:flex-1 w-full gap-8 lg:gap-12">
                  
                  {/* 時間バー：単位「時間」を数字の後に配置 */}
                  <div className="w-full lg:flex-1 space-y-3 px-2 order-1 lg:order-none">
                    <div className="flex items-end gap-1 px-1 leading-none">
                      <span className="text-4xl font-black leading-none text-slate-700">{stat.hours}</span>
                      <span className="text-2xl font-black text-slate-300 italic mb-0.5">時間</span>
                    </div>
                    <div className="h-6 bg-slate-50 rounded-full overflow-hidden w-full shadow-inner border border-slate-100">
                      <div className="h-full bg-indigo-300 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(165,180,252,0.4)]" style={{ width: `${(stat.hours / maxHours) * 100}%` }} />
                    </div>
                  </div>

                  {/* 感情バランス：スマホ時に時間のすぐ下に配置 */}
                  <div className="w-full pt-4 border-t border-slate-50 space-y-3 order-2 lg:hidden">
                    <span className="text-[14px] font-bold text-slate-400 tracking-[0.2em] uppercase ml-1 block leading-none">感情のバランス</span>
                    <div className="h-8 bg-slate-50 rounded-2xl overflow-hidden flex w-full border border-slate-100 shadow-inner leading-none">
                      {Object.entries(stat.emotions).map(([id, count]) => {
                        const config = EMOTION_CONFIG[id];
                        if (!config || count === 0) return null;
                        const total = Object.values(stat.emotions).reduce((a, b: any) => a + b, 0);
                        return (
                          <div key={id} className="h-full flex items-center justify-center text-white text-[13px] font-bold" style={{ width: `${(count / total) * 100}%`, backgroundColor: config.color }}>
                            {(count / total) * 100 > 12 && config.label}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* 収支金額 */}
                  <div className="w-full lg:w-1/2 space-y-6 text-left lg:text-right border-t lg:border-t-0 pt-6 lg:pt-0 order-3 lg:order-none leading-none">
                    <div className="space-y-1">
                      <span className="text-[14px] font-bold text-rose-400 uppercase tracking-[0.2em] block mb-2 leading-none">GIVE (支出)</span>
                      <div className="flex items-center lg:justify-end leading-none">
                        <span className="text-2xl font-black text-rose-300 mr-1 italic leading-none">¥</span>
                        <span className="text-5xl font-black text-rose-500 tracking-tighter italic leading-none">{stat.spent.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="space-y-1 pt-2">
                      <span className="text-[14px] font-bold text-indigo-400 uppercase tracking-[0.2em] block mb-2 leading-none">GIFT (収入)</span>
                      <div className="flex items-center lg:justify-end leading-none">
                        <span className="text-2xl font-black text-indigo-300 mr-1 italic leading-none">¥</span>
                        <span className="text-5xl font-black text-indigo-500 tracking-tighter italic leading-none">{stat.received.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PC版用の感情比率バー */}
              <div className="hidden lg:block pt-8 border-t border-slate-50 space-y-4 leading-none">
                <span className="text-[14px] font-bold text-slate-400 tracking-[0.2em] uppercase ml-1 block leading-none mb-2">感情のバランス</span>
                <div className="h-8 bg-slate-50 rounded-2xl overflow-hidden flex w-full border border-slate-100 shadow-inner">
                  {Object.entries(stat.emotions).map(([id, count]) => {
                    const config = EMOTION_CONFIG[id];
                    if (!config || count === 0) return null;
                    const total = Object.values(stat.emotions).reduce((a, b: any) => a + b, 0);
                    return (
                      <div key={id} className="h-full flex items-center justify-center text-white text-[14px] font-black transition-all duration-1000 shadow-sm" style={{ width: `${(count / total) * 100}%`, backgroundColor: config.color }}>
                        {(count / total) * 100 > 12 && config.label}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* C. 総サマリー */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10 leading-none">
        <Card className="bg-white border-none shadow-sm rounded-[45px] p-10 text-center transition-transform hover:scale-[1.02]">
          <p className="text-[15px] font-bold uppercase tracking-[0.3em] text-rose-400 mb-4 leading-none">今日の総 GIVE</p>
          <h3 className="text-5xl font-black italic text-rose-500 tracking-tighter leading-none">¥{totalSpent.toLocaleString()}</h3>
        </Card>
        <Card className="bg-white border-none shadow-sm rounded-[45px] p-10 text-center transition-transform hover:scale-[1.02]">
          <p className="text-[15px] font-bold uppercase tracking-[0.3em] text-indigo-400 mb-4 leading-none">今日の総 GIFT</p>
          <h3 className="text-5xl font-black italic text-indigo-500 tracking-tighter leading-none">¥{totalReceived.toLocaleString()}</h3>
        </Card>
      </div>
    </div>
  )
}
