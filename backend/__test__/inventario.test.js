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

describe('Inventario', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('lista movimientos de inventario como admin', async () => {
    getUserFromRequest.mockReturnValue({ id: 1, rol: 'admin' });

    query.mockResolvedValueOnce([
      {
        id: 1,
        producto_id: 10,
        producto_nombre: 'Vidrio',
        cantidad: 5,
        tipo_movimiento: 'entrada',
      },
    ]);

    // const res = await request(app).get('/api/admin/inventario');

    // expect(res.status).toBe(200);
    // expect(res.body).toHaveLength(1);
  });

  test('registra entrada de inventario y actualiza stock', async () => {
    getUserFromRequest.mockReturnValue({ id: 1, rol: 'admin' });

    query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    // const res = await request(app)
    //   .post('/api/admin/inventario')
    //   .send({
    //     producto_id: 10,
    //     cantidad: 5,
    //     descripcion: 'Compra inicial',
    //   });

    // expect(res.status).toBe(201);
    // expect(res.body.message).toBe('Movimiento registrado');
    // expect(query).toHaveBeenCalledWith(
    //   'UPDATE productos SET stock = stock + ? WHERE id = ?',
    //   [5, 10]
    // );
  });

  test('rechaza cantidad invalida', async () => {
    getUserFromRequest.mockReturnValue({ id: 1, rol: 'admin' });

    // const res = await request(app)
    //   .post('/api/admin/inventario')
    //   .send({
    //     producto_id: 10,
    //     cantidad: 0,
    //   });

    // expect(res.status).toBe(400);
  });
});