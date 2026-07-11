export const SUPER_ADMIN_EMAIL = 'africartsadmin99@gmail.com';

export function isSuperAdminEmail(email: string): boolean {
  return email.toLowerCase() === SUPER_ADMIN_EMAIL;
}

export function resolveUserRole(
  email: string,
  role?: string
): 'customer' | 'vendor' | 'super_admin' {
  if (isSuperAdminEmail(email)) return 'super_admin';
  if (role === 'vendor' || role === 'super_admin') return role;
  return 'customer';
}
