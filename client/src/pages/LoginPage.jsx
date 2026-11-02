import { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App.jsx';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || '로그인에 실패했습니다.');
      localStorage.setItem('token', data.token);
      setUser(data.user);
      navigate('/mypage', { replace: true });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="form-card">
      <p className="eyebrow">다시 만나 반가워요</p><h1>로그인</h1>
      {location.state?.message && <p className="message success">{location.state.message}</p>}
      <form onSubmit={submit}>
        <label>이메일<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>비밀번호<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        {message && <p className="message error" role="alert">{message}</p>}
        <button className="button primary full" disabled={busy}>{busy ? '로그인 중...' : '로그인'}</button>
      </form>
      <p className="form-switch">처음이신가요? <Link to="/signup">회원가입</Link></p>
    </section>
  );
}
