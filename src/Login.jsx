import React, { useState } from 'react';
import { login } from './services/apiService';
import './Login.css';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      setError('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    setIsLoading(true);

    try {

      let response;
      try {
        response = await login(formData.username, formData.password, 'recruiter');
      } catch {
        response = await login(formData.username, formData.password, 'applicant');
      }

      if (response.success) {
        const userData = {
          id: response.user.id,
          username: response.user.username,
          role: response.user.role
        };

        onLogin(userData);
      } else {
        setError(response.message || 'Đăng nhập thất bại');
      }
    } catch (error) {
      setError(error.message || 'Đăng nhập thất bại. Vui lòng thử lại!');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="logo">
          <h1>🤖 AI Resume Ranker</h1>
          <p>Hệ thống xếp hạng CV thông minh</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">

          <div className="form-group">
            <label htmlFor="username">Tên đăng nhập:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </form>

      </div>
    </div>
  );
};

export default Login;