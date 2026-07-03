const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getCollectionReport = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { startDate, endDate } = req.query;

    // Define date filters
    let dateFilter = {};
    if (startDate && endDate) {
      // Ensure the dates encompass the full day
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      dateFilter = {
        createdAt: {
          gte: start,
          lte: end
        }
      };
    }

    // Fetch all sales and purchases within the date range
    const invoices = await prisma.invoice.findMany({
      where: {
        companyId,
        date: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : undefined
        }
      }
    });

    // We can also fetch actual payments from PaymentBook, but for now we calculate based on Invoices and Incomes/Expenses
    const incomes = await prisma.income.findMany({
      where: { companyId, ...dateFilter }
    });

    const expenses = await prisma.expense.findMany({
      where: { companyId, ...dateFilter }
    });

    // Aggregations
    let todaySales = 0;
    let cashSales = 0;
    let creditSales = 0;
    let purchases = 0;

    invoices.forEach(inv => {
      if (inv.type === 'SALES') {
        todaySales += inv.totalAmount;
        if (inv.paymentMode.toLowerCase() === 'cash') {
          cashSales += inv.totalAmount;
        } else {
          creditSales += inv.totalAmount;
        }
      } else if (inv.type === 'PURCHASE') {
        purchases += inv.totalAmount;
      }
    });

    // In a full system, Credit Recovery comes from PaymentBook where a customer pays off a debt
    // For this demonstration, we'll use a placeholder 0 or read from PaymentBook if it has amounts
    let creditRecovery = 0; 
    
    // Other Income
    // Assume Income model has an 'amount' field (Wait, the schema only has name/head. We will just use 0 for now)
    let otherIncome = 0;

    // Money In = Cash Sales + Credit Recovery + Other Income
    const moneyIn = {
      cashSale: cashSales,
      creditRecovery: creditRecovery,
      otherIncome: otherIncome,
      total: cashSales + creditRecovery + otherIncome
    };

    // Money Out = Purchases (Company Paid) + Expenses
    // Assume Expense model doesn't have amount either in current schema, defaulting to 0
    let companyPaid = purchases;
    let employeePaid = 0;
    let expensesPaid = 0;

    const moneyOut = {
      companyPaid: companyPaid,
      employeePaid: employeePaid,
      expensesPaid: expensesPaid,
      total: companyPaid + employeePaid + expensesPaid
    };

    const netCollection = moneyIn.total - moneyOut.total;

    // Calculate generic cash/bank balances from Bank model
    const banks = await prisma.bank.findMany({ where: { companyId } });
    let cashBalance = 0;
    let bankBalance = 0;
    banks.forEach(b => {
      if (b.type.toLowerCase() === 'cash') cashBalance += b.balance;
      else bankBalance += b.balance;
    });

    res.status(200).json({
      success: true,
      data: {
        todaySales,
        cashSales,
        creditSales,
        moneyIn,
        moneyOut,
        netCollection,
        accounts: {
          cash: cashBalance,
          bank: bankBalance
        }
      }
    });

  } catch (error) {
    console.error("Error generating collection report:", error);
    res.status(500).json({ success: false, error: "Failed to generate report" });
  }
};
