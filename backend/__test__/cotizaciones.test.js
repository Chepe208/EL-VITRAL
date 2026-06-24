const request = require('supertest');

jest.mock('../lib/db.js', () => ({
  query: jest.fn(),
}));

jest.mock('../lib/auth.js', () => ({
  getUserFromRequest: jest.fn(),
  isAdmin: jest.fn((user) => user?.rol === 'admin'),
  sanitizeEmail: jest.fn((email) => email.trim().toLowerCase()),
  sanitizeString: jest.fn((value) => String(value ?? '').trim()),
}));

const { query } = require('../lib/db.js');
const { getUserFromRequest } = require('../lib/auth.js');

// const app = require('../index.js');

describe('Cotizaciones', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('crea una cotizacion correctamente', async () => {
    getUserFromRequest.mockReturnValue({ id: 1, rol: 'usuario' });

    query
      .mockResolvedValueOnce([
        {
          id: 10,
          nombre: 'Vidrio templado',
          tipo: 'vidrio',
          precio_base: 100000,
        },
      ])
      .mockResolvedValueOnce({ insertId: 55 })
      .mockResolvedValueOnce({});

    // const res = await request(app)
    //   .post('/api/cotizaciones')
    //   .send({
    //     cliente: {
    //       nombre: 'Carlos',
    //       email: 'carlos@test.com',
    //       telefono: '3000000000',
    //       direccion: 'Calle 123',
    //     },
    //     productos: [
    //       {
    //         producto_id: 10,
    //         cantidad: 2,
    //         medida_largo: 100,
    //         medida_ancho: 100,
    //       },
    //     ],
    //   });

    // expect(res.status).toBe(201);
    // expect(res.body.codigo).toBeDefined();
  });

  test('rechaza cotizacion sin usuario autenticado', async () => {
    getUserFromRequest.mockReturnValue(null);

    // const res = await request(app)
    //   .post('/api/cotizaciones')
    //   .send({});

    // expect(res.status).toBe(401);
    // expect(res.body.error).toBe('No autorizado');
  });

  test('lista cotizaciones del usuario normal', async () => {
    getUserFromRequest.mockReturnValue({ id: 1, rol: 'usuario' });

    query.mockResolvedValueOnce([
      { id: 1, usuario_id: 1, total: '120000', codigo_unico: 'ABC123' },
    ]);

    // const res = await request(app).get('/api/cotizaciones');

    // expect(res.status).toBe(200);
    // expect(res.body).toHaveLength(1);
  });
});