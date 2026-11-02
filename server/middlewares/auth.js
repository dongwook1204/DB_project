import jwt from 'jsonwebtoken';
import pool from '../db.js';

export const authenticateToken = async (req, res, next) => {
  const authorization = req.headers.authorization;
  const match = authorization?.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }

  let payload;
  try {
    payload = jwt.verify(match[1], process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: '유효하지 않은 인증 정보입니다.' });
  }

  if (!Number.isInteger(payload.userId)) {
    return res.status(401).json({ message: '유효하지 않은 인증 정보입니다.' });
  }

  try {
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [payload.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: '유효하지 않은 인증 정보입니다.' });
    }

    req.user = { userId: users[0].id };
    return next();
  } catch (error) {
    console.error('인증 회원 조회 실패:', error.message);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};
