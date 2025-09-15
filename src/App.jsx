import React, { useState, useEffect } from 'react'
import Login from './Login'
import ApplicantPage from './components/ApplicantPage'
import RecruiterPage from './components/RecruiterPage'
import apiService from './services/apiService'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {

    const savedUser = sessionStorage.getItem('user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (err) {
        console.error('Error parsing saved user:', err)
        sessionStorage.removeItem('user')
      }
    }

    checkBackendHealth()
  }, [])

  const checkBackendHealth = async () => {
    try {
      await apiService.healthCheck()
      setError('')
    } catch (err) {
      setError('Không thể kết nối đến server. Vui lòng kiểm tra lại.')
      console.error('Backend health check failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (userData) => {
    setUser(userData)
    sessionStorage.setItem('user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    sessionStorage.removeItem('user')
  }

  if (loading) {
    return (
      <div className="App">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="App">
        <div className="error-screen">
          <h2>⚠️ Lỗi kết nối</h2>
          <p>{error}</p>
          <button onClick={checkBackendHealth} className="retry-btn">
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="App">
        <Login onLogin={handleLogin} />
      </div>
    )
  }

  if (user.role === 'recruiter') {
    return (
      <div className="App">
        <RecruiterPage user={user} onLogout={handleLogout} />
      </div>
    )
  }

  if (user.role === 'applicant') {
    return (
      <div className="App">
        <ApplicantPage user={user} onLogout={handleLogout} />
      </div>
    )
  }

  return (
    <div className="App">
      <div className="error-screen">
        <h2>⚠️ Lỗi</h2>
        <p>Vai trò người dùng không hợp lệ</p>
        <button onClick={handleLogout} className="retry-btn">
          Đăng nhập lại
        </button>
      </div>
    </div>
  )
}

export default App
