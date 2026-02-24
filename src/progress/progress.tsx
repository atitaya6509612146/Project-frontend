import { useMemo, useState } from 'react'
import { Button, DatePicker } from 'antd'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import Header, { type HomeTab } from '../components/header'
import Footer from '../components/footer'
import birdImage from '../assets/bird.png'
import catImage from '../assets/cat.png'
import './progress.css'

type GoalItem = {
  id: string
  label: string
  points: string
  checked?: boolean
  note?: string
}

type GoalGroup = {
  id: string
  title: string
  items: GoalItem[]
}

const goalGroups: GoalGroup[] = [
  {
    id: 'education',
    title: 'Education',
    items: [
      { id: 'book', label: 'Read a book', points: '+20 pts', checked: true, note: 'A HTML book for the exam next week TT' },
      { id: 'homework', label: 'Do homework', points: '+20 pts' },
      { id: 'pencil', label: 'Buy a pencil', points: '+10 pts' },
      { id: 'piano', label: 'Practice piano', points: '+30 pts' },
    ],
  },
  {
    id: 'health',
    title: 'Health & Wellness',
    items: [
      { id: 'meditate', label: 'Meditating', points: '+20 pts' },
      { id: 'run', label: 'Run 10 km', points: '+20 pts', checked: true },
      { id: 'swim', label: 'Swimming', points: '+20 pts' },
    ],
  },
  {
    id: 'other',
    title: 'Others',
    items: [
      { id: 'water', label: 'Drink 8 glasses', points: '+15 pts' },
      { id: 'sleep', label: 'Sleep before 11 PM', points: '+10 pts' },
      { id: 'walk', label: '30 minute walk', points: '+20 pts' },
    ],
  },
]

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
const PET_STORAGE_KEY = 'selectedPet'
type GoalFrequency = 'everyday' | 'every-week' | 'monthly' | 'weekend-only' | 'weekday-only' | 'custom'
type GoalDifficulty = 'easy' | 'medium' | 'hard'
type GoalModalMode = 'add' | 'edit'
type EditingGoalRef = { groupId: string; itemId: string } | null
const { RangePicker } = DatePicker

