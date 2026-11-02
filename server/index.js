import express from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pool from './db.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(serverDirectory, '.env') });

if (!process.env.JWT_SECRET) {
  console.error('서버 시작 실패: server/.env에 JWT_SECRET을 설정하세요.');
  process.exit(1);
}

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

try {
  await pool.query('SELECT 1');
  console.log('MySQL 연결 확인 성공');
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
} catch (error) {
  console.error('MySQL 연결 확인 실패:', error.message);
  await pool.end().catch(() => {});
  process.exitCode = 1;
}
