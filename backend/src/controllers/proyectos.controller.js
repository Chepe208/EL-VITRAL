const { query } = require('../../lib/db.js');
const { requireAdmin, sanitizeString } = require('../../lib/auth.js');
const { sendJSON, parseBody } = require('../utils/http.js');
const { formatNumericRow, createProjectSlug } = require('../utils/formatters.js');

async function getPublicProjects(req, res) {
  const proyectos = await query(`
    SELECT id, titulo, slug, resumen, descripcion, imagen_url, tecnologias, orden, activo, fecha_creacion, fecha_actualizacion
    FROM proyectos_destacados
    WHERE activo = 1
    ORDER BY orden ASC, fecha_creacion DESC
  `);
  return sendJSON(res, 200, Array.isArray(proyectos) ? proyectos.map(formatNumericRow) : []);
}

async function getProjectBySlug(req, res, slug) {
  const sanitizedSlug = sanitizeString(decodeURIComponent(slug));
  const rows = await query(`
    SELECT id, titulo, slug, resumen, descripcion, imagen_url, tecnologias, orden, activo, fecha_creacion, fecha_actualizacion
    FROM proyectos_destacados
    WHERE slug = ? AND activo = 1
    LIMIT 1
  `, [sanitizedSlug]);
  if (!Array.isArray(rows) || rows.length === 0) {
    return sendJSON(res, 404, { error: 'Proyecto no encontrado' });
  }
  return sendJSON(res, 200, formatNumericRow(rows[0]));
}

async function getAdminProjects(req, res) {
  const adminCheck = requireAdmin(req);
  if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });
  const proyectos = await query(`
    SELECT id, titulo, slug, resumen, descripcion, imagen_url, tecnologias, orden, activo, fecha_creacion, fecha_actualizacion
    FROM proyectos_destacados
    ORDER BY orden ASC, fecha_creacion DESC
  `);
  return sendJSON(res, 200, Array.isArray(proyectos) ? proyectos.map(formatNumericRow) : []);
}

async function createAdminProject(req, res) {
  const adminCheck = requireAdmin(req);
  if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });
  const body = await parseBody(req);
  const titulo = sanitizeString(body.titulo || '');
  const slug = createProjectSlug(body.slug || titulo);
  const resumen = sanitizeString(body.resumen || '');
  const descripcion = sanitizeString(body.descripcion || '');
  const imagenUrl = sanitizeString(body.imagen_url || '');
  const tecnologias = sanitizeString(body.tecnologias || '');
  const orden = Number(body.orden ?? 0);
  const activo = body.activo === false ? 0 : 1;

  if (!titulo || !slug || !resumen || !imagenUrl || !Number.isInteger(orden)) {
    return sendJSON(res, 400, { error: 'Título, resumen, imagen y orden válido son obligatorios' });
  }

  const existentes = await query('SELECT id FROM proyectos_destacados WHERE slug = ?', [slug]);
  if (Array.isArray(existentes) && existentes.length > 0) {
    return sendJSON(res, 409, { error: 'Ya existe un proyecto con ese enlace (slug)' });
  }

  const result = await query(`
    INSERT INTO proyectos_destacados (titulo, slug, resumen, descripcion, imagen_url, tecnologias, orden, activo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [titulo, slug, resumen, descripcion || null, imagenUrl, tecnologias || null, orden, activo]);

  return sendJSON(res, 201, { message: 'Proyecto creado', id: result.insertId });
}

async function updateAdminProject(req, res, id) {
  const adminCheck = requireAdmin(req);
  if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });

  if (!Number.isInteger(id) || id < 1) {
    return sendJSON(res, 400, { error: 'ID de proyecto inválido' });
  }

  const body = await parseBody(req);
  const has = (key) => Object.prototype.hasOwnProperty.call(body, key);
  const updates = {};

  if (has('titulo')) {
    const titulo = sanitizeString(body.titulo);
    if (!titulo) return sendJSON(res, 400, { error: 'El título es obligatorio' });
    updates.titulo = titulo;
  }
  if (has('slug')) {
    const slug = createProjectSlug(body.slug);
    if (!slug) return sendJSON(res, 400, { error: 'El enlace del proyecto es obligatorio' });
    updates.slug = slug;
  }
  if (has('resumen')) {
    const resumen = sanitizeString(body.resumen);
    if (!resumen) return sendJSON(res, 400, { error: 'El resumen es obligatorio' });
    updates.resumen = resumen;
  }
  if (has('descripcion')) updates.descripcion = sanitizeString(body.descripcion) || null;
  if (has('imagen_url')) {
    const imagenUrl = sanitizeString(body.imagen_url);
    if (!imagenUrl) return sendJSON(res, 400, { error: 'La imagen es obligatoria' });
    updates.imagen_url = imagenUrl;
  }
  if (has('tecnologias')) updates.tecnologias = sanitizeString(body.tecnologias) || null;
  if (has('orden')) {
    const orden = Number(body.orden);
    if (!Number.isInteger(orden)) return sendJSON(res, 400, { error: 'El orden debe ser un número entero' });
    updates.orden = orden;
  }
  if (has('activo')) updates.activo = body.activo ? 1 : 0;

  const updateFields = Object.keys(updates);
  if (updateFields.length === 0) {
    return sendJSON(res, 400, { error: 'No hay datos para actualizar' });
  }

  if (updates.slug) {
    const existentes = await query('SELECT id FROM proyectos_destacados WHERE slug = ? AND id != ?', [updates.slug, id]);
    if (Array.isArray(existentes) && existentes.length > 0) {
      return sendJSON(res, 409, { error: 'Ya existe un proyecto con ese enlace (slug)' });
    }
  }

  const params = updateFields.map((field) => updates[field]);
  params.push(id);
  const result = await query(`UPDATE proyectos_destacados SET ${updateFields.map((field) => `${field} = ?`).join(', ')} WHERE id = ?`, params);
  if (!result.affectedRows) {
    return sendJSON(res, 404, { error: 'Proyecto no encontrado' });
  }

  return sendJSON(res, 200, { message: 'Proyecto actualizado' });
}

module.exports = {
  getPublicProjects,
  getProjectBySlug,
  getAdminProjects,
  createAdminProject,
  updateAdminProject,
};
