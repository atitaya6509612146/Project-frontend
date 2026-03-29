import { Button } from 'antd'
import { useLang } from '../hooks/useLang'
import './footer.css'

type FooterProps = {
  onAddGoal?: () => void
}

function Footer({ onAddGoal }: FooterProps) {
  const { t } = useLang()

  return (
    <footer className="app-footer">
      <Button type="primary" className="app-footer-goal-btn" onClick={onAddGoal}>
        {t('footer.addGoal')}
      </Button>
    </footer>
  )
}

export default Footer
