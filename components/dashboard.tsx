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
  // データが取得できない場合に備えて空配列をデフォルトに設定
  const { entries = [] } = useStore()

  // 1. カテゴリー別データ（円グラフ用）
  const categoryData = useMemo(() => {
    if (!entries || entries.length === 0) return []
    const stats: Record<string, number> = {}
    entries.forEach(e => {
      const cat = e.category || 'living-cost'
      stats[cat] = (stats[cat] || 0) + (e.amount || 0)
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
    if (!entries || entries.length === 0) return []
    const stats: Record<string, { amount: number; hours: number }> = {}
    entries.forEach(e => {
      const duration = Math.max(1, (e.endHour || 0) - (e.startHour || 0))
      const entryPeople = e.people || []
      entryPeople.forEach(p => {
        if (!stats[p]) stats[p] = { amount: 0, hours: 0 }
        stats[p].amount += (e.amount || 0)
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

  const totalAmount = entries.reduce((sum, e) => sum + (e.amount || 0), 0)
  const COLORS = ['#6366f1', '#f472b6', '#10b981', '#f59e0b', '#8b5cf6']

  // データが一つもない場合の表示（エラー回避）
  if (!entries || entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 text-slate-400 space-y-6 bg-slate-50 pb-32">
        <Heart className="w-16 h-16 opacity-10 animate-pulse" />
        <div className="text-center space-y-2">
          <p className="font-bold text-lg text-slate-500">分析データがまだありません</p>
          <p className="text-sm">タイムラインに今日の出来事を記録してみましょう！</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-10 h-full overflow-y-auto bg-slate-50 pb-32">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight text-center sm:text-left">エネルギー分析</h2>
        <p className="text-slate-500 font-medium text-center sm:text-left tracking-tight">時間とお金、あなたのリソースの行方</p>
      </div>

      {/* A. カテゴリー別の割合（円グラフ：復活！） */}
      <Card className="rounded-[40px] border-none shadow-sm overflow-hidden bg-white">
        <CardHeader className="pb-0 pt-8">
          <CardTitle className="flex items-center justify-center gap-2 text-slate-700 text-base font-bold">
            <PieIcon className="w-5 h-5 text-primary" /> カテゴリー別の割合
          </CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={8}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {categoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* B. 人ごとの詳細リスト：数字を大きく、時間も表示 */}
      <div className="space-y-5">
        <h4 className="flex items-center gap-2 text-lg font-bold text-slate-700 ml-2">
          <Users className="w-5 h-5 text-primary" /> 繋がりごとの循環
        </h4>
        <div className="grid grid-cols-1 gap-4">
          {personStats.map((stat) => (
            <div key={stat.name} className="bg-white p-7 rounded-[35px] shadow-sm border border-slate-100 flex justify-between items-center transition-transform hover:scale-[1.01]">
              <div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Target</span>
                <div className="text-2xl font-bold text-slate-800">{stat.name} <span className="text-slate-400 text-sm font-medium">さん</span></div>
              </div>
              <div className="flex gap-8 items-center">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">TIME</span>
                  <span className="text-xl font-black text-slate-700">{stat.hours}<span className="text-xs ml-0.5 opacity-50">h</span></span>
                </div>
                <div className="text-right border-l pl-8 border-slate-50">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">AMOUNT</span>
                  <span className="text-4xl font-black text-primary tracking-tighter italic">
                    ¥{stat.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* C. 総額カード（最下段） */}
      <Card className="bg-slate-900 text-white border-none shadow-2xl rounded-[45px] mt-10">
        <CardContent className="p-12 text-center space-y-4">
          <Heart className="w-10 h-10 mx-auto text-pink-500 opacity-80 animate-pulse" />
          <h3 className="text-6xl font-black italic tracking-tighter">
            ¥{totalAmount.toLocaleString()}
          </h3>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em]">Total Life Energy Flow</p>
          <p className="text-slate-400 text-sm font-medium">今日、あなたが循環させた全ての価値</p>
        </CardContent>
      </Card>
    </div>
  )
}
