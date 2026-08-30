import { createHash, randomBytes } from 'crypto';

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function newResetToken(): string {
  return randomBytes(32).toString('hex');
}

export function appBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (raw) return raw;
  return process.env.NODE_ENV === 'production'
    ? 'https://morrowhome.site'
    : 'http://localhost:3000';
}

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<{ delivered: boolean }> {
  if (!isMailConfigured()) {
    console.log('[mail] SMTP 未配置，密码重置链接（1 小时内有效）:', resetUrl);
    return { delivered: false };
  }

  const { default: nodemailer } = await import('nodemailer');
  const port = Number(process.env.SMTP_PORT || 465);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: 'VOCALOID Hub 重置密码',
    text: `你好，\n\n请在 1 小时内打开下面的链接设置新密码：\n${resetUrl}\n\n如果不是你本人操作，忽略这封信即可。`,
  });

  return { delivered: true };
}
