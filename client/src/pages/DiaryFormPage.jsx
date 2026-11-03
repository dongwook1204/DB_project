import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiRequest, AuthContext } from '../App.jsx';

const moods = ['행복', '평온', '슬픔', '화남', '피곤'];

function getLocalDate() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export default function DiaryFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const { user, logout } = useContext(AuthContext);
  const [form, setForm] = useState({ title: '', content: '', diary_date: getLocalDate(), mood: '평온' });
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!editing) return;
    let active = true;
    apiRequest(`/api/diaries/${id}`).then((diary) => {
      if (!active) return;
      if (Number(diary.user_id) !== Number(user.id)) {
        setError('본인이 작성한 일기만 수정할 수 있습니다.');
        return;
      }
      setForm({ title: diary.title, content: diary.content, diary_date: diary.diary_date, mood: diary.mood });
    }).catch((requestError) => {
      if (!active) return;
      if (requestError.status === 401) logout();
      else setError(requestError.status === 404 ? '일기를 찾을 수 없습니다.' : requestError.message);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [editing, id, user.id, logout]);

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault(); setError('');
    if (!form.title.trim() || !form.content.trim()) return setError('제목과 내용은 필수입니다.');
    if ([...form.title].length > 150) return setError('제목은 150자 이하여야 합니다.');
    if (new TextEncoder().encode(form.content).length > 65535) return setError('내용이 허용된 길이를 초과했습니다.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.diary_date)) return setError('날짜는 YYYY-MM-DD 형식이어야 합니다.');
    const [year, month, day] = form.diary_date.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return setError('실제로 존재하는 날짜를 입력해 주세요.');
    if (!moods.includes(form.mood)) return setError('기분을 선택해 주세요.');

    setSaving(true);
    try {
      const diary = await apiRequest(editing ? `/api/diaries/${id}` : '/api/diaries', {
        method: editing ? 'PUT' : 'POST', body: JSON.stringify(form)
      });
      navigate(`/diaries/${diary.id}`, { replace: true });
    } catch (requestError) {
      if (requestError.status === 401) logout();
      else if (requestError.status === 403) setError('본인이 작성한 일기만 수정할 수 있습니다.');
      else setError(requestError.message);
    } finally { setSaving(false); }
  };

  if (loading) return <p className="loading">일기 정보를 불러오고 있어요...</p>;
  const blocked = editing && (error.includes('본인이 작성') || error.includes('찾을 수'));
  return <section className="form-card diary-form-card">
    <Link className="back-link" to={editing ? `/diaries/${id}` : '/'}>← 돌아가기</Link>
    <p className="eyebrow">나의 하루 기록</p><h1>{editing ? '일기 수정' : '일기 쓰기'}</h1>
    {error && <p className="message error" role="alert">{error}</p>}
    {blocked ? <Link className="button secondary" to="/">일기 목록으로</Link> : <form onSubmit={submit}>
      <label>제목<input name="title" maxLength="150" required value={form.title} onChange={change} /></label>
      <label>내용<textarea name="content" rows="9" required value={form.content} onChange={change} /></label>
      <label>날짜<input name="diary_date" type="date" required value={form.diary_date} onChange={change} /></label>
      <label>기분<select name="mood" value={form.mood} onChange={change}>{moods.map((mood) => <option key={mood}>{mood}</option>)}</select></label>
      <button className="button primary full" disabled={saving}>{saving ? '저장 중...' : '저장하기'}</button>
    </form>}
  </section>;
}
