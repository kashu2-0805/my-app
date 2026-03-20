'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from '@/lib/store'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, LineChart, Line, 
  PieChart, Pie, Legend 
} from 'recharts'
import { TrendingUp, Users, Heart, PieChart as PieIcon, Clock, Smile, Frown, Angry, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Dashboard() {
  const { entries = [] } = useStore()

  // 🎨 感情の定義
  const EMOTION_CONFIG = {
    anger: { label: '怒', color: '#800000', icon: Angry },
    sorrow: { label: '哀', color: '#3B82F6', icon: Frown },
    joy: { label: '喜', color: '#FBBF24', icon: Smile },
    happiness: { label: '楽', color: '#F472B6', icon: Zap },
  }

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

  // 2. 人ごとの集計（金額 ＆ 時間 ＆ 感情）
  const personStats = useMemo(() => {
    if (!entries || entries.length === 0) return []
    const stats: Record<string, { amount: number; hours: number; emotions: Record<string, number> }> = {}
    
    entries.forEach(e => {
      const duration = Math.max(1, (e.endHour || 0) - (e.startHour || 0))
      const entryPeople = e.people || []
      const entryEmotion = e.emotion || 'joy'
      
      entryPeople.forEach(p => {
        if (!stats[p]) {
          stats[p] = { 
            amount: 0, 
            hours: 0, 
            emotions: { joy: 0, anger: 0, sorrow: 0, happiness: 0 } 
          }
        }
        stats[p].amount += (e.amount || 0)
        stats[p].hours += duration
        // 感情が存在する場合のみカウント
        if (stats[p].emotions[entryEmotion] !== undefined) {
          stats[p].emotions[entryEmotion] += 1
        }
      })
    })

    return Object.entries(stats)
      .map(([name, data]) => ({ 
        name, 
        amount: data.amount, 
        hours: data.hours,
        emotions: data.emotions
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [entries])

  const totalAmount = entries.reduce((sum, e) => sum + (e.amount || 0), 0)
  const COLORS = ['#6366f1', '#f472b6', '#10b981', '#f59e0b', '#8b5cf6']

  // データがゼロの時の表示
  if (!entries || entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 text-slate-400 space-y-6 bg-slate-50 pb-32">
        <Heart className="w-16 h-16 opacity-10 animate-pulse" />
        <p className="font-bold text-lg text-slate-500 text-center">分析データがまだありません<br /><span className="text-sm font-normal">タイムラインに記録してみましょう！</span></p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-12 h-full overflow-y-auto bg-slate-50 pb-32">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight text-center sm:text-left">エネルギー分析</h2>
        <p className="text-slate-500 font-medium text-center sm:text-left tracking-tight">時間とお金、あなたのリソースの行方</p>
      </div>

      {/* A. カテゴリー別の割合（円グラフ） */}
      <Card className="rounded-[40px] border-none shadow-sm overflow-hidden bg-white">
        <CardHeader className="pb-0 pt-8 text-center">
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

      {/* B. 対人関係の個別分析 */}
      <div className="space-y-6">
        <h4 className="flex items-center gap-2 text-lg font-bold text-slate-700 ml-2">
          <Users className="w-5 h-5 text-primary" /> 対人関係の個別分析
        </h4>
        <div className="grid grid-cols-1 gap-6">
          {personStats.map((stat) => (
            <div key={stat.name} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
              
              {/* 名前と感情 */}
              <div className="space-y-4 w-full sm:w-1/3 text-center sm:text-left">
                <div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block">Person</span>
                  <div className="text-2xl font-bold text-slate-800">{stat.name} さん</div>
                </div>
                <div className="flex justify-center sm:justify-start gap-3">
                  {Object.entries(stat.emotions).map(([id, count]) => {
                    const config = EMOTION_CONFIG[id as keyof typeof EMOTION_CONFIG];
                    if (!config || count === 0) return null;
                    const Icon = config.icon;
                    return (
                      <div key={id} className="flex flex-col items-center">
                        <div className="p-2 rounded-full" style={{ backgroundColor: `${config.color}10`, color: config.color }}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black mt-1" style={{ color: config.color }}>{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 時間の棒グラフ */}
              <div className="w-full sm:w-1/3 space-y-2 px-4">
                <div className="flex justify-between items-end">
                   <Label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Time Spent</Label>
                   <span className="text-xl font-black text-slate-700">{stat.hours}h</span>
                </div>
                <div className="h-4 bg-slate-50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-pink-400 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (stat.hours / 24) * 100)}%` }}
                  />
                </div>
              </div>

              {/* 金額 */}
              <div className="w-full sm:w-1/3 text-center sm:text-right">
                <span className="text-[10px] font-bold text-slate-400 block mb-1 tracking-widest uppercase">Total Amount</span>
                <span className="text-4xl font-black text-primary tracking-tighter italic block">
                  ¥{stat.amount.toLocaleString()}
                </span>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* C. 総額カード */}
      <Card className="bg-slate-900 text-white border-none shadow-2xl rounded-[45px] mt-10">
        <CardContent className="p-12 text-center space-y-4">
          <Heart className="w-10 h-10 mx-auto text-pink-500 opacity-80 animate-pulse" />
          <h3 className="text-6xl font-black italic tracking-tighter">
            ¥{totalAmount.toLocaleString()}
          </h3>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em]">Total Life Energy Flow</p>
        </CardContent>
      </Card>
    </div>
  )
}
