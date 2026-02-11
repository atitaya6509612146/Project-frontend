import { useMemo, useState } from 'react'
import { Button } from 'antd'
import Header, { type HomeTab } from '../components/header'
import Footer from '../components/footer'
import './progress.css'

function ProgressPage() {
  const [activeTab, setActiveTab] = useState<HomeTab>('progress')

  const currentDate = useMemo(
    () =>
      new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      }).format(new Date()),
    [],
  )

  return (
    <div className="progress-page">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="progress-main">
        {activeTab === 'progress' ? (
          <section className="progress-card">
            <div className="progress-head-row">
              <h1 className="progress-greeting">
                Hello!
                <br />
                Nan
              </h1>
              <p className="progress-date">{currentDate}</p>
            </div>

            <div className="progress-action">
              <Button type="primary" className="progress-pet-btn">
                START YOUR PROGRESS
              </Button>
            </div>
          </section>
        ) : activeTab === 'goals' ? (
          <section className="progress-card progress-tab-card">
            <h1 className="progress-tab-title">YOUR GOALS</h1>
            <p className="progress-tab-desc">Set your weekly goals and track each milestone here.</p>
          </section>
        ) : (
          <section className="progress-card progress-tab-card">
            <h1 className="progress-tab-title">STATISTICS</h1>
            <p className="progress-tab-desc">View your progress history, streaks, and completion trends.</p>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default ProgressPage
