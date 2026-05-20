import { getStoredAuthToken } from './lib/user-profile'

// ประเภทข้อมูลและตัวเลือก fetch กลางที่ helper API ด้านล่างใช้ร่วมกัน
export type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: HeadersInit
}

// รูปแบบ error กลางของ API พร้อม status และ payload ที่ parse แล้ว
export class ApiError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

type ApiMessageResponse = {
  message?: string
}

export type LoginPayload = {
  username: string
  password: string
}

export type LoginResponse = ApiMessageResponse & {
  success?: boolean
  id?: string | number
  userId?: string | number
  username?: string
  token?: string
  level?: number
  exp?: number
  [key: string]: unknown
}

export type UserResponse = {
  id?: string | number
  email?: string
  username?: string
  password?: string
  pets?: string
  level?: number
  exp?: number
  [key: string]: unknown
}

export type UserPetsResponse = ApiMessageResponse & {
  pets?: string
  pet?: string
  [key: string]: unknown
}

export type UpdateUserPetsPayload = {
  pets: string
}

export type UserStreakResponse = ApiMessageResponse & {
  id?: number
  user_id?: number
  streak_count?: number
  best_streak?: number
  last_completed_date?: string
  updated_at?: string
  [key: string]: unknown
}

export type ActivityCategoryResponse = {
  id: number
  category_name: string
  category_name_th?: string
}

export type CreateUserGoalPayload = {
  id: number
  user_id: number
  category_id: number
  title: string
  description: string
  difficulty: string
  points: number
  is_active: boolean
  frequency_type: string
  start_date?: string
  end_date?: string
  create_date: string
  update_date: string
}

export type UpdateUserGoalPayload = {
  user_id: number
  category_id: number
  title: string
  description: string
  difficulty: string
  points: number
  is_active: boolean
  frequency_type: string
  start_date?: string
  end_date?: string
}

export type UserGoalResponse = ApiMessageResponse & {
  id?: number
  user_id?: number
  category_id?: number
  title?: string
  description?: string
  difficulty?: string
  points?: number
  is_active?: boolean
  frequency_type?: string
  start_date?: string
  end_date?: string
  is_completed_today?: boolean
  is_completed?: boolean
  create_date?: string
  update_date?: string
  [key: string]: unknown
}

export type GoalHistoryResponse = ApiMessageResponse & {
  id?: number
  goal_id?: number
  user_id?: number
  finish_date?: string
  is_completed?: boolean
  create_date?: string
  update_date?: string
  [key: string]: unknown
}

export type GoalHistoryChartParams = {
  userid: string | number
  year: string | number
  month: string | number
  categoryid?: string | number
}

export type GoalHistoryChartResponse = {
  [key: string]: unknown
} | unknown[]

export type CreateGoalHistoryPayload = {
  id?: number
  goal_id: number
  user_id: number
  finish_date?: string
  is_completed: boolean
  create_date?: string
  update_date?: string
}

export type UpdateGoalHistoryPayload = {
  goal_id: number
  user_id: number
  finish_date: string
  is_completed: boolean
}

export type UpdateUserPayload = {
  email: string
  username: string
  password: string
  level: number
  exp: number
}

export type CreateUserPayload = {
  email: string
  username: string
  password: string
  level: number
  exp: number
}

const API_BASE_URL = 'http://localhost:5057'

const buildUrl = (path: string) => `${API_BASE_URL}${path}`

// สร้าง query string สำหรับ GET endpoint ที่มี filter parameters
const buildPathWithParams = (path: string, params: Record<string, string | number>) => {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    searchParams.set(key, String(value))
  })

  return `${path}?${searchParams.toString()}`
}

