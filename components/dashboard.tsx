'use client'

import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from '@/lib/store'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Users, Heart, PieChart as PieIcon, Smile, Frown, Angry, Zap, TrendingUp, X, Clock, Tag } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function Dashboard() {
  const { entries = [] } = useStore()
  const [range, setRange] = useState<'1D' | '1W' | '1M' | '6M'>('1W')
  const [selectedEntry, setSelectedEntry] = useState<any>(null) // クリックされたデータを保存

  const EMOTION_CONFIG: any = {
    anger: { label: '怒', color: '#BC8F8F', icon: Angry },     
    sorrow: { label: '哀', color: '#6495ED', icon: Frown },     
    joy: { label: '喜', color: '#FBBF24', icon: Smile },       
    happiness: { label: '楽', color: '#F472B6', icon: Zap },   
  }

  const categoryLabels: Record<string, string> = {
    'self-investment': 'じぶん投資', 'self-reward': 'じぶんご褒美', 'living-cost': '生存コスト', 'waste': '無駄遣い'
  }

  // 1. 📈 グラフデータ生成
  const timelineData = useMemo(() => {
    if (!entries.length) return []
    const now = new Date()
    const filterDate = new Date()
    if (range === '1D') filterDate.setHours(now.getHours() - 24)
    else if (range === '1W') filterDate.setDate(now.getDate() - 7)
    else if (range === '1M') filterDate.setMonth(now.getMonth() - 1)
    else if (range === '6M') filterDate.setMonth(now.getMonth() - 6)

    return entries
      .filter(e => new Date(e.date) >= filterDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((e) => {
        const d = new Date(e.date)
        let label = range === '1D' ? `${e.startHour}:00` : range === '1W' ? `${d.getMonth() + 1}/${d.getDate()}` : range === '1M' ? `${d.getDate()}日` : `${d.getMonth() + 1}月`
        return {
          displayDate: label,
          intensity: e.emotionIntensity || 50,
          original: e // 元データを保持しておく
        }
      })
  }, [entries, range])

  // 2. 集計ロジック（前回の内容を維持）
  const categoryData = useMemo(() => {
    const stats: Record<string, number> = {}
    entries.forEach(e => {
      const cat = e.category || 'living-cost'
      stats[cat] = (stats[cat] || 0) + (e.amount || 0)
    })
    return Object.entries(stats).map(([id, value]) => ({ name: categoryLabels[id] || id, value }))
  }, [entries])

  const personStats = useMemo(() => {
    const stats: Record<string, any> = {}
    entries.forEach(e => {
      const duration = Math.max(1, (e.endHour || 0) - (e.startHour || 0))
      const amt = e.amount || 0
      const entryEmotion = e.emotion || 'joy'
      ;(e.people || []).forEach(p => {
        if (!stats[p]) stats[p] = { spent: 0, received: 0, hours: 0, emotions: { joy: 0, anger: 0, sorrow: 0, happiness: 0 } }
        if (e.amountType === 'received') stats[p].received += amt; else stats[p].spent += amt
        stats[p].hours += duration
        if (stats[p].emotions[entryEmotion] !== undefined) stats[p].emotions[entryEmotion] += 1
      })
    })
    return Object.entries(stats).map(([name, data]) => ({ name, ...data })).sort((a, b) => (b.spent + b.received) - (a.spent + a.received))
  }, [entries])

  const maxHours = Math.max(...personStats.map(s => s.hours), 1)
  const totalSpent = entries.filter(e => e.amountType !== 'received').reduce((sum, e) => sum + (e.amount || 0), 0)
  const totalReceived = entries.filter(e => e.amountType === 'received').reduce((sum, e) => sum + (e.amount || 0), 0)

  if (!entries.length) return null

  return (
    <div className="p-6 space-y-12 h-full overflow-y-auto bg-slate-50 pb-40 text-slate-800">
      <div className="space-y-2 text-center sm:text-left">
        <h2 className="text-3xl font-black tracking-tight leading-none">エネルギー分析</h2>
        <p className="text-slate-500 font-medium tracking-tight pt-2">点から記憶をたどる</p>
      </div>

      {/* 📈 感情グラフ（クリックイベント付き） */}
      <Card className="rounded-[40px] border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 pt-8 px-8">
          <CardTitle className="text-slate-700 text-base font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" /> 感情のバイオリズム
          </CardTitle>
          <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
            {(['1D', '1W', '1M', '6M'] as const).map((r) => (
              <button key={r} onClick={() => setRange(r)} className={`rounded-xl px-4 py-1 h-8 text-xs font-bold transition-all ${range === r ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"}`}>{r === '1D' ? '1日' : r === '1W' ? '1週間' : r === '1M' ? '1ヶ月' : '半年'}</button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="h-64 pt-4 px-4 sm:px-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={timelineData} 
              onClick={(data) => data && data.activePayload && setSelectedEntry(data.activePayload[0].payload.original)}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="displayDate" stroke="#cbd5e1" fontSize={12} tickLine={false} axisLine={false} interval={range === '1D' ? 1 : 'preserveStartEnd'} />
              <YAxis hide domain={[0, 100]} />
              <Tooltip cursor={{ stroke: '#6366f1', strokeWidth: 2 }} content={() => null} />
              <Line type="monotone" dataKey="intensity" stroke="#6366f1" strokeWidth={4} dot={{ r: 8, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 10, cursor: 'pointer' }} isAnimationActive={true} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-center text-slate-400 mt-2 italic">点をクリックして当時の詳細を表示</p>
        </CardContent>
      </Card>

      {/* 詳細ポップアップ（モーダル） */}
      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="rounded-[40px] border-none p-0 overflow-hidden max-w-[90vw] sm:max-w-md">
          {selectedEntry && (
            <div className="relative">
              <div className="h-32 w-full" style={{ backgroundColor: EMOTION_CONFIG[selectedEntry.emotion]?.color || '#6366f1' }}>
                <div className="absolute top-6 left-8 flex items-center gap-3 text-white">
                  {React.createElement(EMOTION_CONFIG[selectedEntry.emotion]?.icon || Smile, { className: "w-8 h-8" })}
                  <span className="text-2xl font-black">この時のきもち</span>
                </div>
              </div>
              <div className="p-8 space-y-6 bg-white -mt-6 rounded-t-[40px] relative">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
                      <Clock className="w-4 h-4" /> {selectedEntry.date} {selectedEntry.startHour}:00 - {selectedEntry.endHour}:00
                    </div>
                    <div className="text-3xl font-black text-slate-800">¥{selectedEntry.amount.toLocaleString()}</div>
                  </div>
                  <div className="px-4 py-2 bg-slate-50 rounded-2xl text-xs font-bold text-slate-500 flex items-center gap-2">
                    <Tag className="w-3 h-3" /> {categoryLabels[selectedEntry.category]}
                  </div>
                </div>
                
                <div className="bg-slate-50 p-6 rounded-[30px] text-slate-700 leading-relaxed italic">
                  "{selectedEntry.note || "（メモはありません）"}"
                </div>

                <div className="flex gap-2 flex-wrap">
                  {selectedEntry.people.map((p: string) => (
                    <span key={p} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">@{p}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 以降、カテゴリー円グラフ・対人分析（以前の素晴らしいデザインを継続） */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="rounded-[40px] border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="pb-0 pt-8 text-center"><CardTitle className="text-slate-700 text-base font-bold flex justify-center items-center gap-2"><PieIcon className="w-5 h-5 text-indigo-400" /> カテゴリー別</CardTitle></CardHeader>
          <CardContent className="h-72 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={categoryData} cx="50%" cy="50%" innerRadius={30} outerRadius={90} dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`} paddingAngle={2}>
                {categoryData.map((_, i) => <Cell key={i} fill={['#6366f1', '#f472b6', '#10b981', '#f59e0b'][i % 4]} stroke="none" />)}
              </Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-6">
          <Card className="bg-white border-none shadow-sm rounded-[45px] p-10 text-center flex-1 flex flex-col justify-center transition-transform hover:scale-[1.02]">
            <p className="text-[15px] font-bold uppercase tracking-[0.3em] text-rose-400 mb-4 font-bold">今日の総 GIVE</p>
            <h3 className="text-5xl font-black italic text-rose-500 tracking-tighter leading-none">¥{totalSpent.toLocaleString()}</h3>
          </Card>
          <Card className="bg-white border-none shadow-sm rounded-[45px] p-10 text-center flex-1 flex flex-col justify-center transition-transform hover:scale-[1.02]">
            <p className="text-[15px] font-bold uppercase tracking-[0.3em] text-indigo-400 mb-4 font-bold">今日の総 GIFT</p>
            <h3 className="text-5xl font-black italic text-indigo-500 tracking-tighter leading-none">¥{totalReceived.toLocaleString()}</h3>
          </Card>
        </div>
      </div>

      <div className="space-y-6">
        <h4 className="flex items-center gap-2 text-xl font-bold text-slate-700 ml-2"><Users className="w-6 h-6 text-primary" /> 対人分析</h4>
        <div className="grid grid-cols-1 gap-10">
          {personStats.map((stat) => (
            <div key={stat.name} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-10">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-8 leading-none">
                <div className="w-full lg:w-1/4 leading-none pt-2">
                  <span className="text-[14px] font-bold text-slate-400 uppercase tracking-[0.2em] block mb-3 font-bold">相手</span>
                  <div className="text-3xl font-black leading-none">{stat.name} <span className="text-lg font-medium text-slate-400">さん</span></div>
                </div>
                <div className="flex flex-col lg:flex-row lg:flex-1 w-full gap-8 lg:gap-12">
                  <div className="w-full lg:flex-1 space-y-3 px-2 order-1 lg:order-none">
                    <div className="flex items-end gap-1 px-1"><span className="text-4xl font-black text-slate-700">{stat.hours}</span><span className="text-2xl font-black text-slate-300 italic mb-0.5">時間</span></div>
                    <div className="h-6 bg-slate-50 rounded-full overflow-hidden w-full shadow-inner border border-slate-100">
                      <div className="h-full bg-indigo-300 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(165,180,252,0.4)]" style={{ width: `${(stat.hours / maxHours) * 100}%` }} />
                    </div>
                  </div>
                  <div className="w-full lg:w-1/2 space-y-6 text-left lg:text-right border-t lg:border-t-0 pt-6 lg:pt-0 order-3 lg:order-none">
                    <div className="space-y-1"><span className="text-[14px] font-bold text-rose-400 uppercase tracking-[0.2em] block mb-2 font-bold">GIVE (支出)</span>
                    <div className="flex items-center lg:justify-end leading-none"><span className="text-2xl font-black text-rose-300 mr-1 italic">¥</span><span className="text-5xl font-black text-rose-500 tracking-tighter italic leading-none">{stat.spent.toLocaleString()}</span></div></div>
                    <div className="space-y-1 pt-2 leading-none"><span className="text-[14px] font-bold text-indigo-400 uppercase tracking-[0.2em] block mb-2 font-bold">GIFT (収入)</span>
                    <div className="flex items-center lg:justify-end leading-none"><span className="text-2xl font-black text-indigo-300 mr-1 italic">¥</span><span className="text-5xl font-black text-indigo-500 tracking-tighter italic leading-none">{stat.received.toLocaleString()}</span></div></div>
                  </div>
                </div>
              </div>
              <div className="pt-8 border-t border-slate-50 space-y-4 leading-none">
                <span className="text-[14px] font-bold text-slate-400 tracking-[0.2em] uppercase ml-1 block mb-2 font-bold">感情のバランス</span>
                <div className="h-8 bg-slate-50 rounded-2xl overflow-hidden flex w-full border border-slate-100 shadow-inner">
                  {Object.entries(stat.emotions).map(([id, count]) => {
                    const config = EMOTION_CONFIG[id];
                    if (!config || count === 0) return null;
                    const total = Object.values(stat.emotions).reduce((a, b: any) => a + b, 0);
                    return (<div key={id} className="h-full flex items-center justify-center text-white text-[14px] font-black transition-all" style={{ width: `${(count / total) * 100}%`, backgroundColor: config.color }}>{config.label}</div>)
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
