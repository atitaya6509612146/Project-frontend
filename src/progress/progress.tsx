import { useEffect, useMemo, useState } from 'react'
import { Button, DatePicker, Modal, message } from 'antd'
import { CloseOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { ApiError, createGoalHistory, createUserGoal, deleteUserGoalById, getActivityCategories, getActivityCategoryById, getGoalHistories, getGoalHistoryChart, getTodayUserGoals, getUserById, updateGoalHistoryById, updateUserGoalById, type GoalHistoryChartResponse, type GoalHistoryResponse, type UserGoalResponse } from '../api'
import Header, { type HomeTab } from '../components/header'
import Footer from '../components/footer'
import birdImage1 from '../assets/bird1.png'
import birdImage2 from '../assets/bird2.png'
import birdImage3 from '../assets/bird3.png'
import catImage1 from '../assets/cat1.png'
import catImage2 from '../assets/cat2.png'
import catImage3 from '../assets/cat3.png'
import { getStoredUserProfile, saveUserDetailsProfile } from '../lib/user-profile'
import './progress.css'

type GoalItem = {
  id: string
  label: string
  points: string
  checked?: boolean
  note?: string
  categoryId?: number
  difficulty?: string
  frequencyType?: string
  startDate?: string
  endDate?: string
}

type GoalGroup = {
  id: string
  title: string
  items: GoalItem[]
}

const monthOptions = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

type PetType = 'bird' | 'cat'
type GoalCategoryId = 'education' | 'health' | 'other'
type ActivityCategoryOption = { id: number; categoryId: GoalCategoryId; label: string }
type ModalActivityCategoryOption = { id: number; label: string }
const PET_STORAGE_KEY = 'selectedPet'
type GoalFrequency = 'daily' | 'weekday' | 'weekend' | 'custom'
type GoalDifficulty = 'easy' | 'medium' | 'hard'
type GoalModalMode = 'add' | 'edit'
type EditingGoalRef = { groupId: string; itemId: string } | null
type StatsSeriesKey = 'day' | 'week' | 'month'
type StatsMode = 'daily' | 'weekly' | 'monthly'
type StatsChartData = {
  labels: string[]
  series: Record<StatsSeriesKey, number[]>
}
const { RangePicker } = DatePicker
const LEVEL_PROGRESS_MAX = 100

const petImagesByLevel = {
  bird: {
    1: birdImage1,
    2: birdImage2,
    3: birdImage3,
  },
  cat: {
    1: catImage1,
    2: catImage2,
    3: catImage3,
  },
} as const

const resolvePetStage = (level: number) => {
  if (level < 10) {
    return 1
  }
  if (level < 25) {
    return 2
  }
  return 3
}

const fallbackCategoryOptions: ActivityCategoryOption[] = [
  { id: 1, categoryId: 'education', label: 'Education' },
  { id: 2, categoryId: 'health', label: 'Health & Wellness' },
  { id: 3, categoryId: 'other', label: 'Others' },
]

const fallbackModalCategoryOptions: ModalActivityCategoryOption[] = fallbackCategoryOptions.map((category) => ({
  id: category.id,
  label: category.label,
}))

const createEmptyStatsChartData = (year: number, month: number, mode: StatsMode): StatsChartData => {
  if (mode === 'weekly') {
    return {
      labels: ['W1', 'W2', 'W3', 'W4', 'W5'],
      series: {
        day: [0, 0, 0, 0, 0],
        week: [0, 0, 0, 0, 0],
        month: [0, 0, 0, 0, 0],
      },
    }
  }

  if (mode === 'monthly') {
    const labels = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
    const emptySeries = new Array(labels.length).fill(0)

    return {
      labels,
      series: {
        day: [...emptySeries],
        week: [...emptySeries],
        month: [...emptySeries],
      },
    }
  }

  const daysInMonth = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).daysInMonth()
  const labels = Array.from({ length: daysInMonth }, (_, index) => String(index + 1).padStart(2, '0'))
  const emptySeries = new Array(daysInMonth).fill(0)

  return {
    labels,
    series: {
      day: [...emptySeries],
      week: [...emptySeries],
      month: [...emptySeries],
    },
  }
}

const resolveGoalCategoryId = (categoryName: string): GoalCategoryId | null => {
  const normalized = categoryName.trim().toLowerCase()

  if (normalized.includes('education')) {
    return 'education'
  }

  if (normalized.includes('health') || normalized.includes('wellness')) {
    return 'health'
  }

  if (normalized.includes('other')) {
    return 'other'
  }

  return null
}

