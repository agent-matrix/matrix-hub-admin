import { Resend } from 'resend';

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function fromAddress(): string {
  return process.env.RESEND_FROM || 'MatrixHub <onboarding@resend.dev>';
}

function appUrl(): string {
  return (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(
    /\/+$/,
    ''
  );
}

export interface EmailResult {
  ok: boolean;
  id?: string;
  error?: string;
  /** True when no RESEND_API_KEY is configured (email silently skipped). */
  skipped?: boolean;
}

const shell = (title: string, body: string) => `
<div style="background:#020403;padding:32px 0;font-family:-apple-system,Segoe UI,Roboto,sans-serif">
  <div style="max-width:480px;margin:0 auto;background:#06100B;border:1px solid rgba(0,255,136,0.18);border-radius:20px;padding:32px;color:#d7fbe8">
    <div style="font-family:monospace;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#34d399">MatrixHub</div>
    <h1 style="font-size:22px;margin:12px 0 16px;color:#ecfdf5">${title}</h1>
    ${body}
    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:28px 0 16px" />
    <p style="font-size:12px;color:rgba(215,251,232,0.5)">MatrixHub — operator console. If you didn't request this, you can ignore this email.</p>
  </div>
</div>`;

export async function sendVerificationEmail(to: string, token: string): Promise<EmailResult> {
  const c = client();
  const link = `${appUrl()}/verify?token=${encodeURIComponent(token)}`;
  if (!c) {
    // No key configured — surface the link in server logs so dev still works.
    console.warn(`[email:skipped] verification link for ${to}: ${link}`);
    return { ok: true, skipped: true };
  }
  const html = shell(
    'Verify your email',
    `<p style="font-size:14px;line-height:22px;color:rgba(215,251,232,0.8)">
       Confirm your address to activate your MatrixHub account.
     </p>
     <a href="${link}" style="display:inline-block;margin-top:8px;background:#34d399;color:#022;padding:12px 22px;border-radius:14px;font-weight:600;text-decoration:none">Verify email</a>
     <p style="font-size:12px;margin-top:18px;color:rgba(215,251,232,0.5)">Or paste this link:<br/>${link}</p>`
  );
  try {
    const { data, error } = await c.emails.send({
      from: fromAddress(),
      to: [to],
      subject: 'Verify your MatrixHub email',
      html,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function sendInviteEmail(
  to: string,
  token: string,
  tenantName: string
): Promise<EmailResult> {
  const c = client();
  const link = `${appUrl()}/accept-invite?token=${encodeURIComponent(token)}`;
  if (!c) {
    console.warn(`[email:skipped] invite link for ${to} (${tenantName}): ${link}`);
    return { ok: true, skipped: true };
  }
  const html = shell(
    `You're invited to ${tenantName}`,
    `<p style="font-size:14px;line-height:22px;color:rgba(215,251,232,0.8)">
       You've been invited to join <strong>${tenantName}</strong> on MatrixHub.
     </p>
     <a href="${link}" style="display:inline-block;margin-top:8px;background:#34d399;color:#022;padding:12px 22px;border-radius:14px;font-weight:600;text-decoration:none">Accept invitation</a>
     <p style="font-size:12px;margin-top:18px;color:rgba(215,251,232,0.5)">Or paste this link:<br/>${link}</p>`
  );
  try {
    const { data, error } = await c.emails.send({
      from: fromAddress(),
      to: [to],
      subject: `Join ${tenantName} on MatrixHub`,
      html,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}
