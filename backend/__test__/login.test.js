const request = require('supertest');

jest.mock('../lib/db.js', () => ({
  query: jest.fn(),
}));

jest.mock('../lib/auth.js', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
  sanitizeEmail: jest.fn((email) => String(email ?? '').trim().toLowerCase()),
  sanitizeString: jest.fn((value) => String(value ?? '').trim()),
  generateToken: jest.fn(() => 'fake-token'),
  getUserFromRequest: jest.fn(),
  isAdmin: jest.fn((user) => user?.rol === 'admin'),
  verifyToken: jest.fn(),
}));

const { query } = require('../lib/db.js');
const { comparePassword, generateToken } = require('../lib/auth.js');
const app = require('../index.js');

describe('Login - POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('inicia sesion correctamente con credenciales validas', async () => {
    query.mockResolvedValueOnce([
      {
        id: 1,
        nombre: 'Juan Perez',
        email: 'juan@test.com',
        password: 'hashed_password',
        rol: 'usuario',
        activo: 1,
        aprobado: 1,
      },
    ]);

    comparePassword.mockResolvedValueOnce(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'juan@test.com',
        password: '123456',
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
    expect(generateToken).toHaveBeenCalledWith({
      id: 1,
      rol: 'usuario',
      nombre: 'Juan Perez',
      email: 'juan@test.com',
    });
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('rechaza login con password incorrecto', async () => {
    query.mockResolvedValueOnce([
      {
        id: 1,
        nombre: 'Juan Perez',
        email: 'juan@test.com',
        password: 'hashed_password',
        rol: 'usuario',
        activo: 1,
        aprobado: 1,
      },
    ]);

    comparePassword.mockResolvedValueOnce(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'juan@test.com',
        password: 'incorrecta',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  test('rechaza login si el usuario no existe', async () => {
    query.mockResolvedValueOnce([]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'noexiste@test.com',
        password: '123456',
      });

    expect(res.status).toBe(401);
    expect(comparePassword).not.toHaveBeenCalled();
  });
});