import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest, AuthContext } from '../App.jsx';

export default function MyPage() {
  const { user, setUser, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState(user?.email || '');
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    apiRequest('/api/users/me')
      .then((data) => { setProfile(data); setEmail(data.email); setNickname(data.nickname); setUser(data); })
      .catch((requestError) => {
        if (requestError.status === 401) logout();
        else setError(requestError.message);
      })
      .finally(() => setLoading(false));
  }, [logout, setUser]);

  const saveProfile = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setMessage('');
    try {
      const data = await apiRequest('/api/users/me', {
        method: 'PUT', body: JSON.stringify({ email, nickname })
      });
      setProfile(data); setUser(data); setEmail(data.email); setNickname(data.nickname);
      setMessage('회원 정보가 수정되었습니다.');
    } catch (requestError) {
      if (requestError.status === 401) logout();
      else setError(requestError.message);
    } finally { setSaving(false); }
  };

  const deleteAccount = async (event) => {
    event.preventDefault(); setDeleting(true); setError(''); setMessage('');
    try {
      await apiRequest('/api/users/me', { method: 'DELETE', body: JSON.stringify({ password }) });
      localStorage.removeItem('token'); setUser(null); navigate('/', { replace: true });
    } catch (requestError) {
      if (requestError.status === 401 && requestError.message !== '현재 비밀번호가 올바르지 않습니다.') {
        logout();
      } else {
        setError(requestError.message);
      }
    } finally { setDeleting(false); }
  };

  if (loading) return <p className="loading">회원 정보를 불러오고 있어요...</p>;

  return (
    <section className="account-page">
      <div className="page-heading"><p className="eyebrow">내 계정</p><h1>마이페이지</h1><p>회원 정보를 확인하고 관리할 수 있어요.</p></div>
      {error && <p className="message error" role="alert">{error}</p>}
      {message && <p className="message success" role="status">{message}</p>}
      {profile && <p className="joined-date">가입일: {new Date(profile.created_at).toLocaleDateString('ko-KR')}</p>}
      <form className="panel" onSubmit={saveProfile}>
        <h2>회원 정보 수정</h2>
        <label>이메일<input type="email" autoComplete="email" maxLength="100" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>닉네임<input autoComplete="nickname" maxLength="50" required value={nickname} onChange={(event) => setNickname(event.target.value)} /></label>
        <button className="button primary" disabled={saving}>{saving ? '저장 중...' : '변경 내용 저장'}</button>
      </form>
      <form className="panel danger-panel" onSubmit={deleteAccount}>
        <h2>회원 탈퇴</h2>
        <p>탈퇴하면 계정과 함께 작성한 일기도 모두 삭제되며 되돌릴 수 없습니다.</p>
        <label>현재 비밀번호<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <button className="button danger" disabled={deleting}>{deleting ? '탈퇴 처리 중...' : '회원 탈퇴'}</button>
      </form>
    </section>
  );
}
