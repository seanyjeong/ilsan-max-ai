const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const port = 8321;

app.use(cors());
app.use(express.json());

// MySQL 연결 풀
const db = mysql.createPool({
  host: '211.37.174.218',
  user: 'root',
  password: 'q141171616!',
  database: 'jungsi',
  waitForConnections: true,
  connectionLimit: 10,
});

// n8n/일산맥스AI 전용 API Key 인증
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey === 'ilsan-max-ai-key-2024') {
    return next();
  }
  return res.status(401).json({ success: false, message: 'API Key 필요' });
};

// =============================================
// API 엔드포인트
// =============================================

// 헬스체크
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ilsan-max-ai' });
});

// 대학 목록 조회
app.get('/api/universities', apiKeyAuth, async (req, res) => {
  try {
    const { year = 2025 } = req.query;
    const [rows] = await db.query(
      'SELECT DISTINCT U_ID, 대학명, 학과명 FROM 정시기본 WHERE 학년도 = ? ORDER BY 대학명, 학과명',
      [year]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('대학 목록 조회 오류:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 대학 상세 정보 (반영비율 포함)
app.get('/api/universities/:uid', apiKeyAuth, async (req, res) => {
  try {
    const { uid } = req.params;
    const { year = 2025 } = req.query;

    // 기본 정보
    const [basic] = await db.query(
      'SELECT * FROM 정시기본 WHERE U_ID = ? AND 학년도 = ?',
      [uid, year]
    );

    // 반영비율
    const [ratio] = await db.query(
      'SELECT * FROM 정시반영비율 WHERE U_ID = ? AND 학년도 = ?',
      [uid, year]
    );

    // 실기배점
    const [scores] = await db.query(
      'SELECT * FROM 정시실기배점 WHERE U_ID = ? AND 학년도 = ? ORDER BY 종목명, 성별, 기록',
      [uid, year]
    );

    res.json({
      success: true,
      data: {
        basic: basic[0] || null,
        ratio: ratio[0] || null,
        scores: scores
      }
    });
  } catch (err) {
    console.error('대학 상세 조회 오류:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 실기 점수 계산
app.post('/api/calculate-score', apiKeyAuth, async (req, res) => {
  try {
    const { uid, year = 2025, event, record, gender } = req.body;

    if (!uid || !event || record === undefined) {
      return res.status(400).json({ success: false, message: 'uid, event, record 필요' });
    }

    // 해당 종목 배점표 조회
    let query = 'SELECT * FROM 정시실기배점 WHERE U_ID = ? AND 학년도 = ? AND 종목명 = ?';
    const params = [uid, year, event];

    if (gender) {
      query += ' AND (성별 = ? OR 성별 IS NULL OR 성별 = "")';
      params.push(gender);
    }

    query += ' ORDER BY 기록';
    const [scoreTable] = await db.query(query, params);

    if (scoreTable.length === 0) {
      return res.json({ success: true, score: null, message: '배점표 없음' });
    }

    // 점수 계산 (silgical.js 로직 적용)
    const score = lookupScore(record, event, scoreTable);

    res.json({
      success: true,
      score: score,
      event: event,
      record: record
    });
  } catch (err) {
    console.error('점수 계산 오류:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// =============================================
// 실기 점수 계산 헬퍼 함수 (silgical.js에서 가져옴)
// =============================================

function getEventRules(eventName) {
  eventName = eventName || '';
  const LOW_IS_BETTER_KEYWORDS = ['m', 'run', '왕복', '초', '벽', '지그', 'z'];
  let method = 'higher_is_better';

  if (LOW_IS_BETTER_KEYWORDS.some((k) => eventName.toLowerCase().includes(k))) {
    method = 'lower_is_better';
  }
  if (eventName.includes('던지기') || eventName.includes('멀리뛰기')) {
    method = 'higher_is_better';
  }
  return method;
}

function lookupScore(studentRecord, eventName, scoreTable) {
  if (!scoreTable || scoreTable.length === 0) return 0;

  const method = getEventRules(eventName);
  const studentValueStr = String(studentRecord).trim().toUpperCase();

  // F, G, 미응시 등은 최하점
  const FORCE_MIN_KEYWORDS = ['F', 'G', '미응시', '파울', '실격'];
  if (FORCE_MIN_KEYWORDS.includes(studentValueStr)) {
    const scores = scoreTable.map(r => Number(r.배점)).filter(n => !isNaN(n));
    return Math.min(...scores);
  }

  const studentValueNum = Number(studentRecord);
  if (isNaN(studentValueNum)) return 0;

  // 숫자 기록들만 추출
  const numericLevels = scoreTable
    .filter(r => !isNaN(Number(r.기록)))
    .map(r => ({ record: Number(r.기록), score: Number(r.배점) }));

  if (numericLevels.length === 0) return 0;

  // 정렬 후 매칭
  if (method === 'lower_is_better') {
    // 낮을수록 좋음 (달리기): 내림차순, 기록 이상이면 해당 점수
    numericLevels.sort((a, b) => b.record - a.record);
    for (const level of numericLevels) {
      if (studentValueNum >= level.record) return level.score;
    }
    return numericLevels[numericLevels.length - 1].score;
  } else {
    // 높을수록 좋음 (제멀): 내림차순, 기록 이상이면 해당 점수
    numericLevels.sort((a, b) => b.record - a.record);
    for (const level of numericLevels) {
      if (studentValueNum >= level.record) return level.score;
    }
    return numericLevels[numericLevels.length - 1].score;
  }
}

// =============================================
// 서버 시작
// =============================================

app.listen(port, () => {
  console.log(`일산맥스AI 서버 실행 중: http://localhost:${port}`);
});
