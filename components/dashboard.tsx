'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from '@/lib/store'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, Users, Heart } from 'lucide-react'

export function Dashboard() {
  const { entries } = useStore()

  // 人ごとの合計金額を集計
  const personStats = useMemo(() => {
    const stats: Record<string, number> = {}
    entries.forEach(e => {
      e.people.forEach(p => {
        stats[p] = (stats[p] || 0) + e.amount
      })
    })
    return Object.entries(stats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [entries])

  const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="p-6 space-y-8 h-full overflow-y-auto bg-slate-50 pb-24">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">分析レポート</h2>
        <p className="text-slate-500 font-medium">あなたの人生に流れるエネルギーの記録</p>
      </div>

      {/* 合計金額：超特大カード */}
      <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-none shadow-2xl rounded-[40px] overflow-hidden">
        <CardContent className="p-10 text-center space-y-4">
          <Heart className="w-12 h-12 mx-auto opacity-50 mb-2" />
          <p className="text-indigo-100 text-sm font-bold uppercase tracking-widest">Total Energy Flow</p>
          <h3 className="text-7xl font-black italic tracking-tighter">
            ¥{totalAmount.toLocaleString()}
          </h3>
          <p className="text-indigo-200 text-sm">
            これだけの「豊かさ」を体験し、分かち合いました
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        {/* 人ごとの詳細リスト：数字を大きく */}
        <div className="space-y-4">
          <h4 className="flex items-center gap-2 text-lg font-bold text-slate-700 ml-2">
            <Users className="w-5 h-5" /> 繋がりと循環の記録
          </h4>
          {personStats.map((stat, index) => (
            <Card key={stat.name} className="rounded-3xl border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">Person</span>
                  <div className="text-2xl font-bold text-slate-800">{stat.name} さん</div>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">Total Amount</span>
                  <div className="text-4xl font-black text-primary tracking-tighter">
                    ¥{stat.value.toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