function ProgressPage() {
  const [activeTab, setActiveTab] = useState<HomeTab>('progress')
  const [isPetModalOpen, setIsPetModalOpen] = useState(false)
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false)
  const [isDeleteGoalModalOpen, setIsDeleteGoalModalOpen] = useState(false)
  const [goalModalMode, setGoalModalMode] = useState<GoalModalMode>('add')
  const [editingGoalRef, setEditingGoalRef] = useState<EditingGoalRef>(null)
  const [selectedPet, setSelectedPet] = useState<PetType>('bird')
  const [goalCategory, setGoalCategory] = useState('')
  const [selectedActivityCategoryId, setSelectedActivityCategoryId] = useState('')
  const [goalName, setGoalName] = useState('')
  const [goalDifficulty, setGoalDifficulty] = useState<'' | GoalDifficulty>('')
  const [goalDescription, setGoalDescription] = useState('')
  const [goalFrequency, setGoalFrequency] = useState<'' | GoalFrequency>('')
  const [customDateRange, setCustomDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [isSavingGoal, setIsSavingGoal] = useState(false)
  const [isDeletingGoal, setIsDeletingGoal] = useState(false)
  const [isGoalsLoading, setIsGoalsLoading] = useState(false)
  const [userGoals, setUserGoals] = useState<UserGoalResponse[]>([])
  const [goalHistories, setGoalHistories] = useState<GoalHistoryResponse[]>([])
  const [updatingGoalHistoryKeys, setUpdatingGoalHistoryKeys] = useState<Record<string, boolean>>({})
  const [currentPet, setCurrentPet] = useState<PetType | null>(() => {
    if (typeof window === 'undefined') {
      return null
    }
    const savedPet = window.localStorage.getItem(PET_STORAGE_KEY)
    return savedPet === 'bird' || savedPet === 'cat' ? savedPet : null
  })
  const [checkedGoals, setCheckedGoals] = useState<Record<string, boolean>>(
    {},
  )
  const [username, setUsername] = useState(() => {
    const storedProfile = getStoredUserProfile()
    return storedProfile.username && storedProfile.username !== '-' ? storedProfile.username : 'User'
  })
  const [level, setLevel] = useState(() => {
    const storedProfile = getStoredUserProfile()
    return storedProfile.level > 0 ? storedProfile.level : 1
  })
  const [exp, setExp] = useState(() => {
    const storedProfile = getStoredUserProfile()
    return storedProfile.exp >= 0 ? storedProfile.exp : 0
  })
  const [activityCategories, setActivityCategories] = useState(fallbackCategoryOptions)
  const [modalActivityCategories, setModalActivityCategories] = useState(fallbackModalCategoryOptions)

  const currentDate = useMemo(
    () =>
      new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      }).format(new Date()),
    [],
  )
  const currentYear = new Date().getFullYear()
  const currentMonthIndex = new Date().getMonth()
  const [selectedCategory, setSelectedCategory] = useState<string>(String(fallbackModalCategoryOptions[0]?.id ?? ''))
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [selectedMonth, setSelectedMonth] = useState<string>(monthOptions[currentMonthIndex])
  const [appliedCategory, setAppliedCategory] = useState<string>(String(fallbackModalCategoryOptions[0]?.id ?? ''))
  const [appliedYear, setAppliedYear] = useState<number>(currentYear)
  const [appliedMonth, setAppliedMonth] = useState<string>(monthOptions[currentMonthIndex])
  const [isStatsLoading, setIsStatsLoading] = useState(false)
  const [hasSearchedStats, setHasSearchedStats] = useState(false)
  const [statsMode, setStatsMode] = useState<StatsMode>('daily')
  const [statsChartData, setStatsChartData] = useState<StatsChartData>(() =>
    createEmptyStatsChartData(currentYear, currentMonthIndex + 1, 'daily'),
  )
  const availableMonths = selectedYear < currentYear ? monthOptions : monthOptions.slice(0, currentMonthIndex + 1)
  const categoryLabel = modalActivityCategories.find((category) => String(category.id) === appliedCategory)?.label || 'Others'
  const safeLevel = level > 0 ? level : 1
  const safeExp = exp >= 0 ? exp : 0
  const currentLevelExp = safeExp % LEVEL_PROGRESS_MAX
  const levelProgressPercent = (currentLevelExp / LEVEL_PROGRESS_MAX) * 100
  const activePetStage = resolvePetStage(safeLevel)
  const activePetImage = currentPet ? petImagesByLevel[currentPet][activePetStage] : undefined
  const goalGroupsState = useMemo<GoalGroup[]>(() => {
    const groupsMap = new Map<string, GoalGroup>()

    userGoals
      .filter((goal) => goal.is_active !== false)
      .forEach((goal) => {
        const categoryId = goal.category_id
        if (typeof categoryId !== 'number') {
          return
        }

        const groupId = String(categoryId)
        const categoryLabel =
          modalActivityCategories.find((category) => category.id === categoryId)?.label ||
          activityCategories.find((category) => category.id === categoryId)?.label ||
          `Category ${categoryId}`

        if (!groupsMap.has(groupId)) {
          groupsMap.set(groupId, {
            id: groupId,
            title: categoryLabel,
            items: [],
          })
        }

        groupsMap.get(groupId)?.items.push({
          id: String(goal.id ?? `${categoryId}-${goal.title ?? 'goal'}`),
          label: goal.title || 'Untitled goal',
          points: `+${goal.points ?? 0} pts`,
          note: goal.description || undefined,
          categoryId,
          difficulty: goal.difficulty,
          frequencyType: goal.frequency_type,
          startDate: goal.start_date,
          endDate: goal.end_date,
        })
      })

    return Array.from(groupsMap.values())
  }, [activityCategories, modalActivityCategories, userGoals])
  const maxChartValue = useMemo(() => {
    const values =
      statsMode === 'daily'
        ? statsChartData.series.day
        : statsMode === 'weekly'
          ? statsChartData.series.week
          : statsChartData.series.month
    const highest = Math.max(0, ...values)

    const step =
      highest <= 100
        ? 25
        : highest <= 250
          ? 50
          : highest <= 500
            ? 100
            : highest <= 1000
              ? 200
              : 500

    return Math.max(step * 4, Math.ceil(highest / step) * step)
  }, [statsChartData, statsMode])
  const yAxisTicks = useMemo(() => {
    const step = maxChartValue / 4
    return [0, step, step * 2, step * 3, maxChartValue]
  }, [maxChartValue])
  const activeStatsSeries = useMemo(
    () =>
      statsMode === 'daily'
        ? statsChartData.series.day
        : statsMode === 'weekly'
          ? statsChartData.series.week
          : statsChartData.series.month,
    [statsChartData, statsMode],
  )
  const activeStatsLabels = useMemo(() => {
    if (statsMode === 'daily') {
      return statsChartData.labels
    }

    if (statsMode === 'weekly') {
      return Array.from({ length: activeStatsSeries.length }, (_, index) => `W${index + 1}`)
    }

    return Array.from({ length: activeStatsSeries.length }, (_, index) => String(index + 1).padStart(2, '0'))
  }, [activeStatsSeries.length, statsChartData.labels, statsMode])

  useEffect(() => {
    if (!hasSearchedStats) {
      const monthIndex = monthOptions.findIndex((month) => month === selectedMonth)
      if (monthIndex >= 0) {
        setStatsChartData(createEmptyStatsChartData(selectedYear, monthIndex + 1, statsMode))
      }
    }
  }, [hasSearchedStats, selectedMonth, selectedYear, statsMode])

  const normalizeChartSeries = (value: unknown): number[] => {
    if (!Array.isArray(value)) {
      return []
    }

    return value
      .map((item) => {
        if (typeof item === 'number') {
          return item
        }
        if (typeof item === 'string') {
          const parsed = Number(item)
          return Number.isFinite(parsed) ? parsed : null
        }
        if (typeof item === 'object' && item !== null) {
          const candidate = 'value' in item ? item.value : 'count' in item ? item.count : 'total' in item ? item.total : null
          if (typeof candidate === 'number') {
            return candidate
          }
          if (typeof candidate === 'string') {
            const parsed = Number(candidate)
            return Number.isFinite(parsed) ? parsed : null
          }
        }
        return null
      })
      .filter((item): item is number => item !== null)
  }

  const normalizeChartLabels = (length: number, source?: unknown): string[] => {
    if (Array.isArray(source)) {
      const labels = source
        .map((item) => {
          if (typeof item === 'number') {
            return String(item)
          }

          if (typeof item === 'string') {
            if (/^\d{4}-\d{2}-\d{2}$/.test(item)) {
              return item.slice(-2)
            }

            return item
          }

          return null
        })
        .filter((item): item is string => item !== null)

      if (labels.length === length) {
        return labels
      }
    }

    return Array.from({ length }, (_, index) => `W${index + 1}`)
  }

  const parseGoalHistoryChartResponse = (payload: GoalHistoryChartResponse): StatsChartData | null => {
    if (Array.isArray(payload)) {
      const day = normalizeChartSeries(payload)
      if (day.length > 0) {
        return {
          labels: normalizeChartLabels(day.length),
          series: {
            day,
            week: new Array(day.length).fill(0),
            month: new Array(day.length).fill(0),
          },
        }
      }

      return null
    }

    if (typeof payload !== 'object' || payload === null) {
      return null
    }

    const hasNestedSeries =
      ('daily' in payload && typeof payload.daily === 'object' && payload.daily !== null) ||
      ('weekly' in payload && typeof payload.weekly === 'object' && payload.weekly !== null) ||
      ('monthly' in payload && typeof payload.monthly === 'object' && payload.monthly !== null)

    if (hasNestedSeries) {
      const dailyData = 'daily' in payload && typeof payload.daily === 'object' && payload.daily !== null ? payload.daily : null
      const weeklyData = 'weekly' in payload && typeof payload.weekly === 'object' && payload.weekly !== null ? payload.weekly : null
      const monthlyData = 'monthly' in payload && typeof payload.monthly === 'object' && payload.monthly !== null ? payload.monthly : null

      const day = normalizeChartSeries(
        dailyData && 'values' in dailyData ? dailyData.values : dailyData && 'data' in dailyData ? dailyData.data : [],
      )
      const week = normalizeChartSeries(
        weeklyData && 'values' in weeklyData ? weeklyData.values : weeklyData && 'data' in weeklyData ? weeklyData.data : [],
      )
      const month = normalizeChartSeries(
        monthlyData && 'values' in monthlyData ? monthlyData.values : monthlyData && 'data' in monthlyData ? monthlyData.data : [],
      )
      const maxLength = Math.max(day.length, week.length, month.length)

      if (maxLength === 0) {
        return null
      }

      const labelsSource =
        dailyData && 'labels' in dailyData
          ? dailyData.labels
          : weeklyData && 'labels' in weeklyData
            ? weeklyData.labels
            : monthlyData && 'labels' in monthlyData
              ? monthlyData.labels
              : undefined

      return {
        labels: normalizeChartLabels(maxLength, labelsSource),
        series: {
          day: day,
          week: week,
          month: month,
        },
      }
    }

    const day = normalizeChartSeries(
      'day' in payload ? payload.day : 'daily' in payload ? payload.daily : 'perDay' in payload ? payload.perDay : [],
    )
    const week = normalizeChartSeries(
      'week' in payload ? payload.week : 'weekly' in payload ? payload.weekly : 'perWeek' in payload ? payload.perWeek : [],
    )
    const month = normalizeChartSeries(
      'month' in payload ? payload.month : 'monthly' in payload ? payload.monthly : 'perMonth' in payload ? payload.perMonth : [],
    )
    const maxLength = Math.max(day.length, week.length, month.length)

    if (maxLength === 0) {
      return null
    }

    const labelsSource =
      'labels' in payload
        ? payload.labels
        : 'weeks' in payload
          ? payload.weeks
          : 'xAxis' in payload
            ? payload.xAxis
            : undefined

    return {
      labels: normalizeChartLabels(maxLength, labelsSource),
      series: {
        day: [...day, ...new Array(Math.max(0, maxLength - day.length)).fill(0)],
        week: [...week, ...new Array(Math.max(0, maxLength - week.length)).fill(0)],
        month: [...month, ...new Array(Math.max(0, maxLength - month.length)).fill(0)],
      },
    }
  }

  const createPolylinePoints = (values: number[]) => {
    if (values.length === 0) {
      return ''
    }

    const xStart = 90
    const xEnd = 710
    const yTop = 40
    const yBottom = 250
    const xStep = values.length > 1 ? (xEnd - xStart) / (values.length - 1) : 0

    return values
      .map((value, index) => {
        const x = xStart + xStep * index
        const y = yBottom - (Math.max(0, value) / maxChartValue) * (yBottom - yTop)
        return `${x},${y}`
      })
      .join(' ')
  }

  const createChartPoints = (values: number[]) => {
    if (values.length === 0) {
      return []
    }

    const xStart = 90
    const xEnd = 710
    const yTop = 40
    const yBottom = 250
    const xStep = values.length > 1 ? (xEnd - xStart) / (values.length - 1) : 0

    return values.map((value, index) => ({
      x: xStart + xStep * index,
      y: yBottom - (Math.max(0, value) / maxChartValue) * (yBottom - yTop),
    }))
  }

  const refreshUserProgress = async () => {
    const storedProfile = getStoredUserProfile()
    const userId = storedProfile.userId

    if (!userId) {
      return
    }

    try {
      const response = await getUserById(userId)
      const nextUsername = response.username?.trim() || storedProfile.username
      const nextLevel = typeof response.level === 'number' ? response.level : storedProfile.level
      const nextExp = typeof response.exp === 'number' ? response.exp : storedProfile.exp

      if (nextUsername && nextUsername !== '-') {
        setUsername(nextUsername)
      }
      setLevel(nextLevel > 0 ? nextLevel : 1)
      setExp(nextExp >= 0 ? nextExp : 0)
      saveUserDetailsProfile({
        username: nextUsername && nextUsername !== '-' ? nextUsername : undefined,
        level: nextLevel,
        exp: nextExp,
      })
    } catch (error) {
      if (error instanceof ApiError) {
        return
      }
    }
  }

  useEffect(() => {
    void refreshUserProgress()
  }, [])

  useEffect(() => {
    if (activeTab === 'progress') {
      void refreshUserProgress()
    }
  }, [activeTab])

  useEffect(() => {
    const loadActivityCategories = async () => {
      try {
        const response = await getActivityCategories()
        const nextModalOptions: ModalActivityCategoryOption[] = response.map((item) => ({
          id: item.id,
          label: item.category_name,
        }))
        const nextOptions = response
          .map((item) => {
            const categoryId = resolveGoalCategoryId(item.category_name)

            if (!categoryId) {
              return null
            }

            return {
              id: item.id,
              categoryId,
              label: item.category_name,
            }
          })
          .filter((item): item is ActivityCategoryOption => item !== null)

        if (nextModalOptions.length > 0) {
          setModalActivityCategories(nextModalOptions)
          setSelectedCategory((current) => current || String(nextModalOptions[0].id))
          setAppliedCategory((current) => current || String(nextModalOptions[0].id))
        }
        if (nextOptions.length > 0) {
          setActivityCategories(nextOptions)
        }
      } catch (error) {
        if (error instanceof ApiError) {
          return
        }
      }
    }

    void loadActivityCategories()
  }, [])

  useEffect(() => {
    const storedProfile = getStoredUserProfile()
    const userId = Number(storedProfile.userId)

    if (!Number.isFinite(userId) || userId <= 0) {
      return
    }

    const loadUserGoals = async () => {
      try {
        setIsGoalsLoading(true)
        const response = await getTodayUserGoals(userId)
        const nextGoals = response.filter((goal) => Number(goal.user_id) === userId)
        setUserGoals(nextGoals)
        setCheckedGoals((prev) => {
          const next = { ...prev }
          nextGoals.forEach((goal) => {
            if (goal.id !== undefined && goal.category_id !== undefined) {
              next[`${goal.category_id}:${goal.id}`] = false
            }
          })
          return next
        })
      } catch (error) {
        if (error instanceof ApiError) {
          message.error(error.message || 'Unable to load goals')
        } else {
          message.error('Unable to load goals')
        }
      } finally {
        setIsGoalsLoading(false)
      }
    }

    void loadUserGoals()
  }, [])

  useEffect(() => {
    const storedProfile = getStoredUserProfile()
    const userId = Number(storedProfile.userId)

    if (!Number.isFinite(userId) || userId <= 0) {
      return
    }

    const loadGoalHistories = async () => {
      try {
        const response = await getGoalHistories()
        const nextHistories = response.filter((history) => Number(history.user_id) === userId)
        setGoalHistories(nextHistories)
        setCheckedGoals((prev) => {
          const next = { ...prev }
          nextHistories.forEach((history) => {
            if (history.goal_id !== undefined) {
              const goal = userGoals.find((item) => item.id === history.goal_id)
              const categoryId = goal?.category_id
              if (categoryId !== undefined) {
                next[`${categoryId}:${history.goal_id}`] = Boolean(history.is_completed)
              }
            }
          })
          return next
        })
      } catch (error) {
        if (error instanceof ApiError) {
          message.error(error.message || 'Unable to load goal histories')
        } else {
          message.error('Unable to load goal histories')
        }
      }
    }

    void loadGoalHistories()
  }, [userGoals])

  const handleToggleGoalHistory = async (goalId: string, categoryId: string, nextChecked: boolean) => {
    const storedProfile = getStoredUserProfile()
    const userId = Number(storedProfile.userId)
    const numericGoalId = Number(goalId)
    const key = `${categoryId}:${goalId}`

    if (!Number.isFinite(userId) || userId <= 0 || !Number.isFinite(numericGoalId) || numericGoalId <= 0) {
      message.error('Unable to update goal history')
      return
    }

    const nowIso = new Date().toISOString()
    const existingHistory = goalHistories.find((history) => history.goal_id === numericGoalId)

    setUpdatingGoalHistoryKeys((prev) => ({ ...prev, [key]: true }))
    setCheckedGoals((prev) => ({ ...prev, [key]: nextChecked }))

    try {
      if (existingHistory?.id !== undefined) {
        const response = await updateGoalHistoryById(existingHistory.id, {
          goal_id: numericGoalId,
          user_id: userId,
          finish_date: nowIso,
          is_completed: nextChecked,
        })

        setGoalHistories((prev) =>
          prev.map((history) =>
            history.id === existingHistory.id
              ? {
                  ...history,
                  ...response,
                  id: existingHistory.id,
                  goal_id: numericGoalId,
                  user_id: userId,
                  finish_date: nowIso,
                  is_completed: nextChecked,
                }
              : history,
          ),
        )
        void refreshUserProgress()
      } else {
        const response = await createGoalHistory({
          id: 0,
          goal_id: numericGoalId,
          user_id: userId,
          finish_date: nowIso,
          is_completed: nextChecked,
          create_date: nowIso,
          update_date: nowIso,
        })

        setGoalHistories((prev) => [
          ...prev,
          {
            ...response,
            id: typeof response.id === 'number' ? response.id : Date.now(),
            goal_id: numericGoalId,
            user_id: userId,
            finish_date: nowIso,
            is_completed: nextChecked,
            create_date: nowIso,
            update_date: nowIso,
          },
        ])
        void refreshUserProgress()
      }
    } catch (error) {
      setCheckedGoals((prev) => ({ ...prev, [key]: !nextChecked }))
      if (error instanceof ApiError) {
        message.error(error.message || 'Unable to update goal history')
      } else {
        message.error('Unable to update goal history')
      }
    } finally {
      setUpdatingGoalHistoryKeys((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  const handleOpenPetModal = () => {
    setSelectedPet(currentPet ?? 'bird')
    setIsPetModalOpen(true)
  }

  const handleConfirmPet = () => {
    setCurrentPet(selectedPet)
    window.localStorage.setItem(PET_STORAGE_KEY, selectedPet)
    setIsPetModalOpen(false)
  }

  const handleSearchStats = async () => {
    const storedProfile = getStoredUserProfile()
    const userId = Number(storedProfile.userId)
    const selectedCategoryOption = modalActivityCategories.find((category) => String(category.id) === selectedCategory)
    const monthIndex = monthOptions.findIndex((month) => month === selectedMonth)

    if (!Number.isFinite(userId) || userId <= 0) {
      message.error('User id is required before searching statistics')
      return
    }

    if (!selectedCategoryOption) {
      message.error('Please choose a category')
      return
    }

    if (monthIndex < 0) {
      message.error('Please choose a valid month')
      return
    }

    try {
      setIsStatsLoading(true)
      setHasSearchedStats(true)
      const response = await getGoalHistoryChart({
        userid: userId,
        year: selectedYear,
        month: monthIndex + 1,
        categoryid: selectedCategoryOption.id,
      })
      const nextChartData = parseGoalHistoryChartResponse(response)

      setAppliedCategory(selectedCategory)
      setAppliedYear(selectedYear)
      setAppliedMonth(selectedMonth)

      if (nextChartData) {
        setStatsChartData(nextChartData)
      } else {
        setStatsChartData(createEmptyStatsChartData(selectedYear, monthIndex + 1, statsMode))
        message.info('No chart data found for this filter')
      }
    } catch (error) {
      if (error instanceof ApiError) {
        message.error(error.message || 'Unable to load statistics')
      } else {
        message.error('Unable to load statistics')
      }
    } finally {
      setIsStatsLoading(false)
    }
  }

  const resolveDifficultyFromPoints = (points: string): GoalDifficulty => {
    if (points.includes('+30')) {
      return 'hard'
    }
    if (points.includes('+20')) {
      return 'medium'
    }
    return 'easy'
  }

  const resolveNumericPointsFromDifficulty = (difficulty: GoalDifficulty): number =>
    difficulty === 'hard' ? 30 : difficulty === 'medium' ? 20 : 10

  const handleOpenAddGoalModal = () => {
    setGoalModalMode('add')
    setEditingGoalRef(null)
    setGoalCategory('')
    setSelectedActivityCategoryId('')
    setGoalName('')
    setGoalDifficulty('')
    setGoalDescription('')
    setGoalFrequency('')
    setCustomDateRange(null)
    setIsAddGoalModalOpen(true)
  }

  const handleOpenEditGoalModal = (groupId: string, itemId: string) => {
    const targetGroup = goalGroupsState.find((group) => group.id === groupId)
    const targetItem = targetGroup?.items.find((item) => item.id === itemId)
    if (!targetGroup || !targetItem) {
      return
    }

    setGoalModalMode('edit')
    setEditingGoalRef({ groupId, itemId })
    setGoalCategory(groupId)
    setGoalName(targetItem.label)
    setGoalDifficulty(resolveDifficultyFromPoints(targetItem.points))
    setGoalDescription(targetItem.note ?? '')
    setGoalFrequency((targetItem.frequencyType as '' | GoalFrequency | undefined) || '')
    setCustomDateRange(
      targetItem.startDate && targetItem.endDate ? [dayjs(targetItem.startDate), dayjs(targetItem.endDate)] : null,
    )

    const matchedCategory = modalActivityCategories.find((category) => String(category.id) === groupId)
    if (matchedCategory) {
      setSelectedActivityCategoryId(String(matchedCategory.id))
      void getActivityCategoryById(matchedCategory.id).catch(() => undefined)
    } else {
      setSelectedActivityCategoryId('')
    }

    setIsAddGoalModalOpen(true)
  }

  const handleConfirmGoalModal = async () => {
    const selectedCategory = modalActivityCategories.find((category) => String(category.id) === selectedActivityCategoryId)
    const resolvedGoalCategory =
      goalCategory || (selectedCategory ? (resolveGoalCategoryId(selectedCategory.label) ?? 'other') : '')
    const selectedCategoryId = Number(selectedActivityCategoryId)
    const isCustomFrequency = goalFrequency === 'custom'
    const startDate = customDateRange?.[0]?.format('YYYY-MM-DD')
    const endDate = customDateRange?.[1]?.format('YYYY-MM-DD')

    if (!goalName.trim()) {
      message.error('Please enter activity name')
      return
    }

    if (!selectedCategoryId || !Number.isFinite(selectedCategoryId)) {
      message.error('Please choose a category')
      return
    }

    if (!goalFrequency) {
      message.error('Please choose frequency')
      return
    }

    if (isCustomFrequency && (!startDate || !endDate)) {
      message.error('Please choose start and end date for custom frequency')
      return
    }

    if (!resolvedGoalCategory) {
      return
    }

    const difficulty: GoalDifficulty = goalDifficulty || 'easy'
    const numericPoints = resolveNumericPointsFromDifficulty(difficulty)

    if (goalModalMode === 'edit' && editingGoalRef) {
      const storedProfile = getStoredUserProfile()
      const userId = Number(storedProfile.userId)
      const oldKey = `${editingGoalRef.groupId}:${editingGoalRef.itemId}`
      const newKey = `${selectedCategoryId}:${editingGoalRef.itemId}`

      if (!Number.isFinite(userId) || userId <= 0) {
        message.error('User id is required before editing a goal')
        return
      }

      try {
        setIsSavingGoal(true)
        const response = await updateUserGoalById(editingGoalRef.itemId, {
          user_id: userId,
          category_id: selectedCategoryId,
          title: goalName.trim(),
          description: goalDescription.trim(),
          difficulty,
          points: numericPoints,
          is_active: true,
          frequency_type: goalFrequency,
          start_date: isCustomFrequency ? startDate : undefined,
          end_date: isCustomFrequency ? endDate : undefined,
        })

        setUserGoals((prev) =>
          prev.map((goal) =>
            String(goal.id) === editingGoalRef.itemId
              ? {
                  ...goal,
                  ...response,
                  id: goal.id,
                  user_id: userId,
                  category_id: selectedCategoryId,
                  title: goalName.trim(),
                  description: goalDescription.trim(),
                  difficulty,
                  points: numericPoints,
                  is_active: true,
                  frequency_type: goalFrequency,
                  start_date: isCustomFrequency ? startDate : undefined,
                  end_date: isCustomFrequency ? endDate : undefined,
                }
              : goal,
          ),
        )

        if (oldKey !== newKey) {
          setCheckedGoals((prev) => {
            const next = { ...prev, [newKey]: Boolean(prev[oldKey]) }
            delete next[oldKey]
            return next
          })
        }

        setIsAddGoalModalOpen(false)
        message.success(response.message || 'Goal updated successfully')
      } catch (error) {
        if (error instanceof ApiError) {
          message.error(error.message || 'Unable to update goal')
        } else {
          message.error('Unable to update goal')
        }
      } finally {
        setIsSavingGoal(false)
      }

      return
    } else {
      const storedProfile = getStoredUserProfile()
      const userId = Number(storedProfile.userId)

      if (!Number.isFinite(userId) || userId <= 0) {
        message.error('User id is required before adding a goal')
        return
      }

      const nowIso = new Date().toISOString()

      try {
        setIsSavingGoal(true)
        const response = await createUserGoal({
          id: 0,
          user_id: userId,
          category_id: selectedCategoryId,
          title: goalName.trim(),
          description: goalDescription.trim(),
          difficulty,
          points: numericPoints,
          is_active: true,
          frequency_type: goalFrequency,
          start_date: isCustomFrequency ? startDate : undefined,
          end_date: isCustomFrequency ? endDate : undefined,
          create_date: nowIso,
          update_date: nowIso,
        })

        const createdGoalId = typeof response.id === 'number' ? response.id : Date.now()
        const newGoalId = String(createdGoalId)
        setUserGoals((prev) => [
          ...prev,
          {
            ...response,
            id: createdGoalId,
            user_id: userId,
            category_id: selectedCategoryId,
            title: goalName.trim(),
            description: goalDescription.trim(),
            difficulty,
            points: numericPoints,
            is_active: true,
            frequency_type: goalFrequency,
            start_date: isCustomFrequency ? startDate : undefined,
            end_date: isCustomFrequency ? endDate : undefined,
            create_date: nowIso,
            update_date: nowIso,
          },
        ])
        setCheckedGoals((prev) => ({ ...prev, [`${selectedCategoryId}:${newGoalId}`]: false }))
        setIsAddGoalModalOpen(false)
        message.success(response.message || 'Goal added successfully')
      } catch (error) {
        if (error instanceof ApiError) {
          message.error(error.message || 'Unable to add goal')
        } else {
          message.error('Unable to add goal')
        }
      } finally {
        setIsSavingGoal(false)
      }

      return
    }

    setIsAddGoalModalOpen(false)
  }

  const handleDeleteGoal = async () => {
    if (goalModalMode !== 'edit' || !editingGoalRef) {
      return
    }

    const deleteKey = `${editingGoalRef.groupId}:${editingGoalRef.itemId}`

    try {
      setIsDeletingGoal(true)
      const response = await deleteUserGoalById(editingGoalRef.itemId)
      setUserGoals((prev) => prev.filter((goal) => String(goal.id) !== editingGoalRef.itemId))
      setCheckedGoals((prev) => {
        const next = { ...prev }
        delete next[deleteKey]
        return next
      })
      setIsDeleteGoalModalOpen(false)
      setIsAddGoalModalOpen(false)
      message.success(response.message || 'Goal deleted successfully')
    } catch (error) {
      if (error instanceof ApiError) {
        message.error(error.message || 'Unable to delete goal')
      } else {
        message.error('Unable to delete goal')
      }
    } finally {
      setIsDeletingGoal(false)
    }
  }

  return (
    <div className="progress-page">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="progress-main">
        {activeTab === 'progress' ? (
          <section className="progress-card">
            <div className="progress-head-row">
              <h1 className="progress-greeting">
                Hello!
                <br />
                {username}
              </h1>
              <p className="progress-date">{currentDate}</p>
            </div>

            {currentPet ? (
              <>
                <div className="progress-pet-stage">
                  <img src={activePetImage} alt={`${currentPet} pet`} className="progress-pet-image" />
                </div>

                <div className="progress-level-section">
                  <h2 className="progress-level-title">YOUR LEVEL</h2>
                  <div className="progress-level-row">
                    <span className="progress-level-label">Level {safeLevel}</span>
                    <div
                      className="progress-level-track"
                      role="progressbar"
                      aria-valuenow={safeExp}
                      aria-valuemin={0}
                      aria-valuemax={LEVEL_PROGRESS_MAX}
                    >
                      <span className="progress-level-fill" style={{ width: `${levelProgressPercent}%` }} />
                    </div>
                    <span className="progress-level-value">
                      {currentLevelExp}/{LEVEL_PROGRESS_MAX}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="progress-action">
                <Button type="primary" className="progress-pet-btn" onClick={handleOpenPetModal}>
                  START YOUR PROGRESS
                </Button>
              </div>
            )}
          </section>
        ) : activeTab === 'goals' ? (
          <section className="goals-tab">
            <h1 className="goals-heading">YOUR GOALS TODAY!</h1>

            <div className="goals-scroll" role="region" aria-label="Goals cards">
              {isGoalsLoading ? <p className="user-status">Loading goals...</p> : null}
              {!isGoalsLoading && goalGroupsState.length === 0 ? <p className="user-status">No goals found.</p> : null}
              {goalGroupsState.map((group) => (
                <article className="goal-card" key={group.id}>
                  <h2 className="goal-card-title">{group.title}</h2>

                  <ul className="goal-list">
                    {group.items.map((item) => {
                      const key = `${group.id}:${item.id}`
                      const checked = Boolean(checkedGoals[key])
                      const isUpdatingHistory = Boolean(updatingGoalHistoryKeys[key])

                      return (
                        <li className="goal-item" key={item.id}>
                          <label className="goal-check-wrap">
                            <input
                              type="checkbox"
                              className="goal-checkbox"
                              checked={checked}
                              disabled={isUpdatingHistory}
                              onChange={(event) => void handleToggleGoalHistory(item.id, group.id, event.target.checked)}
                            />
                            <span className={`goal-text${checked ? ' goal-text-done' : ''}`}>
                              {item.label}
                              <button
                                type="button"
                                className="goal-edit-btn"
                                onClick={(event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  handleOpenEditGoalModal(group.id, item.id)
                                }}
                                aria-label={`Edit ${item.label}`}
                              >
                                <EditOutlined />
                              </button>
                            </span>
                          </label>
                          <span className="goal-points">{item.points}</span>
                          {item.note ? <p className="goal-note">{item.note}</p> : null}
                        </li>
                      )
                    })}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section className="stats-tab">
            <h1 className="stats-heading">STATISTICS</h1>

            <div className="stats-filters">
              <label className="stats-select-wrap">
                <select
                  className="stats-select"
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                >
                  {modalActivityCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="stats-select-wrap">
                <select
                  className="stats-select"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                >
                  {availableMonths.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </label>
              <label className="stats-select-wrap">
                <select
                  className="stats-select"
                  value={selectedYear}
                  onChange={(event) => {
                    const year = Number(event.target.value)
                    setSelectedYear(year)
                    const nextMonths = year < currentYear ? monthOptions : monthOptions.slice(0, currentMonthIndex + 1)
                    if (!nextMonths.includes(selectedMonth)) {
                      setSelectedMonth(nextMonths[nextMonths.length - 1])
                    }
                  }}
                >
                  <option value={currentYear}>{currentYear}</option>
                  <option value={currentYear - 1}>{currentYear - 1}</option>
                  <option value={currentYear - 2}>{currentYear - 2}</option>
                </select>
              </label>
              <button type="button" className="stats-search-btn" onClick={() => void handleSearchStats()} disabled={isStatsLoading}>
                {isStatsLoading ? 'loading...' : 'search'}
              </button>
            </div>

            <article className="stats-card">
              <div className="stats-card-head">
                <h2 className="stats-card-title">{categoryLabel}</h2>
                <p className="stats-card-period">
                  {appliedMonth} {appliedYear}
                </p>
              </div>

              <div className="stats-chart-wrap">
                <div className="stats-chart-legend">
                  <button
                    type="button"
                    className={`stats-mode-bullet${statsMode === 'daily' ? ' stats-mode-bullet-active' : ''}`}
                    onClick={() => setStatsMode('daily')}
                  >
                    <i className="stats-legend-dot stats-legend-dot-day" />
                    Daily
                  </button>
                  <button
                    type="button"
                    className={`stats-mode-bullet${statsMode === 'weekly' ? ' stats-mode-bullet-active' : ''}`}
                    onClick={() => setStatsMode('weekly')}
                  >
                    <i className="stats-legend-dot stats-legend-dot-week" />
                    Weekly
                  </button>
                  <button
                    type="button"
                    className={`stats-mode-bullet${statsMode === 'monthly' ? ' stats-mode-bullet-active' : ''}`}
                    onClick={() => setStatsMode('monthly')}
                  >
                    <i className="stats-legend-dot stats-legend-dot-month" />
                    Monthly
                  </button>
                </div>

                <div className="stats-chart">
                  <svg viewBox="0 0 760 300" className="stats-chart-svg" role="img" aria-label="Progress graph">
                    <line x1="60" y1="30" x2="60" y2="250" className="stats-axis" />
                    <line x1="60" y1="250" x2="730" y2="250" className="stats-axis" />

                    <line x1="60" y1="200" x2="730" y2="200" className="stats-grid-line" />
                    <line x1="60" y1="150" x2="730" y2="150" className="stats-grid-line" />
                    <line x1="60" y1="100" x2="730" y2="100" className="stats-grid-line" />

                    {hasSearchedStats ? (
                      <polyline
                        points={createPolylinePoints(activeStatsSeries)}
                        className={
                          statsMode === 'daily'
                            ? 'stats-line-day'
                            : statsMode === 'weekly'
                              ? 'stats-line-week'
                              : 'stats-line-month'
                        }
                      />
                    ) : null}

                    {hasSearchedStats
                      ? createChartPoints(activeStatsSeries).map((point, index) => (
                          <circle
                            key={`${statsMode}-${index}`}
                            cx={point.x}
                            cy={point.y}
                            r="4"
                            className={
                              statsMode === 'daily'
                                ? 'stats-point-day'
                                : statsMode === 'weekly'
                                  ? 'stats-point-week'
                                  : 'stats-point-month'
                            }
                          />
                        ))
                      : null}

                    {activeStatsLabels.map((label, index) => {
                      const xStart = 90
                      const xEnd = 710
                      const xStep = activeStatsLabels.length > 1 ? (xEnd - xStart) / (activeStatsLabels.length - 1) : 0
                      return (
                        <text key={`${statsMode}-${label}-${index}`} x={xStart + xStep * index} y="274" className="stats-x-label">
                          {label}
                        </text>
                      )
                    })}

                    <text x="48" y="250" className="stats-y-label">
                      {Math.round(yAxisTicks[0])}
                    </text>
                    <text x="48" y="200" className="stats-y-label">
                      {Math.round(yAxisTicks[1])}
                    </text>
                    <text x="48" y="150" className="stats-y-label">
                      {Math.round(yAxisTicks[2])}
                    </text>
                    <text x="48" y="100" className="stats-y-label">
                      {Math.round(yAxisTicks[3])}
                    </text>
                    <text x="48" y="30" className="stats-y-label">
                      {Math.round(yAxisTicks[4])}
                    </text>
                  </svg>
                </div>

              </div>
            </article>
          </section>
        )}
      </main>
      <Footer onAddGoal={handleOpenAddGoalModal} />
      {isAddGoalModalOpen ? (
        <div className="goal-modal-overlay" role="dialog" aria-modal="true" aria-label="Add your goal">
          <div className="goal-modal-card">
            <button
              type="button"
              className="goal-modal-close"
              onClick={() => setIsAddGoalModalOpen(false)}
              aria-label="Close dialog"
              disabled={isSavingGoal || isDeletingGoal}
            >
              <CloseOutlined />
            </button>
            <h2 className="goal-modal-title">{goalModalMode === 'edit' ? 'EDIT GOAL' : 'ADD GOAL'}</h2>

            <div className="goal-modal-field">
              <label htmlFor="goal-category" className="goal-modal-label">
                Choose category
              </label>
              <select
                id="goal-category"
                className={`goal-modal-select goal-modal-select-wide${selectedActivityCategoryId === '' ? ' goal-modal-select-empty' : ''}`}
                value={selectedActivityCategoryId}
                onChange={(event) => {
                  const selectedId = event.target.value
                  setSelectedActivityCategoryId(selectedId)
                  const selectedCategory = modalActivityCategories.find((category) => String(category.id) === selectedId)
                  setGoalCategory(selectedCategory ? (resolveGoalCategoryId(selectedCategory.label) ?? 'other') : '')
                }}
              >
                <option value="" disabled>
                  Select category
                </option>
                {modalActivityCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="goal-modal-field">
              <label htmlFor="goal-name" className="goal-modal-label">
                Activity name
              </label>
              <input
                id="goal-name"
                className="goal-modal-input"
                type="text"
                value={goalName}
                onChange={(event) => setGoalName(event.target.value)}
                placeholder="Type activity name"
              />
            </div>

            <div className="goal-modal-field">
              <label htmlFor="goal-difficulty" className="goal-modal-label">
                Choose difficulty
              </label>
              <select
                id="goal-difficulty"
                className={`goal-modal-select${goalDifficulty === '' ? ' goal-modal-select-empty' : ''}`}
                value={goalDifficulty}
                onChange={(event) => setGoalDifficulty(event.target.value as '' | 'easy' | 'medium' | 'hard')}
              >
                <option value="" disabled>
                  Select difficulty
                </option>
                <option value="easy">Easy (+10 pts)</option>
                <option value="medium">Medium (+20 pts)</option>
                <option value="hard">Hard (+30 pts)</option>
              </select>
            </div>

            <div className="goal-modal-field">
              <label htmlFor="goal-frequency" className="goal-modal-label">
                Choose frequency
              </label>
              <select
                id="goal-frequency"
                className={`goal-modal-select goal-modal-select-wide${goalFrequency === '' ? ' goal-modal-select-empty' : ''}`}
                value={goalFrequency}
                onChange={(event) => setGoalFrequency(event.target.value as '' | GoalFrequency)}
              >
                <option value="" disabled>
                  Select frequency
                </option>
                <option value="daily">Daily</option>
                <option value="weekday">Weekday</option>
                <option value="weekend">Weekend</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {goalFrequency === 'custom' ? (
              <div className="goal-modal-field">
                <label className="goal-modal-label" htmlFor="goal-custom-range">
                  Choose date
                </label>
                <RangePicker
                  id="goal-custom-range"
                  className="goal-modal-range-picker"
                  value={customDateRange}
                  onChange={(dates) => setCustomDateRange(dates)}
                  format="DD/MM/YYYY"
                  placeholder={['Start date', 'End date']}
                />
              </div>
            ) : null}

            <div className="goal-modal-field">
              <div className="goal-modal-description-head">
                <label htmlFor="goal-description" className="goal-modal-label">
                  Description
                </label>
                <span className="goal-modal-counter">{goalDescription.length}/50</span>
              </div>
              <textarea
                id="goal-description"
                className="goal-modal-textarea"
                maxLength={50}
                value={goalDescription}
                onChange={(event) => setGoalDescription(event.target.value)}
                placeholder="Type description"
              />
            </div>

            <div className="goal-modal-actions">
              <button type="button" className="goal-modal-cancel-btn" onClick={() => setIsAddGoalModalOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="goal-modal-confirm-btn"
                onClick={() => void handleConfirmGoalModal()}
                disabled={isSavingGoal || isDeletingGoal}
              >
                {isSavingGoal ? 'Saving...' : 'Confirm'}
              </button>
            </div>

            {goalModalMode === 'edit' ? (
              <button
                type="button"
                className="goal-modal-delete-btn"
                onClick={() => setIsDeleteGoalModalOpen(true)}
                aria-label="Delete goal"
                disabled={isSavingGoal || isDeletingGoal}
              >
                <DeleteOutlined />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      <Modal
        open={isDeleteGoalModalOpen}
        footer={null}
        closable={false}
        centered
        width={380}
        maskClosable={!isDeletingGoal}
        onCancel={() => {
          if (!isDeletingGoal) {
            setIsDeleteGoalModalOpen(false)
          }
        }}
        className="user-delete-modal"
      >
        <div className="user-delete-modal-body">
          <button
            type="button"
            className="user-delete-modal-close"
            onClick={() => setIsDeleteGoalModalOpen(false)}
            disabled={isDeletingGoal}
            aria-label="Close dialog"
          >
            <CloseOutlined />
          </button>

          <h2 className="user-delete-modal-title">
            Do you really want to
            <br />
            <span className="user-delete-modal-danger">delete</span> this goal?
          </h2>

          <div className="user-delete-modal-actions">
            <button
              type="button"
              className="user-delete-modal-confirm"
              onClick={() => void handleDeleteGoal()}
              disabled={isDeletingGoal}
            >
              {isDeletingGoal ? '...' : 'YES'}
            </button>
            <button
              type="button"
              className="user-delete-modal-cancel"
              onClick={() => setIsDeleteGoalModalOpen(false)}
              disabled={isDeletingGoal}
            >
              CANCEL
            </button>
          </div>
        </div>
      </Modal>
      {activeTab === 'progress' && isPetModalOpen ? (
        <div className="pet-modal-overlay" role="dialog" aria-modal="true" aria-label="Choose your pet">
          <div className="pet-modal-card">
            <div className="pet-option-list">
              <label className={`pet-option${selectedPet === 'bird' ? ' pet-option-active' : ''}`}>
                <input
                  type="radio"
                  name="pet"
                  value="bird"
                  checked={selectedPet === 'bird'}
                  onChange={() => setSelectedPet('bird')}
                />
                <img src={petImagesByLevel.bird[3]} alt="Bird pet" className="pet-option-image" />
              </label>

              <label className={`pet-option${selectedPet === 'cat' ? ' pet-option-active' : ''}`}>
                <input
                  type="radio"
                  name="pet"
                  value="cat"
                  checked={selectedPet === 'cat'}
                  onChange={() => setSelectedPet('cat')}
                />
                <img src={petImagesByLevel.cat[3]} alt="Cat pet" className="pet-option-image" />
              </label>
            </div>

            <div className="pet-modal-actions">
              <button type="button" className="pet-cancel-btn" onClick={() => setIsPetModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="pet-confirm-btn" onClick={handleConfirmPet}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default ProgressPage
