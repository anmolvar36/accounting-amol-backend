const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getLedger = async (req, res) => {
  const companyId = req.user.companyId;
  const { customerId } = req.params;

  try {
    // 1. Get customer
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(customerId, 10), companyId }
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // 2. Get all invoices (Sales = Debit)
    const invoices = await prisma.invoice.findMany({
      where: { customerId: parseInt(customerId, 10), companyId },
      orderBy: { date: 'asc' }
    });

    // 3. Get all payments (Payment In = Credit, Payment Out = Debit)
    const payments = await prisma.customerPayment.findMany({
      where: { customerId: parseInt(customerId, 10), companyId },
      orderBy: { date: 'asc' }
    });

    // 4. Combine and sort
    let entries = [];
    
    invoices.forEach(inv => {
      entries.push({
        id: `INV-${inv.id}`,
        rawId: inv.id,
        type: 'INVOICE',
        date: inv.date,
        voucherNo: inv.invoiceNo,
        amount: inv.totalAmount, // This is debit
        paymentIn: 0,
        discount: 0,
        remark: 'Sales Invoice'
      });
    });

    payments.forEach(pay => {
      entries.push({
        id: `PAY-${pay.id}`,
        rawId: pay.id,
        type: pay.paymentType === 'IN' ? 'PAYMENT_IN' : 'PAYMENT_OUT',
        date: pay.date,
        voucherNo: pay.referenceNo || '-',
        amount: pay.paymentType === 'OUT' ? pay.amount : 0, // Debit if we pay them
        paymentIn: pay.paymentType === 'IN' ? pay.amount : 0, // Credit if they pay us
        discount: pay.discount || 0,
        remark: pay.remark || (pay.paymentType === 'IN' ? 'Payment Received' : 'Payment Made')
      });
    });

    // Sort by date
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance
    let runningBalance = 0;
    entries = entries.map(entry => {
      // Debit increases balance (what they owe us)
      // Credit (payment in) decreases balance
      runningBalance += entry.amount; // Add invoice amount or payment out
      runningBalance -= entry.paymentIn; // Subtract payment in
      runningBalance -= entry.discount; // Subtract discount
      return {
        ...entry,
        balance: runningBalance
      };
    });

    res.status(200).json({ 
      success: true, 
      customer: {
        id: customer.id,
        name: customer.name,
        balance: customer.balance,
        details: `${customer.city || ''} ${customer.mobile ? `Mobile: ${customer.mobile}` : ''}`
      },
      data: entries 
    });
  } catch (error) {
    console.error('Error fetching ledger:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.addPayment = async (req, res) => {
  const companyId = req.user.companyId;
  const { customerId } = req.params;
  const { date, amount, paymentType, paymentMode, referenceNo, discount, remark } = req.body;

  try {
    const parsedAmount = parseFloat(amount) || 0;
    const parsedDiscount = parseFloat(discount) || 0;

    // Use a transaction to create payment and update customer balance
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.customerPayment.create({
        data: {
          date: date ? new Date(date) : new Date(),
          amount: parsedAmount,
          paymentType: paymentType || 'IN',
          paymentMode: paymentMode || 'Cash',
          referenceNo,
          discount: parsedDiscount,
          remark,
          customerId: parseInt(customerId, 10),
          companyId
        }
      });

      // Update customer balance
      // Balance = what they owe. 
      // Payment IN = they paid us -> balance decreases
      // Payment OUT = we paid them -> balance increases
      let balanceAdjustment = 0;
      if (paymentType === 'IN') {
        balanceAdjustment = -(parsedAmount + parsedDiscount);
      } else {
        balanceAdjustment = (parsedAmount + parsedDiscount);
      }

      await tx.customer.update({
        where: { id: parseInt(customerId, 10) },
        data: {
          balance: { increment: balanceAdjustment }
        }
      });

      return payment;
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Error adding payment:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
