import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../db.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, email, nickname, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: '유효하지 않은 인증 정보입니다.' });
    }

    return res.status(200).json(users[0]);
  } catch (error) {
    console.error('프로필 조회 실패:', error.message);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

router.put('/me', authenticateToken, async (req, res) => {
  const { email, nickname } = req.body ?? {};

  if (typeof email !== 'string' || typeof nickname !== 'string') {
    return res.status(400).json({ message: '이메일과 닉네임을 문자열로 입력해 주세요.' });
  }

  const normalizedEmail = email.trim();
  const normalizedNickname = nickname.trim();
  if (!normalizedEmail || !normalizedNickname) {
    return res.status(400).json({ message: '이메일과 닉네임은 필수입니다.' });
  }
  if (!emailPattern.test(normalizedEmail) || [...normalizedEmail].length > 100) {
    return res.status(400).json({ message: '이메일 형식 또는 길이를 확인해 주세요.' });
  }
  if ([...normalizedNickname].length > 50) {
    return res.status(400).json({ message: '닉네임은 50자 이하여야 합니다.' });
  }

  try {
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND id <> ?',
      [normalizedEmail, req.user.userId]
    );
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' });
    }

    await pool.execute(
      'UPDATE users SET email = ?, nickname = ? WHERE id = ?',
      [normalizedEmail, normalizedNickname, req.user.userId]
    );

    const [users] = await pool.execute(
      'SELECT id, email, nickname, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );
    if (users.length === 0) {
      return res.status(401).json({ message: '유효하지 않은 인증 정보입니다.' });
    }

    return res.status(200).json(users[0]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' });
    }
    console.error('프로필 수정 실패:', error.message);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

router.delete('/me', authenticateToken, async (req, res) => {
  const { password } = req.body ?? {};
  if (typeof password !== 'string' || !password) {
    return res.status(400).json({ message: '현재 비밀번호를 입력해 주세요.' });
  }

  try {
    const [users] = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
      [req.user.userId]
    );
    if (users.length === 0) {
      return res.status(401).json({ message: '유효하지 않은 인증 정보입니다.' });
    }

    if (!(await bcrypt.compare(password, users[0].password))) {
      return res.status(401).json({ message: '현재 비밀번호가 올바르지 않습니다.' });
    }

    await pool.execute('DELETE FROM users WHERE id = ?', [req.user.userId]);
    return res.status(200).json({ message: '회원 탈퇴가 완료되었습니다.' });
  } catch (error) {
    console.error('회원 탈퇴 처리 실패:', error.message);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

export default router;
