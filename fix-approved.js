const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  // Set semua user yang isApproved = null menjadi true
  const result = await p.user.updateMany({
    where: { isApproved: null },
    data: { isApproved: true }
  })
  console.log('Fixed:', result.count, 'users')

  const users = await p.user.findMany({ select: { email: true, isApproved: true, isActive: true } })
  console.log(JSON.stringify(users, null, 2))
}

main().catch(console.error).finally(() => p.$disconnect())
