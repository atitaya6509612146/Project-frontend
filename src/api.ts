import { getStoredAuthToken } from './lib/user-profile'

export type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: HeadersInit
}

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
  [key: string]: unknown
}

export type UserResponse = {
  id?: string | number
  email?: string
  username?: string
  password?: string
  [key: string]: unknown
}

export type UpdateUserPayload = {
  email: string
  username: string
  password: string
}

export type CreateUserPayload = {
  email: string
  username: string
  password: string
}

const API_BASE_URL = 'http://localhost:5057'

const buildUrl = (path: string) => `${API_BASE_URL}${path}`

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

export const updateUserById = (id: string | number, payload: UpdateUserPayload) =>
  apiRequest<UserResponse & ApiMessageResponse>(`/api/Users/${id}`, {
    method: 'PUT',
    body: payload,
  })

export const deleteUserById = (id: string | number) =>
  apiRequest<ApiMessageResponse>(`/api/Users/${id}`, {
    method: 'DELETE',
  })
