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
    commissionType, size, colour, expiryMonth, location, hindiName, description, termsCondition, productTags,
    attributeValues
  } = req.body;
  
  let finalSku = (sku && sku.trim() !== '') ? sku.trim() : 'SKU-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);
  
  // Resolve duplicate SKU if it already exists for the company
  let skuExists = true;
  let attempts = 0;
  while (skuExists && attempts < 10) {
    const existing = await prisma.product.findFirst({
      where: { sku: finalSku, companyId }
    });
    if (existing) {
      finalSku = `${sku || 'SKU'}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      attempts++;
    } else {
      skuExists = false;
    }
  }

  try {
    const product = await prisma.product.create({
      data: { 
        name, 
        sku: finalSku, 
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
        companyId,
        ...(attributeValues && {
          attributeValues: {
            create: attributeValues.map(attr => ({
              attributeId: parseInt(attr.attributeId, 10),
              value: attr.value
            }))
          }
        })
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
    commissionType, size, colour, expiryMonth, location, hindiName, description, termsCondition, productTags,
    attributeValues
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

    if (attributeValues) {
      await prisma.productAttributeValue.deleteMany({
        where: { productId: product.id }
      });
      if (attributeValues.length > 0) {
        await prisma.productAttributeValue.createMany({
          data: attributeValues.map(attr => ({
            productId: product.id,
            attributeId: parseInt(attr.attributeId, 10),
            value: attr.value
          }))
        });
      }
    }
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

// Get Expiry Report
exports.getExpiryReport = async (req, res) => {
  const companyId = req.user.companyId;
  const { filter, startDate, endDate } = req.query;

  try {
    const products = await prisma.product.findMany({
      where: { 
        companyId,
        enableExpiry: true,
        expiryMonth: { not: null, not: "" }
      },
      select: {
        id: true,
        name: true,
        sku: true,
        category: true,
        stock: true,
        expiryMonth: true
      }
    });

    // Parse dates and filter in-memory
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filteredProducts = products.filter(p => {
      // expiryMonth format: DD/MM/YYYY
      const parts = p.expiryMonth.split('/');
      if (parts.length !== 3) return false;
      const expDate = new Date(parts[2], parts[1] - 1, parts[0]);
      expDate.setHours(0, 0, 0, 0);

      const diffTime = expDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      switch(filter) {
        case 'Expired Already':
          return diffDays < 0;
        case 'Next 7 Days':
          return diffDays >= 0 && diffDays <= 7;
        case 'Next 15 Days':
          return diffDays >= 0 && diffDays <= 15;
        case 'Next 30 Days':
          return diffDays >= 0 && diffDays <= 30;
        case 'Next 3 Months':
          return diffDays >= 0 && diffDays <= 90;
        case 'Next 6 Months':
          return diffDays >= 0 && diffDays <= 180;
        case 'Custom Date Range':
          if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0,0,0,0);
            const end = new Date(endDate);
            end.setHours(23,59,59,999);
            return expDate >= start && expDate <= end;
          }
          return true;
        default:
          return true;
      }
    });

    // Sort by expiry date ascending
    filteredProducts.sort((a, b) => {
      const partsA = a.expiryMonth.split('/');
      const partsB = b.expiryMonth.split('/');
      const dateA = new Date(partsA[2], partsA[1] - 1, partsA[0]);
      const dateB = new Date(partsB[2], partsB[1] - 1, partsB[0]);
      return dateA - dateB;
    });

    res.status(200).json({ success: true, data: filteredProducts });
  } catch (error) {
    console.error("Expiry Report Error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get Stock Inventory Report
exports.getStockInventory = async (req, res) => {
  const companyId = req.user.companyId;
  const { startDate, endDate, search, branchId, locationId, warehouseId } = req.query;

  try {
    // Fetch all warehouses for company to resolve relationships and apply filtering
    const warehouses = await prisma.warehouse.findMany({
      where: { companyId },
      include: {
        branch: true,
        locRef: true
      }
    });

    // Determine target warehouse names and IDs for filtering
    let targetWarehouseNames = null;
    let targetWarehouseIds = null;

    if (warehouseId) {
      const wh = warehouses.find(w => w.id === parseInt(warehouseId, 10));
      if (wh) {
        targetWarehouseNames = [wh.name];
        targetWarehouseIds = [wh.id];
      } else {
        // If warehouse filter is specified but not found
        targetWarehouseNames = [];
        targetWarehouseIds = [];
      }
    } else if (locationId) {
      const whs = warehouses.filter(w => w.locationId === parseInt(locationId, 10));
      targetWarehouseNames = whs.map(w => w.name);
      targetWarehouseIds = whs.map(w => w.id);
    } else if (branchId) {
      const whs = warehouses.filter(w => w.branchId === parseInt(branchId, 10));
      targetWarehouseNames = whs.map(w => w.name);
      targetWarehouseIds = whs.map(w => w.id);
    }

    // Build date filter for invoices
    let dateFilter = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter = { date: { gte: start, lte: end } };
    }

    // Search filter for products
    let productWhere = { companyId };
    if (search && search.trim() !== '') {
      productWhere.name = { contains: search.trim() };
    }
    
    // Filter products by warehouses if a filter is active
    if (targetWarehouseNames !== null) {
      productWhere.warehouse = { in: targetWarehouseNames };
    }

    // Get all products for this company
    const products = await prisma.product.findMany({
      where: productWhere,
      select: {
        id: true,
        name: true,
        stock: true,
        openingStockRate: true,
        warehouse: true,
        location: true,
      },
      orderBy: { name: 'asc' }
    });

    if (products.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const productIds = products.map(p => p.id);

    // Get purchase quantities from PURCHASE invoices within date range
    const purchaseItems = await prisma.invoiceItem.findMany({
      where: {
        productId: { in: productIds },
        invoice: {
          is: {
            companyId,
            type: 'PURCHASE',
            ...(targetWarehouseIds && { warehouseId: { in: targetWarehouseIds } }),
            ...dateFilter
          }
        }
      },
      select: {
        productId: true,
        quantity: true,
        freeQty: true,
      }
    });

    // Get sale quantities from SALES invoices within date range
    const saleItems = await prisma.invoiceItem.findMany({
      where: {
        productId: { in: productIds },
        invoice: {
          is: {
            companyId,
            type: 'SALES',
            ...(targetWarehouseIds && { warehouseId: { in: targetWarehouseIds } }),
            ...dateFilter
          }
        }
      },
      select: {
        productId: true,
        quantity: true,
        freeQty: true,
      }
    });

    // Get sale return quantities (these add back to stock)
    const saleReturnItems = await prisma.invoiceItem.findMany({
      where: {
        productId: { in: productIds },
        invoice: {
          is: {
            companyId,
            type: 'SALES_RETURN',
            ...(targetWarehouseIds && { warehouseId: { in: targetWarehouseIds } }),
            ...dateFilter
          }
        }
      },
      select: {
        productId: true,
        quantity: true,
      }
    });

    // Get purchase return quantities (these reduce purchase qty)
    const purchaseReturnItems = await prisma.invoiceItem.findMany({
      where: {
        productId: { in: productIds },
        invoice: {
          is: {
            companyId,
            type: 'PURCHASE_RETURN',
            ...(targetWarehouseIds && { warehouseId: { in: targetWarehouseIds } }),
            ...dateFilter
          }
        }
      },
      select: {
        productId: true,
        quantity: true,
      }
    });

    // Build maps for quick lookup
    const purchaseMap = {};
    purchaseItems.forEach(item => {
      purchaseMap[item.productId] = (purchaseMap[item.productId] || 0) + (item.quantity || 0) + (item.freeQty || 0);
    });

    const saleMap = {};
    saleItems.forEach(item => {
      saleMap[item.productId] = (saleMap[item.productId] || 0) + (item.quantity || 0);
    });

    const saleReturnMap = {};
    saleReturnItems.forEach(item => {
      saleReturnMap[item.productId] = (saleReturnMap[item.productId] || 0) + (item.quantity || 0);
    });

    const purchaseReturnMap = {};
    purchaseReturnItems.forEach(item => {
      purchaseReturnMap[item.productId] = (purchaseReturnMap[item.productId] || 0) + (item.quantity || 0);
    });

    const inventoryData = products.map(product => {
      const purchaseQty = (purchaseMap[product.id] || 0) - (purchaseReturnMap[product.id] || 0);
      const saleQty = (saleMap[product.id] || 0) - (saleReturnMap[product.id] || 0);

      let openingStock = 0;
      let closingStock = product.stock;

      if (startDate && endDate) {
        // Opening Stock = Closing Stock - Purchases + Sales (reverse calculation)
        openingStock = product.stock - purchaseQty + saleQty;
        closingStock = openingStock + purchaseQty - saleQty;
      }

      // Resolve branch, location and warehouse names
      const matchedWarehouse = warehouses.find(w => w.name === product.warehouse);
      const branchName = matchedWarehouse?.branch?.name || 'No Branch';
      const locationName = matchedWarehouse?.locRef?.name || product.location || 'No Location';
      const warehouseName = product.warehouse || 'No Warehouse';

      return {
        id: product.id,
        name: product.name,
        branchName,
        locationName,
        warehouseName,
        openingStock,
        purchaseQty,
        saleQty,
        closingStock,
      };
    });

    res.status(200).json({ success: true, data: inventoryData });
  } catch (error) {
    console.error('Stock Inventory Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get Order List
exports.getOrderList = async (req, res) => {
  const companyId = req.user.companyId;

  try {
    const products = await prisma.product.findMany({
      where: {
        companyId,
        lowStockAlert: {
          gt: 0
        }
      },
      select: {
        id: true,
        name: true,
        category: true,
        stock: true,
        lowStockAlert: true,
        reorderLevel: true,
        purchasePrice: true
      }
    });

    const orderList = products
      .filter(p => p.stock <= p.lowStockAlert)
      .map(p => {
        let quantity = Math.max(p.reorderLevel - p.stock, 1);
        if (p.reorderLevel <= 0) {
          quantity = p.lowStockAlert > 0 ? p.lowStockAlert : 1;
        }
        
        return {
          id: p.id,
          description: p.name,
          category: p.category || 'Uncategorized',
          quantity: quantity,
          price: p.purchasePrice || 0,
          amount: quantity * (p.purchasePrice || 0)
        };
      });

    res.status(200).json({ success: true, data: orderList });
  } catch (error) {
    console.error("Order List Error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
