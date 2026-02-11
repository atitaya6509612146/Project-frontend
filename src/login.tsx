import { Button, ConfigProvider, Form, Input } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import './login.css'

function Login() {
  const navigate = useNavigate()

  const handleFinish = (values: { username: string; password: string }) => {
    console.log('login submit', values)
    navigate('/home')
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
            className="login-form"
            layout="vertical"
            requiredMark={false}
            onFinish={handleFinish}
          >
            <Form.Item name="username" rules={[{ required: true, message: 'Please enter username' }]}> 
              <Input size="large" placeholder="Username" />
            </Form.Item>

            <Form.Item name="password" rules={[{ required: true, message: 'Please enter password' }]}> 
              <Input.Password size="large" placeholder="Password" />
            </Form.Item>

            <Form.Item className="login-submit-wrap">
              <Button type="primary" htmlType="submit" className="login-submit-btn">
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
