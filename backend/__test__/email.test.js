const { sendEmail } = require('../lib/email.js');

describe('Envio de correo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('envia un correo correctamente usando transporter mockeado', async () => {
    const transporter = {
      sendMail: jest.fn().mockResolvedValue({
        messageId: 'correo-123',
      }),
    };

    const result = await sendEmail({
      transporter,
      to: 'cliente@test.com',
      subject: 'Cotizacion EL VITRAL',
      text: 'Tu cotizacion fue creada correctamente',
    });

    expect(result.messageId).toBe('correo-123');
    expect(transporter.sendMail).toHaveBeenCalledWith({
      from: 'EL VITRAL <no-reply@elvitral.com>',
      to: 'cliente@test.com',
      subject: 'Cotizacion EL VITRAL',
      text: 'Tu cotizacion fue creada correctamente',
      html: undefined,
    });
  });

  test('rechaza envio si faltan datos obligatorios', async () => {
    const transporter = {
      sendMail: jest.fn(),
    };

    await expect(
      sendEmail({
        transporter,
        to: '',
        subject: '',
        text: '',
      })
    ).rejects.toThrow('Faltan datos para enviar el correo');

    expect(transporter.sendMail).not.toHaveBeenCalled();
  });
});