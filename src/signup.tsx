import { useState } from 'react'
import { LeftCircleOutlined } from '@ant-design/icons'
import { Button, ConfigProvider, Form, Input } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import './signup.css'
import { saveSignupProfile } from './lib/user-profile'

type SignupFormValues = {
  email: string
  username: string
  password: string
}

function Signup() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const navigate = useNavigate()

  const handleFinish = (values: SignupFormValues) => {
    console.log('signup submit', values)
    saveSignupProfile(values)
    setIsSubmitted(true)
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4b5b5f',
          borderRadius: 12,
          fontFamily: "'SukhumvitSet', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        },
      }}
    >
      <div className={`signup-page${isSubmitted ? ' signup-page-success' : ''}`}>
        <header className="signup-logo">logo</header>

        {isSubmitted ? (
          <main className="signup-success">
            <h1 className="signup-success-title">WELCOME !</h1>
            <Button type="primary" className="signup-login-again-btn" onClick={() => navigate('/login')}>
              Login again
            </Button>
          </main>
        ) : (
          <main className="signup-card">
            <Link className="signup-back" to="/login" aria-label="Back to login">
              <LeftCircleOutlined />
              <span>Already have an account?</span>
            </Link>

            <h1 className="signup-title">HELLO !</h1>

            <Form className="signup-form" layout="vertical" requiredMark={false} onFinish={handleFinish}>
              <Form.Item
                name="email"
                className="signup-item full-row"
                label={
                  <span className="signup-label">
                    EMAIL <span>*</span>
                  </span>
                }
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter a valid email' },
                ]}
              >
                <Input placeholder="@example.com" />
              </Form.Item>

              <Form.Item
                name="username"
                className="signup-item full-row"
                label={
                  <span className="signup-label">
                    USERNAME <span>*</span>
                  </span>
                }
                rules={[
                  { required: true, message: 'Please enter username' },
                  { max: 20, message: 'Username must be 20 characters or fewer' },
                ]}
              >
                <Input
                  placeholder="Username"
                  maxLength={20}
                  showCount={{ formatter: ({ count, maxLength }) => `${count}/${maxLength}` }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                className="signup-item full-row"
                label={
                  <span className="signup-label">
                    CREATE PASSWORD <span>*</span>
                  </span>
                }
                rules={[
                  { required: true, message: 'Please enter password' },
                  { min: 6, message: 'Password must be atleast 6 characters' },
                ]}
              >
                <Input.Password placeholder="Password" />
              </Form.Item>

              <Form.Item className="signup-submit-wrap">
                <Button type="primary" htmlType="submit" className="signup-submit-btn">
                  Sign up
                </Button>
              </Form.Item>
            </Form>
          </main>
        )}
      </div>
    </ConfigProvider>
  )
}

export default Signup
