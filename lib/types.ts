export type Emotion = 'joy' | 'anger' | 'sorrow' | 'happiness'

export type Category = 'self-investment' | 'self-reward' | 'living-cost' | 'waste'

export interface TimeEntry {
  id: string
  date: string
  startHour: number
  endHour: number
  content: string
  people: string[]
  amount: number
  amountType: 'spent' | 'received'
  category: Category
  emotion: Emotion
  emotionIntensity: number // 1-5
  createdAt: string
}

export interface Person {
  id: string
  name: string
  color: string
  isDefault?: boolean
}

export const EMOTIONS: { id: Emotion; label: string; icon: string }[] = [
  { id: 'joy', label: '喜', icon: 'smile' },
  { id: 'anger', label: '怒', icon: 'angry' },
  { id: 'sorrow', label: '哀', icon: 'frown' },
  { id: 'happiness', label: '楽', icon: 'laugh' },
]

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'self-investment', label: 'じぶん投資' },
  { id: 'self-reward', label: 'じぶんご褒美' },
  { id: 'living-cost', label: '生存コスト' },
  { id: 'waste', label: '無駄遣い' },
]

export const EMOTION_COLORS: Record<Emotion, string> = {
  joy: 'bg-joy',
  anger: 'bg-anger',
  sorrow: 'bg-sorrow',
  happiness: 'bg-happiness',
}

export const CATEGORY_COLORS: Record<Category, string> = {
  'self-investment': 'bg-self-investment',
  'self-reward': 'bg-self-reward',
  'living-cost': 'bg-living-cost',
  'waste': 'bg-waste',
}

export const DEFAULT_PEOPLE: { id: string; name: string }[] = [
  { id: 'default-1', name: '自分' },
  { id: 'default-2', name: '会社' },
  { id: 'default-3', name: '父' },
  { id: 'default-4', name: '母' },
  { id: 'default-5', name: '田中さん' },
  { id: 'default-6', name: 'メアリー' },
]
