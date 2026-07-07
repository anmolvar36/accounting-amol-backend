const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all customers/parties for the tenant
exports.getCustomers = async (req, res) => {
  const companyId = req.user.companyId;
  const { type, search } = req.query;
  try {
    const customers = await prisma.customer.findMany({ 
      where: { 
        companyId,
        ...(type && { type }),
        ...(search && search.trim() !== '' && {
          OR: [
            { name: { contains: search.trim() } },
            { mobile: { contains: search.trim() } },
            { phone: { contains: search.trim() } },
          ]
        })
      },
      ...(search && { take: 10 }),
      orderBy: { name: 'asc' }
    });
    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create a new customer/party for the tenant
exports.createCustomer = async (req, res) => {
  const companyId = req.user.companyId;
  const { 
    name, phone, address, gstin, mobile, partyTags, balance, status, type,
    dueDays, drugLicense, pinCode, gstApplicable, state, email, partyType,
    otherMobileNo, partyLimit, interestRate, loyaltyPoints, joiningDate,
    wholeParty, sezParty, focParty, city
  } = req.body;
  try {
    const customer = await prisma.customer.create({
      data: { 
        name, 
        phone, 
        address, 
        gstin, 
        mobile, 
        partyTags, 
        balance: balance ? parseFloat(balance) : 0, 
        status: status || 'Active',
        type: type || 'CUSTOMER',
        city,
        dueDays: dueDays ? parseInt(dueDays, 10) : 7,
        drugLicense,
        pinCode,
        gstApplicable,
        state,
        email,
        partyType,
        otherMobileNo,
        partyLimit: partyLimit ? parseFloat(partyLimit) : 0,
        interestRate: interestRate ? parseFloat(interestRate) : 0,
        loyaltyPoints: loyaltyPoints ? parseInt(loyaltyPoints, 10) : 0,
        joiningDate,
        wholeParty: wholeParty === true,
        sezParty: sezParty === true,
        focParty: focParty === true,
        companyId 
      }
    });
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update customer/party
exports.updateCustomer = async (req, res) => {
  const companyId = req.user.companyId;
  const { id } = req.params;
  const { 
    name, phone, address, gstin, mobile, partyTags, balance, status,
    dueDays, drugLicense, pinCode, gstApplicable, state, email, partyType,
    otherMobileNo, partyLimit, interestRate, loyaltyPoints, joiningDate,
    wholeParty, sezParty, focParty, city
  } = req.body;
  try {
    const customer = await prisma.customer.update({
      where: { id: parseInt(id, 10), companyId },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(gstin !== undefined && { gstin }),
        ...(mobile !== undefined && { mobile }),
        ...(partyTags !== undefined && { partyTags }),
        ...(balance !== undefined && { balance: parseFloat(balance) }),
        ...(status && { status }),
        ...(city !== undefined && { city }),
        ...(dueDays !== undefined && { dueDays: parseInt(dueDays, 10) }),
        ...(drugLicense !== undefined && { drugLicense }),
        ...(pinCode !== undefined && { pinCode }),
        ...(gstApplicable !== undefined && { gstApplicable }),
        ...(state !== undefined && { state }),
        ...(email !== undefined && { email }),
        ...(partyType !== undefined && { partyType }),
        ...(otherMobileNo !== undefined && { otherMobileNo }),
        ...(partyLimit !== undefined && { partyLimit: parseFloat(partyLimit) }),
        ...(interestRate !== undefined && { interestRate: parseFloat(interestRate) }),
        ...(loyaltyPoints !== undefined && { loyaltyPoints: parseInt(loyaltyPoints, 10) }),
        ...(joiningDate !== undefined && { joiningDate }),
        ...(wholeParty !== undefined && { wholeParty }),
        ...(sezParty !== undefined && { sezParty }),
        ...(focParty !== undefined && { focParty })
      }
    });
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete customer/party
exports.deleteCustomer = async (req, res) => {
  const companyId = req.user.companyId;
  const { id } = req.params;
  try {
    await prisma.customer.delete({
      where: { id: parseInt(id, 10), companyId }
    });
    res.status(200).json({ success: true, message: 'Party deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
