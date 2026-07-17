const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMedicalAttributes() {
  try {
    const medicalCategory = await prisma.category.findFirst({
      where: { name: 'Medical' }
    });

    if (!medicalCategory) {
      console.log('Medical category not found');
      return;
    }

    console.log(`Found Medical category (ID: ${medicalCategory.id}). Adding new attributes...`);

    const newAttributes = [
      {
        categoryId: medicalCategory.id,
        name: 'Composition / Salts (Generic Name)',
        type: 'Text',
        options: null,
        isRequired: false,
        order: 4
      },
      {
        categoryId: medicalCategory.id,
        name: 'Potency / Strength (Dose)',
        type: 'Text',
        options: null,
        isRequired: false,
        order: 5
      },
      {
        categoryId: medicalCategory.id,
        name: 'Drug Schedule Type',
        type: 'Dropdown',
        options: ['Schedule H', 'Schedule H1', 'Schedule X', 'OTC', 'None'],
        isRequired: false,
        order: 6
      }
    ];

    for (const attr of newAttributes) {
      // Check if it already exists to prevent duplicates
      const existing = await prisma.categoryAttribute.findFirst({
        where: {
          categoryId: medicalCategory.id,
          name: attr.name
        }
      });

      if (!existing) {
        await prisma.categoryAttribute.create({
          data: attr
        });
        console.log(`Added attribute: ${attr.name}`);
      } else {
        console.log(`Attribute already exists: ${attr.name}`);
      }
    }

    console.log('Successfully added new attributes for Medical category!');
  } catch (error) {
    console.error('Error adding attributes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMedicalAttributes();
