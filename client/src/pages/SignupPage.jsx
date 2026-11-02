import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function SignupPage() {
  const [form, setForm] = useState({ email: '', nickname: '', password: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    if (form.password !== form.confirmPassword) return setMessage('비밀번호 확인이 일치하지 않습니다.');
    if (form.password.length < 8 || new TextEncoder().encode(form.password).length > 72) {
      return setMessage('비밀번호는 8자 이상, UTF-8 기준 72바이트 이하여야 합니다.');
    }

    setBusy(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, nickname: form.nickname, password: form.password })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || '회원가입에 실패했습니다.');
      navigate('/login', { replace: true, state: { message: '가입이 완료되었습니다. 로그인해 주세요.' } });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="form-card">
      <p className="eyebrow">함께 시작해요</p><h1>회원가입</h1>
      <form onSubmit={submit}>
        <label>이메일<input name="email" type="email" autoComplete="email" maxLength="100" required value={form.email} onChange={update} /></label>
        <label>닉네임<input name="nickname" autoComplete="nickname" maxLength="50" required value={form.nickname} onChange={update} /></label>
        <label>비밀번호<input name="password" type="password" autoComplete="new-password" minLength="8" required value={form.password} onChange={update} /></label>
        <label>비밀번호 확인<input name="confirmPassword" type="password" autoComplete="new-password" required value={form.confirmPassword} onChange={update} /></label>
        {message && <p className="message error" role="alert">{message}</p>}
        <button className="button primary full" disabled={busy}>{busy ? '가입 중...' : '가입하기'}</button>
      </form>
      <p className="form-switch">이미 계정이 있나요? <Link to="/login">로그인</Link></p>
    </section>
  );
}
