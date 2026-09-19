const { query } = require('../../lib/db.js');

async function ensureSurveyTable() {
  await query(
    'CREATE TABLE IF NOT EXISTS encuestas_satisfaccion (' +
      'id INT PRIMARY KEY AUTO_INCREMENT, ' +
      'pedido_id INT NOT NULL, ' +
      'usuario_id VARCHAR(36) NOT NULL, ' +
      'calificacion TINYINT NOT NULL, ' +
      'comentario TEXT, ' +
      'fecha_respuesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP, ' +
      'UNIQUE KEY unique_encuesta_pedido (pedido_id), ' +
      'FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE, ' +
      'FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE' +
      ')'
  );
}

async function ensurePasswordResetColumns() {
  const tokenColumn = await query("SHOW COLUMNS FROM usuarios LIKE 'reset_token'");
  if (!Array.isArray(tokenColumn) || tokenColumn.length === 0) {
    await query('ALTER TABLE usuarios ADD COLUMN reset_token VARCHAR(255) NULL');
  }

  const expiresColumn = await query("SHOW COLUMNS FROM usuarios LIKE 'reset_expires_at'");
  if (!Array.isArray(expiresColumn) || expiresColumn.length === 0) {
    await query('ALTER TABLE usuarios ADD COLUMN reset_expires_at DATETIME NULL');
  }
}

async function ensureGoogleIdColumn() {
  const googleColumn = await query("SHOW COLUMNS FROM usuarios LIKE 'google_id'");
  if (!Array.isArray(googleColumn) || googleColumn.length === 0) {
    await query('ALTER TABLE usuarios ADD COLUMN google_id VARCHAR(255) NULL');
    await query('CREATE UNIQUE INDEX idx_usuarios_google_id ON usuarios (google_id)');
  }
}

async function ensureAgendaDiasDisponiblesTable() {
  try {
    await query(
      'CREATE TABLE IF NOT EXISTS agenda_dias_disponibles (' +
        'id INT PRIMARY KEY AUTO_INCREMENT, ' +
        'fecha DATE NOT NULL, ' +
        'fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP, ' +
        'UNIQUE KEY uq_agenda_fecha (fecha)' +
        ')'
    );
  } catch (error) {
    console.error('Error ensuring agenda_dias_disponibles table:', error.message);
  }
}

async function ensureUltimaAgendaColumn() {
  const col = await query("SHOW COLUMNS FROM usuarios LIKE 'ultima_agenda'");
  if (!Array.isArray(col) || col.length === 0) {
    await query('ALTER TABLE usuarios ADD COLUMN ultima_agenda DATETIME NULL');
  }
}

async function ensureConsentColumns() {
  const columns = [
    ['politica_datos_aceptada', 'BOOLEAN NOT NULL DEFAULT false'],
    ['politica_datos_aceptada_at', 'TIMESTAMP NULL'],
    ['terminos_aceptados', 'BOOLEAN NOT NULL DEFAULT false'],
    ['terminos_aceptados_at', 'TIMESTAMP NULL'],
  ];
  for (const [name, definition] of columns) {
    const result = await query(
      'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['usuarios', name]
    );
    if (!Array.isArray(result) || result.length === 0) {
      await query(`ALTER TABLE usuarios ADD COLUMN ${name} ${definition}`);
    }
  }
}

module.exports = {
  ensureSurveyTable,
  ensurePasswordResetColumns,
  ensureGoogleIdColumn,
  ensureAgendaDiasDisponiblesTable,
  ensureUltimaAgendaColumn,
  ensureConsentColumns,
};
