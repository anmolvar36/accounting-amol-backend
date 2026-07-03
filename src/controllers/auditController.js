const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/v1/audit-logs - tenant scoped audit log
exports.getLogs = async (req, res) => {
  const companyId = req.user.companyId;
  try {
    const logs = await prisma.auditLog.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
