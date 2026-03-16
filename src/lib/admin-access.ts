type AdminIdentity = {
  uid?: string | null;
  email?: string | null;
};

function parseList(value?: string): string[] {
  if (!value) return [];

  return value
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedAdmin(identity: AdminIdentity): boolean {
  const adminUids = parseList(process.env.ADMIN_UIDS);
  const adminEmails = parseList(process.env.ADMIN_EMAILS);

  const normalizedUid = identity.uid?.trim().toLowerCase() ?? null;
  const normalizedEmail = identity.email?.trim().toLowerCase() ?? null;

  return (
    (normalizedUid !== null && adminUids.includes(normalizedUid)) ||
    (normalizedEmail !== null && adminEmails.includes(normalizedEmail))
  );
}
