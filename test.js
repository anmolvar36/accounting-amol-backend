const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.invoice.findMany({ select: { id: true, invoiceNo: true, type: true, date: true } }).then(res => {
  console.log(JSON.stringify(res, null, 2));
  prisma.$disconnect();
});
