import { useNavigate } from 'react-router-dom'
import { UserOutlined } from '@ant-design/icons'
import { useLang } from '../hooks/useLang'
import './header.css'

type HomeTab = 'progress' | 'goals' | 'stats'

type HeaderProps = {
  activeTab: HomeTab
  onTabChange: (tab: HomeTab) => void
}

// แถบนำทางด้านบนที่ใช้ร่วมกันในหน้า home tabs และหน้า user
function Header({ activeTab, onTabChange }: HeaderProps) {
  const navigate = useNavigate()
  const { lang, setLang, t } = useLang()

  return (
    <header className="top-nav">
      <div className="top-nav-logo">{t('header.logo')}</div>

      {/* ปุ่ม tab ใช้สลับเนื้อหาใน ProgressPage โดยไม่เปลี่ยน route */}
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
        {/* ปุ่มเปลี่ยนภาษาจะอัปเดตค่าใน LangProvider กลาง */}
        <div className="top-nav-lang" role="group" >
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
        {/* ไอคอนผู้ใช้พาไปหน้าข้อมูลบัญชี */}
        <button type="button" className="top-nav-user" onClick={() => navigate('/user')}>
          <UserOutlined />
        </button>
      </div>
    </header>
  )
}

export type { HomeTab }
export default Header
