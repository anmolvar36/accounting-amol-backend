const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all products for the tenant
exports.getProducts = async (req, res) => {
  const companyId = req.user.companyId;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({ where: { companyId }, skip, take: limit }),
      prisma.product.count({ where: { companyId } })
    ]);
    res.status(200).json({ success: true, data: products, meta: { total, page, limit } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create a new product for the tenant
exports.createProduct = async (req, res) => {
  const companyId = req.user.companyId;
  const { 
    name, sku, price, stock, mrp, barcode, category, brand, colorVariant, status,
    tax, hsnCode, purchasePrice, wholesalePrice, creditSalePrice, baseUnit, purchaseUnit, salesUnit,
    lowStockAlert, reorderLevel, enableBatch, enableExpiry, enableImei, hasBom, qtySlabs,
    openingStockRate, warehouse, bomName, isMultiLevel, bomRecipe,
    syncOnline, onlineProductName, onlineProductDesc, onlineSalePrice, ecommerceCategory, productImage,
    commissionType, size, colour, expiryMonth, location, hindiName, description, termsCondition, productTags
  } = req.body;
  try {
    const product = await prisma.product.create({
      data: { 
        name, 
        sku, 
        barcode,
        price: parseFloat(price) || 0, 
        mrp: parseFloat(mrp) || 0,
        category,
        brand,
        colorVariant,
        status: status || 'Active',
        stock: parseInt(stock, 10) || 0, 
        tax: parseFloat(tax) || 0,
        hsnCode,
        purchasePrice: parseFloat(purchasePrice) || 0,
        wholesalePrice: parseFloat(wholesalePrice) || 0,
        creditSalePrice: parseFloat(creditSalePrice) || 0,
        baseUnit,
        purchaseUnit,
        salesUnit,
        lowStockAlert: parseInt(lowStockAlert, 10) || 0,
        reorderLevel: parseInt(reorderLevel, 10) || 0,
        enableBatch: Boolean(enableBatch),
        enableExpiry: Boolean(enableExpiry),
        enableImei: Boolean(enableImei),
        hasBom: Boolean(hasBom),
        qtySlabs: qtySlabs ? qtySlabs : undefined,
        openingStockRate: parseFloat(openingStockRate) || 0,
        warehouse,
        bomName,
        isMultiLevel: Boolean(isMultiLevel),
        bomRecipe: bomRecipe ? bomRecipe : undefined,
        syncOnline: Boolean(syncOnline),
        onlineProductName,
        onlineProductDesc,
        onlineSalePrice: parseFloat(onlineSalePrice) || 0,
        ecommerceCategory,
        productImage,
        commissionType,
        size,
        colour,
        expiryMonth,
        location,
        hindiName,
        description,
        termsCondition,
        productTags,
        companyId 
      }
    });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'SKU already exists for this company' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update a product (e.g., stock adjustments)
exports.updateProduct = async (req, res) => {
  const companyId = req.user.companyId;
  const { id } = req.params;
  const { 
    name, sku, price, stock, mrp, barcode, category, brand, colorVariant, status,
    tax, hsnCode, purchasePrice, wholesalePrice, creditSalePrice, baseUnit, purchaseUnit, salesUnit,
    lowStockAlert, reorderLevel, enableBatch, enableExpiry, enableImei, hasBom, qtySlabs,
    openingStockRate, warehouse, bomName, isMultiLevel, bomRecipe,
    syncOnline, onlineProductName, onlineProductDesc, onlineSalePrice, ecommerceCategory, productImage,
    commissionType, size, colour, expiryMonth, location, hindiName, description, termsCondition, productTags
  } = req.body;
  try {
    const existing = await prisma.product.findUnique({ where: { id: parseInt(id, 10) } });
    if (!existing || existing.companyId !== companyId) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const product = await prisma.product.update({
      where: { id: parseInt(id, 10) },
      data: {
        ...(name && { name }),
        ...(sku && { sku }),
        ...(barcode !== undefined && { barcode }),
        ...(category !== undefined && { category }),
        ...(brand !== undefined && { brand }),
        ...(colorVariant !== undefined && { colorVariant }),
        ...(status && { status }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(mrp !== undefined && { mrp: parseFloat(mrp) }),
        ...(stock !== undefined && { stock: parseInt(stock, 10) }),
        ...(tax !== undefined && { tax: parseFloat(tax) }),
        ...(hsnCode !== undefined && { hsnCode }),
        ...(purchasePrice !== undefined && { purchasePrice: parseFloat(purchasePrice) }),
        ...(wholesalePrice !== undefined && { wholesalePrice: parseFloat(wholesalePrice) }),
        ...(creditSalePrice !== undefined && { creditSalePrice: parseFloat(creditSalePrice) }),
        ...(baseUnit !== undefined && { baseUnit }),
        ...(purchaseUnit !== undefined && { purchaseUnit }),
        ...(salesUnit !== undefined && { salesUnit }),
        ...(lowStockAlert !== undefined && { lowStockAlert: parseInt(lowStockAlert, 10) }),
        ...(reorderLevel !== undefined && { reorderLevel: parseInt(reorderLevel, 10) }),
        ...(enableBatch !== undefined && { enableBatch: Boolean(enableBatch) }),
        ...(enableExpiry !== undefined && { enableExpiry: Boolean(enableExpiry) }),
        ...(enableImei !== undefined && { enableImei: Boolean(enableImei) }),
        ...(hasBom !== undefined && { hasBom: Boolean(hasBom) }),
        ...(qtySlabs !== undefined && { qtySlabs }),
        ...(openingStockRate !== undefined && { openingStockRate: parseFloat(openingStockRate) }),
        ...(warehouse !== undefined && { warehouse }),
        ...(bomName !== undefined && { bomName }),
        ...(isMultiLevel !== undefined && { isMultiLevel: Boolean(isMultiLevel) }),
        ...(bomRecipe !== undefined && { bomRecipe }),
        ...(syncOnline !== undefined && { syncOnline: Boolean(syncOnline) }),
        ...(onlineProductName !== undefined && { onlineProductName }),
        ...(onlineProductDesc !== undefined && { onlineProductDesc }),
        ...(onlineSalePrice !== undefined && { onlineSalePrice: parseFloat(onlineSalePrice) }),
        ...(ecommerceCategory !== undefined && { ecommerceCategory }),
        ...(productImage !== undefined && { productImage }),
        ...(commissionType !== undefined && { commissionType }),
        ...(size !== undefined && { size }),
        ...(colour !== undefined && { colour }),
        ...(expiryMonth !== undefined && { expiryMonth }),
        ...(location !== undefined && { location }),
        ...(hindiName !== undefined && { hindiName }),
        ...(description !== undefined && { description }),
        ...(termsCondition !== undefined && { termsCondition }),
        ...(productTags !== undefined && { productTags })
      }
    });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  const companyId = req.user.companyId;
  const { id } = req.params;
  try {
    const existing = await prisma.product.findUnique({ where: { id: parseInt(id, 10) } });
    if (!existing || existing.companyId !== companyId) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    await prisma.product.delete({
      where: { id: parseInt(id, 10) }
    });
    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2003') {
      return res.status(400).json({ success: false, message: 'Cannot delete product because it has been billed in invoices. Please mark it as Inactive instead.' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Merge two products
exports.mergeProducts = async (req, res) => {
  const companyId = req.user.companyId;
  const { incorrectProductId, correctProductId } = req.body;

  if (!incorrectProductId || !correctProductId) {
    return res.status(400).json({ success: false, message: 'Missing product IDs' });
  }
  
  if (incorrectProductId === correctProductId) {
    return res.status(400).json({ success: false, message: 'Cannot merge a product into itself' });
  }

  try {
    const incorrect = await prisma.product.findFirst({ where: { id: parseInt(incorrectProductId, 10), companyId } });
    const correct = await prisma.product.findFirst({ where: { id: parseInt(correctProductId, 10), companyId } });

    if (!incorrect || !correct) {
      return res.status(404).json({ success: false, message: 'One or both products not found' });
    }

    // Run within a transaction to ensure data integrity
    await prisma.$transaction(async (tx) => {
      // 1. Update Invoice items
      await tx.invoiceItem.updateMany({
        where: { productId: incorrect.id },
        data: { productId: correct.id }
      });

      // 2. Update Bom items
      await tx.bomItem.updateMany({
        where: { productId: incorrect.id },
        data: { productId: correct.id }
      });

      // 3. Add stock from incorrect to correct
      await tx.product.update({
        where: { id: correct.id },
        data: {
          stock: correct.stock + incorrect.stock
        }
      });

      // 4. Delete incorrect product
      await tx.product.delete({
        where: { id: incorrect.id }
      });
    });

    res.status(200).json({ success: true, message: 'Products merged successfully' });
  } catch (error) {
    console.error('Merge Products Error:', error);
    res.status(500).json({ success: false, message: 'Server error during merge' });
  }
};
