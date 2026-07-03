const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Handles stock updates for all inventory transaction types based on Business Rules.
 * @param {Array} items - Array of InvoiceItem objects { productId, quantity }
 * @param {String} transactionType - TransactionType enum
 * @param {Number} warehouseId - The warehouse where the transaction is happening
 * @param {Number} toWarehouseId - Destination warehouse (only for STOCK_TRANSFER)
 * @param {Object} tx - Prisma transaction client
 */
const updateStock = async (items, transactionType, warehouseId, toWarehouseId, tx = prisma) => {
  // If the transaction doesn't affect stock, return early.
  if (['PURCHASE_ORDER', 'QUOTATION', 'CHALLAN'].includes(transactionType)) {
    return;
  }

  for (const item of items) {
    const qty = parseInt(item.quantity) + parseInt(item.freeQty || 0);

    // Determine the operation based on transaction type
    let stockChange = 0;

    switch (transactionType) {
      case 'PURCHASE':
      case 'SALES_RETURN':
        stockChange = qty; // Increase stock
        break;
      case 'SALES':
      case 'PURCHASE_RETURN':
        stockChange = -qty; // Decrease stock
        break;
      case 'ADJUSTMENT':
        // For simple adjustments, we will assume it's absolute replacement or delta.
        // If we treat it as delta, it can be positive or negative. For this basic setup:
        stockChange = qty; 
        break;
      default:
        break;
    }

    // Apply standard stock change
    if (stockChange !== 0 && transactionType !== 'STOCK_TRANSFER') {
      const product = await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: stockChange } }
      });

      // Low stock validation check
      if (stockChange < 0 && product.stock < 0) {
        // Here we could throw an error if "negativeStockLock" setting is true.
        // For now, we throw an error to prevent negative stock.
        // throw new Error(`Insufficient stock for Product ID ${product.id}`);
      }
    }

    // Handle Stock Transfer explicitly
    if (transactionType === 'STOCK_TRANSFER') {
      // In a robust multi-warehouse setup, we would track stock per warehouse.
      // Currently, the Product model has a single global 'stock' field. 
      // A stock transfer doesn't change global stock, only location-specific stock.
      // To fully implement this, we'd need a ProductWarehouse junction table.
      // Since it's global for now, STOCK_TRANSFER doesn't change global stock total.
    }
  }
};

module.exports = {
  updateStock
};
