import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../App.jsx';

export default function AuthorsPage() {
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/api/diaries/with-authors').then(setDiaries).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false));
  }, []);

  return <section className="authors-page">
    <div className="page-heading"><p className="eyebrow">함께 기록한 이야기</p><h1>작성자별 일기</h1><p>회원과 일기를 JOIN한 결과입니다.</p></div>
    {loading && <p className="loading">작성자별 일기를 불러오고 있어요...</p>}
    {error && <p className="message error" role="alert">{error}</p>}
    {!loading && !error && diaries.length === 0 && <div className="empty-state">조회할 일기가 없습니다.</div>}
    {!loading && !error && diaries.length > 0 && <div className="table-scroll" role="region" aria-label="작성자별 일기 목록" tabIndex="0">
      <table><thead><tr><th>작성자</th><th>일기 제목</th><th>날짜</th><th>기분</th></tr></thead>
        <tbody>{diaries.map((diary) => <tr key={diary.id}>
          <td>{diary.nickname}</td><td><Link to={`/diaries/${diary.id}`}>{diary.title}</Link></td>
          <td>{diary.diary_date}</td><td><span className="mood-tag">{diary.mood}</span></td>
        </tr>)}</tbody>
      </table>
    </div>}
  </section>;
}
