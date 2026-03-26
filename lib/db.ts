import mysql from 'mysql2/promise';

const requiredDbVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingDbVars = requiredDbVars.filter((k) => process.env[k] === undefined || process.env[k] === null);

if (missingDbVars.length) {
  console.warn(`Faltan variables de entorno para DB: ${missingDbVars.join(', ')}`);
}

const pool = mysql.createPool({
  host: (process.env.DB_HOST as string) || 'localhost',
  user: (process.env.DB_USER as string) || 'root',
  password: (process.env.DB_PASSWORD as string) || '',
  database: (process.env.DB_NAME as string) || 'el_vitral_db',
  waitForConnections: true,
  connectionLimit: 10,
});

export async function query(sql: string, params?: any[]) {
  if (missingDbVars.length) {
    throw new Error(`Faltan variables de entorno para DB: ${missingDbVars.join(', ')}`);
  }
  const [rows] = await pool.execute(sql, params);
  return rows;
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