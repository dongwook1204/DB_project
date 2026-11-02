import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../App.jsx';

export default function HomePage() {
  const { user } = useContext(AuthContext);
  return (
    <section className="hero">
      <p className="eyebrow">마음을 기록하고 함께 나눠요</p>
      <h1>오늘의 이야기가<br />내일의 위로가 되도록</h1>
      <p className="hero-copy">공유 일기장은 하루의 생각과 기분을 기록하고 서로의 이야기를 나누기 위한 공간입니다.</p>
      <div className="button-row">
        {user ? <Link className="button primary" to="/mypage">마이페이지</Link> : <>
          <Link className="button primary" to="/signup">시작하기</Link>
          <Link className="button secondary" to="/login">로그인</Link>
        </>}
      </div>
      <p className="feature-note">회원 기능을 먼저 준비하고 있어요. 일기 작성 기능은 곧 만날 수 있습니다.</p>
    </section>
  );
}
