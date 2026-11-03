import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiRequest, AuthContext } from '../App.jsx';

export default function DiaryDetailPage() {
  const { id } = useParams();
  const { user, logout } = useContext(AuthContext);
  const [diary, setDiary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [missing, setMissing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    apiRequest(`/api/diaries/${id}`).then((data) => { if (active) setDiary(data); })
      .catch((requestError) => {
        if (!active) return;
        if (requestError.status === 404) setMissing(true);
        else setError(requestError.message);
      }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const isOwner = diary && user && Number(diary.user_id) === Number(user.id);
  const removeDiary = async () => {
    if (!window.confirm('이 일기를 삭제할까요?')) return;
    setDeleting(true); setError('');
    try {
      await apiRequest(`/api/diaries/${id}`, { method: 'DELETE' });
      navigate('/', { replace: true });
    } catch (requestError) {
      if (requestError.status === 401) logout();
      else if (requestError.status === 403) setError('본인이 작성한 일기만 삭제할 수 있습니다.');
      else setError(requestError.message);
    } finally { setDeleting(false); }
  };

  if (loading) return <p className="loading">일기를 불러오고 있어요...</p>;
  if (missing) return <section className="empty-state"><h1>일기를 찾을 수 없습니다.</h1><Link to="/">일기 목록으로</Link></section>;
  if (!diary) return <section className="empty-state"><p className="message error">{error}</p><Link to="/">일기 목록으로</Link></section>;

  return <article className="diary-detail">
    <Link className="back-link" to="/">← 전체 일기</Link>
    {error && <p className="message error" role="alert">{error}</p>}
    <div className="diary-meta"><time>{diary.diary_date}</time><span className="mood-tag">{diary.mood}</span></div>
    <h1>{diary.title}</h1><div className="diary-content">{diary.content}</div>
    {isOwner && <div className="detail-actions">
      <Link className="button secondary" to={`/diaries/${diary.id}/edit`}>수정</Link>
      <button className="button danger" onClick={removeDiary} disabled={deleting}>{deleting ? '삭제 중...' : '삭제'}</button>
    </div>}
  </article>;
}
