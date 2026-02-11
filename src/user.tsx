import { useNavigate } from 'react-router-dom'
import Header from './components/header'
import Footer from './components/footer'
import './user.css'

function UserPage() {
  const navigate = useNavigate()

  return (
    <div className="user-page">
      <Header activeTab="progress" onTabChange={() => navigate('/home')} />

      <main className="user-main">
        <section className="user-card">
          <h1 className="user-title">USER PROFILE</h1>
          <p className="user-subtitle">Manage your account information here.</p>

          <div className="user-info-grid">
            <div className="user-info-item">
              <span className="user-label">Username</span>
              <span className="user-value">Nan</span>
            </div>
            <div className="user-info-item">
              <span className="user-label">Email</span>
              <span className="user-value">nan@gmail.com</span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default UserPage
