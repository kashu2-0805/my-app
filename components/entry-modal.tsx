'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Trash2, Plus, Sparkles, Star } from 'lucide-react'
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

const EMOTION_ICONS: Record<Emotion, string> = {
  joy: '😊',
  anger: '😠',
  sorrow: '😢',
  happiness: '😄',
}

const EMOTION_LABELS: Record<Emotion, { label: string; negLabel: string; posLabel: string }> = {
  joy: { label: '喜', negLabel: '平静', posLabel: '大喜び' },
  anger: { label: '怒', negLabel: '穏やか', posLabel: '激怒' },
  sorrow: { label: '哀', negLabel: '平常心', posLabel: '深い悲しみ' },
  happiness: { label: '楽', negLabel: '普通', posLabel: 'とても楽しい' },
}

const CATEGORY_STYLES: Record<Category, { bg: string; border: string; icon: string }> = {
  'self-investment': { 
    bg: 'bg-self-investment/15', 
    border: 'border-self-investment',
    icon: '📚'
  },
  'self-reward': { 
    bg: 'bg-self-reward/15', 
    border: 'border-self-reward',
    icon: '✨'
  },
  'living-cost': { 
    bg: 'bg-living-cost/15', 
    border: 'border-living-cost',
    icon: '🏠'
  },
  'waste': { 
    bg: 'bg-waste/15', 
    border: 'border-waste',
    icon: '💸'
  },
}

// Star particle for special self-love effect
function StarParticle({ style }: { style: React.CSSProperties }) {
  return (
    <div 
      className="absolute pointer-events-none animate-star-float"
      style={style}
    >
      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
    </div>
  )
}

// Sparkle particle component
function SparkleParticle({ style }: { style: React.CSSProperties }) {
  return (
    <div 
      className="absolute pointer-events-none float-particle"
      style={style}
    >
      <Sparkles className="w-4 h-4 text-self-reward" />
    </div>
  )
}

