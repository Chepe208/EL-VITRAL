const request = require('supertest');

jest.mock('../lib/db.js', () => ({
  query: jest.fn(),
}));

jest.mock('../lib/auth.js', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
  sanitizeEmail: jest.fn((email) => String(email ?? '').trim().toLowerCase()),
  sanitizeString: jest.fn((value) => String(value ?? '').trim()),
  generateToken: jest.fn(),
  getUserFromRequest: jest.fn(),
  isAdmin: jest.fn((user) => user?.rol === 'admin'),
  verifyToken: jest.fn(),
}));

const { query } = require('../lib/db.js');
const { getUserFromRequest } = require('../lib/auth.js');
const app = require('../index.js');

describe('CRUD Productos - /api/admin/productos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getUserFromRequest.mockReturnValue({ id: 1, rol: 'admin' });
  });

  test('crea un producto correctamente', async () => {
    query.mockResolvedValueOnce({ insertId: 10 });

    const res = await request(app)
      .post('/api/admin/productos')
      .send({
        nombre: 'Vidrio templado',
        descripcion: 'Vidrio de seguridad',
        tipo: 'vidrio',
        unidad_medida: 'm2',
        precio_base: 120000,
        imagen_url: '',
        stock: 5,
        activo: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Producto creado');
    expect(res.body.id).toBe(10);
    expect(query.mock.calls[0][0]).toContain('INSERT INTO productos');
  });

  test('actualiza un producto correctamente', async () => {
    query.mockResolvedValueOnce({});

    const res = await request(app)
      .patch('/api/admin/productos/10')
      .send({
        nombre: 'Vidrio actualizado',
        precio_base: 150000,
        stock: 8,
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Producto actualizado');
    expect(query.mock.calls[0][0]).toContain('UPDATE productos SET');
  });

  test('elimina un producto correctamente', async () => {
    query.mockResolvedValueOnce({});

    const res = await request(app)
      .delete('/api/admin/productos/10');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Producto eliminado');
    expect(query).toHaveBeenCalledWith(
      'DELETE FROM productos WHERE id = ?',
      [10]
    );
  });

  test('rechaza crear producto con campos incompletos', async () => {
    const res = await request(app)
      .post('/api/admin/productos')
      .send({
        nombre: '',
        tipo: '',
        unidad_medida: '',
        precio_base: 0,
      });

    expect(res.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
});