import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();
const allowedMoods = new Set(['행복', '평온', '슬픔', '화남', '피곤']);
const textMaximumBytes = 65535;

function isValidId(value) {
  return /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));
}

function validateDiary(input) {
  const { title, content, diary_date: diaryDate, mood } = input ?? {};

  if (typeof title !== 'string' || typeof content !== 'string' ||
      typeof diaryDate !== 'string' || typeof mood !== 'string') {
    return '제목, 내용, 날짜, 기분을 올바른 형식으로 입력해 주세요.';
  }
  if (!title.trim() || !content.trim()) {
    return '제목과 내용은 공백만 입력할 수 없습니다.';
  }
  if ([...title].length > 150) return '제목은 150자 이하여야 합니다.';
  if (Buffer.byteLength(content, 'utf8') > textMaximumBytes) {
    return '내용이 데이터베이스에 저장할 수 있는 길이를 초과했습니다.';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(diaryDate)) {
    return '날짜는 YYYY-MM-DD 형식으로 입력해 주세요.';
  }
  const [year, month, day] = diaryDate.split('-').map(Number);
  const actualDate = new Date(Date.UTC(year, month - 1, day));
  if (actualDate.getUTCFullYear() !== year || actualDate.getUTCMonth() !== month - 1 || actualDate.getUTCDate() !== day) {
    return '실제로 존재하는 날짜를 입력해 주세요.';
  }
  if (!allowedMoods.has(mood) || [...mood].length > 20) {
    return '기분은 행복, 평온, 슬픔, 화남, 피곤 중에서 선택해 주세요.';
  }
  return null;
}

const diaryFields = `id, user_id, title, content,
  DATE_FORMAT(diary_date, '%Y-%m-%d') AS diary_date, mood`;

router.post('/', authenticateToken, async (req, res) => {
  const validationError = validateDiary(req.body);
  if (validationError) return res.status(400).json({ message: validationError });

  const { title, content, diary_date: diaryDate, mood } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO diaries (user_id, title, content, diary_date, mood) VALUES (?, ?, ?, ?, ?)',
      [req.user.userId, title.trim(), content, diaryDate, mood]
    );
    const [diaries] = await pool.execute(
      `SELECT ${diaryFields} FROM diaries WHERE id = ?`,
      [result.insertId]
    );
    return res.status(201).json(diaries[0]);
  } catch (error) {
    console.error('일기 작성 실패:', error.message);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

router.get('/', async (req, res) => {
  try {
    const [diaries] = await pool.execute(
      `SELECT ${diaryFields} FROM diaries ORDER BY diary_date DESC, id DESC`
    );
    return res.status(200).json(diaries);
  } catch (error) {
    console.error('일기 목록 조회 실패:', error.message);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

router.get('/with-authors', async (req, res) => {
  try {
    const [diaries] = await pool.execute(
      `SELECT d.id, d.user_id, d.title,
        DATE_FORMAT(d.diary_date, '%Y-%m-%d') AS diary_date,
        d.mood, u.nickname AS nickname
       FROM diaries d
       INNER JOIN users u ON d.user_id = u.id
       ORDER BY d.diary_date DESC, d.id DESC`
    );
    return res.status(200).json(diaries);
  } catch (error) {
    console.error('작성자 포함 일기 조회 실패:', error.message);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

router.get('/:id', async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: '일기 번호는 양의 정수여야 합니다.' });
  }
  try {
    const [diaries] = await pool.execute(
      `SELECT ${diaryFields} FROM diaries WHERE id = ?`,
      [Number(req.params.id)]
    );
    if (diaries.length === 0) return res.status(404).json({ message: '일기를 찾을 수 없습니다.' });
    return res.status(200).json(diaries[0]);
  } catch (error) {
    console.error('일기 상세 조회 실패:', error.message);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: '일기 번호는 양의 정수여야 합니다.' });
  }
  const validationError = validateDiary(req.body);
  if (validationError) return res.status(400).json({ message: validationError });

  const diaryId = Number(req.params.id);
  const { title, content, diary_date: diaryDate, mood } = req.body;
  try {
    const [existing] = await pool.execute(
      'SELECT id, user_id FROM diaries WHERE id = ?',
      [diaryId]
    );
    if (existing.length === 0) return res.status(404).json({ message: '일기를 찾을 수 없습니다.' });
    if (existing[0].user_id !== req.user.userId) {
      return res.status(403).json({ message: '본인이 작성한 일기만 수정할 수 있습니다.' });
    }

    await pool.execute(
      'UPDATE diaries SET title = ?, content = ?, diary_date = ?, mood = ? WHERE id = ? AND user_id = ?',
      [title.trim(), content, diaryDate, mood, diaryId, req.user.userId]
    );
    const [diaries] = await pool.execute(
      `SELECT ${diaryFields} FROM diaries WHERE id = ? AND user_id = ?`,
      [diaryId, req.user.userId]
    );
    if (diaries.length === 0) return res.status(404).json({ message: '일기를 찾을 수 없습니다.' });
    return res.status(200).json(diaries[0]);
  } catch (error) {
    console.error('일기 수정 실패:', error.message);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: '일기 번호는 양의 정수여야 합니다.' });
  }
  const diaryId = Number(req.params.id);
  try {
    const [existing] = await pool.execute(
      'SELECT id, user_id FROM diaries WHERE id = ?',
      [diaryId]
    );
    if (existing.length === 0) return res.status(404).json({ message: '일기를 찾을 수 없습니다.' });
    if (existing[0].user_id !== req.user.userId) {
      return res.status(403).json({ message: '본인이 작성한 일기만 삭제할 수 있습니다.' });
    }

    const [result] = await pool.execute(
      'DELETE FROM diaries WHERE id = ? AND user_id = ?',
      [diaryId, req.user.userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: '일기를 찾을 수 없습니다.' });
    return res.status(200).json({ message: '일기가 삭제되었습니다.' });
  } catch (error) {
    console.error('일기 삭제 실패:', error.message);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

export default router;
