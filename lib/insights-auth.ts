export function verifyAdminToken(token: string | null): boolean {
  const adminToken = process.env.INSIGHTS_ADMIN_TOKEN;
  if (!adminToken) return false;
  return token === adminToken;
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/);
  return match ? match[1] : null;
}
