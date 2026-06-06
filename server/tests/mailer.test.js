const mockSend = jest.fn().mockResolvedValue({});

jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        setCredentials: jest.fn(),
      })),
    },
    gmail: jest.fn(() => ({
      users: {
        messages: {
          send: mockSend,
        },
      },
    })),
  },
}));

describe('mailer', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    mockSend.mockClear();
    process.env = {
      ...originalEnv,
      GMAIL_CLIENT_ID: 'client-id',
      GMAIL_CLIENT_SECRET: 'client-secret',
      GMAIL_REFRESH_TOKEN: 'refresh-token',
      GMAIL_USER: 'sender@gmail.com',
      SMTP_FROM: '백석 학생 허브',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('Gmail API 설정이 있으면 Gmail API로 인증 메일을 보낸다', async () => {
    const { sendVerificationEmail, isGmailApiConfigured } = require('../src/config/mailer');

    await expect(sendVerificationEmail('student@bu.ac.kr', '123456')).resolves.toEqual({
      dev: false,
      provider: 'gmail-api',
    });

    expect(isGmailApiConfigured()).toBe(true);
    expect(mockSend).toHaveBeenCalledWith({
      userId: 'me',
      requestBody: {
        raw: expect.any(String),
      },
    });

    const raw = mockSend.mock.calls[0][0].requestBody.raw;
    const decoded = Buffer.from(
      raw.replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    ).toString('utf8');
    expect(decoded).toMatch(/From: =\?UTF-8\?B\?[^?]+\?= <sender@gmail.com>/);
    expect(decoded).toMatch(/Subject: =\?UTF-8\?B\?[^?]+\?=/);
  });

  it('한글 표시 이름을 RFC 2047 형식으로 인코딩한다', () => {
    const { formatAddressHeader } = require('../src/config/mailer');
    const formatted = formatAddressHeader('"백석 학생 허브" <sender@gmail.com>');
    expect(formatted).toMatch(/^=\?UTF-8\?B\?[^?]+\?= <sender@gmail.com>$/);
    expect(formatted).not.toContain('백석');
  });
});
