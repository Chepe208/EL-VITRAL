const request = require('supertest');

jest.mock('../lib/db.js', () => ({
  query: jest.fn(),
}));

jest.mock('../lib/auth.js', () => ({
  hashPassword: jest.fn(() => Promise.resolve('hashed_password')),
  comparePassword: jest.fn(),
  sanitizeEmail: jest.fn((email) => String(email ?? '').trim().toLowerCase()),
  sanitizeString: jest.fn((value) => String(value ?? '').trim()),
  generateToken: jest.fn(),
  getUserFromRequest: jest.fn(),
  isAdmin: jest.fn((user) => user?.rol === 'admin'),
  verifyToken: jest.fn(),
}));

const { query } = require('../lib/db.js');
const { hashPassword } = require('../lib/auth.js');
const app = require('../index.js');

describe('Registro - POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('registra un usuario nuevo correctamente', async () => {
    query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ insertId: 1 });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Maria Lopez',
        email: 'maria@test.com',
        password: '123456',
        telefono: '3001234567',
        direccion: 'Calle 1',
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Usuario registrado correctamente');
    expect(hashPassword).toHaveBeenCalledWith('123456');
    expect(query.mock.calls[1][0]).toContain('INSERT INTO usuarios');
  });

  test('rechaza registro si faltan campos obligatorios', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: '',
        email: 'maria@test.com',
        password: '',
      });

    expect(res.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });

  test('rechaza registro si el correo ya existe', async () => {
    query.mockResolvedValueOnce([{ id: 1 }]);

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Maria Lopez',
        email: 'maria@test.com',
        password: '123456',
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBeDefined();
  });
});