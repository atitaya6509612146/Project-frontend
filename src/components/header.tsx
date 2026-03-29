import { useNavigate } from 'react-router-dom'
import { UserOutlined } from '@ant-design/icons'
import { useLang } from '../hooks/useLang'
import './header.css'

type HomeTab = 'progress' | 'goals' | 'stats'

type HeaderProps = {
  activeTab: HomeTab
  onTabChange: (tab: HomeTab) => void
}

function Header({ activeTab, onTabChange }: HeaderProps) {
  const navigate = useNavigate()
  const { lang, setLang, t } = useLang()

  return (
    <header className="top-nav">
      <div className="top-nav-logo">{t('header.logo')}</div>

      <nav className="top-nav-menu" aria-label="Main navigation">
        <button
          type="button"
          className={`top-nav-link top-nav-tab-button${activeTab === 'progress' ? ' top-nav-link-active' : ''}`}
          onClick={() => onTabChange('progress')}
        >
          {t('header.progress')}
        </button>
        <button
          type="button"
          className={`top-nav-link top-nav-tab-button${activeTab === 'goals' ? ' top-nav-link-active' : ''}`}
          onClick={() => onTabChange('goals')}
        >
          {t('header.goals')}
        </button>
        <button
          type="button"
          className={`top-nav-link top-nav-tab-button${activeTab === 'stats' ? ' top-nav-link-active' : ''}`}
          onClick={() => onTabChange('stats')}
        >
          {t('header.stats')}
        </button>
      </nav>

      <div className="top-nav-tools">
        <div className="top-nav-lang" role="group" aria-label={t('header.language')}>
          <button
            type="button"
            className={`top-nav-lang-option${lang === 'en' ? ' top-nav-lang-option-active' : ''}`}
            aria-pressed={lang === 'en'}
            onClick={() => setLang('en')}
          >
            EN
          </button>
          <button
            type="button"
            className={`top-nav-lang-option${lang === 'th' ? ' top-nav-lang-option-active' : ''}`}
            aria-pressed={lang === 'th'}
            onClick={() => setLang('th')}
          >
            TH
          </button>
        </div>
        <button type="button" className="top-nav-user" aria-label={t('header.userProfile')} onClick={() => navigate('/user')}>
          <UserOutlined />
        </button>
      </div>
    </header>
  )
}

export type { HomeTab }
export default Header
