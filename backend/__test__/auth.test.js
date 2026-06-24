const request = require('supertest');

jest.mock('../lib/db.js', () => ({
  query: jest.fn(),
}));

jest.mock('../lib/auth.js', () => ({
  hashPassword: jest.fn(() => Promise.resolve('hashed_password')),
  comparePassword: jest.fn(),
  sanitizeEmail: jest.fn((email) => email.trim().toLowerCase()),
  sanitizeString: jest.fn((value) => String(value ?? '').trim()),
  generateToken: jest.fn(() => 'fake-token'),
  getUserFromRequest: jest.fn(),
  isAdmin: jest.fn((user) => user?.rol === 'admin'),
  verifyToken: jest.fn(),
}));

const { query } = require('../lib/db.js');
const { comparePassword, getUserFromRequest } = require('../lib/auth.js');

// Cuando exportes tu app/server desde index.js:
// const app = require('../index.js');

describe('Autenticacion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('registra un usuario nuevo', async () => {
    query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ insertId: 1 });

    // const res = await request(app)
    //   .post('/api/auth/register')
    //   .send({
    //     nombre: 'Juan',
    //     email: 'juan@test.com',
    //     password: '123456',
    //     telefono: '3001234567',
    //     direccion: 'Calle 1',
    //   });

    // expect(res.status).toBe(201);
    // expect(res.body.message).toBe('Usuario registrado correctamente');
  });

  test('rechaza login con contraseña incorrecta', async () => {
    query.mockResolvedValueOnce([
      {
        id: 1,
        nombre: 'Juan',
        email: 'juan@test.com',
        password: 'hashed_password',
        rol: 'usuario',
        activo: 1,
        aprobado: 1,
      },
    ]);

    comparePassword.mockResolvedValueOnce(false);

    // const res = await request(app)
    //   .post('/api/auth/login')
    //   .send({ email: 'juan@test.com', password: 'bad' });

    // expect(res.status).toBe(401);
    // expect(res.body.error).toBe('Correo o contrasena incorrectos');
  });

  test('devuelve usuario autenticado en /api/auth/me', async () => {
    getUserFromRequest.mockReturnValue({ id: 1, rol: 'usuario' });

    query.mockResolvedValueOnce([
      {
        id: 1,
        nombre: 'Juan',
        email: 'juan@test.com',
        rol: 'usuario',
      },
    ]);

    // const res = await request(app).get('/api/auth/me');

    // expect(res.status).toBe(200);
    // expect(res.body.email).toBe('juan@test.com');
  });
});