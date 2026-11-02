import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/signup', async (req, res) => {
  const { email, password, nickname } = req.body ?? {};

  if (typeof email !== 'string' || typeof password !== 'string' || typeof nickname !== 'string') {
    return res.status(400).json({ message: '이메일, 비밀번호, 닉네임을 문자열로 입력해 주세요.' });
  }

  if (!email.trim() || !password || !nickname.trim()) {
    return res.status(400).json({ message: '이메일, 비밀번호, 닉네임은 필수입니다.' });
  }

  if (!emailPattern.test(email) || Buffer.byteLength(email, 'utf8') > 100) {
    return res.status(400).json({ message: '이메일 형식 또는 길이를 확인해 주세요.' });
  }

  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ message: '비밀번호는 8자 이상, UTF-8 기준 72바이트 이하여야 합니다.' });
  }

  if ([...nickname].length > 50) {
    return res.status(400).json({ message: '닉네임은 50자 이하여야 합니다.' });
  }

  try {
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (email, password, nickname) VALUES (?, ?, ?)',
      [email, hashedPassword, nickname]
    );

    return res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      user: { id: result.insertId, email, nickname }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' });
    }

    console.error('회원가입 처리 실패:', error.message);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호를 입력해 주세요.' });
  }

  try {
    const [users] = await pool.execute(
      'SELECT id, email, password, nickname FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0 || !(await bcrypt.compare(password, users[0].password))) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const user = users[0];
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: '로그인되었습니다.',
      token,
      user: { id: user.id, email: user.email, nickname: user.nickname }
    });
  } catch (error) {
    console.error('로그인 처리 실패:', error.message);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

export default router;