function ProgressPage() {
  const [activeTab, setActiveTab] = useState<HomeTab>('progress')
  const [isPetModalOpen, setIsPetModalOpen] = useState(false)
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false)
  const [goalModalMode, setGoalModalMode] = useState<GoalModalMode>('add')
  const [editingGoalRef, setEditingGoalRef] = useState<EditingGoalRef>(null)
  const [selectedPet, setSelectedPet] = useState<PetType>('bird')
  const [goalCategory, setGoalCategory] = useState<'' | 'education' | 'health' | 'other'>('')
  const [goalName, setGoalName] = useState('')
  const [goalDifficulty, setGoalDifficulty] = useState<'' | GoalDifficulty>('')
  const [goalDescription, setGoalDescription] = useState('')
  const [goalFrequency, setGoalFrequency] = useState<'' | GoalFrequency>('')
  const [customDateRange, setCustomDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [goalGroupsState, setGoalGroupsState] = useState<GoalGroup[]>(goalGroups)
  const [currentPet, setCurrentPet] = useState<PetType | null>(() => {
    if (typeof window === 'undefined') {
      return null
    }
    const savedPet = window.localStorage.getItem(PET_STORAGE_KEY)
    return savedPet === 'bird' || savedPet === 'cat' ? savedPet : null
  })
  const [checkedGoals, setCheckedGoals] = useState<Record<string, boolean>>(
    Object.fromEntries(
      goalGroups.flatMap((group) => group.items.map((item) => [`${group.id}:${item.id}`, Boolean(item.checked)])),
    ),
  )

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
  const [selectedCategory, setSelectedCategory] = useState<'health' | 'education' | 'other'>('health')
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [selectedMonth, setSelectedMonth] = useState<string>(monthOptions[currentMonthIndex])
  const [appliedCategory, setAppliedCategory] = useState<'health' | 'education' | 'other'>('health')
  const [appliedYear, setAppliedYear] = useState<number>(currentYear)
  const [appliedMonth, setAppliedMonth] = useState<string>(monthOptions[currentMonthIndex])
  const availableMonths = selectedYear < currentYear ? monthOptions : monthOptions.slice(0, currentMonthIndex + 1)
  const categoryLabel =
    appliedCategory === 'health' ? 'Health & Wellness' : appliedCategory === 'education' ? 'Education' : 'Others'
  const activePetImage = currentPet === 'cat' ? catImage : birdImage

  const handleOpenPetModal = () => {
    setSelectedPet(currentPet ?? 'bird')
    setIsPetModalOpen(true)
  }

  const handleConfirmPet = () => {
    setCurrentPet(selectedPet)
    window.localStorage.setItem(PET_STORAGE_KEY, selectedPet)
    setIsPetModalOpen(false)
  }

  const handleSearchStats = () => {
    setAppliedCategory(selectedCategory)
    setAppliedYear(selectedYear)
    setAppliedMonth(selectedMonth)
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

  const resolvePointsFromDifficulty = (difficulty: GoalDifficulty): string =>
    difficulty === 'hard' ? '+30 pts' : difficulty === 'medium' ? '+20 pts' : '+10 pts'

  const handleOpenAddGoalModal = () => {
    setGoalModalMode('add')
    setEditingGoalRef(null)
    setGoalCategory('')
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
    setGoalCategory(groupId as '' | 'education' | 'health' | 'other')
    setGoalName(targetItem.label)
    setGoalDifficulty(resolveDifficultyFromPoints(targetItem.points))
    setGoalDescription(targetItem.note ?? '')
    setGoalFrequency('')
    setCustomDateRange(null)
    setIsAddGoalModalOpen(true)
  }

  const handleConfirmGoalModal = () => {
    if (!goalCategory || !goalName.trim()) {
      return
    }

    const difficulty: GoalDifficulty = goalDifficulty || 'easy'
    const updatedItemFields = {
      label: goalName.trim(),
      points: resolvePointsFromDifficulty(difficulty),
      note: goalDescription.trim() || undefined,
    }

    if (goalModalMode === 'edit' && editingGoalRef) {
      const oldKey = `${editingGoalRef.groupId}:${editingGoalRef.itemId}`
      const newKey = `${goalCategory}:${editingGoalRef.itemId}`

      setGoalGroupsState((prev) => {
        let originalItem: GoalItem | null = null
        const withoutOld = prev.map((group) => {
          if (group.id !== editingGoalRef.groupId) {
            return group
          }
          return {
            ...group,
            items: group.items.filter((item) => {
              if (item.id === editingGoalRef.itemId) {
                originalItem = item
                return false
              }
              return true
            }),
          }
        })

        if (!originalItem) {
          return prev
        }

        const baseItem = originalItem as GoalItem
        const updatedItem: GoalItem = { ...baseItem, ...updatedItemFields }
        return withoutOld.map((group) =>
          group.id === goalCategory ? { ...group, items: [...group.items, updatedItem] } : group,
        )
      })

      if (oldKey !== newKey) {
        setCheckedGoals((prev) => {
          const next = { ...prev, [newKey]: Boolean(prev[oldKey]) }
          delete next[oldKey]
          return next
        })
      }
    } else {
      const newGoalId = `goal-${Date.now()}`
      const newGoal: GoalItem = {
        id: newGoalId,
        ...updatedItemFields,
      }
      setGoalGroupsState((prev) =>
        prev.map((group) => (group.id === goalCategory ? { ...group, items: [...group.items, newGoal] } : group)),
      )
      setCheckedGoals((prev) => ({ ...prev, [`${goalCategory}:${newGoalId}`]: false }))
    }

    setIsAddGoalModalOpen(false)
  }

  const handleDeleteGoal = () => {
    if (goalModalMode !== 'edit' || !editingGoalRef) {
      return
    }

    const deleteKey = `${editingGoalRef.groupId}:${editingGoalRef.itemId}`

    setGoalGroupsState((prev) =>
      prev.map((group) =>
        group.id === editingGoalRef.groupId
          ? { ...group, items: group.items.filter((item) => item.id !== editingGoalRef.itemId) }
          : group,
      ),
    )
    setCheckedGoals((prev) => {
      const next = { ...prev }
      delete next[deleteKey]
      return next
    })
    setIsAddGoalModalOpen(false)
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
                Nan
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
                    <span className="progress-level-label">Level 1</span>
                    <div className="progress-level-track" role="progressbar" aria-valuenow={60} aria-valuemin={0} aria-valuemax={100}>
                      <span className="progress-level-fill" />
                    </div>
                    <span className="progress-level-value">60/100</span>
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
              {goalGroupsState.map((group) => (
                <article className="goal-card" key={group.id}>
                  <h2 className="goal-card-title">{group.title}</h2>

                  <ul className="goal-list">
                    {group.items.map((item) => {
                      const key = `${group.id}:${item.id}`
                      const checked = Boolean(checkedGoals[key])

                      return (
                        <li className="goal-item" key={item.id}>
                          <label className="goal-check-wrap">
                            <input
                              type="checkbox"
                              className="goal-checkbox"
                              checked={checked}
                              onChange={(event) =>
                                setCheckedGoals((prev) => ({ ...prev, [key]: event.target.checked }))
                              }
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
                  onChange={(event) => setSelectedCategory(event.target.value as 'health' | 'education' | 'other')}
                >
                  <option value="health">Health &amp; Wellness</option>
                  <option value="education">Education</option>
                  <option value="other">Others</option>
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
              <button type="button" className="stats-search-btn" onClick={handleSearchStats}>
                search
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
                  <span className="stats-legend-item">
                    <i className="stats-legend-dot stats-legend-dot-day" />
                    per Day
                  </span>
                  <span className="stats-legend-item">
                    <i className="stats-legend-dot stats-legend-dot-week" />
                    per Week
                  </span>
                  <span className="stats-legend-item">
                    <i className="stats-legend-dot stats-legend-dot-month" />
                    per Month
                  </span>
                </div>

                <div className="stats-chart">
                  <svg viewBox="0 0 760 300" className="stats-chart-svg" role="img" aria-label="Progress graph">
                    <line x1="60" y1="30" x2="60" y2="250" className="stats-axis" />
                    <line x1="60" y1="250" x2="730" y2="250" className="stats-axis" />

                    <line x1="60" y1="200" x2="730" y2="200" className="stats-grid-line" />
                    <line x1="60" y1="150" x2="730" y2="150" className="stats-grid-line" />
                    <line x1="60" y1="100" x2="730" y2="100" className="stats-grid-line" />

                    <polyline points="90,180 250,160 410,145 570,135 710,120" className="stats-line-day" />
                    <polyline points="90,210 250,188 410,176 570,170 710,162" className="stats-line-week" />
                    <polyline points="90,225 250,215 410,208 570,202 710,195" className="stats-line-month" />
                    <circle cx="90" cy="180" r="4" className="stats-point-day" />
                    <circle cx="250" cy="160" r="4" className="stats-point-day" />
                    <circle cx="410" cy="145" r="4" className="stats-point-day" />
                    <circle cx="570" cy="135" r="4" className="stats-point-day" />
                    <circle cx="710" cy="120" r="4" className="stats-point-day" />
                    <circle cx="90" cy="210" r="4" className="stats-point-week" />
                    <circle cx="250" cy="188" r="4" className="stats-point-week" />
                    <circle cx="410" cy="176" r="4" className="stats-point-week" />
                    <circle cx="570" cy="170" r="4" className="stats-point-week" />
                    <circle cx="710" cy="162" r="4" className="stats-point-week" />
                    <circle cx="90" cy="225" r="4" className="stats-point-month" />
                    <circle cx="250" cy="215" r="4" className="stats-point-month" />
                    <circle cx="410" cy="208" r="4" className="stats-point-month" />
                    <circle cx="570" cy="202" r="4" className="stats-point-month" />
                    <circle cx="710" cy="195" r="4" className="stats-point-month" />

                    <text x="90" y="274" className="stats-x-label">
                      W1
                    </text>
                    <text x="250" y="274" className="stats-x-label">
                      W2
                    </text>
                    <text x="410" y="274" className="stats-x-label">
                      W3
                    </text>
                    <text x="570" y="274" className="stats-x-label">
                      W4
                    </text>
                    <text x="710" y="274" className="stats-x-label">
                      W5
                    </text>

                    <text x="48" y="250" className="stats-y-label">
                      0
                    </text>
                    <text x="48" y="200" className="stats-y-label">
                      25
                    </text>
                    <text x="48" y="150" className="stats-y-label">
                      50
                    </text>
                    <text x="48" y="100" className="stats-y-label">
                      75
                    </text>
                    <text x="48" y="30" className="stats-y-label">
                      100
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
            <h2 className="goal-modal-title">{goalModalMode === 'edit' ? 'EDIT GOAL' : 'ADD GOAL'}</h2>

            <div className="goal-modal-field">
              <label htmlFor="goal-category" className="goal-modal-label">
                Choose category
              </label>
              <select
                id="goal-category"
                className={`goal-modal-select goal-modal-select-wide${goalCategory === '' ? ' goal-modal-select-empty' : ''}`}
                value={goalCategory}
                onChange={(event) => setGoalCategory(event.target.value as '' | 'education' | 'health' | 'other')}
              >
                <option value="" disabled>
                  Select category
                </option>
                <option value="education">Education</option>
                <option value="health">Health &amp; Wellness</option>
                <option value="other">Others</option>
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
                <option value="everyday">Everyday</option>
                <option value="weekday-only">Weekday only</option>
                <option value="weekend-only">Weekend only</option>
                <option value="every-week">Every Week</option>
                <option value="monthly">Monthly</option>
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
              <button type="button" className="goal-modal-confirm-btn" onClick={handleConfirmGoalModal}>
                Confirm
              </button>
            </div>

            {goalModalMode === 'edit' ? (
              <button type="button" className="goal-modal-delete-btn" onClick={handleDeleteGoal} aria-label="Delete goal">
                <DeleteOutlined />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
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
                <img src={birdImage} alt="Bird pet" className="pet-option-image" />
              </label>

              <label className={`pet-option${selectedPet === 'cat' ? ' pet-option-active' : ''}`}>
                <input
                  type="radio"
                  name="pet"
                  value="cat"
                  checked={selectedPet === 'cat'}
                  onChange={() => setSelectedPet('cat')}
                />
                <img src={catImage} alt="Cat pet" className="pet-option-image" />
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
