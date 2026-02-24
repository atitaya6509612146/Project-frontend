import { Button } from 'antd'
import './footer.css'

type FooterProps = {
  onAddGoal?: () => void
}

function Footer({ onAddGoal }: FooterProps) {
  return (
    <footer className="app-footer">
      <Button type="primary" className="app-footer-goal-btn" onClick={onAddGoal}>
        Add your goal!
      </Button>
    </footer>
  )
}

export default Footer
