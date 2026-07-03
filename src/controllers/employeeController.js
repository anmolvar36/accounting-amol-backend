const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all employees for the tenant
exports.getEmployees = async (req, res) => {
  const companyId = req.user.companyId;
  try {
    const employees = await prisma.employee.findMany({
      where: { companyId }
    });
    res.status(200).json({ success: true, data: employees });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create a new employee
exports.createEmployee = async (req, res) => {
  const companyId = req.user.companyId;
  const { 
    name, mobile, city, joiningDate, designation, salary, 
    paidHoliday, commission, specialCommission, totalSaleCommission, 
    commissionOnManufacturing 
  } = req.body;
  try {
    const employee = await prisma.employee.create({
      data: {
        name,
        mobile: mobile || null,
        city: city || null,
        joiningDate: joiningDate || null,
        designation: designation || null,
        salary: parseFloat(salary) || 0,
        paidHoliday: parseInt(paidHoliday, 10) || 0,
        commission: parseFloat(commission) || 0,
        specialCommission: parseFloat(specialCommission) || 0,
        totalSaleCommission: parseFloat(totalSaleCommission) || 0,
        commissionOnManufacturing: parseFloat(commissionOnManufacturing) || 0,
        companyId
      }
    });
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update employee details
exports.updateEmployee = async (req, res) => {
  const companyId = req.user.companyId;
  const { id } = req.params;
  const { 
    name, mobile, city, joiningDate, designation, salary, 
    paidHoliday, commission, specialCommission, totalSaleCommission, 
    commissionOnManufacturing 
  } = req.body;
  try {
    const employee = await prisma.employee.update({
      where: { id: parseInt(id, 10), companyId },
      data: {
        ...(name && { name }),
        ...(mobile !== undefined && { mobile }),
        ...(city !== undefined && { city }),
        ...(joiningDate !== undefined && { joiningDate }),
        ...(designation !== undefined && { designation }),
        ...(salary !== undefined && { salary: parseFloat(salary) }),
        ...(paidHoliday !== undefined && { paidHoliday: parseInt(paidHoliday, 10) }),
        ...(commission !== undefined && { commission: parseFloat(commission) }),
        ...(specialCommission !== undefined && { specialCommission: parseFloat(specialCommission) }),
        ...(totalSaleCommission !== undefined && { totalSaleCommission: parseFloat(totalSaleCommission) }),
        ...(commissionOnManufacturing !== undefined && { commissionOnManufacturing: parseFloat(commissionOnManufacturing) })
      }
    });
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
  const companyId = req.user.companyId;
  const { id } = req.params;
  try {
    await prisma.employee.delete({
      where: { id: parseInt(id, 10), companyId }
    });
    res.status(200).json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get employee transactions
exports.getEmployeeTransactions = async (req, res) => {
  const companyId = req.user.companyId;
  const employeeId = parseInt(req.params.id, 10);

  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId, companyId }
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const transactions = await prisma.employeeTransaction.findMany({
      where: { employeeId, companyId },
      orderBy: { date: 'asc' }
    });

    let entries = [];
    let runningBalance = 0;

    transactions.forEach(t => {
      // type: "SALARY" or "PAYMENT"
      // Salary increases the balance (Company owes the employee) -> Credit
      // Payment decreases the balance (Company paid the employee) -> Debit
      if (t.type === 'SALARY') {
        runningBalance += t.amount;
      } else {
        runningBalance -= t.amount;
        runningBalance -= t.discount;
      }

      entries.push({
        id: t.id,
        date: t.date,
        type: t.type,
        amount: t.amount,
        discount: t.discount,
        remark: t.remark,
        balance: runningBalance
      });
    });

    res.status(200).json({
      success: true,
      employee: employee,
      data: entries
    });
  } catch (error) {
    console.error('Error fetching employee transactions:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Add employee transaction (Salary or Payment)
exports.addEmployeeTransaction = async (req, res) => {
  const companyId = req.user.companyId;
  const employeeId = parseInt(req.params.id, 10);
  const { date, type, amount, discount, remark } = req.body;
  // type should be "SALARY" or "PAYMENT"

  try {
    const parsedAmount = parseFloat(amount) || 0;
    const parsedDiscount = parseFloat(discount) || 0;

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.employeeTransaction.create({
        data: {
          date: date ? new Date(date) : new Date(),
          type: type || 'PAYMENT',
          amount: parsedAmount,
          discount: parsedDiscount,
          remark,
          employeeId,
          companyId
        }
      });

      // Update employee balance
      // Salary -> increment
      // Payment -> decrement
      if (type === 'SALARY') {
        await tx.employee.update({
          where: { id: employeeId },
          data: { balance: { increment: parsedAmount } }
        });
      } else {
        await tx.employee.update({
          where: { id: employeeId },
          data: { balance: { decrement: parsedAmount + parsedDiscount } }
        });
      }

      return transaction;
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Error adding employee transaction:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get employee attendance
exports.getAttendance = async (req, res) => {
  const companyId = req.user.companyId;
  const { month } = req.query; // format: YYYY-MM
  try {
    let whereClause = { companyId };
    
    if (month) {
      const startDate = new Date(`${month}-01T00:00:00.000Z`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      
      whereClause.date = {
        gte: startDate,
        lt: endDate
      };
    }

    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        employee: {
          select: { name: true }
        }
      }
    });

    res.status(200).json({ success: true, data: attendances });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Mark employee attendance
exports.markAttendance = async (req, res) => {
  const companyId = req.user.companyId;
  const { employeeId, date, status } = req.body;
  try {
    const attendanceDate = new Date(date);
    
    // Upsert attendance record
    const attendance = await prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId: parseInt(employeeId, 10),
          date: attendanceDate
        }
      },
      update: {
        status
      },
      create: {
        employeeId: parseInt(employeeId, 10),
        companyId,
        date: attendanceDate,
        status
      }
    });

    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
