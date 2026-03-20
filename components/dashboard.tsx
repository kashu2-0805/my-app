'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from '@/lib/store'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Users, TrendingUp, PieChart as PieIcon, Briefcase, ChevronLeft, ChevronRight, Clock, Tag, Smile } from 'lucide-react'
import { Dialog, DialogContent } from "@/components/ui/dialog"

export function Dashboard() {
  const { entries = [] } = useStore()
  const [range, setRange] = useState<'1D' | '1W' | '1M' | '6M'>('1W')
  const [selectedEntry, setSelectedEntry] = useState<any>(null)

  const categoryLabels: Record<string, string> = {
    'self-investment': 'じぶん投資', 'self-reward': 'じぶんご褒美', 'living-cost': '生存コスト', 'waste': '無駄遣い'
  }

  // 🗓️ 日付ラベルの計算
  const { filteredEntries, mainDateLabel, subLabel } = useMemo(() => {
    const now = new Date()
    const startDate = new Date()
    if (range === '1D') startDate.setHours(now.getHours() - 24)
    else if (range === '1W') startDate.setDate(now.getDate() - 7)
    else if (range === '1M') startDate.setMonth(now.getMonth() - 1)
    else if (range === '6M') startDate.setMonth(now.getMonth() - 6)

    const filtered = entries.filter(e => new Date(e.date) >= startDate)
    const days = ['日', '月', '火', '水', '木', '金', '土']
    const fmt = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日(${days[d.getDay()]})`
    
    return { 
      filteredEntries: filtered, 
      mainDateLabel: range === '1D' ? fmt(now) : `${fmt(startDate)} 〜 ${fmt(now)}`,
      subLabel: range === '1D' ? "今日" : range === '1W' ? "直近1週間" : range === '1M' ? "直近1ヶ月" : "直近半年"
    }
  }, [entries, range])

  // 🔥 【魔法の処理】外側の「エネルギー分析」というタイトルを無理やり日付に書き換える
  useEffect(() => {
    const titleElement = document.querySelector('h2'); // 画面内のh2タグ（タイトル）を探す
    const subElement = document.querySelector('p');  // その下のpタグ（説明文）を探す
    
    if (titleElement) {
      titleElement.textContent = mainDateLabel;
      titleElement.style.fontSize = "28px";
      titleElement.style.fontWeight = "900";
    }
    if (subElement && subElement.textContent?.includes('俯瞰する')) {
      subElement.textContent = subLabel;
      subElement.style.color = "#ec4899"; // ピンク色にする
      subElement.style.fontWeight = "bold";
    }
  }, [mainDateLabel, subLabel]);

  // 以降、集計ロジックなどは維持
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
      const duration = Math.max(1, (e.endHour || 0) - (e.startHour || 0)); const amt = e.amount || 0
      ;(e.people || []).forEach(p => {
        if (!stats[p]) stats[p] = { spent: 0, received: 0, hours: 0, emotions: { joy: 0, anger: 0, sorrow: 0, happiness: 0 } }
        if (e.amountType === 'received') stats[p].received += amt; else stats[p].spent += amt
        stats[p].hours += duration
      })
    })
    return Object.entries(stats).map(([name, data]) => ({ name, ...data })).sort((a, b) => (b.spent + b.received) - (a.spent + a.received))
  }, [filteredEntries])

  const totalSpent = filteredEntries.filter(e => e.amountType !== 'received').reduce((sum, e) => sum + (e.amount || 0), 0)
  const totalReceived = filteredEntries.filter(e => e.amountType === 'received').reduce((sum, e) => sum + (e.amount || 0), 0)

  if (!entries.length) return null

  return (
    <div className="flex flex-col h-full bg-white text-slate-800">
      {/* 🏁 予備のヘッダー（もし上書きに失敗してもここに出ます） */}
      <div className="flex flex-col items-center py-4 border-b border-slate-50 opacity-0 h-0 overflow-hidden sm:opacity-100 sm:h-auto">
         <h2 className="text-2xl font-black">{mainDateLabel}</h2>
      </div>

      <div className="flex justify-center bg-white pb-6">
        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
          {(['1D', '1W', '1M', '6M'] as const).map((r) => (
            <button key={r} onClick={() => setRange(r)} className={`rounded-xl px-5 py-1.5 text-xs font-black transition-all ${range === r ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"}`}>
              {r === '1D' ? '1日' : r === '1W' ? '1週間' : r === '1M' ? '1ヶ月' : '半年'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-10 pb-40 bg-slate-50/50">
        <Card className="rounded-[40px] border-none shadow-sm bg-white overflow-hidden p-6">
          <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-indigo-400" /><span className="font-bold text-slate-700">バイオリズム</span></div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} onClick={(d) => d && d.activePayload && setSelectedEntry(d.activePayload[0].payload.original)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="displayDate" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis hide domain={[0, 100]} />
                <Line type="monotone" dataKey="intensity" stroke="#6366f1" strokeWidth={4} dot={{ r: 6, fill: "#6366f1" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="rounded-[40px] border-none shadow-sm bg-white p-6 h-80"><ResponsiveContainer><PieChart><Pie data={categoryData} innerRadius={35} outerRadius={80} dataKey="value" label={({name}) => name}><Cell fill="#6366f1"/><Cell fill="#f472b6"/><Cell fill="#10b981"/><Cell fill="#f59e0b"/></Pie><Tooltip/></PieChart></ResponsiveContainer></Card>
          <Card className="rounded-[40px] border-none shadow-sm bg-white p-6 h-80"><ResponsiveContainer><PieChart><Pie data={relationshipData} innerRadius={35} outerRadius={80} dataKey="value" label={({name}) => name}><Cell fill="#818cf8"/><Cell fill="#fb7185"/><Cell fill="#34d399"/><Cell fill="#f472b6"/></Pie><Tooltip/></PieChart></ResponsiveContainer></Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 leading-none">
          <Card className="bg-white rounded-[50px] p-12 text-center border border-rose-50 font-black"><p className="text-rose-300 mb-2">Total GIVE</p><h3 className="text-5xl italic text-rose-500">¥{totalSpent.toLocaleString()}</h3></Card>
          <Card className="bg-white rounded-[50px] p-12 text-center border border-indigo-50 font-black"><p className="text-indigo-300 mb-2">Total GIFT</p><h3 className="text-5xl italic text-indigo-500">¥{totalReceived.toLocaleString()}</h3></Card>
        </div>
      </div>
    </div>
  )
}
