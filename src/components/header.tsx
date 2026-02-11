import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserOutlined } from '@ant-design/icons'
import './header.css'

type HomeTab = 'progress' | 'goals' | 'stats'

type HeaderProps = {
  activeTab: HomeTab
  onTabChange: (tab: HomeTab) => void
}

function Header({ activeTab, onTabChange }: HeaderProps) {
  const navigate = useNavigate()
  const [language, setLanguage] = useState<'EN' | 'TH'>('EN')

  return (
    <header className="top-nav">
      <div className="top-nav-logo">logo</div>

      <nav className="top-nav-menu" aria-label="Main navigation">
        <button
          type="button"
          className={`top-nav-link top-nav-tab-button${activeTab === 'progress' ? ' top-nav-link-active' : ''}`}
          onClick={() => onTabChange('progress')}
        >
          YOUR PROGRESS
        </button>
        <button
          type="button"
          className={`top-nav-link top-nav-tab-button${activeTab === 'goals' ? ' top-nav-link-active' : ''}`}
          onClick={() => onTabChange('goals')}
        >
          YOUR GOALS
        </button>
        <button
          type="button"
          className={`top-nav-link top-nav-tab-button${activeTab === 'stats' ? ' top-nav-link-active' : ''}`}
          onClick={() => onTabChange('stats')}
        >
          STATISTICS
        </button>
      </nav>

      <div className="top-nav-tools">
        <div className="top-nav-lang" role="group" aria-label="Language switch">
          <button
            type="button"
            className={`top-nav-lang-option${language === 'EN' ? ' top-nav-lang-option-active' : ''}`}
            aria-pressed={language === 'EN'}
            onClick={() => setLanguage('EN')}
          >
            EN
          </button>
          <button
            type="button"
            className={`top-nav-lang-option${language === 'TH' ? ' top-nav-lang-option-active' : ''}`}
            aria-pressed={language === 'TH'}
            onClick={() => setLanguage('TH')}
          >
            TH
          </button>
        </div>
        <button type="button" className="top-nav-user" aria-label="User profile" onClick={() => navigate('/user')}>
          <UserOutlined />
        </button>
      </div>
    </header>
  )
}

export type { HomeTab }
export default Header
