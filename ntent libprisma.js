[35mlib/prisma.js[m[36m:[m[32m13[m[36m:[mfunction createUnavailable[1;31mPrismaClient([m) {
[35mlib/prisma.js[m[36m:[m[32m24[m[36m:[mfunction create[1;31mPrismaClient([m) {
[35mlib/prisma.js[m[36m:[m[32m26[m[36m:[m    return createUnavailable[1;31mPrismaClient([m)
[35mlib/prisma.js[m[36m:[m[32m29[m[36m:[m  return new [1;31mPrismaClient([m{
[35mlib/prisma.js[m[36m:[m[32m35[m[36m:[mfunction isCompatible[1;31mPrismaClient([mclient) {
[35mlib/prisma.js[m[36m:[m[32m43[m[36m:[mfunction resolve[1;31mPrismaClient([m) {
[35mlib/prisma.js[m[36m:[m[32m45[m[36m:[m    return createUnavailable[1;31mPrismaClient([m)
[35mlib/prisma.js[m[36m:[m[32m50[m[36m:[m  if (isCompatible[1;31mPrismaClient([mcachedPrisma)) {
[35mlib/prisma.js[m[36m:[m[32m58[m[36m:[m  const nextPrisma = create[1;31mPrismaClient([m)
[35mlib/prisma.js[m[36m:[m[32m68[m[36m:[m  const client = resolve[1;31mPrismaClient([m)
[35mlib/prisma.js[m[36m:[m[32m85[m[36m:[m      const client = resolve[1;31mPrismaClient([m)
[35mlib/prisma.js[m[36m:[m[32m89[m[36m:[m      return Reflect.ownKeys(resolve[1;31mPrismaClient([m))
[35mlib/prisma.js[m[36m:[m[32m92[m[36m:[m      const client = resolve[1;31mPrismaClient([m)
[35mlib/prisma.js[m[36m:[m[32m108[m[36m:[m  globalForPrisma.prisma = resolve[1;31mPrismaClient([m)
[35mscripts/import-json-to-mysql.mjs[m[36m:[m[32m10[m[36m:[mconst prisma = new [1;31mPrismaClient([m{
[35mscripts/refresh-mysql-validation-baseline.mjs[m[36m:[m[32m10[m[36m:[mconst prisma = new [1;31mPrismaClient([m{
[35mscripts/seed-access-permissions.mjs[m[36m:[m[32m12[m[36m:[mconst prisma = new [1;31mPrismaClient([m{
[35mscripts/validate-mysql-import.mjs[m[36m:[m[32m11[m[36m:[mconst prisma = new [1;31mPrismaClient([m{
