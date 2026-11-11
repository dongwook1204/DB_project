import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../App.jsx';

export default function AuthorsPage() {
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [stats, setStats] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  useEffect(() => {
    let active = true;

    // 첫 번째 JOIN: 작성자 닉네임이 포함된 일기 목록
    apiRequest('/api/diaries/with-authors')
      .then((data) => {
        if (active) setDiaries(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    // 두 번째 JOIN: 회원별 일기 개수
    apiRequest('/api/users/diary-stats')
      .then((data) => {
        if (active) setStats(data);
      })
      .catch((requestError) => {
        if (active) setStatsError(requestError.message);
      })
      .finally(() => {
        if (active) setStatsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="authors-page">
      <div className="page-heading">
        <p className="eyebrow">함께 기록한 이야기</p>
        <h1>작성자별 일기</h1>
        <p>회원들의 일기와 작성 개수를 확인할 수 있어요.</p>
      </div>

      <section className="panel" aria-labelledby="diary-list-title">
        <h2 id="diary-list-title">작성자별 일기 목록</h2>

        {loading && (
          <p className="loading">
            작성자별 일기를 불러오고 있어요...
          </p>
        )}

        {error && (
          <p className="message error" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && diaries.length === 0 && (
          <div className="empty-state">
            조회할 일기가 없습니다.
          </div>
        )}

        {!loading && !error && diaries.length > 0 && (
          <div
            className="table-scroll"
            role="region"
            aria-label="작성자별 일기 목록"
            tabIndex="0"
          >
            <table>
              <thead>
                <tr>
                  <th scope="col">작성자</th>
                  <th scope="col">일기 제목</th>
                  <th scope="col">날짜</th>
                  <th scope="col">기분</th>
                </tr>
              </thead>

              <tbody>
                {diaries.map((diary) => (
                  <tr key={diary.id}>
                    <td>{diary.nickname}</td>
                    <td>
                      <Link to={`/diaries/${diary.id}`}>
                        {diary.title}
                      </Link>
                    </td>
                    <td>{diary.diary_date}</td>
                    <td>
                      <span className="mood-tag">
                        {diary.mood}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel" aria-labelledby="diary-stats-title">
        <h2 id="diary-stats-title">회원별 일기 개수</h2>
        <p>일기를 작성하지 않은 회원도 0개로 표시됩니다.</p>

        {statsLoading && (
          <p className="loading">
            회원별 일기 개수를 불러오고 있어요...
          </p>
        )}

        {statsError && (
          <p className="message error" role="alert">
            {statsError}
          </p>
        )}

        {!statsLoading && !statsError && stats.length === 0 && (
          <div className="empty-state">
            가입한 회원이 없습니다.
          </div>
        )}

        {!statsLoading && !statsError && stats.length > 0 && (
          <div
            className="table-scroll"
            role="region"
            aria-label="회원별 일기 개수"
            tabIndex="0"
          >
            <table>
              <thead>
                <tr>
                  <th scope="col">작성자</th>
                  <th scope="col">작성한 일기 수</th>
                </tr>
              </thead>

              <tbody>
                {stats.map((member) => (
                  <tr key={member.id}>
                    <td>{member.nickname}</td>
                    <td>{member.diary_count}개</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}