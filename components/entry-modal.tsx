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

const CATEGORY_STYLES: Record<Category, { icon: string }> = {
  'self-investment': { icon: '📚' },
  'self-reward': { icon: '✨' },
  'living-cost': { icon: '🏠' },
  'waste': { icon: '💸' },
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

        <div className="p-6 space-y-8">
          {/* 時間 */}
          <div className="flex gap-3 items-center">
            <select value={startHour} onChange={(e) => setStartHour(parseInt(e.target.value))} className="flex-1 h-12 rounded-xl bg-slate-50 border-none font-medium text-center">
              {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}:00</option>)}
            </select>
            <span className="text-slate-300">→</span>
            <select value={endHour} onChange={(e) => setEndHour(parseInt(e.target.value))} className="flex-1 h-12 rounded-xl bg-slate-50 border-none font-medium text-center">
              {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}:00</option>)}
            </select>
          </div>

          {/* 内容 */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-500">何をしましたか？</Label>
            <Input value={content} onChange={(e) => setContent(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none px-4" />
          </div>

          {/* 人物 */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-500">誰と？</Label>
            <div className="flex flex-wrap gap-2">
              {people.map((p) => (
                <button key={p.id} onClick={() => setSelectedPeople(prev => prev.includes(p.name) ? prev.filter(x => x !== p.name) : [...prev, p.name])}
                  className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all", selectedPeople.includes(p.name) ? "bg-primary text-white" : "bg-slate-50 text-slate-400")}>
                  {p.name}
                </button>
              ))}
            </div>