// wrapper กลางของ fetch: ใส่ token/header/body, parse response และโยน ApiError เมื่อ request ล้มเหลว
export const apiRequest = async <TResponse>(
  path: string,
  { method = 'GET', body, headers }: ApiRequestOptions = {},
): Promise<TResponse> => {
  const token = getStoredAuthToken()

  const response = await fetch(buildUrl(path), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).catch(() => {
    throw new ApiError('Unable to connect to API service', 0, null)
  })

  let payload: unknown = null
  const contentType = response.headers.get('content-type') || ''

  if (response.status !== 204) {
    try {
      if (contentType.includes('application/json')) {
        payload = await response.json()
      } else {
        const text = await response.text()
        payload = text ? { message: text } : null
      }
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string'
        ? payload.message
        : 'Request failed'

    throw new ApiError(message, response.status, payload)
  }

  return ((payload ?? {}) as TResponse)
}

// endpoint สำหรับ auth และบัญชีผู้ใช้
export const login = (payload: LoginPayload) =>
  apiRequest<LoginResponse>('/api/Login', {
    method: 'POST',
    body: payload,
  })

export const createUser = (payload: CreateUserPayload) =>
  apiRequest<UserResponse & ApiMessageResponse>('/api/Users', {
    method: 'POST',
    body: payload,
  })

export const getUserById = (id: string | number) => apiRequest<UserResponse>(`/api/Users/${id}`)

export const getUserPets = (id: string | number) =>
  apiRequest<UserPetsResponse | string>(`/api/Users/${id}/pets`)

export const getUserStreak = (id: string | number) =>
  apiRequest<UserStreakResponse>(`/api/Users/${id}/streak`)

export const updateUserPets = (id: string | number, payload: UpdateUserPetsPayload) =>
  apiRequest<UserPetsResponse & ApiMessageResponse>(`/api/Users/${id}/pets`, {
    method: 'POST',
    body: payload,
  })

export const updateUserById = (id: string | number, payload: UpdateUserPayload) =>
  apiRequest<UserResponse & ApiMessageResponse>(`/api/Users/${id}`, {
    method: 'PUT',
    body: payload,
  })

export const deleteUserById = (id: string | number) =>
  apiRequest<ApiMessageResponse>(`/api/Users/${id}`, {
    method: 'DELETE',
  })

// endpoint หมวดหมู่และ goal ที่หน้า progress/goals/statistics ใช้
export const getActivityCategories = () => apiRequest<ActivityCategoryResponse[]>('/api/ActivityCategories')

export const getActivityCategoryById = (id: string | number) =>
  apiRequest<ActivityCategoryResponse>(`/api/ActivityCategories/${id}`)

export const createUserGoal = (payload: CreateUserGoalPayload) =>
  apiRequest<UserGoalResponse>('/api/UserGoals', {
    method: 'POST',
    body: payload,
  })

export const getUserGoals = () => apiRequest<UserGoalResponse[]>('/api/UserGoals')

export const getTodayUserGoals = (userId: string | number) =>
  apiRequest<UserGoalResponse[]>(
    buildPathWithParams('/api/UserGoals/today', {
      userId,
    }),
  )

export const updateUserGoalById = (id: string | number, payload: UpdateUserGoalPayload) =>
  apiRequest<UserGoalResponse>(`/api/UserGoals/${id}`, {
    method: 'PUT',
    body: payload,
  })

export const deleteUserGoalById = (id: string | number) =>
  apiRequest<ApiMessageResponse>(`/api/UserGoals/${id}`, {
    method: 'DELETE',
  })

// endpoint ประวัติ goal สำหรับบันทึกการทำสำเร็จและโหลดข้อมูลกราฟ
export const getGoalHistories = () => apiRequest<GoalHistoryResponse[]>('/api/GoalHistories')

export const getGoalHistoryById = (id: string | number) =>
  apiRequest<GoalHistoryResponse>(`/api/GoalHistories/${id}`)

export const createGoalHistory = (payload: CreateGoalHistoryPayload) =>
  apiRequest<GoalHistoryResponse>('/api/GoalHistories', {
    method: 'POST',
    body: payload,
  })

export const updateGoalHistoryById = (id: string | number, payload: UpdateGoalHistoryPayload) =>
  apiRequest<GoalHistoryResponse>(`/api/GoalHistories/${id}`, {
    method: 'PATCH',
    body: payload,
  })

export const getGoalHistoryChart = ({ userid, year, month, categoryid }: GoalHistoryChartParams) => {
  const params: Record<string, string | number> = {
    userid,
    year,
    month,
  }

  if (categoryid !== undefined) {
    params.categoryid = categoryid
  }

  return apiRequest<GoalHistoryChartResponse>(buildPathWithParams('/api/GoalHistories/chart', params))
}
