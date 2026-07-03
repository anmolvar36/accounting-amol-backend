require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDashboard() {
  try {
    const activeCompanies = await prisma.company.count({ where: { status: 'ACTIVE' } });
    const activeSubscriptions = await prisma.company.count({ where: { status: 'ACTIVE', planId: { not: null } } });
    const inactiveSubscriptions = await prisma.company.count({ where: { status: { not: 'ACTIVE' } } });

    const companiesWithPlans = await prisma.company.findMany({
      where: { status: 'ACTIVE', planId: { not: null } },
      include: { plan: true }
    });
    const mrr = companiesWithPlans.reduce((sum, c) => sum + (c.plan?.price || 0), 0);

    console.log('Dashboard Metrics:');
    console.log('  Total Active Companies:', activeCompanies);
    console.log('  Active Subscriptions:', activeSubscriptions);
    console.log('  Inactive Subscriptions:', inactiveSubscriptions);
    console.log('  MRR: ₹', mrr);

    const allCompanies = await prisma.company.findMany({ include: { plan: true }, orderBy: { createdAt: 'desc' } });
    console.log('\nAll Companies:');
    allCompanies.forEach(c => console.log(`  - ${c.name} | Plan: ${c.plan?.name || 'None'} | Status: ${c.status}`));
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboard();
