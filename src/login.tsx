import { useState } from 'react'
import { Alert, Button, ConfigProvider, Form, Input, message } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, login, type LoginPayload } from './api'
import './login.css'
import { saveLoginProfile } from './lib/user-profile'

type LoginFormValues = LoginPayload

function Login() {
  const [form] = Form.useForm<LoginFormValues>()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleFinish = async (values: LoginFormValues) => {
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const payload = await login(values)
      const userId =
        payload.userId !== undefined
          ? String(payload.userId)
          : payload.id !== undefined
            ? String(payload.id)
            : undefined

      saveLoginProfile({
        ...values,
        userId,
        username: payload.username || values.username,
        token: payload.token,
      })
      message.success(payload.message || 'Login successful')
      form.resetFields(['password'])
      navigate('/home')
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message || 'Login failed')
      } else {
        setErrorMessage('Unable to connect to login service')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#47555b',
          borderRadius: 12,
          fontFamily: "'SukhumvitSet', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        },
      }}
    >
      <div className="login-page">
        <header className="login-header">logo</header>

        <main className="login-panel">
          <h1 className="login-title">LOGIN</h1>

          <Form
            form={form}
            className="login-form"
            layout="vertical"
            requiredMark={false}
            onFinish={handleFinish}
          >
            {errorMessage ? <Alert type="error" showIcon message={errorMessage} /> : null}

            <Form.Item name="username" rules={[{ required: true, message: 'Please enter username' }]}> 
              <Input size="large" placeholder="Username" />
            </Form.Item>

            <Form.Item name="password" rules={[{ required: true, message: 'Please enter password' }]}> 
              <Input.Password size="large" placeholder="Password" />
            </Form.Item>

            <Form.Item className="login-submit-wrap">
              <Button type="primary" htmlType="submit" className="login-submit-btn" loading={isSubmitting}>
                Login
              </Button>
            </Form.Item>
          </Form>

          <div className="login-alt">
            <span>or</span>
            <Link to="/signup">Sign up</Link>
          </div>
        </main>
      </div>
    </ConfigProvider>
  )
}

export default Login
