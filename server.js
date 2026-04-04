import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Khởi tạo Database nếu chưa tồn tại
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS girls (
        stt VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        wish TEXT,
        image_url TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('PostgreSQL Database Initialize Successfully');
  } catch (err) {
    console.error('Lỗi khi khởi tạo PostgreSQL:', err);
  }
};
initDB();

// Định nghĩa API Lấy 1 bản ghi
app.get('/api/girls/:stt', async (req, res) => {
  try {
    const { stt } = req.params;
    const { rows } = await pool.query('SELECT * FROM girls WHERE stt = $1', [stt]);
    if (rows.length === 0) return res.status(404).json({ message: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Định nghĩa API Lấy toàn bộ bản ghi
app.get('/api/girls', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM girls ORDER BY stt ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Create/Update bản ghi (Lưu Ảnh Nén Base64)
app.post('/api/girls', async (req, res) => {
  try {
    const { stt, name, wish, imageUrl } = req.body;
    
    // Upsert (Insert or Update) Command
    const query = `
      INSERT INTO girls (stt, name, wish, image_url, updated_at) 
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (stt) 
      DO UPDATE SET name = $2, wish = $3, image_url = $4, updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const values = [stt, name, wish, imageUrl];
    const { rows } = await pool.query(query, values);
    
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server API chạy tại http://localhost:${PORT}`));
