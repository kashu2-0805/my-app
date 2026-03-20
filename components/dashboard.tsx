'use client'

import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from '@/lib/store'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Users, Heart, PieChart as PieIcon, Smile, Frown, Angry, Zap, TrendingUp, Clock, Tag, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react'
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

  // 🗓️ 日付ラベル生成（タイムライン画面のデザインを再現）
  const { filteredEntries, mainDateLabel, subLabel } = useMemo(() => {
    if (!entries.length) return { filteredEntries: [], mainDateLabel: "データなし", subLabel: "-" }
    const now = new Date()
    const startDate = new Date()
    if (range === '1D') startDate.setHours(now.getHours() - 24)
    else if (range === '1W') startDate.setDate(now.getDate() - 7)
    else if (range === '1M') startDate.setMonth(now.getMonth() - 1)
    else if (range === '6M') startDate.setMonth(now.getMonth() - 6)

    const filtered = entries.filter(e => new Date(e.date) >= startDate)
    const days = ['日', '月', '火', '水', '木', '金', '土']
    const fmt = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日(${days[d.getDay()]})`
    
    let mainLabel = range === '1D' ? fmt(now) : `${fmt(startDate)} 〜 ${fmt(now)}`
    let sub = range === '1D' ? "今日" : range === '1W' ? "直近1週間" : range === '1M' ? "直近1ヶ月" : "直近半年"

    return { filteredEntries: filtered, mainDateLabel: mainLabel, subLabel: sub }
  }, [entries, range])

  // 集計ロジック
  const timelineData = useMemo(() => {
    return [...filteredEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((e) => ({ displayDate: range === '1D' ? `${e.startHour}:00` : `${new Date(e.date).getMonth() + 1}/${new Date(e.date).getDate()}`, intensity: e.emotionIntensity || 50, original: e }))
  }, [filteredEntries, range])

  const categoryData = useMemo(() => {
    const stats: Record<string, number> = {}
    filteredEntries.forEach(e => { const cat = e.category || 'living-cost'; stats[cat] = (stats[cat] || 0) + (e.amount || 0) })
    return Object.entries(stats).map(([id, value]) => ({ name: categoryLabels[id] || id, value }))
  }, [filteredEntries])

  const relationshipData = useMemo(() => {
    const stats: Record<string, number> = {}
    filteredEntries.forEach(e => { const rel = e.relationship || 'その他'; stats[rel] = (stats[rel] || 0) + Math.max(1, (e.endHour || 0) - (e.startHour || 0)) })
    return Object.entries(stats).map(([name, value]) => ({ name, value }))
  }, [filteredEntries])

  const personStats = useMemo(() => {
    const stats: Record<string, any> = {}
    filteredEntries.forEach(e => {
      const duration = Math.max(1, (e.endHour || 0) - (e.startHour || 0)); const amt = e.amount || 0; const entryEmotion = e.emotion || 'joy'
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
    <div className="flex flex-col h-full bg-white text-slate-800">
      
      {/* 🏁 ヘッダー：画像の「エネルギー分析」の位置を日付に書き換えました */}
      <div className="flex flex-col items-center pt-8 pb-4 bg-white">
        <div className="flex items-center justify-between w-full px-8 max-w-md">
          <ChevronLeft className="w-5 h-5 text-slate-200" />
          <div className="text-center">
            {/* 🗓️ 画面最上部のメインタイトル位置に日付を表示 */}
            <h2 className="text-[28px] font-black text-slate-800 tracking-tight leading-none">{mainDateLabel}</h2>
            {/* 🗓️ サブタイトル位置にピンクのラベルを表示 */}
            <p className="text-pink-500 text-[14px] font-black mt-2 leading-none uppercase tracking-widest">{subLabel}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-200" />
        </div>

        {/* 期間切り替えボタン */}
        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 mt-6">
          {(['1D', '1W', '1M', '6M'] as const).map((r) => (
            <button 
              key={r} 
              onClick={() => setRange(r)} 
              className={`rounded-xl px-5 py-2 text-xs font-black transition-all ${range === r ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"}`}
            >
              {r === '1D' ? '1日' : r === '1W' ? '1週間' : r === '1M' ? '1ヶ月' : '半年'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-10 pb-40 bg-slate-50/50">
        
        {/* 📈 感情グラフ（クリック詳細対応） */}
        <Card className="rounded-[40px] border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="pb-2 pt-8 px-8 flex flex-row items-center gap-2 leading-none">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <CardTitle className="text-slate-700 text-base font-bold leading-none uppercase tracking-widest">Biorythm</CardTitle>
          </CardHeader>
          <CardContent className="h-64 pt-4 px-4 sm:px-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} onClick={(data) => data && data.activePayload && setSelectedEntry(data.activePayload[0].payload.original)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="displayDate" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip cursor={{ stroke: '#6366f1', strokeWidth: 2 }} content={() => null} />
                <Line type="monotone" dataKey="intensity" stroke="#6366f1" strokeWidth={4} dot={{ r: 6, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 8, cursor: 'pointer' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 円グラフ2種 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 leading-none">
          <Card className="rounded-[40px] border-none shadow-sm bg-white overflow-hidden leading-none p-4">
            <CardHeader className="text-center font-bold text-slate-700 leading-none font-black uppercase tracking-widest">Money Balance</CardHeader>
            <CardContent className="h-72 leading-none pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={categoryData} cx="50%" cy="50%" innerRadius={35} outerRadius={95} dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`} paddingAngle={2}>
                  {categoryData.map((_, i) => <Cell key={i} fill={['#6366f1', '#f472b6', '#10b981', '#f59e0b'][i % 4]} stroke="none" />)}
                </Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="rounded-[40px] border-none shadow-sm bg-white overflow-hidden leading-none p-4">
            <CardHeader className="text-center font-bold text-slate-700 leading-none font-black uppercase tracking-widest">Time Portfolio</CardHeader>
            <CardContent className="h-72 leading-none pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={relationshipData} cx="50%" cy="50%" innerRadius={35} outerRadius={95} dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`} paddingAngle={2}>
                  {relationshipData.map((_, i) => <Cell key={i} fill={['#818cf8', '#fb7185', '#34d399', '#f472b6', '#94a3b8'][i % 5]} stroke="none" />)}
                </Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* 対人分析 */}
        <div className="space-y-6">
          <h4 className="flex items-center gap-2 text-xl font-bold text-slate-700 ml-2 font-black uppercase tracking-widest"><Users className="w-6 h-6 text-primary" /> People</h4>
          {personStats.map((stat) => (
            <div key={stat.name} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-10 transition-all">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-8 leading-none">
                <div className="w-full lg:w-1/4 leading-none pt-2"><span className="text-[14px] font-bold text-slate-400 uppercase tracking-[0.2em] block mb-3 font-black">Person</span><div className="text-3xl font-black leading-none">{stat.name} さん</div></div>
                <div className="flex flex-col lg:flex-row lg:flex-1 w-full gap-8 leading-none"><div className="w-full lg:flex-1 space-y-3 leading-none"><div className="flex items-end gap-1 leading-none font-black"><span className="text-4xl font-black text-slate-700 leading-none">{stat.hours}</span><span className="text-2xl font-black text-slate-300 italic mb-0.5 leading-none">時間</span></div>
                  <div className="h-6 bg-slate-50 rounded-full overflow-hidden w-full shadow-inner border border-slate-100 leading-none"><div className="h-full bg-indigo-300 rounded-full" style={{ width: `${(stat.hours / maxHours) * 100}%` }} /></div>
                </div>
                <div className="w-full lg:w-1/3 space-y-6 text-left lg:text-right border-t lg:border-t-0 pt-6 leading-none">
                  <div className="space-y-1 leading-none font-black"><span className="text-[14px] font-bold text-rose-400 uppercase tracking-[0.2em] block leading-none font-black">GIVE</span><div className="flex items-center lg:justify-end leading-none font-black"><span className="text-2xl font-black text-rose-300 mr-1 italic leading-none font-black">¥</span><span className="text-5xl font-black text-rose-500 tracking-tighter italic leading-none">{stat.spent.toLocaleString()}</span></div></div>
                  <div className="space-y-1 pt-2 leading-none font-black"><span className="text-[14px] font-bold text-indigo-400 uppercase tracking-[0.2em] block leading-none font-bold">GIFT</span><div className="flex items-center lg:justify-end leading-none font-black"><span className="text-2xl font-black text-indigo-300 mr-1 italic leading-none font-black">¥</span><span className="text-5xl font-black text-indigo-500 tracking-tighter italic leading-none">{stat.received.toLocaleString()}</span></div></div>
                </div></div>
              </div>
              <div className="pt-8 border-t border-slate-50 space-y-4 leading-none font-black tracking-widest"><span className="text-[14px] font-bold text-slate-400 uppercase ml-1 block mb-2 font-black leading-none">Balance</span>
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

        {/* 総まとめ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-16 pb-20 leading-none">
          <Card className="bg-white border-none shadow-sm rounded-[50px] p-12 text-center border border-rose-50 font-black"><p className="text-[15px] font-bold uppercase tracking-[0.4em] text-rose-300 mb-4 leading-none font-black">Total GIVE</p><h3 className="text-6xl font-black italic text-rose-500 tracking-tighter leading-none tracking-tighter">¥{totalSpent.toLocaleString()}</h3></Card>
          <Card className="bg-white border-none shadow-sm rounded-[50px] p-12 text-center border border-indigo-50 font-black"><p className="text-[15px] font-bold uppercase tracking-[0.4em] text-indigo-300 mb-4 leading-none font-black">Total GIFT</p><h3 className="text-6xl font-black italic text-indigo-500 tracking-tighter leading-none tracking-tighter">¥{totalReceived.toLocaleString()}</h3></Card>
        </div>
      </div>

      {/* 詳細日記ダイアログ */}
      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="rounded-[40px] border-none p-0 overflow-hidden shadow-2xl">
          {selectedEntry && (
            <div className="relative">
              <div className="h-32 w-full p-8 flex items-center gap-3 text-white transition-colors duration-500" style={{ backgroundColor: EMOTION_CONFIG[selectedEntry.emotion]?.color || '#6366f1' }}>
                {React.createElement(EMOTION_CONFIG[selectedEntry.emotion]?.icon || Smile, { className: "w-10 h-10 drop-shadow-md" })}
                <span className="text-2xl font-black">記憶の記録</span>
              </div>
              <div className="p-8 space-y-6 bg-white -mt-6 rounded-t-[40px] relative">
                <div className="flex justify-between items-start leading-none">
                  <div className="space-y-1 leading-none">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest leading-none mb-1 font-black"><Clock className="w-3 h-3" /> {selectedEntry.date} | {selectedEntry.startHour}:00</div>
                    <div className="text-4xl font-black text-slate-800 leading-none pt-1">¥{selectedEntry.amount.toLocaleString()}</div>
                  </div>
                  <div className="px-3 py-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 border border-slate-100 leading-none font-black"><Tag className="w-3 h-3" /> {categoryLabels[selectedEntry.category]}</div>
                </div>
                <div className="bg-slate-50 p-6 rounded-[32px] text-slate-700 italic border border-slate-100 shadow-inner font-black">"{selectedEntry.note || "（メモはありません）"}"</div>
                <div className="flex gap-2 flex-wrap">
                  {selectedEntry.people.map((p: string) => (<span key={p} className="px-4 py-2 bg-indigo-50 text-indigo-500 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-100 leading-none font-black">@{p}</span>))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
