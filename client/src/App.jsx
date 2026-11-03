import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Header from './components/Header.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import MyPage from './pages/MyPage.jsx';
import DiaryDetailPage from './pages/DiaryDetailPage.jsx';
import DiaryFormPage from './pages/DiaryFormPage.jsx';
import AuthorsPage from './pages/AuthorsPage.jsx';

export const AuthContext = createContext(null);

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || '요청을 처리하지 못했습니다.');
    error.status = response.status;
    throw error;
  }
  return data;
}

export const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url, { ...options, headers });
  return readResponse(response);
};

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  const logout = useCallback((redirect = true) => {
    localStorage.removeItem('token');
    setUser(null);
    if (redirect) navigate('/login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setChecking(false);
      return;
    }

    apiRequest('/api/users/me')
      .then(setUser)
      .catch((error) => {
        localStorage.removeItem('token');
        setUser(null);
        if (error.status === 401) navigate('/login', { replace: true });
      })
      .finally(() => setChecking(false));
  }, [navigate]);

  const auth = useMemo(() => ({ user, setUser, logout, checking }), [user, logout, checking]);

  if (checking) return <div className="loading">로그인 상태를 확인하고 있어요...</div>;

  return (
    <AuthContext.Provider value={auth}>
      <div className="app-shell">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/diaries/with-authors" element={<AuthorsPage />} />
            <Route path="/diaries/new" element={user ? <DiaryFormPage /> : <Navigate to="/login" replace />} />
            <Route path="/diaries/:id/edit" element={user ? <DiaryFormPage /> : <Navigate to="/login" replace />} />
            <Route path="/diaries/:id" element={<DiaryDetailPage />} />
            <Route path="/signup" element={user ? <Navigate to="/mypage" replace /> : <SignupPage />} />
            <Route path="/login" element={user ? <Navigate to="/mypage" replace /> : <LoginPage />} />
            <Route path="/mypage" element={user ? <MyPage /> : <Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="footer">오늘의 마음을 천천히 나누는 곳</footer>
      </div>
    </AuthContext.Provider>
  );
}
