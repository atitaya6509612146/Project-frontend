import { useEffect, useState } from 'react'
import { CloseOutlined } from '@ant-design/icons'
import { Modal, message } from 'antd'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError, deleteUserById, getUserById, updateUserById } from './api'
import Header from './components/header'
import { clearStoredUserProfile, getStoredUserProfile, saveUserDetailsProfile } from './lib/user-profile'
import './user.css'

type UserForm = {
  email: string
  username: string
  password: string
}

type UserFormErrors = Partial<Record<keyof UserForm, string>>

function UserPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<UserFormErrors>({})
  const [user, setUser] = useState<UserForm>({
    email: '',
    username: '',
    password: '',
  })
  const [draft, setDraft] = useState<UserForm>({
    email: '',
    username: '',
    password: '',
  })

  useEffect(() => {
    const storedProfile = getStoredUserProfile()
    const userId = searchParams.get('id') || storedProfile.userId

    if (!userId) {
      setErrorMessage('User id is required. Please login again or open this page with ?id=<userId>')
      setIsLoading(false)
      return
    }

    const loadUser = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const response = await getUserById(userId)
        const nextUser: UserForm = {
          email: response.email || '-',
          username: response.username || '-',
          password: response.password || '******',
        }

        setUser(nextUser)
        setDraft(nextUser)
      } catch (error) {
        if (error instanceof ApiError) {
          setErrorMessage(error.message || 'Unable to load user data')
        } else {
          setErrorMessage('Unable to load user data')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void loadUser()
  }, [searchParams])

  const startEdit = () => {
    setDraft(user)
    setFieldErrors({})
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setDraft(user)
    setFieldErrors({})
    setIsEditing(false)
  }

  const validateField = (field: keyof UserForm, value: string): string => {
    if (field === 'username') {
      if (!value.trim()) {
        return 'Please enter username'
      }

      if (value.length > 20) {
        return 'Username must be 20 characters or fewer'
      }
    }

    if (field === 'email') {
      if (!value.trim()) {
        return 'Please enter email'
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailPattern.test(value)) {
        return 'Please enter a valid email'
      }
    }

    if (field === 'password') {
      if (!value.trim()) {
        return 'Please enter password'
      }

      if (value.length < 6) {
        return 'Password must be at least 6 characters'
      }
    }

    return ''
  }

  const validateDraft = (values: UserForm): UserFormErrors => {
    const nextErrors: UserFormErrors = {}

    ;(['email', 'username', 'password'] as const).forEach((field) => {
      const error = validateField(field, values[field])
      if (error) {
        nextErrors[field] = error
      }
    })

    return nextErrors
  }

  const confirmSaveEdit = async () => {
    const storedProfile = getStoredUserProfile()
    const userId = searchParams.get('id') || storedProfile.userId

    if (!userId) {
      setErrorMessage('User id is required before saving this account')
      setIsSaveModalOpen(false)
      return
    }

    const nextErrors = validateDraft(draft)
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      setIsSaveModalOpen(false)
      return
    }

    setErrorMessage('')

    try {
      const response = await updateUserById(userId, draft)
      const nextUser: UserForm = {
        email: response?.email || draft.email,
        username: response?.username || draft.username,
        password: response?.password || draft.password,
      }

      setUser(nextUser)
      setDraft(nextUser)
      setFieldErrors({})
      saveUserDetailsProfile(nextUser)
      setIsSaveModalOpen(false)
      setIsEditing(false)
      message.success(response?.message || 'Account updated successfully')
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message || 'Unable to update account')
      } else {
        setErrorMessage('Unable to update account')
      }
    }
  }

  const onChangeField = (field: keyof UserForm, value: string) => {
    setErrorMessage('')
    setDraft((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => {
      const nextError = validateField(field, value)
      if (!nextError) {
        const { [field]: _, ...rest } = prev
        return rest
      }

      return { ...prev, [field]: nextError }
    })
  }

  const handleSaveEdit = () => {
    const storedProfile = getStoredUserProfile()
    const userId = searchParams.get('id') || storedProfile.userId

    if (!userId) {
      setErrorMessage('User id is required before saving this account')
      return
    }

    const nextErrors = validateDraft(draft)
    setFieldErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSaveModalOpen(true)
  }

  const handleLogout = () => {
    clearStoredUserProfile()
    navigate('/login')
  }

  const handleDeleteAccount = () => {
    const storedProfile = getStoredUserProfile()
    const userId = searchParams.get('id') || storedProfile.userId

    if (!userId) {
      setErrorMessage('User id is required before deleting this account')
      return
    }

    setIsDeleteModalOpen(true)
  }

  const confirmDeleteAccount = async () => {
    const storedProfile = getStoredUserProfile()
    const userId = searchParams.get('id') || storedProfile.userId

    if (!userId) {
      setErrorMessage('User id is required before deleting this account')
      setIsDeleteModalOpen(false)
      return
    }

    setIsDeleting(true)
    setErrorMessage('')

    try {
      const response = await deleteUserById(userId)
      clearStoredUserProfile()
      setIsDeleteModalOpen(false)
      message.success(response.message || 'Account deleted successfully')
      navigate('/login')
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message || 'Unable to delete account')
      } else {
        setErrorMessage('Unable to delete account')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const viewData = isEditing ? draft : user

  return (
    <div className="user-page">
      <Header activeTab="progress" onTabChange={() => navigate('/home')} />

      <main className="user-main">
        <section className="user-card">
          <h1 className="user-title">INFORMATION</h1>

          {isLoading ? <p className="user-status">Loading user data...</p> : null}
          {!isLoading && errorMessage ? <p className="user-status user-status-error">{errorMessage}</p> : null}

          <div className="user-form-grid">
            <div className="user-field">
              <label className="user-label">EMAIL</label>
              <input
                className={`user-input${fieldErrors.email ? ' user-input-invalid' : ''}`}
                value={viewData.email}
                disabled={isLoading || Boolean(errorMessage)}
                readOnly={!isEditing}
                tabIndex={isEditing ? 0 : -1}
                onChange={(event) => onChangeField('email', event.target.value)}
              />
              {isEditing && fieldErrors.email ? <p className="user-field-error">{fieldErrors.email}</p> : null}
            </div>

            <div className="user-field">
              <label className="user-label">USERNAME</label>
              <div className="user-username-wrap">
                <input
                  className={`user-input${fieldErrors.username ? ' user-input-invalid' : ''}${isEditing ? ' user-username-input' : ''}`}
                  value={viewData.username}
                  disabled={isLoading || Boolean(errorMessage)}
                  readOnly={!isEditing}
                  maxLength={20}
                  tabIndex={isEditing ? 0 : -1}
                  onChange={(event) => onChangeField('username', event.target.value)}
                />
                {isEditing ? <span className="user-field-count user-field-count-inside">{`${viewData.username.length}/20`}</span> : null}
              </div>
              {isEditing && fieldErrors.username ? <p className="user-field-error">{fieldErrors.username}</p> : null}
            </div>

            <div className="user-field">
              <label className="user-label">PASSWORD</label>
              <div className="user-password-wrap">
                <input
                  className={`user-input user-password-input${fieldErrors.password ? ' user-input-invalid' : ''}`}
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={viewData.password}
                  disabled={isLoading || Boolean(errorMessage)}
                  readOnly={!isEditing}
                  tabIndex={isEditing ? 0 : -1}
                  onChange={(event) => onChangeField('password', event.target.value)}
                />
                <button
                  type="button"
                  className="user-password-toggle"
                  onClick={() => setIsPasswordVisible((current) => !current)}
                  disabled={isLoading || Boolean(errorMessage)}
                  aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                  aria-pressed={isPasswordVisible}
                >
                  {isPasswordVisible ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="user-password-icon">
                      <path
                        d="M3 4.5 19.5 21"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M10.6 6.2A10.9 10.9 0 0 1 12 6c5.7 0 9.8 5.3 10 5.5a.8.8 0 0 1 0 1c-.1.2-1.5 1.9-3.7 3.4M6.7 9C4.6 10.5 3.2 12.2 3 12.5a.8.8 0 0 0 0 1C3.2 13.7 7.3 19 13 19c.6 0 1.2-.1 1.8-.2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M9.9 10a3 3 0 0 0 4.1 4.1"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="user-password-icon">
                      <path
                        d="M2.5 12S6.5 5.5 12 5.5 21.5 12 21.5 12 17.5 18.5 12 18.5 2.5 12 2.5 12Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  )}
                </button>
              </div>
              {isEditing && fieldErrors.password ? <p className="user-field-error">{fieldErrors.password}</p> : null}
            </div>
          </div>

          <div className="user-actions">
            {isEditing ? (
              <>
                <button type="button" className="user-edit-btn" onClick={handleSaveEdit}>
                  save
                </button>
                <button type="button" className="user-cancel-btn" onClick={cancelEdit}>
                  cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="user-edit-btn"
                  onClick={startEdit}
                  disabled={isLoading || Boolean(errorMessage)}
                >
                  edit
                </button>

                <button
                  type="button"
                  className="user-delete-btn"
                  disabled={isLoading || Boolean(errorMessage) || isDeleting}
                  onClick={handleDeleteAccount}
                >
                  Delete Account
                </button>

                <button
                  type="button"
                  className="user-logout-btn"
                  onClick={handleLogout}
                  disabled={isDeleting}
                >
                  Logout
                </button>
              </>
            )}

          </div>
        </section>
      </main>

      <Modal
        open={isSaveModalOpen}
        footer={null}
        closable={false}
        centered
        width={380}
        maskClosable
        onCancel={() => setIsSaveModalOpen(false)}
        className="user-delete-modal"
      >
        <div className="user-delete-modal-body">
          <button
            type="button"
            className="user-delete-modal-close"
            onClick={() => setIsSaveModalOpen(false)}
            aria-label="Close dialog"
          >
            <CloseOutlined />
          </button>

          <h2 className="user-delete-modal-title">
            Do you really want to
            <br />
            <span className="user-save-modal-accent">save</span> your changes?
          </h2>

          <div className="user-delete-modal-actions">
            <button
              type="button"
              className="user-delete-modal-confirm"
              onClick={confirmSaveEdit}
            >
              YES
            </button>
            <button
              type="button"
              className="user-delete-modal-cancel"
              onClick={() => setIsSaveModalOpen(false)}
            >
              CANCEL
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={isDeleteModalOpen}
        footer={null}
        closable={false}
        centered
        width={380}
        maskClosable={!isDeleting}
        onCancel={() => {
          if (!isDeleting) {
            setIsDeleteModalOpen(false)
          }
        }}
        className="user-delete-modal"
      >
        <div className="user-delete-modal-body">
          <button
            type="button"
            className="user-delete-modal-close"
            onClick={() => setIsDeleteModalOpen(false)}
            disabled={isDeleting}
            aria-label="Close dialog"
          >
            <CloseOutlined />
          </button>

          <h2 className="user-delete-modal-title">
            Do you really want to
            <br />
            <span className="user-delete-modal-danger">delete</span> your account?
          </h2>

          <div className="user-delete-modal-actions">
            <button
              type="button"
              className="user-delete-modal-confirm"
              onClick={confirmDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? '...' : 'YES'}
            </button>
            <button
              type="button"
              className="user-delete-modal-cancel"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              CANCEL
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default UserPage
