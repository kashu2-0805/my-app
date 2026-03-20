"use client"

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { Heart, Trash2, Smile, Frown, Angry, Zap } from 'lucide-react'

// 🎨 感情の定義（色とアイコン）
const EMOTIONS = {
  anger: { label: "怒", color: "#800000", icon: Angry }, // えび茶
  sadness: { label: "哀", color: "#3B82F6", icon: Frown }, // 青
  joy: { label: "喜", color: "#FBBF24", icon: Smile },    // 黄
  pleasure: { label: "楽", color: "#F472B6", icon: Zap }    // ピンク
}

// 👥 デフォルトの人物リスト
const DEFAULT_PEOPLE = ["自分", "仕事", "父", "母", "上司", "田中さん"]

export default function LifeDesignApp() {
  const [entries, setEntries] = useState([
    { id: 1, date: '2026-03-10', person: '上司', amount: 5000, emotion: 'anger', satisfaction: 2, note: 'サンプル：厳しい指導' },
    { id: 2, date: '2026-03-12', person: '母', amount: 3000, emotion: 'joy', satisfaction: 9, note: 'サンプル：手料理' },
    { id: 3, date: '2026-03-15', person: '田中さん', amount: 1500, emotion: 'pleasure', satisfaction: 8, note: 'サンプル：お土産' },
  ])

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    person: DEFAULT_PEOPLE[0],
    amount: '',
    emotion: 'joy',
    satisfaction: 5,
    note: ''
  })

  const [selectedEntry, setSelectedEntry] = useState(null)

  // 入力保存
  const handleSubmit = (e) => {
    e.preventDefault()
    const newEntry = { ...formData, id: Date.now(), amount: Number(formData.amount) }
    setEntries([...entries, newEntry])
    setFormData({ ...formData, amount: '', note: '' })
  }

  // サンプル全消去
  const clearEntries = () => {
    if (confirm("すべてのデータを消去しますか？")) setEntries([])
  }

  // 分析データ：人ごとの集計
  const personData = useMemo(() => {
    const data = {}
    entries.forEach(e => {
      data[e.person] = (data[e.person] || 0) + e.amount
    })
    return Object.entries(data).map(([name, value]) => ({ name, value }))
  }, [entries])

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8 bg-slate-50 min-h-screen">
      <header className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold text-slate-800">ライフデザイン・ダイアリー</h1>
        <Button variant="ghost" size="sm" onClick={clearEntries} className="text-slate-400">
          <Trash2 className="w-4 h-4 mr-2" /> データをクリア
        </Button>
      </header>

      <Tabs defaultValue="input">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="input">タイムライン入力</TabsTrigger>
          <TabsTrigger value="analysis">GIVE & GIFT 分析</TabsTrigger>
        </TabsList>

        {/* --- 入力画面 --- */}
        <TabsContent value="input">
          <Card>
            <CardHeader><CardTitle>今日の出来事を記録</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>日付</Label>
                    <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div>
                    <Label>相手</Label>
                    <select className="w-full border rounded p-2" value={formData.person} onChange={e => setFormData({...formData, person: e.target.value})}>
                      {DEFAULT_PEOPLE.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>感情（えび茶：怒 / 青：哀 / 黄：喜 / ピンク：楽）</Label>
                  <div className="flex justify-around items-center p-4 bg-white rounded-lg shadow-sm">
                    {Object.entries(EMOTIONS).map(([key, info]) => {
                      const Icon = info.icon
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setFormData({...formData, emotion: key})}
                          className={`flex flex-col items-center p-3 rounded-full transition-all ${formData.emotion === key ? 'scale-125 ring-2 ring-offset-2' : 'opacity-40'}`}
                          style={{ backgroundColor: formData.emotion === key ? info.color : 'transparent', color: formData.emotion === key ? 'white' : info.color }}
                        >
                          <Icon className="w-8 h-8" />
                          <span className="text-xs font-bold mt-1">{info.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <Label>金額 (GIVE / GIFT)</Label>
                  <Input type="number" placeholder="金額を入力" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                </div>

                <Button type="submit" className="w-full bg-slate-800 text-white">記録を保存する</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- 分析画面 --- */}
        <TabsContent value="analysis">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="md:col-span-2">
              <CardHeader><CardTitle>心の満足度（グラフ上の点をクリックで詳細表示）</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={entries} onClick={(data) => data && setSelectedEntry(data.activePayload?.[0]?.payload)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="satisfaction" stroke="#6366f1" strokeWidth={3} dot={{ r: 8, fill: "#6366f1" }} activeDot={{ r: 12 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {selectedEntry && (
              <Card className="md:col-span-2 border-indigo-200 bg-indigo-50 animate-in fade-in slide-in-from-top-4">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-indigo-900">{selectedEntry.date} の記録</h3>
                    <p className="text-sm text-indigo-700">{selectedEntry.person}との出来事: {selectedEntry.note || "（メモなし）"}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedEntry(null)}>閉じる</Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle>時間を共にした人との GIVE/GIFT</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={personData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value">
                      {personData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#f472b6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <CardHeader><CardTitle className="text-white">現在の影響金額</CardTitle></CardHeader>
              <CardContent className="text-center py-10">
                <div className="space-y-4">
                  <div className="text-sm opacity-80 uppercase tracking-widest">Total Give & Gift</div>
                  <div className="text-6xl font-black italic">
                    ¥{(entries.reduce((sum, e) => sum + e.amount, 0)).toLocaleString()}
                  </div>
                  <p className="text-xs opacity-70">
                    これだけの価値が、あなたの周りで循環しました
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
