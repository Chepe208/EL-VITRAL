import mysql from 'mysql2/promise';

const poolConfig: any = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'el_vitral_db',
  waitForConnections: true,
  connectionLimit: 10,
};

if (process.env.DB_SSL === 'true') {
  poolConfig.ssl = {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true,
  };
}

const pool = mysql.createPool(poolConfig);

export async function query(sql: string, params?: any[]) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error: any) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function testConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
    return true;
  } finally {
    conn.release();
  }
}