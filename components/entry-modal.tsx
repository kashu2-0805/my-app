'use client'

import { useState, useEffect } from 'react'
import { X, Trash2, Angry, Frown, Smile, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useStore } from '@/lib/store'
import type { TimeEntry, Emotion, Category } from '@/lib/types'
import { CATEGORIES } from '@/lib/types'
import { cn } from '@/lib/utils'

interface EntryModalProps {
  isOpen: boolean
  onClose: () => void
  initialHour?: number
  editEntry?: TimeEntry | null
  selectedDate?: string
}

const EMOTION_CONFIG: Record<Emotion, { icon: any; color: string; label: string }> = {
  anger: { label: '怒', color: '#800000', icon: Angry },
  sorrow: { label: '哀', color: '#3B82F6', icon: Frown },
  joy: { label: '喜', color: '#FBBF24', icon: Smile },
  happiness: { label: '楽', color: '#F472B6', icon: Zap },
}

export function EntryModal({ isOpen, onClose, initialHour = 9, editEntry, selectedDate }: EntryModalProps) {
  const { addEntry, updateEntry, deleteEntry, people, addPerson } = useStore()
  const [content, setContent] = useState('')
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [amount, setAmount] = useState('')
  const [amountType, setAmountType] = useState<'spent' | 'received'>('spent')
  const [category, setCategory] = useState<Category>('living-cost')
  const [emotionValues, setEmotionValues] = useState<Record<Emotion, number>>({ joy: 0, anger: 0, sorrow: 0, happiness: 0 })
  const [startHour, setStartHour] = useState(initialHour)
  const [endHour, setEndHour] = useState(initialHour + 1)

  useEffect(() => {
    const defaultList = ["自分", "仕事", "父", "母", "上司", "田中さん"]
    defaultList.forEach(name => {
      if (!people.find(p => p.name === name)) addPerson(name)
    })
  }, [people, addPerson])

  useEffect(() => {
    if (editEntry) {
      setContent(editEntry.content); setSelectedPeople(editEntry.people); setAmount(editEntry.amount.toString());
      setAmountType(editEntry.amountType); setCategory(editEntry.category);
      setEmotionValues({
        joy: editEntry.emotion === 'joy' ? editEntry.emotionIntensity : 0,
        anger: editEntry.emotion === 'anger' ? editEntry.emotionIntensity : 0,
        sorrow: editEntry.emotion === 'sorrow' ? editEntry.emotionIntensity : 0,
        happiness: editEntry.emotion === 'happiness' ? editEntry.emotionIntensity : 0,
      });
      setStartHour(editEntry.startHour); setEndHour(editEntry.endHour);
    } else {
      setContent(''); setSelectedPeople([]); setAmount(''); setAmountType('spent'); setCategory('living-cost');
      setEmotionValues({ joy: 0, anger: 0, sorrow: 0, happiness: 0 }); setStartHour(initialHour); setEndHour(initialHour + 1);
    }
  }, [editEntry, initialHour, isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full sm:max-w-xl bg-white rounded-t-[40px] sm:rounded-[40px] shadow-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-10">
        
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black text-slate-800">{editEntry ? '編集' : '記録'}</h2>
          <Button variant="ghost" onClick={onClose} className="rounded-full h-12 w-12"><X className="h-8 w-8" /></Button>
        </div>

        <div className="space-y-12">
          {/* 時間セクション - 特大化 */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-[30px]">
            <div className="space-y-2">
              <Label className="text-lg font-bold text-slate-400">開始</Label>
              <select value={startHour} onChange={(e) => setStartHour(parseInt(e.target.value))} className="w-full h-16 text-2xl font-bold bg-white rounded-2xl border-none px-4 shadow-sm">{Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}:00</option>)}</select>
            </div>
            <div className="space-y-2">
              <Label className="text-lg font-bold text-slate-400">終了</Label>
              <select value={endHour} onChange={(e) => setEndHour(parseInt(e.target.value))} className="w-full h-16 text-2xl font-bold bg-white rounded-2xl border-none px-4 shadow-sm">{Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}:00</option>)}</select>
            </div>
          </div>

          {/* 内容 - 特大化 */}
          <div className="space-y-3">
            <Label className="text-xl font-bold text-slate-700">内容</Label>
            <Input value={content} onChange={(e) => setContent(e.target.value)} className="h-20 text-2xl rounded-2xl bg-slate-50 border-none px-6" />
          </div>

          {/* 人物 - ゆったり配置 */}
          <div className="space-y-4">
            <Label className="text-xl font-bold text-slate-700">誰と？</Label>
            <div className="flex flex-wrap gap-4">
              {people.map((p) => (
                <button key={p.id} onClick={() => setSelectedPeople(prev => prev.includes(p.name) ? prev.filter(x => x !== p.name) : [...prev, p.name])}
                  className={cn("px-8 py-4 rounded-2xl text-xl font-bold shadow-sm transition-all", selectedPeople.includes(p.name) ? "bg-primary text-white scale-110" : "bg-slate-50 text-slate-400")}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* 感情 - ここが一番変わります */}
          <div className="space-y-8 border-t pt-8">
            <Label className="text-xl font-bold text-slate-700 block text-center">今の気持ち</Label>
            {Object.entries(EMOTION_CONFIG).map(([id, config]) => {
              const Icon = config.icon; const val = emotionValues[id as Emotion];
              return (
                <div key={id} className="flex items-center gap-8 bg-slate-50 p-6 rounded-[30px]">
                  <div className="flex flex-col items-center w-24">
                    <div className={cn("p-5 rounded-full transition-all", val > 0 ? "scale-125 shadow-xl" : "opacity-20")} style={{ backgroundColor: val > 0 ? config.color : 'transparent', color: val > 0 ? 'white' : config.color }}>
                      <Icon className="w-12 h-12" />
                    </div>
                    <span className="text-lg font-black mt-2" style={{ color: config.color }}>{config.label}</span>
                  </div>
                  <Slider value={[val]} onValueChange={(v) => setEmotionValues(prev => ({ ...prev, [id]: v[0] }))} min={0} max={5} step={1} className="flex-1 h-6" />
                </div>
              )
            })}
          </div>

          <Button onClick={() => {
            const maxEm = Object.entries(emotionValues).reduce((a, b) => Math.abs(a[1]) > Math.abs(b[1]) ? a : b);
            addEntry({
              date: selectedDate || new Date().toISOString().split('T')[0],
              startHour, endHour, content, people: selectedPeople, amount: parseInt(amount) || 0,
              amountType, category, emotion: maxEm[0] as Emotion, emotionIntensity: Math.abs(maxEm[1]) || 1,
            });
            onClose();
          }} className="w-full h-24 text-3xl font-black rounded-[35px] bg-primary text-white shadow-2xl">保存する</Button>
        </div>
      </div>
    </div>
  )
}
