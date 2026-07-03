const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to generate a simple invoice number
const generateInvoiceNo = () => {
  const now = new Date();
  return `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${now.getTime()}`;
};

/**
 * Create an invoice for the tenant.
 * Expected payload:
 * {
 *   customerId: Number,
 *   date: String,
 *   paymentMode: String,
 *   remark: String,
 *   subTotal: Number,
 *   totalDiscount: Number,
 *   freightCharges: Number,
 *   totalAmount: Number,
 *   items: [ { productId: Number, quantity: Number, freeQty: Number, price: Number, discount1: Number, discount2: Number, imei: String, amount: Number } ]
 * }
 */
exports.createInvoice = async (req, res) => {
  const companyId = req.user.companyId;
  const { customerId, date, paymentMode, remark, subTotal, totalDiscount, freightCharges, totalAmount, items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Invoice must contain at least one item.' });
  }

  try {
    // Run everything in a transaction to keep data consistent
    const result = await prisma.$transaction(async (tx) => {
      // Validate customer belongs to the same company
      const customer = await tx.customer.findUnique({
        where: { id: parseInt(customerId, 10) },
        select: { id: true, companyId: true }
      });
      if (!customer || customer.companyId !== companyId) {
        throw new Error('Invalid customer for this company');
      }

      // Process each line item stock
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: parseInt(item.productId, 10) },
          select: { id: true, stock: true, companyId: true }
        });
        if (!product || product.companyId !== companyId) {
          throw new Error(`Product ${item.productId} not found for this company`);
        }
        // Decrement stock
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: parseInt(item.quantity) } }
        });
      }

      // Create the invoice record
      const invoice = await tx.invoice.create({
        data: {
          invoiceNo: generateInvoiceNo(),
          date: date ? new Date(date) : new Date(),
          subTotal: parseFloat(subTotal) || 0,
          totalDiscount: parseFloat(totalDiscount) || 0,
          freightCharges: parseFloat(freightCharges) || 0,
          totalAmount: parseFloat(totalAmount) || 0,
          paymentMode: paymentMode || 'Cash',
          remark: remark || '',
          companyId,
          customerId: parseInt(customerId, 10),
          items: {
            create: items.map(item => ({
              productId: parseInt(item.productId, 10),
              quantity: parseInt(item.quantity) || 0,
              freeQty: parseInt(item.freeQty) || 0,
              price: parseFloat(item.price) || 0,
              discount1: parseFloat(item.discount1) || 0,
              discount2: parseFloat(item.discount2) || 0,
              imei: item.imei || null,
              amount: parseFloat(item.amount) || 0
            }))
          }
        },
        include: {
          items: true
        }
      });

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          actionType: 'CREATE_INVOICE',
          details: JSON.stringify({ invoiceNo: invoice.invoiceNo, totalAmount }),
          userName: req.user.email || req.user.id,
          companyId,
        },
      });

      return invoice;
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Invoice creation error:', error);
    const message = error.message || 'Server error';
    res.status(400).json({ success: false, message });
  }
};

/**
 * Get all invoices or filter by type
 */
exports.getInvoices = async (req, res) => {
  const companyId = req.user.companyId;
  const { type } = req.query;

  try {
    const whereClause = { companyId };
    if (type) {
      whereClause.type = type;
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(400).json({ success: false, message: error.message || 'Server error' });
  }
};
