import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest, AuthContext } from '../App.jsx';

export default function HomePage() {
  const { user } = useContext(AuthContext);
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/api/diaries').then(setDiaries).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false));
  }, []);

  return (
    <section className="diary-list-page">
      <div className="page-heading diary-list-heading">
        <div><p className="eyebrow">서로의 하루를 나눠요</p><h1>공유 일기장</h1><p>오늘의 이야기가 내일의 위로가 됩니다.</p></div>
        {user && <Link className="button primary" to="/diaries/new">일기 쓰기</Link>}
      </div>
      {loading && <p className="loading">일기를 불러오고 있어요...</p>}
      {error && <p className="message error" role="alert">{error}</p>}
      {!loading && !error && diaries.length === 0 && <div className="empty-state">아직 작성된 일기가 없습니다.</div>}
      {!loading && !error && diaries.length > 0 && <div className="diary-grid">
        {diaries.map((diary) => <article className="diary-card" key={diary.id}>
          <div className="diary-meta"><time>{diary.diary_date}</time><span className="mood-tag">{diary.mood}</span></div>
          <h2><Link to={`/diaries/${diary.id}`}>{diary.title}</Link></h2>
          <p>{diary.content.length > 150 ? `${diary.content.slice(0, 150)}…` : diary.content}</p>
          <Link className="read-more" to={`/diaries/${diary.id}`}>일기 읽기 →</Link>
        </article>)}
      </div>}
    </section>
  );
}
