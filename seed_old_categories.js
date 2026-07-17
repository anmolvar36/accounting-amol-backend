const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const oldCategories = [
  {
    name: "Boys",
    purchaseDiscount: 0,
    saleDiscount: 0,
    attributes: [
      { name: "Size", type: "Multi Select", options: ["XS", "S", "M", "L", "XL", "XXL", "3XL"] },
      { name: "Color", type: "Multi Select", options: ["Black", "White", "Blue", "Red", "Green", "Yellow", "Pink"] }
    ]
  },
  {
    name: "Books",
    purchaseDiscount: 0,
    saleDiscount: 0,
    attributes: []
  },
  {
    name: "Cosmetics",
    purchaseDiscount: 0,
    saleDiscount: 0,
    attributes: [
      { name: "Shade", type: "Multi Select", options: ["Light", "Medium", "Dark"] },
      { name: "Size", type: "Dropdown", options: ["50ml", "100ml", "200ml"] }
    ]
  },
  {
    name: "Datsun",
    purchaseDiscount: 0,
    saleDiscount: 0,
    attributes: []
  },
  {
    name: "Spares",
    purchaseDiscount: 0,
    saleDiscount: 0,
    attributes: [
      { name: "Part No", type: "Text", options: null },
      { name: "Model/Vehicle", type: "Text", options: null }
    ]
  },
  {
    name: "Hardware",
    purchaseDiscount: 0,
    saleDiscount: 0,
    attributes: []
  },
  {
    name: "Pens",
    purchaseDiscount: 0,
    saleDiscount: 0,
    attributes: []
  },
  {
    name: "Grocery",
    purchaseDiscount: 0,
    saleDiscount: 0,
    attributes: [
      { name: "Unit", type: "Dropdown", options: ["Kg", "Gram", "Litre", "ml", "Packet", "Piece"] },
      { name: "Weight", type: "Text", options: null }
    ]
  },
  {
    name: "Pestiside",
    purchaseDiscount: 0,
    saleDiscount: 0,
    attributes: [
      { name: "Batch No", type: "Text", options: null },
      { name: "Expiry Date", type: "Text", options: null },
      { name: "Manufacturer", type: "Text", options: null }
    ]
  },
  {
    name: "Womens",
    purchaseDiscount: 0,
    saleDiscount: 0,
    attributes: [
      { name: "Size", type: "Multi Select", options: ["XS", "S", "M", "L", "XL", "XXL", "3XL"] },
      { name: "Color", type: "Multi Select", options: ["Black", "White", "Blue", "Red", "Green", "Yellow", "Pink"] }
    ]
  },
  {
    name: "Seeds",
    purchaseDiscount: 0,
    saleDiscount: 0,
    attributes: [
      { name: "Batch No", type: "Text", options: null },
      { name: "Expiry Date", type: "Text", options: null },
      { name: "Manufacturer", type: "Text", options: null }
    ]
  },
  {
    name: "Tab",
    purchaseDiscount: 0,
    saleDiscount: 0,
    attributes: [
      { name: "Batch No", type: "Text", options: null },
      { name: "Expiry Date", type: "Text", options: null },
      { name: "Manufacturer", type: "Text", options: null },
      { name: "Composition / Salts (Generic Name)", type: "Text", options: null },
      { name: "Potency / Strength (Dose)", type: "Text", options: null },
      { name: "Drug Schedule Type", type: "Dropdown", options: ["Schedule H", "Schedule H1", "Schedule X", "OTC", "None"] }
    ]
  },
  {
    name: "New",
    purchaseDiscount: 10,
    saleDiscount: 10,
    attributes: []
  }
];

async function seed() {
  try {
    const companies = await prisma.company.findMany();
    if (companies.length === 0) {
      console.log('No companies found to seed categories.');
      return;
    }

    for (const company of companies) {
      console.log(`Seeding categories for Company ID: ${company.id}...`);

      for (const catData of oldCategories) {
        // Find if category already exists
        let category = await prisma.category.findFirst({
          where: { name: catData.name, companyId: company.id }
        });

        if (!category) {
          category = await prisma.category.create({
            data: {
              name: catData.name,
              purchaseDiscount: catData.purchaseDiscount,
              saleDiscount: catData.saleDiscount,
              isActive: true,
              companyId: company.id
            }
          });
          console.log(`Created category: ${catData.name}`);
        } else {
          // Update discounts if different
          category = await prisma.category.update({
            where: { id: category.id },
            data: {
              purchaseDiscount: catData.purchaseDiscount,
              saleDiscount: catData.saleDiscount
            }
          });
          console.log(`Updated category: ${catData.name}`);
        }

        // Add attributes
        let order = 1;
        for (const attr of catData.attributes) {
          const existingAttr = await prisma.categoryAttribute.findFirst({
            where: { categoryId: category.id, name: attr.name }
          });

          if (!existingAttr) {
            await prisma.categoryAttribute.create({
              data: {
                categoryId: category.id,
                name: attr.name,
                type: attr.type,
                options: attr.options,
                isRequired: false,
                order: order++
              }
            });
            console.log(`  Added attribute: ${attr.name} to ${catData.name}`);
          }
        }
      }
    }
    console.log('Successfully completed seeding old categories and attributes!');
  } catch (error) {
    console.error('Error seeding categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
