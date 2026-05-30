import type { NextApiRequest, NextApiResponse } from 'next';
import { SignJWT, jwtVerify } from 'jose';
import { serialize, parse } from 'cookie';

export const SESSION_COOKIE = 'mh_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionClaims {
  sub: string; // user id
  email: string;
  tenantId: string | null;
  role: string | null;
  name?: string | null;
}

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!value) {
    throw new Error('AUTH_SECRET is not configured. Set a long random string in the environment.');
  }
  return new TextEncoder().encode(value);
}

export async function signSession(claims: SessionClaims): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .setIssuer('matrixhub-admin')
    .sign(secret());
}

export async function verifySession(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: 'matrixhub-admin' });
    return {
      sub: String(payload.sub),
      email: String(payload.email),
      tenantId: (payload.tenantId as string | null) ?? null,
      role: (payload.role as string | null) ?? null,
      name: (payload.name as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export function setSessionCookie(res: NextApiResponse, token: string): void {
  res.setHeader(
    'Set-Cookie',
    serialize(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
    })
  );
}

export function clearSessionCookie(res: NextApiResponse): void {
  res.setHeader(
    'Set-Cookie',
    serialize(SESSION_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })
  );
}

export async function getSession(req: NextApiRequest): Promise<SessionClaims | null> {
  const header = req.headers.cookie;
  if (!header) return null;
  const token = parse(header)[SESSION_COOKIE];
  if (!token) return null;
  return verifySession(token);
}
