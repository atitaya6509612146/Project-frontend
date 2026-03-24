export type UserProfile = {
  userId: string
  token: string
  name: string
  lastname: string
  nickname: string
  gender: string
  dateOfBirth: string
  age: string
  email: string
  username: string
  password: string
}

type SignupPayload = {
  email: string
  username: string
  password: string
}

type UserDetailsPayload = {
  email?: string
  username?: string
  password?: string
}

type LoginPayload = {
  userId?: string
  token?: string
  username: string
  password: string
}

const STORAGE_KEY = 'app_user_profile'

const defaultProfile: UserProfile = {
  userId: '',
  token: '',
  name: '-',
  lastname: '-',
  nickname: '-',
  gender: '-',
  dateOfBirth: '-',
  age: '-',
  email: '-',
  username: '-',
  password: '',
}

const readProfile = (): UserProfile => {
  if (typeof window === 'undefined') {
    return defaultProfile
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaultProfile
    }

    const parsed = JSON.parse(raw) as Partial<UserProfile>
    return { ...defaultProfile, ...parsed }
  } catch {
    return defaultProfile
  }
}

const writeProfile = (profile: UserProfile) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

export const clearStoredUserProfile = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(STORAGE_KEY)
}

export const getStoredUserProfile = (): UserProfile => readProfile()

export const getStoredAuthToken = (): string => readProfile().token

export const saveSignupProfile = (payload: SignupPayload) => {
  const previous = readProfile()
  const merged: UserProfile = {
    ...previous,
    email: payload.email,
    username: payload.username,
    password: payload.password,
    nickname: payload.username || previous.nickname,
  }
  writeProfile(merged)
}

export const saveLoginProfile = (payload: LoginPayload) => {
  const previous = readProfile()
  const merged: UserProfile = {
    ...previous,
    username: payload.username || previous.username,
    password: payload.password || previous.password,
    userId: payload.userId || previous.userId,
    token: payload.token || previous.token,
  }
  writeProfile(merged)
}

export const saveUserDetailsProfile = (payload: UserDetailsPayload) => {
  const previous = readProfile()
  const merged: UserProfile = {
    ...previous,
    email: payload.email || previous.email,
    username: payload.username || previous.username,
    password: payload.password || previous.password,
  }
  writeProfile(merged)
}
