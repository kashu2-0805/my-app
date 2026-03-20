'use client'

import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from '@/lib/store'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Users, Heart, PieChart as PieIcon, Smile, Frown, Angry, Zap, TrendingUp, Clock, Tag, Briefcase, Calendar } from 'lucide-react'
import { Dialog, DialogContent } from "@/components/ui/dialog"

export function Dashboard() {
  const { entries = [] } = useStore()
  const [range, setRange] = useState<'1D' | '1W' | '1M' | '6M'>('1W')
  const [selectedEntry, setSelectedEntry] = useState<any>(null)

  const EMOTION_CONFIG: any = {
    anger: { label: '怒', color: '#BC8F8F', icon: Angry },     
    sorrow: { label: '哀', color: '#6495ED', icon: Frown },     
    joy: { label: '喜', color: '#FBBF24', icon: Smile },       
    happiness: { label: '楽', color: '#F472B6', icon: Zap },   
  }

  const categoryLabels: Record<string, string> = {
    'self-investment': 'じぶん投資', 'self-reward': 'じぶんご褒美', 'living-cost': '生存コスト', 'waste': '無駄遣い'
  }

  // 🛠️ 共通の期間フィルタリング
  const { filteredEntries, dateLabel } = useMemo(() => {
    if (!entries.length) return { filteredEntries: [], dateLabel: "" }
    const now = new Date()
    const startDate = new Date()
    if (range === '1D') startDate.setHours(now.getHours() - 24)
    else if (range === '1W') startDate.setDate(now.getDate() - 7)
    else if (range === '1M') startDate.setMonth(now.getMonth() - 1)
    else if (range === '6M') startDate.setMonth(now.getMonth() - 6)

    const filtered = entries.filter(e => new Date(e.date) >= startDate)
    const fmt = (d: Date) => `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`
    
    return { 
      filteredEntries: filtered, 
      dateLabel: range === '1D' ? fmt(now) : `${fmt(startDate)} - ${fmt(now)}`
    }
  }, [entries, range])

  // 以降、前回の完成されたロジックを維持
  const timelineData = useMemo(() => {
    return [...filteredEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((e) => {
        const d = new Date(e.date)
        return { displayDate: range === '1D' ? `${e.startHour}:00` : `${d.getMonth() + 1}/${d.getDate()}`, intensity: e.emotionIntensity || 50, original: e }
      })
  }, [filteredEntries, range])

  const categoryData = useMemo(() => {
    const stats: Record<string, number> = {}
    filteredEntries.forEach(e => {
      const cat = e.category || 'living-cost'; stats[cat] = (stats[cat] || 0) + (e.amount || 0)
    })
    return Object.entries(stats).map(([id, value]) => ({ name: categoryLabels[id] || id, value }))
  }, [filteredEntries])

  const relationshipData = useMemo(() => {
    const stats: Record<string, number> = {}
    filteredEntries.forEach(e => {
      const rel = e.relationship || 'その他'; stats[rel] = (stats[rel] || 0) + Math.max(1, (e.endHour || 0) - (e.startHour || 0))
    })
    return Object.entries(stats).map(([name, value]) => ({ name, value }))
  }, [filteredEntries])

  const personStats = useMemo(() => {
    const stats: Record<string, any> = {}
    filteredEntries.forEach(e => {
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
  }, [filteredEntries])

  const maxHours = Math.max(...personStats.map(s => s.hours), 1)
  const totalSpent = filteredEntries.filter(e => e.amountType !== 'received').reduce((sum, e) => sum + (e.amount || 0), 0)
  const totalReceived = filteredEntries.filter(e => e.amountType === 'received').reduce((sum, e) => sum + (e.amount || 0), 0)

  if (!entries.length) return null

  return (
    <div className="p-6 space-y-8 h-full overflow-y-auto bg-slate-50 pb-40 text-slate-800 font-sans">
      
      {/* 🏁 究極のヘッダー：タイトルのすぐ下に日付を固定 */}
      <div className="text-center space-y-4 pt-4">
        <h2 className="text-4xl font-black tracking-tighter text-slate-900 leading-none">エネルギー分析</h2>
        
        {/* 🚀 絶対に表示される日付ラベル */}
        <div className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-full shadow-lg">
          <Calendar className="w-4 h-4" />
          <span className="text-xl font-bold tracking-tight italic">{dateLabel}</span>
        </div>

        <p className="text-slate-400 font-medium text-xs tracking-widest uppercase">
          {range === '1D' ? 'Today\'s Insight' : 'Periodic Overview'}
        </p>

        {/* ボタン：幅いっぱいに広げて押しやすく */}
        <div className="flex bg-white p-1 rounded-2xl gap-1 shadow-sm border border-slate-200 max-w-sm mx-auto">
          {(['1D', '1W', '1M', '6M'] as const).map((r) => (
            <button key={r} onClick={() => setRange(r)} className={`flex-1 rounded-xl py-2 text-xs font-black transition-all ${range === r ? "bg-indigo-50 text-indigo-700" : "text-slate-400"}`}>
              {r === '1D' ? '1日' : r === '1W' ? '1週間' : r === '1M' ? '1ヶ月' : '半年'}
            </button>
          ))}
        </div>
      </div>

      {/* 📈 感情グラフ（クリック詳細表示） */}
      <Card className="rounded-[40px] border-none shadow-sm bg-white overflow-hidden mt-6">
        <CardHeader className="pb-2 pt-8 px-8"><CardTitle className="text-slate-700 text-base font-bold flex items-center gap-2"><TrendingUp className="w-5 h-5 text-indigo-400" /> バイオリズム</CardTitle></CardHeader>
        <CardContent className="h-64 pt-4 px-4 sm:px-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData} onClick={(data) => data && data.activePayload && setSelectedEntry(data.activePayload[0].payload.original)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="displayDate" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis hide domain={[0, 100]} />
              <Tooltip cursor={{ stroke: '#6366f1', strokeWidth: 2 }} content={() => null} />
              <Line type="monotone" dataKey="intensity" stroke="#6366f1" strokeWidth={4} dot={{ r: 6, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ダイアログ（日記） */}
      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="rounded-[40px] border-none p-0 overflow-hidden max-w-[90vw] sm:max-w-md shadow-2xl">
          {selectedEntry && (
            <div className="relative">
              <div className="h-32 w-full p-8 flex items-center gap-3 text-white" style={{ backgroundColor: EMOTION_CONFIG[selectedEntry.emotion]?.color || '#6366f1' }}>
                {React.createElement(EMOTION_CONFIG[selectedEntry.emotion]?.icon || Smile, { className: "w-10 h-10 drop-shadow-md" })}
                <span className="text-2xl font-black">記憶の記録</span>
              </div>
              <div className="p-8 space-y-6 bg-white -mt-6 rounded-t-[40px] relative">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest leading-none mb-1"><Clock className="w-3 h-3" /> {selectedEntry.date} | {selectedEntry.startHour}:00</div>
                    <div className="text-4xl font-black text-slate-800 leading-none pt-1">¥{selectedEntry.amount.toLocaleString()}</div>
                  </div>
                  <div className="px-3 py-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-500 uppercase flex items-center gap-2 border border-slate-100 tracking-widest leading-none"><Tag className="w-3 h-3" /> {categoryLabels[selectedEntry.category]}</div>
                </div>
                <div className="bg-slate-50 p-6 rounded-[32px] text-slate-700 italic border border-slate-100 shadow-inner leading-normal">"{selectedEntry.note || "（メモはありません）"}"</div>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-4 py-2 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-widest leading-none">{selectedEntry.relationship || 'その他'}</span>
                  {selectedEntry.people.map((p: string) => (<span key={p} className="px-4 py-2 bg-indigo-50 text-indigo-500 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-100 leading-none">@{p}</span>))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 円グラフ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="rounded-[40px] border-none shadow-sm bg-white overflow-hidden"><CardHeader className="pb-0 pt-8 text-center"><CardTitle className="text-slate-700 text-base font-bold flex justify-center items-center gap-2"><PieIcon className="w-5 h-5 text-indigo-400" /> お金のバランス</CardTitle></CardHeader>
          <CardContent className="h-72 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={categoryData} cx="50%" cy="50%" innerRadius={35} outerRadius={95} dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`} paddingAngle={2}>
                {categoryData.map((_, i) => <Cell key={i} fill={['#6366f1', '#f472b6', '#10b981', '#f59e0b'][i % 4]} stroke="none" />)}
              </Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="rounded-[40px] border-none shadow-sm bg-white overflow-hidden"><CardHeader className="pb-0 pt-8 text-center"><CardTitle className="text-slate-700 text-base font-bold flex justify-center items-center gap-2"><Briefcase className="w-5 h-5 text-indigo-400" /> 時間のポートフォリオ</CardTitle></CardHeader>
          <CardContent className="h-72 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={relationshipData} cx="50%" cy="50%" innerRadius={35} outerRadius={95} dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`} paddingAngle={2}>
                {relationshipData.map((_, i) => <Cell key={i} fill={['#818cf8', '#fb7185', '#34d399', '#f472b6', '#94a3b8'][i % 5]} stroke="none" />)}
              </Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 対人分析と総まとめ */}
      <div className="space-y-6">
        <h4 className="flex items-center gap-2 text-xl font-bold text-slate-700 ml-2"><Users className="w-6 h-6 text-primary" /> 対人分析</h4>
        {personStats.map((stat) => (
          <div key={stat.name} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-10 leading-none">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-8 leading-none">
              <div className="w-full lg:w-1/4 leading-none pt-2"><span className="text-[14px] font-bold text-slate-400 uppercase tracking-[0.2em] block mb-3 leading-none">相手</span><div className="text-3xl font-black leading-none">{stat.name} さん</div></div>
              <div className="flex flex-col lg:flex-row lg:flex-1 w-full gap-8 leading-none"><div className="w-full lg:flex-1 space-y-3 leading-none"><div className="flex items-end gap-1 leading-none"><span className="text-4xl font-black text-slate-700 leading-none">{stat.hours}</span><span className="text-2xl font-black text-slate-300 italic mb-0.5 leading-none font-black">時間</span></div>
                <div className="h-6 bg-slate-50 rounded-full overflow-hidden w-full shadow-inner border border-slate-100 leading-none"><div className="h-full bg-indigo-300 rounded-full" style={{ width: `${(stat.hours / maxHours) * 100}%` }} /></div>
              </div>
              <div className="w-full lg:w-1/3 space-y-6 text-left lg:text-right border-t lg:border-t-0 pt-6 leading-none">
                <div className="space-y-1 leading-none"><span className="text-[14px] font-bold text-rose-400 uppercase tracking-[0.2em] block leading-none font-bold">GIVE (支出)</span><div className="flex items-center lg:justify-end leading-none font-black"><span className="text-2xl font-black text-rose-300 mr-1 italic leading-none font-black">¥</span><span className="text-5xl font-black text-rose-500 tracking-tighter italic leading-none">{stat.spent.toLocaleString()}</span></div></div>
                <div className="space-y-1 pt-2 leading-none"><span className="text-[14px] font-bold text-indigo-400 uppercase tracking-[0.2em] block mb-2 leading-none font-bold">GIFT (収入)</span><div className="flex items-center lg:justify-end leading-none font-black"><span className="text-2xl font-black text-indigo-300 mr-1 italic leading-none font-black">¥</span><span className="text-5xl font-black text-indigo-500 tracking-tighter italic leading-none">{stat.received.toLocaleString()}</span></div></div>
              </div></div>
            </div>
            <div className="pt-8 border-t border-slate-50 space-y-4 leading-none"><span className="text-[14px] font-bold text-slate-400 tracking-[0.2em] uppercase ml-1 block mb-2 font-bold leading-none">感情のバランス</span>
                <div className="h-8 bg-slate-50 rounded-2xl overflow-hidden flex w-full border border-slate-100 shadow-inner leading-none">
                  {Object.entries(stat.emotions).map(([id, count]) => {
                    const config = EMOTION_CONFIG[id];
                    if (!config || count === 0) return null;
                    const total = Object.values(stat.emotions).reduce((a, b: any) => a + b, 0);
                    return (<div key={id} className="h-full flex items-center justify-center text-white text-[14px] font-black transition-all leading-none" style={{ width: `${(count / total) * 100}%`, backgroundColor: config.color }}>{config.label}</div>)
                  })}
                </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-16 pb-20 leading-none">
        <Card className="bg-white border-none shadow-sm rounded-[50px] p-12 text-center border border-rose-50 font-black"><p className="text-[15px] font-bold uppercase tracking-[0.4em] text-rose-300 mb-4 leading-none font-black">Total GIVE Flow</p><h3 className="text-6xl font-black italic text-rose-500 tracking-tighter leading-none">¥{totalSpent.toLocaleString()}</h3></Card>
        <Card className="bg-white border-none shadow-sm rounded-[50px] p-12 text-center border border-indigo-50 font-black"><p className="text-[15px] font-bold uppercase tracking-[0.4em] text-indigo-300 mb-4 leading-none font-black">Total GIFT Flow</p><h3 className="text-6xl font-black italic text-indigo-500 tracking-tighter leading-none">¥{totalReceived.toLocaleString()}</h3></Card>
      </div>
    </div>
  )
}
