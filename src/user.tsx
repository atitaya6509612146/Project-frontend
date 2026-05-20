import { useEffect, useState } from 'react'
import { CloseOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons'
import { Modal, message } from 'antd'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError, deleteUserById, getUserById, updateUserById } from './api'
import Header from './components/header'
import { useLang } from './hooks/useLang'
import { clearStoredUserProfile, getStoredUserProfile, saveUserDetailsProfile } from './lib/user-profile'
import './user.css'

type UserForm = {
  email: string
  username: string
  password: string
  level: number
  exp: number
}

type UserFormErrors = Partial<Record<keyof UserForm, string>>

function UserPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useLang()
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
    level: 1,
    exp: 0,
  })
  const [draft, setDraft] = useState<UserForm>({
    email: '',
    username: '',
    password: '',
    level: 1,
    exp: 0,
  })

  useEffect(() => {
    const storedProfile = getStoredUserProfile()
    const userId = searchParams.get('id') || storedProfile.userId

    if (!userId) {
      setErrorMessage(t('user.errorUserIdRequiredLoad'))
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
          level: typeof response.level === 'number' ? response.level : storedProfile.level,
          exp: typeof response.exp === 'number' ? response.exp : storedProfile.exp,
        }

        setUser(nextUser)
        setDraft(nextUser)
        saveUserDetailsProfile(nextUser)
      } catch (error) {
        if (error instanceof ApiError) {
          setErrorMessage(error.message || t('user.errorLoad'))
        } else {
          setErrorMessage(t('user.errorLoad'))
        }
      } finally {
        setIsLoading(false)
      }
    }

    void loadUser()
  }, [searchParams, t])

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
        return t('user.validationUsernameRequired')
      }

      if (value.length > 20) {
        return t('user.validationUsernameMax')
      }
    }

    if (field === 'email') {
      if (!value.trim()) {
        return t('user.validationEmailRequired')
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailPattern.test(value)) {
        return t('user.validationEmailInvalid')
      }
    }

    if (field === 'password') {
      if (!value.trim()) {
        return t('user.validationPasswordRequired')
      }

      if (value.length < 6) {
        return t('user.validationPasswordMin')
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
      setErrorMessage(t('user.errorUserIdRequiredSave'))
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
        level: typeof response?.level === 'number' ? response.level : draft.level,
        exp: typeof response?.exp === 'number' ? response.exp : draft.exp,
      }

      setUser(nextUser)
      setDraft(nextUser)
      setFieldErrors({})
      saveUserDetailsProfile(nextUser)
      setIsSaveModalOpen(false)
      setIsEditing(false)
      message.success(response?.message || t('user.accountUpdated'))
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message || t('user.errorUpdate'))
      } else {
        setErrorMessage(t('user.errorUpdate'))
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
      setErrorMessage(t('user.errorUserIdRequiredSave'))
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
      setErrorMessage(t('user.errorUserIdRequiredDelete'))
      return
    }

    setIsDeleteModalOpen(true)
  }

  const confirmDeleteAccount = async () => {
    const storedProfile = getStoredUserProfile()
    const userId = searchParams.get('id') || storedProfile.userId

    if (!userId) {
      setErrorMessage(t('user.errorUserIdRequiredDelete'))
      setIsDeleteModalOpen(false)
      return
    }

    setIsDeleting(true)
    setErrorMessage('')

    try {
      const response = await deleteUserById(userId)
      clearStoredUserProfile()
      setIsDeleteModalOpen(false)
      message.success(response.message || t('user.accountDeleted'))
      navigate('/login')
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message || t('user.errorDelete'))
      } else {
        setErrorMessage(t('user.errorDelete'))
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
          <h1 className="user-title">{t('user.title')}</h1>

          {isLoading ? (
            <div className="user-loading-state" role="status" aria-live="polite">
              {t('user.loading')}
            </div>
          ) : (
            <>
              {errorMessage ? <p className="user-status user-status-error">{errorMessage}</p> : null}

              <div className="user-form-grid">
                <div className="user-field">
                  <label className="user-label">{t('user.email')}</label>
                  <input
                    className={`user-input${fieldErrors.email ? ' user-input-invalid' : ''}`}
                    value={viewData.email}
                    disabled={Boolean(errorMessage)}
                    readOnly={!isEditing}
                    tabIndex={isEditing ? 0 : -1}
                    onChange={(event) => onChangeField('email', event.target.value)}
                  />
                  {isEditing && fieldErrors.email ? <p className="user-field-error">{fieldErrors.email}</p> : null}
                </div>

                <div className="user-field">
                  <label className="user-label">{t('user.username')}</label>
                  <div className="user-username-wrap">
                    <input
                      className={`user-input${fieldErrors.username ? ' user-input-invalid' : ''}${isEditing ? ' user-username-input' : ''}`}
                      value={viewData.username}
                      disabled={Boolean(errorMessage)}
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
                  <label className="user-label">{t('user.password')}</label>
                  <div className="user-password-wrap">
                    <input
                      className={`user-input user-password-input${fieldErrors.password ? ' user-input-invalid' : ''}`}
                      type={isPasswordVisible ? 'text' : 'password'}
                      value={viewData.password}
                      disabled={Boolean(errorMessage)}
                      readOnly={!isEditing}
                      tabIndex={isEditing ? 0 : -1}
                      onChange={(event) => onChangeField('password', event.target.value)}
                    />
                    <button
                      type="button"
                      className="user-password-toggle"
                      onClick={() => setIsPasswordVisible((current) => !current)}
                      disabled={Boolean(errorMessage)}
                      aria-label={isPasswordVisible ? t('user.hidePassword') : t('user.showPassword')}
                      aria-pressed={isPasswordVisible}
                    >
                      {isPasswordVisible ? <EyeTwoTone className="user-password-icon" /> : <EyeInvisibleOutlined className="user-password-icon" />}
                    </button>
                  </div>
                  {isEditing && fieldErrors.password ? <p className="user-field-error">{fieldErrors.password}</p> : null}
                </div>
              </div>

              <div className="user-actions">
                {isEditing ? (
                  <>
                    <button type="button" className="user-edit-btn" onClick={handleSaveEdit}>
                      {t('user.save')}
                    </button>
                    <button type="button" className="user-cancel-btn" onClick={cancelEdit}>
                      {t('user.cancel')}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="user-edit-btn"
                      onClick={startEdit}
                      disabled={Boolean(errorMessage)}
                    >
                      {t('user.edit')}
                    </button>

                    <button
                      type="button"
                      className="user-delete-btn"
                      disabled={Boolean(errorMessage) || isDeleting}
                      onClick={handleDeleteAccount}
                    >
                      {t('user.deleteAccount')}
                    </button>

                    <button
                      type="button"
                      className="user-logout-btn"
                      onClick={handleLogout}
                      disabled={isDeleting}
                    >
                      {t('user.logout')}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
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
            aria-label={t('user.closeDialog')}
          >
            <CloseOutlined />
          </button>

          <h2 className="user-delete-modal-title">
            {t('user.saveQuestion')}
            <br />
            <span className="user-save-modal-accent">{t('user.save')}</span> {t('user.yourChanges')}
          </h2>

          <div className="user-delete-modal-actions">
            <button
              type="button"
              className="user-delete-modal-confirm"
              onClick={confirmSaveEdit}
            >
              {t('user.yes')}
            </button>
            <button
              type="button"
              className="user-delete-modal-cancel"
              onClick={() => setIsSaveModalOpen(false)}
            >
              {t('user.cancel').toUpperCase()}
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
            aria-label={t('user.closeDialog')}
          >
            <CloseOutlined />
          </button>

          <h2 className="user-delete-modal-title">
            {t('user.deleteQuestion')}
            <br />
            <span className="user-delete-modal-danger">{t('user.delete')}</span> {t('user.yourAccount')}
          </h2>

          <div className="user-delete-modal-actions">
            <button
              type="button"
              className="user-delete-modal-confirm"
              onClick={confirmDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? '...' : t('user.yes')}
            </button>
            <button
              type="button"
              className="user-delete-modal-cancel"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              {t('user.cancel').toUpperCase()}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default UserPage
