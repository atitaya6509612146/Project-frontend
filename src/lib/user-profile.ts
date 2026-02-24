export type UserProfile = {
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

type LoginPayload = {
  username: string
  password: string
}

const STORAGE_KEY = 'app_user_profile'

const defaultProfile: UserProfile = {
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

export const getStoredUserProfile = (): UserProfile => readProfile()

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
  }
  writeProfile(merged)
}
