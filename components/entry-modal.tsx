'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Trash2, Plus, Sparkles, Star, Angry, Frown, Smile, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useStore } from '@/lib/store'
import type { TimeEntry, Emotion, Category } from '@/lib/types'
import { EMOTIONS, CATEGORIES } from '@/lib/types'
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

const CATEGORY_STYLES: Record<Category, { bg: string; border: string; icon: string }> = {
  'self-investment': { bg: 'bg-self-investment/15', border: 'border-self-investment', icon: '📚' },
  'self-reward': { bg: 'bg-self-reward/15', border: 'border-self-reward', icon: '✨' },
  'living-cost': { bg: 'bg-living-cost/15', border: 'border-living-cost', icon: '🏠' },
  'waste': { bg: 'bg-waste/15', border: 'border-waste', icon: '💸' },
}

function StarParticle({ style }: { style: React.CSSProperties }) { return <div className="absolute pointer-events-none animate-star-float" style={style}><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /></div> }
function SparkleParticle({ style }: { style: React.CSSProperties }) { return <div className="absolute pointer-events-none float-particle" style={style}><Sparkles className="w-4 h-4 text-self-reward" /></div> }
function getAvatarColor(name: string): string { const colors = ['bg-primary', 'bg-self-investment', 'bg-self-reward', 'bg-accent']; let hash = 0; for (let i = 0; i < name.length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); } return colors[Math.abs(hash) % colors.length]; }
function getInitials(name: string): string { if (name === '自分') return '私'; if (name === '会社') return '社'; return name.length <= 2 ? name : name.charAt(0); }

export function EntryModal({ isOpen, onClose, initialHour = 9, editEntry, selectedDate }: EntryModalProps) {
  const { addEntry, updateEntry, deleteEntry, people, addPerson, removePerson } = useStore()
  const [content, setContent] = useState('')
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [newPerson, setNewPerson] = useState('')
  const [showPersonInput, setShowPersonInput] = useState(false)
  const [amount, setAmount] = useState('')
  const [amountType, setAmountType] = useState<'spent' | 'received'>('spent')
  const [category, setCategory] = useState<Category>('living-cost')
  const [emotionValues, setEmotionValues] = useState<Record<Emotion, number>>({ joy: 0, anger: 0, sorrow: 0, happiness: 0 })
  const [startHour, setStartHour] = useState(initialHour)
  const [endHour, setEndHour] = useState(initialHour + 1)

  // 👥 人物リストの自動初期化
  useEffect(() => {
    const defaultList = ["自分", "仕事", "父", "母", "上司", "田中さん"]
    defaultList.forEach(name => {
      if (!people.find(p => p.name === name)) addPerson(name)
    })
  }, [])

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

  const handleSubmit = () => {
    let maxEmotion: Emotion = 'joy'; let maxValue = -1;
    Object.entries(emotionValues).forEach(([em, val]) => { if (Math.abs(val) > maxValue) { maxValue = Math.abs(val); maxEmotion = em as Emotion; } });
    const entryData = {
      date: selectedDate || new Date().toISOString().split('T')[0],
      startHour, endHour, content, people: selectedPeople, amount: parseInt(amount) || 0,
      amountType, category, emotion: maxEmotion, emotionIntensity: maxValue === 0 ? 1 : maxValue,
    }
    editEntry ? updateEntry(editEntry.id, entryData) : addEntry(entryData);
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-card rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-card z-10">
          <h2 className="text-lg font-semibold">{editEntry ? '記録を編集' : '今日の記録'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>

        <div className="p-5 space-y-6">
          {/* 1. 時間 */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">開始</Label>
              <select value={startHour} onChange={(e) => setStartHour(parseInt(e.target.value))} className="w-full h-10 px-3 rounded-xl bg-secondary border-0 text-sm">
                {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}:00</option>)}
              </select>
            </div>
            <span className="pb-2 text-muted-foreground">→</span>
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">終了</Label>
              <select value={endHour} onChange={(e) => setEndHour(parseInt(e.target.value))} className="w-full h-10 px-3 rounded-xl bg-secondary border-0 text-sm">
                {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}:00</option>)}
              </select>
            </div>
          </div>

          {/* 2. 内容 */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">何をしましたか？</Label>
            <Input value={content} onChange={(e) => setContent(e.target.value)} placeholder="出来事を入力..." className="h-10 rounded-xl bg-secondary border-0" />
          </div>

          {/* 3. 人物 */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">誰と？</Label>
            <div className="flex flex-wrap gap-2">
              {people.map((p) => (
                <button key={p.id} onClick={() => setSelectedPeople(prev => prev.includes(p.name) ? prev.filter(x => x !== p.name) : [...prev, p.name])}
                  className={cn("px-3 py-1.5 rounded-full text-xs transition-all", selectedPeople.includes(p.name) ? "bg-primary text-white" : "bg-secondary text-muted-foreground")}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* 4. カテゴリー */}
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button key={cat.id} onClick={() => setCategory(cat.id)} className={cn("p-2 rounded-xl border text-xs flex items-center gap-2", category === cat.id ? "bg-primary/5 border-primary" : "bg-secondary border-transparent")}>
                <span>{CATEGORY_STYLES[cat.id].icon}</span> {cat.label}
              </button>
            ))}
          </div>

          {/* 5. 金額 */}
          <div className="flex gap-2 items-center">
            <Button variant={amountType === 'spent' ? 'destructive' : 'secondary'} size="sm" onClick={() => setAmountType('spent')} className="rounded-full">支出</Button>
            <Button variant={amountType === 'received' ? 'default' : 'secondary'} size="sm" onClick={() => setAmountType('received')} className="rounded-full">収入</Button>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">¥</span>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="pl-7 h-10 rounded-xl bg-secondary border-0" />
            </div>
          </div>

          {/* 6. 感情 (ここをご希望通りに調整!) */}
          <div className="pt-4 border-t space-y-4">
            <Label className="text-xs text-muted-foreground text-center block">今の気持ちは？ (えび茶:怒 / 青:哀 / 黄:喜 / ピンク:楽)</Label>
            {Object.entries(EMOTION_CONFIG).map(([id, config]) => {
              const Icon = config.icon; const val = emotionValues[id as Emotion];
              return (
                <div key={id} className="flex items-center gap-4">
                  <div className="flex flex-col items-center w-12 shrink-0">
                    <div className="p-2 rounded-full" style={{ backgroundColor: val > 0 ? config.color : 'transparent', color: val > 0 ? 'white' : config.color }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold mt-1" style={{ color: config.color }}>{config.label}</span>
                  </div>
                  <Slider value={[val]} onValueChange={(v) => setEmotionValues(prev => ({ ...prev, [id]: v[0] }))} min={0} max={5} step={1} className="flex-1" />
                  <span className="text-xs text-muted-foreground w-4">{val}</span>
                </div>
              )
            })}
          </div>

          <Button onClick={handleSubmit} className="w-full h-12 rounded-xl text-white bg-primary">記録を保存する</Button>
        </div>
      </div>
    </div>
  )
}
