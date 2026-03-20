'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from '@/lib/store'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, LineChart, Line, 
  PieChart, Pie, Legend 
} from 'recharts'
import { TrendingUp, Users, Heart, PieChart as PieIcon, Clock } from 'lucide-react'

export function Dashboard() {
  const { entries } = useStore()

  // 1. カテゴリー別データ（円グラフ用）
  const categoryData = useMemo(() => {
    const stats: Record<string, number> = {}
    entries.forEach(e => {
      stats[e.category] = (stats[e.category] || 0) + e.amount
    })
    const categoryLabels: Record<string, string> = {
      'self-investment': '自己投資',
      'self-reward': '自分へのご褒美',
      'living-cost': '生活・必要経費',
      'waste': '浪費・不本意'
    }
    return Object.entries(stats).map(([id, value]) => ({ 
      name: categoryLabels[id] || id, 
      value 
    }))
  }, [entries])

  // 2. 人ごとの集計（金額 ＆ 時間）
  const personStats = useMemo(() => {
    const stats: Record<string, { amount: number; hours: number }> = {}
    entries.forEach(e => {
      const duration = Math.max(1, e.endHour - e.startHour)
      e.people.forEach(p => {
        if (!stats[p]) stats[p] = { amount: 0, hours: 0 }
        stats[p].amount += e.amount
        stats[p].hours += duration
      })
    })
    return Object.entries(stats)
      .map(([name, data]) => ({ 
        name, 
        amount: data.amount, 
        hours: data.hours 
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [entries])

  const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0)
  const COLORS = ['#6366f1', '#f472b6', '#10b981', '#f59e0b', '#8b5cf6']

  return (
    <div className="p-6 space-y-10 h-full overflow-y-auto bg-slate-50 pb-32">
      <div className="space-y-2 text-center sm:text-left">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">エネルギー分析</h2>
        <p className="text-slate-500 font-medium">時間とお金、あなたのリソースはどこへ流れた？</p>
      </div>

      {/* A. カテゴリー分析 (復活の円グラフ) */}
      <Card className="rounded-[30px] border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-700">
            <PieIcon className="w-5 h-5 text-primary" /> カテゴリー別の割合
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* B. 人ごとの「時間」と「お金」の相関 (新しいグラフ) */}
      <Card className="rounded-[30px] border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-700">
            <Users className="w-5 h-5 text-primary" /> 人ごとのエネルギー循環
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={personStats} layout="vertical" margin={{ left: 20, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={80} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Legend />
              {/* 金額の棒 */}
              <Bar dataKey="amount" name="金額 (¥)" fill="#6366f1" radius={[0, 10, 10, 0]} barSize={20} />
              {/* 時間の棒 */}
              <Bar dataKey="hours" name="時間 (h)" fill="#f472b6" radius={[0, 10, 10, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* C. 個別詳細：大きな数字で気づきを促す */}
      <div className="space-y-4">
        <h4 className="flex items-center gap-2 text-lg font-bold text-slate-700 ml-2">
          <Clock className="w-5 h-5 text-primary" /> 詳細な振り返り
        </h4>
        <div className="grid grid-cols-1 gap-4">
          {personStats.map((stat) => (
            <div key={stat.name} className="bg-white p-7 rounded-[32px] shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-center sm:text-left">
                <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Target</span>
                <div className="text-2xl font-bold text-slate-800">{stat.name} さん</div>
              </div>
              <div className="flex gap-8 items-center">
                <div className="text-center">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">TIME</span>
                  <span className="text-2xl font-black text-slate-700">{stat.hours}<span className="text-sm ml-0.5">h</span></span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">TOTAL AMOUNT</span>
                  <span className="text-4xl font-black text-primary tracking-tighter italic">
                    ¥{stat.value.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* D. 総額カード */}
      <Card className="bg-slate-900 text-white border-none shadow-2xl rounded-[40px] mt-10">
        <CardContent className="p-12 text-center space-y-4">
          <Heart className="w-10 h-10 mx-auto text-pink-500 mb-2" />
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em]">Total Life Energy Flow</p>
          <h3 className="text-6xl font-black italic tracking-tighter">
            ¥{totalAmount.toLocaleString()}
          </h3>
          <p className="text-slate-400 text-sm">今日、あなたが世界に生み出した価値の総計</p>
        </CardContent>
      </Card>
    </div>
  )
}
