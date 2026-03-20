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
  const { addEntry, updateEntry, people, addPerson } = useStore()
  const [content, setContent] = useState('')
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [amount, setAmount] = useState('')
  const [amountType, setAmountType] = useState<'spent' | 'received'>('spent')
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
      setAmountType(editEntry.amountType); setEmotionValues({
        joy: editEntry.emotion === 'joy' ? editEntry.emotionIntensity : 0,
        anger: editEntry.emotion === 'anger' ? editEntry.emotionIntensity : 0,
        sorrow: editEntry.emotion === 'sorrow' ? editEntry.emotionIntensity : 0,
        happiness: editEntry.emotion === 'happiness' ? editEntry.emotionIntensity : 0,
      });
      setStartHour(editEntry.startHour); setEndHour(editEntry.endHour);
    } else {
      setContent(''); setSelectedPeople([]); setAmount(''); setAmountType('spent');
      setEmotionValues({ joy: 0, anger: 0, sorrow: 0, happiness: 0 }); setStartHour(initialHour); setEndHour(initialHour + 1);
    }
  }, [editEntry, initialHour, isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-[40px] shadow-2xl max-h-[85vh] overflow-y-auto">
        
        <div className="flex items-center justify-between p-7 border-b border-slate-50 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800">{editEntry ? '編集' : '記録'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full"><X className="h-6 w-6" /></Button>
        </div>

        <div className="p-8 space-y-10">
          {/* 時間・内容・人物は前回の「ちょうど良いサイズ」を維持 */}
          <div className="flex gap-3 h-12">
            <select value={startHour} onChange={(e) => setStartHour(parseInt(e.target.value))} className="flex-1 rounded-xl bg-slate-50 border-none font-bold text-center">{Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}:00</option>)}</select>
            <span className="flex items-center text-slate-300">→</span>
            <select value={endHour} onChange={(e) => setEndHour(parseInt(e.target.value))} className="flex-1 rounded-xl bg-slate-50 border-none font-bold text-center">{Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}:00</option>)}</select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-bold text-slate-400 ml-1">内容</Label>
            <Input value={content} onChange={(e) => setContent(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none px-5 text-lg" />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-bold text-slate-400 ml-1">誰と？</Label>
            <div className="flex flex-wrap gap-2">
              {people.map((p) => (
                <button key={p.id} onClick={() => setSelectedPeople(prev => prev.includes(p.name) ? prev.filter(x => x !== p.name) : [...prev, p.name])}
                  className={cn("px-5 py-2.5 rounded-2xl text-sm font-bold shadow-sm transition-all", selectedPeople.includes(p.name) ? "bg-primary text-white scale-105" : "bg-slate-50 text-slate-400")}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* 💰 金額入力：数字を巨大化！ */}
          <div className="space-y-4 bg-slate-50 p-6 rounded-[32px] border border-slate-100">
            <div className="flex gap-2">
              <Button variant={amountType === 'spent' ? 'destructive' : 'secondary'} className="flex-1 h-12 rounded-xl font-bold" onClick={() => setAmountType('spent')}>支出 (GIVE)</Button>
              <Button variant={amountType === 'received' ? 'default' : 'secondary'} className="flex-1 h-12 rounded-xl font-bold" onClick={() => setAmountType('received')}>収入 (GIFT)</Button>
            </div>
            <div className="relative flex items-center justify-center">
              <span className={cn("text-3xl font-black mr-2", amountType === 'spent' ? "text-destructive" : "text-primary")}>¥</span>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                className={cn(
                  "bg-transparent text-5xl font-black w-full text-center focus:outline-none tracking-tighter",
                  amountType === 'spent' ? "text-destructive" : "text-primary"
                )}
                placeholder="0"
              />
            </div>
            <p className="text-center text-[10px] font-bold text-slate-400 tracking-widest uppercase">Input Amount</p>
          </div>

          {/* 感情：前回のセンタリング案を適用 */}
          <div className="pt-8 border-t space-y-12 pb-6">
            <Label className="text-sm font-bold text-slate-400 block text-center uppercase tracking-widest">Emotion Level</Label>
            {Object.entries(EMOTION_CONFIG).map(([id, config]) => {
              const Icon = config.icon; const val = emotionValues[id as Emotion];
              return (
                <div key={id} className="flex flex-col items-center space-y-5">
                  <div className="flex flex-col items-center">
                    <div className={cn("p-5 rounded-full transition-all duration-300 shadow-md", val > 0 ? "scale-125 shadow-lg" : "opacity-20")} 
                         style={{ backgroundColor: val > 0 ? config.color : 'transparent', color: val > 0 ? 'white' : config.color, border: `2px solid ${config.color}` }}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <span className="text-sm font-black mt-2" style={{ color: config.color }}>{config.label}</span>
                  </div>
                  <div className="w-full px-10"><Slider value={[val]} onValueChange={(v) => setEmotionValues(prev => ({ ...prev, [id]: v[0] }))} min={0} max={5} step={1} className="h-2" /></div>
                </div>
              )
            })}
          </div>

          <Button onClick={() => {
            const maxEm = Object.entries(emotionValues).reduce((a, b) => Math.abs(a[1]) > Math.abs(b[1]) ? a : b);
            addEntry({
              date: selectedDate || new Date().toISOString().split('T')[0],
              startHour, endHour, content, people: selectedPeople, amount: parseInt(amount) || 0,
              amountType, category: 'living-cost', emotion: maxEm[0] as Emotion, emotionIntensity: Math.abs(maxEm[1]) || 1,
            });
            onClose();
          }} className="w-full h-16 text-xl font-black rounded-[24px] bg-primary text-white shadow-xl">保存する</Button>
        </div>
      </div>
    </div>
  )
}
