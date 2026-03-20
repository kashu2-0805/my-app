'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from '@/lib/store'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts'
import { TrendingUp, Users, Heart, PieChart } from 'lucide-react'

export function Dashboard() {
  const { entries } = useStore()

  // 1. 時間の推移データ（満足度の推移）
  const timelineData = useMemo(() => {
    return entries.map(e => ({
      time: `${e.startHour}:00`,
      intensity: e.emotionIntensity,
      date: e.date
    }))
  }, [entries])

  // 2. カテゴリー別データ（投資・浪費など）
  const categoryData = useMemo(() => {
    const stats: Record<string, number> = {}
    entries.forEach(e => {
      stats[e.category] = (stats[e.category] || 0) + e.amount
    })
    return Object.entries(stats).map(([name, value]) => ({ name, value }))
  }, [entries])

  // 3. 人ごとの集計（金額を大きく見せる用）
  const personStats = useMemo(() => {
    const stats: Record<string, number> = {}
    entries.forEach(e => {
      e.people.forEach(p => {
        stats[p] = (stats[p] || 0) + e.amount
      })
    })
    return Object.entries(stats).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [entries])

  const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="p-6 space-y-10 h-full overflow-y-auto bg-slate-50 pb-32">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">分析レポート</h2>
        <p className="text-slate-500 font-medium">心の動きとエネルギーの循環を可視化します</p>
      </div>

      {/* A. 時間の推移グラフ (重要！) */}
      <Card className="rounded-[30px] border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-700">
            <TrendingUp className="w-5 h-5 text-primary" /> 感情の波（時間の推移）
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
              <YAxis hide />
              <Tooltip />
              <Line type="monotone" dataKey="intensity" stroke="#6366f1" strokeWidth={4} dot={{ r: 6, fill: "#6366f1" }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* B. カテゴリー分析 (投資・報酬・生活・浪費) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-[30px] border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-700">
              <PieChart className="w-5 h-5 text-primary" /> カテゴリー別バランス
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <XAxis dataKey="name" fontSize={10} />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#6366f1', '#f472b6', '#10b981', '#f59e0b'][index % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* C. 人ごとの金額表示 (数字を大きく！) */}
        <div className="space-y-4">
          <h4 className="flex items-center gap-2 text-lg font-bold text-slate-700 ml-2">
            <Users className="w-5 h-5 text-primary" /> 繋がりごとの循環
          </h4>
          <div className="space-y-3">
            {personStats.map((stat) => (
              <div key={stat.name} className="bg-white p-5 rounded-3xl shadow-sm flex justify-between items-center border border-slate-100">
                <span className="text-lg font-bold text-slate-700">{stat.name}</span>
                <span className="text-3xl font-black text-primary tracking-tighter italic">
                  ¥{stat.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* D. 総エネルギーフロー (最下段へ) */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white border-none shadow-xl rounded-[40px]">
        <CardContent className="p-10 text-center space-y-4">
          <Heart className="w-10 h-10 mx-auto text-pink-400 opacity-80" />
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Total Life Energy</p>
          <h3 className="text-6xl font-black italic tracking-tighter">
            ¥{totalAmount.toLocaleString()}
          </h3>
          <p className="text-slate-400 text-sm">今日という一日に流れた全ての価値</p>
        </CardContent>
      </Card>
    </div>
  )
}
