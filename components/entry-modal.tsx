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

// 🎨 感情設定：アイコンを大きく、色を鮮明に
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

// ヘルパー関数は維持
function StarParticle({ style }: { style: React.CSSProperties }) { return <div className="absolute pointer-events-none animate-star-float" style={style}><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /></div> }
function SparkleParticle({ style }: { style: React.CSSProperties }) { return <div className="absolute pointer-events-none float-particle" style={style}><Sparkles className="w-4 h-4 text-self-reward" /></div> }
function getAvatarColor(name: string): string { const colors = ['bg-primary', 'bg-self-investment', 'bg-self-reward', 'bg-accent']; let hash = 0; for (let i = 0; i < name.length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); } return colors[Math.abs(hash) % colors.length]; }
function getInitials(name: string): string { if (name === '自分') return '私'; if (name === '会社') return '社'; return name.length <= 2 ? name : name.charAt(0); }

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

  // 👥 人物リストを自動で固定
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
    addEntry({
      date: selectedDate || new Date().toISOString().split('T')[0],
      startHour, endHour, content, people: selectedPeople, amount: parseInt(amount) || 0,
      amountType, category, emotion: maxEmotion, emotionIntensity: maxValue === 0 ? 1 : maxValue,
    });
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-[40px] sm:rounded-[40px] shadow-2xl max-h-[92vh] overflow-y-auto">
        
        {/* Header: 文字を大きく */}
        <div className="flex items-center justify-between p-7 border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-10">
          <h2 className="text-2xl font-bold text-slate-800">{editEntry ? '記録を編集' : '今日の記録'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full"><X className="h-6 w-6" /></Button>
        </div>

        <div className="p-8 space-y-10">
          {/* 1. 時間: セレクトボックスを大きく */}
          <div className="flex gap-6 items-center bg-slate-50 p-6 rounded-3xl">
            <div className="flex-1 space-y-2">
              <Label className="text-sm font-bold text-slate-500 ml-1">開始</Label>
              <select value={startHour} onChange={(e) => setStartHour(parseInt(e.target.value))} className="w-full h-14 text-xl px-4 rounded-2xl bg-white border-none shadow-sm font-semibold">
                {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>)}
              </select>
            </div>
            <span className="text-2xl text-slate-300 mt-6">→</span>
            <div className="flex-1 space-y-2">
              <Label className="text-sm font-bold text-slate-500 ml-1">終了</Label>
              <select value={endHour} onChange={(e) => setEndHour(parseInt(e.target.value))} className="w-full h-14 text-xl px-4 rounded-2xl bg-white border-none shadow-sm font-semibold">
                {Array
