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

/** QQ SMTP 要求 From 与登录邮箱一致，否则常被拒信 */
export function resolveSmtpFrom(smtpUser: string, smtpFrom?: string): string {
  const user = smtpUser.trim();
  const from = (smtpFrom || user).trim();
  if (!user.includes('@') || from.includes(user)) return from || user;
  const nameMatch = from.match(/^"?([^"<]+)"?\s*</);
  const name = nameMatch?.[1]?.trim() || 'VOCALOID Hub';
  return `${name} <${user}>`;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<{ delivered: boolean }> {
  if (!isMailConfigured()) {
    console.log('[mail] SMTP 未配置，密码重置链接（1 小时内有效）:', resetUrl);
    return { delivered: false };
  }

  const smtpUser = process.env.SMTP_USER || '';
  if (smtpUser && !smtpUser.includes('@')) {
    console.warn('[mail] SMTP_USER 应填完整邮箱（如 123456789@qq.com），不要只填 QQ 号');
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
    from: resolveSmtpFrom(smtpUser, process.env.SMTP_FROM),
    to,
    subject: 'VOCALOID Hub 重置密码',
    text: `你好，\n\n请在 1 小时内打开下面的链接设置新密码：\n${resetUrl}\n\n如果不是你本人操作，忽略这封信即可。`,
  });

  return { delivered: true };
}
