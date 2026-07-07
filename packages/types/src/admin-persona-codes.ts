export const ADMIN_PERSONA_ROLE_CODES = [
  'ACCOUNTS_ADMIN',
  'MODERATION_ADMIN',
  'FINANCIAL_ADMIN',
] as const;

export type AdminPersonaRoleCode = (typeof ADMIN_PERSONA_ROLE_CODES)[number];

export function isAdminPersonaRoleCode(code: string): code is AdminPersonaRoleCode {
  return (ADMIN_PERSONA_ROLE_CODES as readonly string[]).includes(code);
}

/** ADMIN and scoped level-2 operator roles that use the `/admin` panel. */
export function isAdminPanelRoleCode(code: string): boolean {
  return code === 'ADMIN' || isAdminPersonaRoleCode(code);
}
