const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all categories for the tenant
exports.getCategories = async (req, res) => {
  const companyId = req.user.companyId;
  try {
    const categories = await prisma.category.findMany({
      where: { companyId }
    });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create a new category
exports.createCategory = async (req, res) => {
  const companyId = req.user.companyId;
  const { name, purchaseDiscount, saleDiscount, isActive } = req.body;
  try {
    const category = await prisma.category.create({
      data: {
        name,
        purchaseDiscount: parseFloat(purchaseDiscount) || 0,
        saleDiscount: parseFloat(saleDiscount) || 0,
        isActive: isActive !== false,
        companyId
      }
    });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update category details
exports.updateCategory = async (req, res) => {
  const companyId = req.user.companyId;
  const { id } = req.params;
  const { name, purchaseDiscount, saleDiscount, isActive } = req.body;
  try {
    const category = await prisma.category.update({
      where: { id: parseInt(id, 10), companyId },
      data: {
        ...(name && { name }),
        ...(purchaseDiscount !== undefined && { purchaseDiscount: parseFloat(purchaseDiscount) }),
        ...(saleDiscount !== undefined && { saleDiscount: parseFloat(saleDiscount) }),
        ...(isActive !== undefined && { isActive })
      }
    });
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  const companyId = req.user.companyId;
  const { id } = req.params;
  try {
    await prisma.category.delete({
      where: { id: parseInt(id, 10), companyId }
    });
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
