const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all subscription plans (global, not tenant-specific)
exports.getPlans = async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      include: {
        _count: {
          select: { companies: true }
        }
      }
    });
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Upgrade a company's subscription plan
exports.upgradeSubscription = async (req, res) => {
  const companyId = req.user.companyId;
  const { planId } = req.body;
  try {
    const updated = await prisma.company.update({
      where: { id: companyId },
      data: { planId: parseInt(planId, 10) }
    });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
