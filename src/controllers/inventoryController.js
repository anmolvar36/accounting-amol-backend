const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { updateStock } = require('../services/inventoryService');

/**
 * Validates transaction type against allowed enum values
 */
const isValidTransactionType = (type) => {
  const validTypes = [
    'PURCHASE_ORDER', 'PURCHASE', 'PURCHASE_RETURN', 
    'SALES', 'SALES_RETURN', 'CHALLAN', 
    'STOCK_TRANSFER', 'QUOTATION', 'ADJUSTMENT'
  ];
  return validTypes.includes(type.toUpperCase());
};

// Create a new inventory transaction
exports.createTransaction = async (req, res) => {
  const { type } = req.params;
  const { 
    invoiceNo, date, subTotal, totalDiscount, freightCharges, 
    totalAmount, paymentMode, remark, status, customerId, 
    warehouseId, toWarehouseId, tcsAmount,
    totalGstAmount, totalCgst, totalSgst, totalIgst, items 
  } = req.body;
  const companyId = req.user.companyId;

  if (!isValidTransactionType(type)) {
    return res.status(400).json({ error: "Invalid transaction type" });
  }

  if (!items || !items.length) {
    return res.status(400).json({ error: "Items array is required" });
  }

  try {
    // We use a transaction to ensure both invoice creation and stock updates happen atomically
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the Transaction (Invoice)
      const invoice = await tx.invoice.create({
        data: {
          invoiceNo,
          date: date ? new Date(date) : new Date(),
          type: type.toUpperCase(),
          subTotal,
          totalDiscount,
          freightCharges,
          totalAmount,
          totalGstAmount: totalGstAmount ? parseFloat(totalGstAmount) : 0,
          totalCgst: totalCgst ? parseFloat(totalCgst) : 0,
          totalSgst: totalSgst ? parseFloat(totalSgst) : 0,
          totalIgst: totalIgst ? parseFloat(totalIgst) : 0,
          tcsAmount: tcsAmount ? parseFloat(tcsAmount) : 0,
          paymentMode,
          remark,
          status,
          companyId,
          customerId: customerId ? parseInt(customerId, 10) : undefined,
          warehouseId: warehouseId ? parseInt(warehouseId, 10) : undefined,
          toWarehouseId: toWarehouseId ? parseInt(toWarehouseId, 10) : undefined,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              freeQty: item.freeQty,
              price: item.price,
              discount1: item.discount1,
              discount2: item.discount2,
              amount: item.amount,
              imei: item.imei,
              gstRate: item.gstRate ? parseFloat(item.gstRate) : 0,
              gstAmount: item.gstAmount ? parseFloat(item.gstAmount) : 0,
              cgst: item.cgst ? parseFloat(item.cgst) : 0,
              sgst: item.sgst ? parseFloat(item.sgst) : 0,
              igst: item.igst ? parseFloat(item.igst) : 0
            }))
          }
        },
        include: { items: true }
      });

      // 2. Update stock depending on transaction type
      await updateStock(items, type.toUpperCase(), warehouseId, toWarehouseId, tx);

      // 3. Update financial ledgers (Customer/Party balance)
      if (type.toUpperCase() === 'SALES' && status !== 'PAID' && customerId) {
        // Increase customer balance (they owe us)
        await tx.customer.update({
          where: { id: parseInt(customerId) },
          data: { balance: { increment: totalAmount } }
        });
      } else if (type.toUpperCase() === 'PURCHASE' && status !== 'PAID' && customerId) {
        // Increase supplier balance (we owe them)
        // Note: Assuming customer model acts as party/supplier too
        await tx.customer.update({
          where: { id: parseInt(customerId) },
          data: { balance: { increment: totalAmount } }
        });
      }

      return invoice;
    });

    res.status(201).json({ message: "Transaction created successfully", data: result });
  } catch (error) {
    console.error("Inventory creation error:", error);
    res.status(500).json({ error: error.message || "Failed to create transaction" });
  }
};

// Get all transactions of a specific type
exports.getTransactions = async (req, res) => {
  const { type } = req.params;
  const companyId = req.user.companyId;

  if (!isValidTransactionType(type)) {
    return res.status(400).json({ error: "Invalid transaction type" });
  }

  try {
    const invoices = await prisma.invoice.findMany({
      where: { 
        companyId,
        type: type.toUpperCase()
      },
      include: {
        customer: true,
        items: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ data: invoices });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};
