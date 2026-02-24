import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from './components/header'
import './user.css'

type UserForm = {
  email: string
  username: string
  password: string
}

function UserPage() {
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [user, setUser] = useState<UserForm>({
    email: 'mock.user@gmail.com',
    username: 'MockUser123',
    password: '******',
  })
  const [draft, setDraft] = useState<UserForm>(user)

  const startEdit = () => {
    setDraft(user)
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setDraft(user)
    setIsEditing(false)
  }

  const saveEdit = () => {
    setUser(draft)
    setIsEditing(false)
  }

  const onChangeField = (field: keyof UserForm, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  const viewData = isEditing ? draft : user

  return (
    <div className="user-page">
      <Header activeTab="progress" onTabChange={() => navigate('/home')} />

      <main className="user-main">
        <section className="user-card">
          <h1 className="user-title">INFORMATION</h1>

          <div className="user-form-grid">
            <div className="user-field">
              <label className="user-label">EMAIL</label>
              <input
                className="user-input"
                value={viewData.email}
                readOnly={!isEditing}
                onChange={(event) => onChangeField('email', event.target.value)}
              />
            </div>

            <div className="user-field">
              <label className="user-label">USERNAME</label>
              <input
                className="user-input"
                value={viewData.username}
                readOnly={!isEditing}
                onChange={(event) => onChangeField('username', event.target.value)}
              />
            </div>

            <div className="user-field">
              <label className="user-label">PASSWORD</label>
              <input
                className="user-input"
                value={viewData.password}
                readOnly={!isEditing}
                onChange={(event) => onChangeField('password', event.target.value)}
              />
            </div>
          </div>

          <div className="user-actions">
            {isEditing ? (
              <>
                <button type="button" className="user-edit-btn" onClick={saveEdit}>
                  save
                </button>
                <button type="button" className="user-cancel-btn" onClick={cancelEdit}>
                  cancel
                </button>
              </>
            ) : (
              <button type="button" className="user-edit-btn" onClick={startEdit}>
                edit
              </button>
            )}

            <button type="button" className="user-delete-btn">
              Delete Account
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default UserPage
