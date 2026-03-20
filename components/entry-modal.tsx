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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-card rounded-[32px] shadow-2xl max-h-[85vh] overflow-y-auto bg-white">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-50 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800">{editEntry ? '編集' : '今日の記録'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full"><X className="h-5 w-5" /></Button>
        </div>

        <div className="p-6 space-y-8 text-slate-800">
          {/* 1. 時間 */}
          <div className="flex gap-3 items-center">
            <select value={startHour} onChange={(e) => setStartHour(parseInt(e.target.value))} className="flex-1 h-12 rounded-xl bg-slate-50 border-none font-medium text-center">
              {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}:00</option>)}
            </select>
            <span className="text-slate-300">→</span>
            <select value={endHour} onChange={(e) => setEndHour(parseInt(e.target.value))} className="flex-1 h-12 rounded-xl bg-slate-50 border-none font-medium text-center">
              {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}:00</option>)}
            </select>
          </div>

          {/* 2. 内容 */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-500 ml-1">何をしましたか？</Label>
            <Input value={content} onChange={(e) => setContent(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none px-4" />
          </div>

          {/* 3. 人物 */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-500 ml-1">誰と？</Label>
            <div className="flex flex-wrap gap-2">
              {people.map((p) => (
                <button key={p.id} onClick={() => setSelectedPeople(prev => prev.includes(p.name) ? prev.filter(x => x !== p.name) : [...prev, p.name])}
                  className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all", selectedPeople.includes(p.name) ? "bg-primary text-white" : "bg-slate-50 text-slate-400")}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* 4. 金額入力 */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-500 ml-1">金額入力</Label>
            <div className="flex gap-2">
              <Button variant={amountType === 'spent' ? 'destructive' : 'secondary'} size="sm" className="flex-1 rounded-xl h-10" onClick={() => setAmountType('spent')}>支出</Button>
              <Button variant={amountType === 'received' ? 'default' : 'secondary'} size="sm" className="flex-1 rounded-xl h-10" onClick={() => setAmountType('received')}>収入</Button>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="pl-8 h-12 rounded-xl bg-slate-50 border-none" placeholder="0" />
            </div>
          </div>

          {/* 5. 感情（センタリング・中央寄せデザイン） */}
          <div className="pt-6 border-t space-y-10 pb-4">
            <Label className="text-sm font-semibold text-slate-500 block text-center mb-2">今の気持ちは？</Label>
            <div className="grid grid-cols-1 gap-12">
              {Object.entries(EMOTION_CONFIG).map(([id, config]) => {
                const Icon = config.icon;
                const val = emotionValues[id as Emotion];
                return (
                  <div key={id} className="flex flex-col items-center space-y-4">
                    {/* アイコンとラベルを中央に */}
                    <div className="flex flex-col items-center">
                      <div 
                        className={cn(
                          "p-4 rounded-full transition-all duration-300 shadow-sm", 
                          val > 0 ? "scale-110 shadow-md" : "opacity-20"
                        )} 
                        style={{ 
                          backgroundColor: val > 0 ? config.color : 'transparent', 
                          color: val > 0 ? 'white' : config.color,
                          border: `2px solid ${config.color}`
                        }}
                      >
                        <Icon className="w-8 h-8" />
                      </div>
                      <span className="text-sm font-black mt-2" style={{ color: config.color }}>
                        {config.label}
                      </span>
                    </div>

                    {/* スライダーをその下に配置 */}
                    <div className="w-full px-8">
                      <Slider 
                        value={[val]} 
                        onValueChange={(v) => setEmotionValues(prev => ({ ...prev, [id]: v[0] }))} 
                        min={0} 
                        max={5} 
                        step={1} 
                        className="h-2"
                      />
                      <div className="flex justify-between mt-2 px-1 text-[10px] text-slate-300 font-bold">
                        <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 保存ボタン */}
          <Button onClick={() => {
            const maxEm = Object.entries(emotionValues).reduce((a, b) => Math.abs(a[1]) > Math.abs(b[1]) ? a : b);
            addEntry({
              date: selectedDate || new Date().toISOString().split('T')[0],
              startHour, endHour, content, people: selectedPeople, amount: parseInt(amount) || 0,
              amountType, category, emotion: maxEm[0] as Emotion, emotionIntensity: Math.abs(maxEm[1]) || 1,
            });
            onClose();
          }} className="w-full h-14 text-lg font-bold rounded-2xl bg-primary text-white shadow-lg">記録を保存</Button>
        </div>
      </div>
    </div>
  )
}
