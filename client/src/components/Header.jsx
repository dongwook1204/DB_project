import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App.jsx';

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(false);
    navigate('/');
  };

  return (
    <header className="site-header">
      <Link className="brand" to="/">공유 일기장</Link>
      <nav aria-label="주 메뉴">
        {user ? (
          <>
            <Link to="/mypage">마이페이지</Link>
            <button className="text-button" onClick={handleLogout}>로그아웃</button>
          </>
        ) : (
          <>
            <Link to="/login">로그인</Link>
            <Link className="nav-signup" to="/signup">회원가입</Link>
          </>
        )}
      </nav>
    </header>
  );
}
