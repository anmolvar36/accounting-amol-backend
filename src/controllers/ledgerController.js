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

    // 3. Build ledger entries from invoices only
    let entries = [];

    invoices.forEach(inv => {
      entries.push({
        id: `INV-${inv.id}`,
        rawId: inv.id,
        type: 'INVOICE',
        date: inv.date,
        voucherNo: inv.invoiceNo,
        amount: inv.totalAmount,   // Debit
        paymentIn: inv.status === 'PAID' ? inv.totalAmount : 0, // If paid, add payment in
        discount: inv.totalDiscount || 0,
        remark: `Sales Invoice`
      });
    });

    // Sort by date
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance
    let runningBalance = 0;
    entries = entries.map(entry => {
      runningBalance += entry.amount;      // Debit (invoice raised)
      runningBalance -= entry.paymentIn;   // Credit (payment received)
      runningBalance -= entry.discount;    // Discount
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

    // Update customer balance directly
    // Payment IN = they paid us -> balance decreases
    // Payment OUT = we paid them -> balance increases
    let balanceAdjustment = 0;
    if (paymentType === 'IN') {
      balanceAdjustment = -(parsedAmount + parsedDiscount);
    } else {
      balanceAdjustment = (parsedAmount + parsedDiscount);
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: parseInt(customerId, 10) },
      data: {
        balance: { increment: balanceAdjustment }
      }
    });

    res.status(201).json({ 
      success: true, 
      data: { 
        customerId: parseInt(customerId, 10),
        amount: parsedAmount,
        discount: parsedDiscount,
        paymentType,
        remark,
        newBalance: updatedCustomer.balance
      } 
    });
  } catch (error) {
    console.error('Error adding payment:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