// Avatar colors based on person name
function getAvatarColor(name: string): string {
  const colors = [
    'bg-primary',
    'bg-self-investment',
    'bg-self-reward',
    'bg-accent',
    'bg-chart-4',
    'bg-chart-5',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// Get initials from name
function getInitials(name: string): string {
  if (name === '自分') return '私'
  if (name === '会社') return '社'
  if (name.length <= 2) return name
  return name.charAt(0)
}

export function EntryModal({ isOpen, onClose, initialHour = 9, editEntry, selectedDate }: EntryModalProps) {
  const { addEntry, updateEntry, deleteEntry, people, addPerson, removePerson } = useStore()
  const [content, setContent] = useState('')
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [newPerson, setNewPerson] = useState('')
  const [showPersonInput, setShowPersonInput] = useState(false)
  const [amount, setAmount] = useState('')
  const [amountType, setAmountType] = useState<'spent' | 'received'>('spent')
  const [category, setCategory] = useState<Category>('living-cost')
  
  // Emotion sliders - each emotion has its own intensity (0 = neutral, negative = left, positive = right)
  const [emotionValues, setEmotionValues] = useState<Record<Emotion, number>>({
    joy: 0,
    anger: 0,
    sorrow: 0,
    happiness: 0,
  })
  
  const [startHour, setStartHour] = useState(initialHour)
  const [endHour, setEndHour] = useState(initialHour + 1)
  const [sparkles, setSparkles] = useState<{ id: number; style: React.CSSProperties }[]>([])
  const [stars, setStars] = useState<{ id: number; style: React.CSSProperties }[]>([])
  const [showRewardMessage, setShowRewardMessage] = useState(false)
  const [showSelfLoveMessage, setShowSelfLoveMessage] = useState(false)

  useEffect(() => {
    if (editEntry) {
      setContent(editEntry.content)
      setSelectedPeople(editEntry.people)
      setAmount(editEntry.amount.toString())
      setAmountType(editEntry.amountType)
      setCategory(editEntry.category)
      // Convert old format to new slider values
      const oldEmotionValue = editEntry.emotionIntensity
      setEmotionValues({
        joy: editEntry.emotion === 'joy' ? oldEmotionValue : 0,
        anger: editEntry.emotion === 'anger' ? oldEmotionValue : 0,
        sorrow: editEntry.emotion === 'sorrow' ? oldEmotionValue : 0,
        happiness: editEntry.emotion === 'happiness' ? oldEmotionValue : 0,
      })
      setStartHour(editEntry.startHour)
      setEndHour(editEntry.endHour)
    } else {
      setContent('')
      setSelectedPeople([])
      setAmount('')
      setAmountType('spent')
      setCategory('living-cost')
      setEmotionValues({ joy: 0, anger: 0, sorrow: 0, happiness: 0 })
      setStartHour(initialHour)
      setEndHour(initialHour + 1)
    }
    setShowRewardMessage(false)
    setShowSelfLoveMessage(false)
    setSparkles([])
    setStars([])
  }, [editEntry, initialHour, isOpen])

  // Check for self-love combination
  const checkSelfLoveEffect = useCallback((personList: string[], cat: Category) => {
    const isSelfSelected = personList.includes('自分')
    const isPositiveCategory = cat === 'self-investment' || cat === 'self-reward'
    
    if (isSelfSelected && isPositiveCategory) {
      const newStars = Array.from({ length: 12 }, (_, i) => ({
        id: Date.now() + i,
        style: {
          left: `${10 + Math.random() * 80}%`,
          top: `${10 + Math.random() * 80}%`,
          animationDelay: `${i * 0.08}s`,
          animationDuration: `${1 + Math.random() * 0.5}s`,
        }
      }))
      setStars(newStars)
      setShowSelfLoveMessage(true)
      
      setTimeout(() => {
        setStars([])
        setShowSelfLoveMessage(false)
      }, 2000)
    }
  }, [])

  // Sparkle effect when selecting self-reward
  const triggerSparkleEffect = useCallback(() => {
    const newSparkles = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      style: {
        left: `${20 + Math.random() * 60}%`,
        top: `${20 + Math.random() * 60}%`,
        animationDelay: `${i * 0.1}s`,
      }
    }))
    setSparkles(newSparkles)
    setShowRewardMessage(true)
    
    setTimeout(() => {
      setSparkles([])
      setShowRewardMessage(false)
    }, 1500)
  }, [])

  const handleCategoryChange = (newCategory: Category) => {
    setCategory(newCategory)
    if (newCategory === 'self-reward') {
      triggerSparkleEffect()
    }
    checkSelfLoveEffect(selectedPeople, newCategory)
  }

  const handlePersonToggle = (personName: string) => {
    const newSelectedPeople = selectedPeople.includes(personName)
      ? selectedPeople.filter((p) => p !== personName)
      : [...selectedPeople, personName]
    
    setSelectedPeople(newSelectedPeople)
    checkSelfLoveEffect(newSelectedPeople, category)
  }

  const handleEmotionChange = (emotion: Emotion, value: number[]) => {
    setEmotionValues(prev => ({ ...prev, [emotion]: value[0] }))
  }

  // Get dominant emotion from slider values
  const getDominantEmotion = (): { emotion: Emotion; intensity: number } => {
    let maxEmotion: Emotion = 'happiness'
    let maxValue = 0
    
    Object.entries(emotionValues).forEach(([emotion, value]) => {
      const absValue = Math.abs(value)
      if (absValue > maxValue) {
        maxValue = absValue
        maxEmotion = emotion as Emotion
      }
    })
    
    // Convert -5 to 5 scale to 1 to 5 scale
    const intensity = Math.max(1, Math.round(Math.abs(emotionValues[maxEmotion]) || 1))
    return { emotion: maxEmotion, intensity }
  }

  const handleSubmit = () => {
    const dateStr = selectedDate || new Date().toISOString().split('T')[0]
    const { emotion, intensity } = getDominantEmotion()
    
    const entryData = {
      date: dateStr,
      startHour,
      endHour,
      content,
      people: selectedPeople,
      amount: parseInt(amount) || 0,
      amountType,
      category,
      emotion,
      emotionIntensity: intensity,
    }

    if (editEntry) {
      updateEntry(editEntry.id, entryData)
    } else {
      addEntry(entryData)
    }
    onClose()
  }

  const handleDelete = () => {
    if (editEntry) {
      deleteEntry(editEntry.id)
      onClose()
    }
  }

  const handleAddPerson = () => {
    if (newPerson.trim()) {
      const person = addPerson(newPerson.trim())
      setSelectedPeople((prev) => [...prev, person.name])
      setNewPerson('')
      setShowPersonInput(false)
    }
  }

  const handleRemovePerson = (personId: string, personName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removePerson(personId)
    setSelectedPeople((prev) => prev.filter((p) => p !== personName))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Sparkle effects */}
        {sparkles.map((sparkle) => (
          <SparkleParticle key={sparkle.id} style={sparkle.style} />
        ))}
        
        {/* Star effects for self-love */}
        {stars.map((star) => (
          <StarParticle key={star.id} style={star.style} />
        ))}
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10 rounded-t-3xl">
          <h2 className="text-lg font-semibold text-card-foreground">
            {editEntry ? '記録を編集' : '今日の記録'}
          </h2>
          <div className="flex items-center gap-2">
            {editEntry && (
              <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-secondary">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
          {/* Time Range */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="text-sm text-muted-foreground mb-2 block">開始</Label>
              <select
                value={startHour}
                onChange={(e) => {
                  const newStart = parseInt(e.target.value)
                  setStartHour(newStart)
                  if (newStart >= endHour) setEndHour(newStart + 1)
                }}
                className="w-full h-12 px-4 rounded-xl bg-secondary border-0 text-foreground font-medium"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end pb-3 text-muted-foreground">→</div>
            <div className="flex-1">
              <Label className="text-sm text-muted-foreground mb-2 block">終了</Label>
              <select
                value={endHour}
                onChange={(e) => setEndHour(parseInt(e.target.value))}
                className="w-full h-12 px-4 rounded-xl bg-secondary border-0 text-foreground font-medium"
              >
                {Array.from({ length: 24 - startHour }, (_, i) => (
                  <option key={i} value={startHour + i + 1}>
                    {(startHour + i + 1).toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Content */}
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">何をしましたか?</Label>
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="今日の出来事を記録..."
              className="h-12 text-base rounded-xl border-0 bg-secondary"
            />
          </div>

          {/* People - Avatar style */}
          <div>
            <Label className="text-sm text-muted-foreground mb-3 block">誰と?</Label>
            <div className="flex flex-wrap gap-3 items-start">
              {people.map((person) => (
                <div key={person.id} className="relative group">
                  <button
                    onClick={() => handlePersonToggle(person.name)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 transition-all',
                      selectedPeople.includes(person.name) && 'scale-110'
                    )}
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center text-base font-medium transition-all',
                        selectedPeople.includes(person.name)
                          ? cn(getAvatarColor(person.name), 'text-white ring-2 ring-offset-2 ring-primary')
                          : 'bg-secondary text-secondary-foreground'
                      )}
                    >
                      {getInitials(person.name)}
                    </div>
                    <span className={cn(
                      'text-xs transition-colors',
                      selectedPeople.includes(person.name)
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground'
                    )}>
                      {person.name}
                    </span>
                  </button>
                  {!person.isDefault && (
                    <button
                      onClick={(e) => handleRemovePerson(person.id, person.name, e)}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-sm"
                    >
                      x
                    </button>
                  )}
                </div>
              ))}
              
              {/* Add person button */}
              <div className="flex flex-col items-center gap-1.5">
                <button
                  onClick={() => setShowPersonInput(!showPersonInput)}
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-secondary hover:bg-secondary/80 text-muted-foreground transition-all border-2 border-dashed border-muted-foreground/30"
                >
                  <Plus className="h-5 w-5" />
                </button>
                <span className="text-xs text-muted-foreground">追加</span>
              </div>
            </div>
            
            {showPersonInput && (
              <div className="flex gap-2 mt-4">
                <Input
                  value={newPerson}
                  onChange={(e) => setNewPerson(e.target.value)}
                  placeholder="名前を入力"
                  className="h-10 rounded-xl border-0 bg-secondary"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPerson()}
                  autoFocus
                />
                <Button variant="secondary" onClick={handleAddPerson} className="h-10 rounded-xl px-4">
                  追加
                </Button>
                <Button variant="ghost" onClick={() => setShowPersonInput(false)} className="h-10 rounded-xl px-3">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Category - 4 categories, title only */}
          <div>
            <Label className="text-sm text-muted-foreground mb-3 block">どんな時間?</Label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={cn(
                    'relative p-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2',
                    category === cat.id
                      ? cn(
                          'border-2',
                          CATEGORY_STYLES[cat.id].bg,
                          CATEGORY_STYLES[cat.id].border
                        )
                      : 'bg-secondary border-2 border-transparent hover:bg-secondary/80'
                  )}
                >
                  <span className="text-lg">{CATEGORY_STYLES[cat.id].icon}</span>
                  <span className="font-medium text-sm text-foreground">{cat.label}</span>
                </button>
              ))}
            </div>
            
            {/* Reward message */}
            {showRewardMessage && category === 'self-reward' && (
              <div className="mt-3 p-3 rounded-xl bg-self-reward/10 border border-self-reward/30 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-sm text-foreground font-medium">
                  自分へのご褒美、素敵です!
                </p>
              </div>
            )}
            
            {/* Self-love message */}
            {showSelfLoveMessage && (
              <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-self-reward/10 border border-primary/30 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-sm text-foreground font-medium flex items-center justify-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  自分を大切にしていますね!
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                </p>
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">金額</Label>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setAmountType('spent')}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all',
                  amountType === 'spent'
                    ? 'bg-destructive/10 text-destructive border-2 border-destructive'
                    : 'bg-secondary text-secondary-foreground border-2 border-transparent'
                )}
              >
                支出
              </button>
              <button
                onClick={() => setAmountType('received')}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all',
                  amountType === 'received'
                    ? 'bg-accent text-accent-foreground border-2 border-primary'
                    : 'bg-secondary text-secondary-foreground border-2 border-transparent'
                )}
              >
                収入・恩恵
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="h-12 text-base pl-8 rounded-xl border-0 bg-secondary"
              />
            </div>
          </div>

          {/* Emotion - 4 sliders in a row */}
          <div>
            <Label className="text-sm text-muted-foreground mb-4 block">今の気持ちは?</Label>
            <div className="space-y-5">
              {EMOTIONS.map((em) => {
                const value = emotionValues[em.id]
                const labels = EMOTION_LABELS[em.id]
                const isActive = Math.abs(value) > 0
                
                return (
                  <div key={em.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'text-2xl transition-transform',
                          isActive && 'scale-110'
                        )}>
                          {EMOTION_ICONS[em.id]}
                        </span>
                        <span className={cn(
                          'text-sm font-medium transition-colors',
                          isActive ? 'text-foreground' : 'text-muted-foreground'
                        )}>
                          {labels.label}
                        </span>
                      </div>
                      {isActive && (
                        <span className="text-xs text-muted-foreground">
                          {value > 0 ? '+' : ''}{value}
                        </span>
                      )}
                    </div>
                    <div className="px-1">
                      <Slider
                        value={[value]}
                        onValueChange={(v) => handleEmotionChange(em.id, v)}
                        min={-5}
                        max={5}
                        step={1}
                        className={cn(
                          'transition-opacity',
                          isActive ? 'opacity-100' : 'opacity-60'
                        )}
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                        <span>{labels.negLabel}</span>
                        <span className="text-muted-foreground/50">中立</span>
                        <span>{labels.posLabel}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            className="w-full h-14 text-base rounded-xl bg-primary hover:bg-primary/90"
          >
            {editEntry ? '更新する' : '記録する'}
          </Button>
        </div>
      </div>
    </div>
  )
}
