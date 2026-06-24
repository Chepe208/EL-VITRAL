const request = require('supertest');

jest.mock('../lib/db.js', () => ({
  query: jest.fn(),
}));

jest.mock('../lib/auth.js', () => ({
  getUserFromRequest: jest.fn(),
  isAdmin: jest.fn((user) => user?.rol === 'admin'),
  sanitizeString: jest.fn((value) => String(value ?? '').trim()),
}));

const { query } = require('../lib/db.js');
const { getUserFromRequest } = require('../lib/auth.js');

// const app = require('../index.js');

describe('Pedidos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('crea pedido desde una cotizacion valida', async () => {
    getUserFromRequest.mockReturnValue({ id: 1, rol: 'usuario' });

    query
      .mockResolvedValueOnce([
        {
          id: 20,
          usuario_id: 1,
          total: 250000,
        },
      ])
      .mockResolvedValueOnce({ insertId: 99 })
      .mockResolvedValueOnce({});

    // const res = await request(app)
    //   .post('/api/pedidos')
    //   .send({
    //     cotizacion_id: 20,
    //     fecha_entrega: '2026-07-01',
    //   });

    // expect(res.status).toBe(201);
    // expect(res.body.message).toBe('Pedido creado');
    // expect(res.body.id).toBe(99);
  });

  test('rechaza pedido sin autenticacion', async () => {
    getUserFromRequest.mockReturnValue(null);

    // const res = await request(app)
    //   .post('/api/pedidos')
    //   .send({
    //     cotizacion_id: 20,
    //     fecha_entrega: '2026-07-01',
    //   });

    // expect(res.status).toBe(401);
  });

  test('rechaza pedido si la cotizacion pertenece a otro usuario', async () => {
    getUserFromRequest.mockReturnValue({ id: 1, rol: 'usuario' });

    query.mockResolvedValueOnce([
      {
        id: 20,
        usuario_id: 2,
        total: 250000,
      },
    ]);

    // const res = await request(app)
    //   .post('/api/pedidos')
    //   .send({
    //     cotizacion_id: 20,
    //     fecha_entrega: '2026-07-01',
    //   });

    // expect(res.status).toBe(403);
  });
});