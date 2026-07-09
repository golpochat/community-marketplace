const { PrismaClient } = require('@prisma/client');

const fragment = process.argv[2] ?? 'sujan';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      email: { contains: fragment, mode: 'insensitive' },
    },
    select: {
      id: true,
      email: true,
      status: true,
      displayName: true,
      emailVerifiedAt: true,
      primaryRole: { select: { code: true, name: true } },
    },
    orderBy: { email: 'asc' },
  });

  if (users.length === 0) {
    console.log(`No users matching "${fragment}" in DATABASE_URL.`);
    return;
  }

  for (const u of users) {
    console.log('---');
    console.log('email:', u.email);
    console.log('role:', u.primaryRole.code);
    console.log('roleName:', u.primaryRole.name);
    console.log('status:', u.status);
    console.log('displayName:', u.displayName);
    console.log('verified:', Boolean(u.emailVerifiedAt));
    console.log('id:', u.id);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
