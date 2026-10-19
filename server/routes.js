const express = require('express');
const router = express.Router();

const Store = require('./models/Store');
const Department = require('./models/Department');
const Customer = require('./models/Customer');
const Product = require('./models/Product');
const Order = require('./models/Order');
const LoyaltyTransaction = require('./models/LoyaltyTransaction');
const Coupon = require('./models/Coupon');
const Campaign = require('./models/Campaign');
const SupportTicket = require('./models/SupportTicket');
const Expense = require('./models/Expense');
const SystemMeta = require('./models/SystemMeta');

// Helper to retrieve active PIN
async function getEffectivePin() {
  try {
    const meta = await SystemMeta.findOne({ key: 'app_pin' }).lean();
    if (meta && meta.value) return String(meta.value);
  } catch (e) {
    // ignore
  }
  return process.env.APP_PIN || '0000';
}

// =================== PIN SECURITY & AUTH ===================
router.post('/auth/verify-pin', async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin && pin !== 0) {
      return res.status(400).json({ success: false, error: 'পিন কোড প্রদান করুন' });
    }
    const currentPin = await getEffectivePin();
    if (String(pin).trim() === currentPin) {
      return res.json({ 
        success: true, 
        message: 'পিন যাচাই সফল হয়েছে',
        storeName: 'মিজান কম্পিউটার অ্যান্ড কসমেটিকস',
        authenticatedAt: new Date().toISOString()
      });
    } else {
      return res.status(401).json({ 
        success: false, 
        error: 'ভুল পিন কোড! অনুগ্রহ করে সঠিক পিন দিন।' 
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/change-pin', async (req, res) => {
  try {
    const { oldPin, newPin } = req.body;
    if (!oldPin || !newPin) {
      return res.status(400).json({ error: 'পুরাতন ও নতুন পিন কোড প্রদান করুন' });
    }
    if (String(newPin).trim().length < 4) {
      return res.status(400).json({ error: 'নতুন পিন কোড কমপক্ষে ৪ ডিজিটের হতে হবে' });
    }
    const currentPin = await getEffectivePin();
    if (String(oldPin).trim() !== currentPin) {
      return res.status(401).json({ error: 'বর্তমান পিন কোড সঠিক নয়' });
    }
    await SystemMeta.findOneAndUpdate(
      { key: 'app_pin' },
      { value: String(newPin).trim(), updated_at: new Date() },
      { upsert: true }
    );
    res.json({ success: true, message: 'পিন কোড সফলভাবে পরিবর্তন করা হয়েছে।' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== STORES & DEPARTMENTS ===================
router.get('/stores', async (req, res) => {
  try {
    await Store.updateMany(
      { name: 'মিজান স্টেশনারি' },
      { $set: { name: 'মিজান কম্পিউটার অ্যান্ড কসমেটিকস' } }
    );
    const stores = await Store.find().sort({ id: 1 }).lean();
    res.json(stores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const DEFAULT_DEPARTMENTS = [
  { id: 'dept_cosmetics', name: 'কসমেটিকস ও রূপচর্চা', code: 'COSM', icon: 'Sparkles', description: 'ফেসওয়াশ, লোশন, ক্রিম, শ্যাম্পু, পারফিউম, লিপস্টিক ও স্কিন কেয়ার' },
  { id: 'dept_gifts', name: 'গিফট আইটেম ও খেলনা', code: 'GIFT', icon: 'Gift', description: 'ফটোফ্রেম, শোপিস, কাস্টমাইজড মগ, হাতঘড়ি, খেলনা ও গিফট বক্স' },
  { id: 'dept_computer', name: 'কম্পিউটার ও ডিজিটাল সামগ্রী', code: 'COMP', icon: 'Monitor', description: 'মাউস, কিবোর্ড, পেনড্রাইভ, হেডফোন, ইউএসবি ক্যাবল ও চার্জার' },
  { id: 'dept_paper', name: 'খাতা, ডায়েরি ও কাগজ সামগ্রী', code: 'PAPR', icon: 'BookOpen', description: 'লেকচার খাতা, স্পাইরাল নোটবুক, এ৪ রিম পেপার ও এক্সিকিউটিভ ডায়েরি' },
  { id: 'dept_pens', name: 'কলম, পেন্সিল ও মার্কার', code: 'PENS', icon: 'Edit3', description: 'বলপেন, জেল পেন, রোলিং বল, ড্রয়িং পেন্সিল ও হাইলাইটার' },
  { id: 'dept_art', name: 'আর্ট, ক্রাফট ও ড্রয়িং', code: 'ARTS', icon: 'Palette', description: 'জলরং, এক্রিলিক, ক্যানভাস, তুলি, গ্লু গান ও পোস্টার পেপার' },
  { id: 'dept_office', name: 'অফিস সাপ্লাই ও ফাইল ফোল্ডার', code: 'OFFC', icon: 'Folder', description: 'বক্স ফাইল, পাঞ্চিং মেশিন, স্ট্যাপলার, ক্লিপবোর্ড ও ডেস্ক অর্গানাইজার' },
  { id: 'dept_tools', name: 'ক্যালকুলেটর, জ্যামিতি ও ব্যাগ', code: 'TOOL', icon: 'Briefcase', description: 'সায়েন্টিফিক ক্যালকুলেটর, জ্যামিতি বক্স, মেটাল স্কেল ও স্কুল ব্যাকপ্যাক' }
];

router.get('/departments', async (req, res) => {
  try {
    for (const d of DEFAULT_DEPARTMENTS) {
      await Department.updateOne(
        { id: d.id },
        { $setOnInsert: d },
        { upsert: true }
      );
    }
    let depts = await Department.find().sort({ id: 1 }).lean();
    res.json(depts && depts.length > 0 ? depts : DEFAULT_DEPARTMENTS);
  } catch (err) {
    res.json(DEFAULT_DEPARTMENTS);
  }
});

router.post('/departments', async (req, res) => {
  try {
    const { name, code, description, icon } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'বিভাগের নাম প্রদান করা আবশ্যক' });
    }

    const trimmedName = name.trim();
    const existing = await Department.findOne({ 
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } 
    });
    if (existing) {
      return res.status(400).json({ error: 'এই নামের একটি বিভাগ ইতিমধ্যে ক্যাটালগে রয়েছে' });
    }

    let generatedCode = code ? code.trim().toUpperCase() : '';
    if (!generatedCode) {
      // Pick first 4 letters or fallback
      const latinOnly = trimmedName.replace(/[^A-Za-z0-9]/g, '');
      generatedCode = (latinOnly.length >= 3 ? latinOnly.substring(0, 4).toUpperCase() : 'DEPT' + Math.floor(10 + Math.random() * 90));
    }

    const id = 'dept_' + Date.now();
    const newDept = await Department.create({
      id,
      name: trimmedName,
      code: generatedCode,
      icon: icon || 'Folder',
      description: description ? description.trim() : ''
    });

    res.status(201).json(newDept);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/departments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const prodCount = await Product.countDocuments({ department_id: id });
    if (prodCount > 0) {
      return res.status(400).json({ 
        error: `এই বিভাগের অধীনে ${prodCount}টি পণ্য বিদ্যমান। বিভাগ মুছতে প্রথমে পণ্যগুলো অন্য বিভাগে স্থানান্তর করুন।` 
      });
    }
    const deleted = await Department.findOneAndDelete({ id });
    if (!deleted) {
      return res.status(404).json({ error: 'বিভাগটি খুঁজে পাওয়া যায়নি' });
    }
    res.json({ success: true, message: 'বিভাগ সফলভাবে মুছে ফেলা হয়েছে।' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== CUSTOMERS ===================
router.get('/customers', async (req, res) => {
  try {
    const { search, tier, churn_risk, preferred_department, sort = 'last_visit' } = req.query;
    const filter = {};

    if (tier && tier !== 'All') filter.tier = tier;
    if (churn_risk && churn_risk !== 'All') filter.churn_risk = churn_risk;
    if (preferred_department && preferred_department !== 'All') filter.preferred_department = preferred_department;

    if (search) {
      const reg = new RegExp(search, 'i');
      filter.$or = [
        { first_name: reg },
        { last_name: reg },
        { card_number: reg },
        { email: reg },
        { phone: reg }
      ];
    }

    const sortMap = {
      'total_spent': { total_spent: -1 },
      'points_balance': { points_balance: -1 },
      'visit_count': { visit_count: -1 },
      'name': { first_name: 1 },
      'last_visit': { last_visit: -1 }
    };

    const customers = await Customer.find(filter).sort(sortMap[sort] || { last_visit: -1 }).lean();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/customers/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({ id: req.params.id }).lean();
    if (!customer) return res.status(404).json({ error: 'গ্রাহক খুঁজে পাওয়া যায়নি' });

    const [orders, loyalty, tickets] = await Promise.all([
      Order.find({ customer_id: customer.id }).sort({ created_at: -1 }).limit(20).lean(),
      LoyaltyTransaction.find({ customer_id: customer.id }).sort({ created_at: -1 }).limit(30).lean(),
      SupportTicket.find({ customer_id: customer.id }).sort({ created_at: -1 }).lean()
    ]);

    const aov = customer.visit_count > 0 ? (customer.total_spent / customer.visit_count).toFixed(2) : '0.00';

    res.json({
      ...customer,
      aov: Number(aov),
      orders,
      loyalty,
      tickets
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/customers', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, birthday, preferred_department, notes, tags } = req.body;
    if (!first_name || !last_name || !email || !phone) {
      return res.status(400).json({ error: 'First name, last name, email, and phone are required' });
    }

    const id = 'cust_' + Date.now();
    const randNum = Math.floor(10000 + Math.random() * 90000);
    const card_number = `BRZ-${randNum}`;
    const join_date = new Date().toISOString().split('T')[0];

    const customer = await Customer.create({
      id,
      card_number,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      tier: 'Bronze',
      points_balance: 50,
      lifetime_points: 50,
      total_spent: 0,
      visit_count: 0,
      join_date,
      birthday: birthday || null,
      churn_risk: 'Low',
      tags: tags || ['নতুন মেম্বার'],
      notes: notes || '',
      preferred_department: preferred_department || 'খাতা, ডায়েরি ও কাগজ সামগ্রী'
    });

    await LoyaltyTransaction.create({
      id: 'lt_' + Date.now(),
      customer_id: id,
      type: 'Bonus',
      points: 50,
      balance_after: 50,
      description: 'স্বাগতম মেম্বার বোনাস পয়েন্ট',
      created_at: new Date().toISOString()
    });

    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/customers/:id', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, birthday, preferred_department, notes, tags } = req.body;
    const updated = await Customer.findOneAndUpdate(
      { id: req.params.id },
      {
        $set: {
          first_name,
          last_name,
          email,
          phone,
          birthday,
          preferred_department,
          notes,
          tags
        }
      },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ error: 'Customer not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/customers/:id/points', async (req, res) => {
  try {
    const { points, reason, type = 'Adjusted' } = req.body;
    const delta = parseInt(points, 10);
    if (isNaN(delta) || delta === 0) {
      return res.status(400).json({ error: 'Valid points integer is required' });
    }

    const customer = await Customer.findOne({ id: req.params.id });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const newBalance = Math.max(0, customer.points_balance + delta);
    const newLifetime = delta > 0 ? customer.lifetime_points + delta : customer.lifetime_points;

    let newTier = customer.tier;
    if (newLifetime >= 12000) newTier = 'VIP';
    else if (newLifetime >= 7000) newTier = 'Platinum';
    else if (newLifetime >= 3500) newTier = 'Gold';
    else if (newLifetime >= 1500) newTier = 'Silver';
    else newTier = 'Bronze';

    customer.points_balance = newBalance;
    customer.lifetime_points = newLifetime;
    customer.tier = newTier;
    await customer.save();

    await LoyaltyTransaction.create({
      id: 'lt_' + Date.now(),
      customer_id: customer.id,
      type,
      points: delta,
      balance_after: newBalance,
      description: reason || 'ম্যানুয়াল পয়েন্ট সমন্বয়',
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      points_balance: newBalance,
      lifetime_points: newLifetime,
      tier: newTier
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== PRODUCTS & INVENTORY ===================
router.get('/products', async (req, res) => {
  try {
    const { department_id, search, low_stock, expiry_filter, expiry_from, expiry_to, sort } = req.query;
    const filter = {};

    if (department_id && department_id !== 'all' && department_id !== 'undefined' && department_id !== 'null') {
      filter.department_id = department_id;
    }

    if (search && search !== 'undefined' && search !== 'null' && search.trim() !== '') {
      const reg = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: reg },
        { barcode: reg },
        { category: reg }
      ];
    }

    if (low_stock === 'true') {
      filter.$expr = { $lte: ['$stock_qty', '$min_threshold'] };
    }

    const today = new Date().toISOString().split('T')[0];
    const addDays = (d, days) => {
      const date = new Date(d);
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0];
    };

    if (expiry_filter && expiry_filter !== 'all' && expiry_filter !== 'undefined' && expiry_filter !== 'null') {
      if (expiry_filter === 'has_expiry') {
        filter.has_expiry = 1;
        filter.expiry_date = { $ne: null };
      } else if (expiry_filter === 'no_expiry') {
        filter.$or = [{ has_expiry: 0 }, { has_expiry: null }, { expiry_date: null }];
      } else if (expiry_filter === 'expired') {
        filter.has_expiry = 1;
        filter.expiry_date = { $lt: today, $ne: null };
      } else if (expiry_filter === 'expiring_30') {
        filter.has_expiry = 1;
        filter.expiry_date = { $gte: today, $lte: addDays(today, 30) };
      } else if (expiry_filter === 'expiring_60') {
        filter.has_expiry = 1;
        filter.expiry_date = { $gte: today, $lte: addDays(today, 60) };
      } else if (expiry_filter === 'expiring_90') {
        filter.has_expiry = 1;
        filter.expiry_date = { $gte: today, $lte: addDays(today, 90) };
      }
    }

    const cleanExpFrom = (expiry_from && expiry_from !== 'undefined' && expiry_from !== 'null' && expiry_from.trim() !== '') ? expiry_from.trim() : null;
    const cleanExpTo = (expiry_to && expiry_to !== 'undefined' && expiry_to !== 'null' && expiry_to.trim() !== '') ? expiry_to.trim() : null;

    if (cleanExpFrom || cleanExpTo) {
      filter.has_expiry = 1;
      filter.expiry_date = filter.expiry_date || {};
      if (cleanExpFrom) filter.expiry_date.$gte = cleanExpFrom;
      if (cleanExpTo) filter.expiry_date.$lte = cleanExpTo;
    }

    // Dynamic sorting (default to newest first so freshly created products appear on top)
    let sortObj = { createdAt: -1, _id: -1 };
    if (sort === 'name') sortObj = { name: 1 };
    else if (sort === 'price_desc') sortObj = { price: -1 };
    else if (sort === 'price_asc') sortObj = { price: 1 };
    else if (sort === 'stock_desc') sortObj = { stock_qty: -1 };
    else if (sort === 'stock_asc') sortObj = { stock_qty: 1 };
    else if (sort === 'oldest') sortObj = { createdAt: 1, _id: 1 };

    const [products, depts] = await Promise.all([
      Product.find(filter).sort(sortObj).lean(),
      Department.find().lean()
    ]);

    const deptMap = {};
    for (const d of DEFAULT_DEPARTMENTS) {
      deptMap[d.id] = { name: d.name, code: d.code };
    }
    for (const d of depts) {
      deptMap[d.id] = { name: d.name, code: d.code };
    }

    const enriched = products.map(p => ({
      ...p,
      department_name: deptMap[p.department_id]?.name || 'সাধারণ স্টেশনারি',
      department_code: deptMap[p.department_id]?.code || 'GEN'
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id }).lean();
    if (!product) return res.status(404).json({ error: 'পণ্যটি খুঁজে পাওয়া যায়নি' });

    const dept = await Department.findOne({ id: product.department_id }).lean();
    const fallbackDept = DEFAULT_DEPARTMENTS.find(d => d.id === product.department_id);
    res.json({
      ...product,
      department_name: dept?.name || fallbackDept?.name || 'সাধারণ স্টেশনারি',
      department_code: dept?.code || fallbackDept?.code || 'GEN'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products', async (req, res) => {
  try {
    const { name, barcode, department_id, category, price, cost, stock_qty, min_threshold, unit, expiry_date, has_expiry } = req.body;
    if (!name || !name.trim() || !barcode || !barcode.trim() || !department_id || price === undefined || price === null || price === '') {
      return res.status(400).json({ error: 'পণ্যের নাম, বারকোড, বিভাগ এবং বিক্রয়মূল্য প্রদান করা আবশ্যক' });
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ error: 'সঠিক বিক্রয়মূল্য প্রদান করুন' });
    }

    const trimmedBarcode = barcode.trim();
    const existing = await Product.findOne({ barcode: trimmedBarcode });
    if (existing) {
      return res.status(400).json({ error: `এই বারকোডটি (${trimmedBarcode}) ইতিমধ্যে ক্যাটালগে রয়েছে ('${existing.name}')` });
    }

    const isExpApplicable = (has_expiry === true || has_expiry === 1 || has_expiry === '1' || has_expiry === 'true') && expiry_date ? 1 : 0;
    const finalExpiry = isExpApplicable ? expiry_date.trim() : null;

    const id = 'prod_' + Date.now();
    const created = await Product.create({
      id,
      barcode: trimmedBarcode,
      name: name.trim(),
      department_id,
      category: (category && category.trim()) ? category.trim() : 'সাধারণ স্টেশনারি',
      price: numPrice,
      cost: parseFloat(cost || 0),
      stock_qty: parseInt(stock_qty || 0, 10),
      min_threshold: parseInt(min_threshold || 10, 10),
      unit: (unit && unit.trim()) ? unit.trim() : 'পিস',
      expiry_date: finalExpiry,
      has_expiry: isExpApplicable
    });

    const dept = await Department.findOne({ id: department_id }).lean();
    const fallbackDept = DEFAULT_DEPARTMENTS.find(d => d.id === department_id);
    res.status(201).json({
      ...created.toObject(),
      department_name: dept?.name || fallbackDept?.name || 'সাধারণ স্টেশনারি',
      department_code: dept?.code || fallbackDept?.code || 'GEN'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const { name, barcode, department_id, category, price, cost, stock_qty, min_threshold, unit, expiry_date, has_expiry } = req.body;
    const existing = await Product.findOne({ id: req.params.id });
    if (!existing) return res.status(404).json({ error: 'পণ্যটি খুঁজে পাওয়া যায়নি' });

    if (barcode && barcode.trim() !== existing.barcode) {
      const duplicate = await Product.findOne({ barcode: barcode.trim(), id: { $ne: req.params.id } });
      if (duplicate) {
        return res.status(400).json({ error: 'এই বারকোডটি অন্য একটি পণ্যে ইতিমধ্যে ব্যবহৃত হচ্ছে' });
      }
      existing.barcode = barcode.trim();
    }

    if (name) existing.name = name.trim();
    if (department_id) existing.department_id = department_id;
    if (category) existing.category = category;
    if (price !== undefined) existing.price = parseFloat(price);
    if (cost !== undefined) existing.cost = parseFloat(cost);
    if (stock_qty !== undefined) existing.stock_qty = parseInt(stock_qty, 10);
    if (min_threshold !== undefined) existing.min_threshold = parseInt(min_threshold, 10);
    if (unit) existing.unit = unit;

    if (has_expiry !== undefined) {
      const isExp = (has_expiry === true || has_expiry === 1 || has_expiry === '1' || has_expiry === 'true') ? 1 : 0;
      existing.has_expiry = isExp;
      existing.expiry_date = isExp ? (expiry_date ? expiry_date.trim() : existing.expiry_date) : null;
    } else if (expiry_date !== undefined) {
      existing.expiry_date = expiry_date ? expiry_date.trim() : null;
      existing.has_expiry = existing.expiry_date ? 1 : 0;
    }

    await existing.save();

    const dept = await Department.findOne({ id: existing.department_id }).lean();
    res.json({
      ...existing.toObject(),
      department_name: dept?.name || '',
      department_code: dept?.code || ''
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/products/:id/stock', async (req, res) => {
  try {
    const { change, set_to } = req.body;
    const product = await Product.findOne({ id: req.params.id });
    if (!product) return res.status(404).json({ error: 'পণ্যটি খুঁজে পাওয়া যায়নি' });

    let newStock = product.stock_qty;
    if (set_to !== undefined) {
      newStock = Math.max(0, parseInt(set_to, 10));
    } else if (change !== undefined) {
      newStock = Math.max(0, product.stock_qty + parseInt(change, 10));
    }

    product.stock_qty = newStock;
    await product.save();

    res.json({ success: true, product_id: product.id, new_stock: newStock });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const result = await Product.deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'পণ্যটি খুঁজে পাওয়া যায়নি' });
    res.json({ success: true, message: 'পণ্যটি সফলভাবে মুছে ফেলা হয়েছে' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== POS & CHECKOUT ===================
router.post('/pos/checkout', async (req, res) => {
  try {
    const {
      customer_id,
      store_id,
      cashier_name,
      items,
      coupon_code,
      manual_discount_type,
      manual_discount_value,
      manual_discount_amount,
      manual_discount_reason = '',
      points_to_redeem = 0,
      payment_method = 'নগদ (Cash)'
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'কার্টে অন্তত একটি পণ্য থাকা আবশ্যক' });
    }

    let subtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const pId = item.productId || item.product_id || item.id;
      const rawQty = item.qty !== undefined ? item.qty : item.quantity;
      const pQty = parseInt(rawQty !== undefined ? rawQty : 1, 10);

      if (!pId) {
        return res.status(400).json({ error: 'কার্টের পণ্যের আইডি পাওয়া যায়নি' });
      }

      if (isNaN(pQty) || pQty <= 0) {
        return res.status(400).json({ error: 'পণ্যের সঠিক পরিমাণ (Quantity) দিন' });
      }

      let prod = await Product.findOne({ id: pId });
      if (!prod && item.barcode) {
        prod = await Product.findOne({ barcode: String(item.barcode).trim() });
      }
      if (!prod) {
        return res.status(400).json({ error: `পণ্য ID '${pId}' খুঁজে পাওয়া যায়নি` });
      }

      if (prod.stock_qty < pQty) {
        return res.status(400).json({ 
          error: `পর্যাপ্ত স্টক নেই: ${prod.name} (চাহিদা: ${pQty}, বর্তমান মজুদ: ${prod.stock_qty})` 
        });
      }

      const lineTotal = Number((prod.price * pQty).toFixed(2));
      subtotal += lineTotal;

      const dept = await Department.findOne({ id: prod.department_id }).lean();
      const fallbackDept = DEFAULT_DEPARTMENTS.find(d => d.id === prod.department_id);
      verifiedItems.push({
        productId: prod.id,
        id: prod.id,
        name: prod.name,
        deptName: dept?.name || fallbackDept?.name || 'স্টেশনারি',
        unitPrice: prod.price,
        qty: pQty,
        quantity: pQty,
        lineTotal
      });

      // Deduct stock
      prod.stock_qty = Math.max(0, prod.stock_qty - pQty);
      await prod.save();
    }

    subtotal = Number(subtotal.toFixed(2));

    // Coupon discount
    let discountAmount = 0;
    if (coupon_code) {
      const coupon = await Coupon.findOne({ code: coupon_code.toUpperCase(), is_active: 1 });
      if (coupon && subtotal >= coupon.min_spend) {
        if (coupon.discount_type === 'percentage') {
          discountAmount = (subtotal * coupon.discount_value) / 100;
          if (coupon.max_discount > 0 && discountAmount > coupon.max_discount) {
            discountAmount = coupon.max_discount;
          }
        } else {
          discountAmount = Math.min(coupon.discount_value, subtotal);
        }
        discountAmount = Number(discountAmount.toFixed(2));
        coupon.used_count += 1;
        await coupon.save();
      }
    }

    // Manual discount
    let calculatedManualDiscount = 0;
    const parsedManualVal = parseFloat(manual_discount_value || manual_discount_amount || 0);
    if (parsedManualVal > 0) {
      if (manual_discount_type === 'percentage') {
        calculatedManualDiscount = (subtotal * parsedManualVal) / 100;
      } else {
        calculatedManualDiscount = parsedManualVal;
      }
      const maxPossibleManual = Math.max(0, subtotal - discountAmount);
      if (calculatedManualDiscount > maxPossibleManual) {
        calculatedManualDiscount = maxPossibleManual;
      }
      calculatedManualDiscount = Number(calculatedManualDiscount.toFixed(2));
    }

    // Points discount
    let pointsRedeemed = 0;
    let pointsDiscount = 0;
    let customer = null;
    if (customer_id) {
      customer = await Customer.findOne({ id: customer_id });
      if (customer && points_to_redeem > 0) {
        pointsRedeemed = Math.min(customer.points_balance, parseInt(points_to_redeem, 10));
        pointsDiscount = Number((pointsRedeemed * 1.0).toFixed(2));
        const rem = Math.max(0, subtotal - discountAmount - calculatedManualDiscount);
        if (pointsDiscount > rem) {
          pointsDiscount = rem;
          pointsRedeemed = Math.round(pointsDiscount);
        }
      }
    }

    const netTaxable = Math.max(0, subtotal - discountAmount - calculatedManualDiscount - pointsDiscount);
    const tax = 0; // Stationery zero VAT in BD
    const total = Number(netTaxable.toFixed(2));

    const orderId = 'ord_' + Date.now();
    const orderNumber = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const createdAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const orderItemsForSave = verifiedItems.map((it, idx) => ({
      id: `item_${orderId}_${idx + 1}`,
      product_id: it.productId,
      product_name: it.name,
      department_name: it.deptName,
      unit_price: it.unitPrice,
      quantity: it.qty,
      total_price: it.lineTotal
    }));

    await Order.create({
      id: orderId,
      order_number: orderNumber,
      customer_id: customer ? customer.id : null,
      store_id: store_id || 'store_1',
      cashier_name: cashier_name || 'মিজানুর রহমান',
      subtotal,
      discount_amount: discountAmount,
      manual_discount: calculatedManualDiscount,
      manual_discount_reason: manual_discount_reason.trim(),
      points_redeemed: pointsRedeemed,
      points_discount: pointsDiscount,
      tax,
      total,
      payment_method,
      status: 'Completed',
      created_at: createdAt,
      items: orderItemsForSave
    });

    let earnedPoints = 0;
    if (customer) {
      let multiplier = 1.0;
      if (customer.tier === 'Silver') multiplier = 1.25;
      else if (customer.tier === 'Gold') multiplier = 1.5;
      else if (customer.tier === 'Platinum') multiplier = 1.75;
      else if (customer.tier === 'VIP') multiplier = 2.0;

      earnedPoints = Math.round(total * multiplier);
      const newBalance = customer.points_balance - pointsRedeemed + earnedPoints;
      const newLifetime = customer.lifetime_points + earnedPoints;
      const newTotalSpent = Number((customer.total_spent + total).toFixed(2));
      const newVisitCount = customer.visit_count + 1;

      let newTier = customer.tier;
      if (newLifetime >= 12000) newTier = 'VIP';
      else if (newLifetime >= 7000) newTier = 'Platinum';
      else if (newLifetime >= 3500) newTier = 'Gold';
      else if (newLifetime >= 1500) newTier = 'Silver';

      customer.points_balance = newBalance;
      customer.lifetime_points = newLifetime;
      customer.total_spent = newTotalSpent;
      customer.visit_count = newVisitCount;
      customer.last_visit = createdAt.split(' ')[0];
      customer.tier = newTier;
      customer.churn_risk = 'Low';
      await customer.save();

      if (pointsRedeemed > 0) {
        await LoyaltyTransaction.create({
          id: 'lt_' + Date.now() + '_red',
          customer_id: customer.id,
          order_id: orderId,
          type: 'Redeemed',
          points: -pointsRedeemed,
          balance_after: customer.points_balance - earnedPoints,
          description: `অর্ডার #${orderNumber}-এ রিডিম পয়েন্ট`,
          created_at: createdAt
        });
      }

      await LoyaltyTransaction.create({
        id: 'lt_' + Date.now() + '_earn',
        customer_id: customer.id,
        order_id: orderId,
        type: 'Earned',
        points: earnedPoints,
        balance_after: customer.points_balance,
        description: `অর্ডার #${orderNumber}-এ অর্জিত ${earnedPoints} পয়েন্ট (${multiplier}x রেট)`,
        created_at: createdAt
      });
    }

    res.status(201).json({
      orderId,
      orderNumber,
      subtotal,
      discountAmount,
      manualDiscount: calculatedManualDiscount,
      manualDiscountReason: manual_discount_reason.trim(),
      pointsRedeemed,
      pointsDiscount,
      tax,
      total,
      payment_method,
      createdAt,
      earnedPoints,
      items: verifiedItems,
      customerName: customer ? `${customer.first_name} ${customer.last_name}` : 'সাধারণ খুচরা ক্রেতা',
      customerCard: customer ? customer.card_number : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== ORDERS & RECEIPTS ===================
router.get('/orders', async (req, res) => {
  try {
    const { customer_id, limit = 50, start_date, end_date } = req.query;
    const filter = {};

    if (customer_id) filter.customer_id = customer_id;
    if (start_date || end_date) {
      filter.created_at = {};
      if (start_date) filter.created_at.$gte = start_date;
      if (end_date) filter.created_at.$lte = end_date + ' 23:59:59';
    }

    const orders = await Order.find(filter)
      .sort({ created_at: -1 })
      .limit(parseInt(limit, 10))
      .lean();

    const customerIds = orders.map(o => o.customer_id).filter(Boolean);
    const customers = await Customer.find({ id: { $in: customerIds } }).lean();
    const custMap = {};
    for (const c of customers) custMap[c.id] = c;

    const enriched = orders.map(o => ({
      ...o,
      customer_first_name: custMap[o.customer_id]?.first_name || '',
      customer_last_name: custMap[o.customer_id]?.last_name || '',
      customer_card: custMap[o.customer_id]?.card_number || null,
      store_name: 'মিজান কম্পিউটার অ্যান্ড কসমেটিকস'
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ id: req.params.id }).lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    let customer = null;
    if (order.customer_id) {
      customer = await Customer.findOne({ id: order.customer_id }).lean();
    }

    const store = await Store.findOne({ id: order.store_id || 'store_1' }).lean();

    res.json({
      ...order,
      first_name: customer?.first_name || '',
      last_name: customer?.last_name || '',
      email: customer?.email || '',
      phone: customer?.phone || '',
      card_number: customer?.card_number || null,
      tier: customer?.tier || 'Bronze',
      store_name: store?.name || 'মিজান কম্পিউটার অ্যান্ড কসমেটিকস',
      store_location: store?.location || 'চন্ডিপুর পুরান বাজার, নড়িয়া, শরীয়তপুর',
      store_phone: store?.phone || '+৮৮০ ১৭৯৮-১২৩৪৫৬'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== COUPONS & OFFERS ===================
router.get('/coupons', async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ expiry_date: 1 }).lean();
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/coupons', async (req, res) => {
  try {
    const { code, title, discount_type, discount_value, min_spend, max_discount, target_tier, expiry_date, usage_limit } = req.body;
    if (!code || !title || !discount_type || discount_value === undefined || !expiry_date) {
      return res.status(400).json({ error: 'Code, title, discount type, value, and expiry date are required' });
    }

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) return res.status(400).json({ error: 'Coupon code already exists' });

    const id = 'cp_' + Date.now();
    const created = await Coupon.create({
      id,
      code: code.toUpperCase(),
      title,
      discount_type,
      discount_value: parseFloat(discount_value),
      min_spend: parseFloat(min_spend || 0),
      max_discount: parseFloat(max_discount || 0),
      target_tier: target_tier || 'All',
      expiry_date,
      usage_limit: parseInt(usage_limit || 100, 10),
      used_count: 0,
      is_active: 1
    });

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/coupons/validate', async (req, res) => {
  try {
    const { code, cart_subtotal, customer_tier = 'Bronze' } = req.body;
    if (!code) return res.status(400).json({ valid: false, message: 'Coupon code is required' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), is_active: 1 }).lean();
    if (!coupon) return res.status(404).json({ valid: false, message: 'Invalid or expired coupon code' });

    if (coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ valid: false, message: 'Coupon usage limit has been reached' });
    }

    const today = new Date().toISOString().split('T')[0];
    if (coupon.expiry_date < today) {
      return res.status(400).json({ valid: false, message: 'Coupon has expired' });
    }

    if (cart_subtotal < coupon.min_spend) {
      return res.status(400).json({
        valid: false,
        message: `ন্যূনতম ৳${coupon.min_spend.toFixed(2)} ক্রয়ে এই কুপন প্রযোজ্য`
      });
    }

    let estimatedDiscount = 0;
    if (coupon.discount_type === 'percentage') {
      estimatedDiscount = (cart_subtotal * coupon.discount_value) / 100;
      if (coupon.max_discount > 0 && estimatedDiscount > coupon.max_discount) {
        estimatedDiscount = coupon.max_discount;
      }
    } else {
      estimatedDiscount = Math.min(coupon.discount_value, cart_subtotal);
    }

    res.json({
      valid: true,
      coupon,
      estimatedDiscount: Number(estimatedDiscount.toFixed(2))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== CAMPAIGNS ===================
const DEFAULT_CAMPAIGNS = [
  {
    id: 'cmp_01',
    name: 'এইচএসসি ও ভর্তি প্রস্তুতি স্পেশাল অফার',
    channel: 'SMS',
    target_segment: 'সকল নিবন্ধিত সদস্য (All Members)',
    subject: 'ভর্তি পরীক্ষা ও এইচএসসি প্রস্তুতিতে খাতা-কলমে বিশেষ ছাড়!',
    content: 'প্রিয় {first_name}, মিজান কম্পিউটার অ্যান্ড কসমেটিকসের বিশেষ অফারে ১০% ছাড় পেতে কুপন কোড ব্যবহার করুন: {coupon_code}।',
    coupon_code: 'STUDENT10',
    status: 'Sent',
    audience_count: 10,
    open_rate: 88.5,
    click_rate: 34.2,
    conversion_rate: 18.5,
    revenue_generated: 16800.00,
    sent_at: '2026-10-10 11:30:00'
  },
  {
    id: 'cmp_02',
    name: 'কর্পোরেট ও অফিস পেপার রিম পাইকারি ক্যাশব্যাক',
    channel: 'Email',
    target_segment: 'ভিআইপি সদস্য (VIP Shoppers)',
    subject: 'বক্স ফাইল ও এ৪ রিম পেপার ক্রয়ে ৫০০ টাকা ক্যাশব্যাক অফার',
    content: 'শ্রদ্ধেয় {first_name}, আপনার অফিসের জন্য ৫,০০০ টাকার স্টেশনারি সামগ্রী অর্ডারে পাচ্ছেন নিশ্চিত ৫০০ টাকা ক্যাশব্যাক! ভাউচার: {coupon_code}।',
    coupon_code: 'BULK500',
    status: 'Sent',
    audience_count: 2,
    open_rate: 75.0,
    click_rate: 45.0,
    conversion_rate: 50.0,
    revenue_generated: 48500.00,
    sent_at: '2026-10-14 16:15:00'
  },
  {
    id: 'cmp_03',
    name: 'আর্ট, ড্রয়িং তুলি ও কালার ক্লিয়ারেন্স সেল',
    channel: 'SMS',
    target_segment: 'গোল্ড ও প্ল্যাটিনাম সদস্য',
    subject: 'চারুকলা ও ড্রয়িং শিক্ষার্থীদের জন্য বিশেষ ছাড়',
    content: 'প্রিয় {first_name}, ক্যামলিন এক্রিলিক ও আর্টিস্ট তুলি সেটে পাচ্ছেন ১৫% আকর্ষণীয় মূল্যছাড়। আজই স্টোরে আসুন!',
    coupon_code: 'EXAMSPECIAL',
    status: 'Draft',
    audience_count: 0,
    open_rate: 0,
    click_rate: 0,
    conversion_rate: 0,
    revenue_generated: 0,
    sent_at: null
  },
  {
    id: 'cmp_04',
    name: 'নিষ্ক্রিয় গ্রাহক রিকল ও রি-এনগেজমেন্ট ব্লাস্ট',
    channel: 'Omnichannel',
    target_segment: 'ঝুঁকিপূর্ণ গ্রাহক (Churn Risk)',
    subject: 'আপনাকে মিস করছি! বিশেষ ২০% উপহার ভাউচার আপনার অপেক্ষায়',
    content: 'প্রিয় {first_name}, মিজান কম্পিউটার অ্যান্ড কসমেটিকসে পুনরায় স্বাগতম জানাতে আপনার অ্যাকাউন্টে যোগ করা হয়েছে ২০% ছাড় ভাউচার: {coupon_code}!',
    coupon_code: 'MIJANVIP20',
    status: 'Draft',
    audience_count: 0,
    open_rate: 0,
    click_rate: 0,
    conversion_rate: 0,
    revenue_generated: 0,
    sent_at: null
  }
];

// Dynamic Database Driven Customer Segments
router.get('/campaigns/segments', async (req, res) => {
  try {
    const [vipCount, goldPlatCount, churnCount, highLtvCount, newMemCount, totalCount] = await Promise.all([
      Customer.countDocuments({ tier: 'VIP' }),
      Customer.countDocuments({ tier: { $in: ['Platinum', 'Gold', 'VIP'] } }),
      Customer.countDocuments({ churn_risk: 'High' }),
      Customer.countDocuments({ $or: [{ lifetime_points: { $gte: 3000 } }, { total_spent: { $gte: 25000 } }] }),
      Customer.countDocuments({ tags: 'নতুন মেম্বার' }),
      Customer.countDocuments({})
    ]);

    const segments = [
      {
        id: 'VIP',
        name: 'ভিআইপি সদস্য (VIP Shoppers)',
        desc: '৪০,০০০+ টাকা কেনাকাটা করা শীর্ষ করপোরেট ও রেগুলার ক্রেতা',
        count: vipCount,
        criteria: 'Tier: VIP'
      },
      {
        id: 'GoldPlus',
        name: 'গোল্ড ও প্ল্যাটিনাম সদস্য',
        desc: 'নিয়মিত খাতা-কলম ও অফিস সরঞ্জাম রিকুইজিশন ক্রেতাবৃন্দ',
        count: goldPlatCount,
        criteria: 'Tier: Gold, Platinum, VIP'
      },
      {
        id: 'ChurnRisk',
        name: 'ঝুঁকিপূর্ণ গ্রাহক (Churn Risk)',
        desc: '৬০ দিনের বেশি সময় স্টোরে আসেননি এমন নিষ্ক্রিয় গ্রাহকদল',
        count: churnCount,
        criteria: 'Churn Risk: High'
      },
      {
        id: 'HighLTV',
        name: 'উচ্চ এলটিভি গ্রাহক (High LTV)',
        desc: '৩,০০০+ লয়্যালটি পয়েন্ট অর্জিত বিশ্বস্ত দীর্ঘমেয়াদী গ্রাহক',
        count: highLtvCount,
        criteria: 'Lifetime Points >= 3000'
      },
      {
        id: 'NewMembers',
        name: 'নতুন নিবন্ধিত মেম্বার (New)',
        desc: 'সাম্প্রতিক সময়ে নিবন্ধিত নতুন স্টেশনারি ক্রেতাবৃন্দ',
        count: newMemCount,
        criteria: 'Tag: নতুন মেম্বার'
      },
      {
        id: 'All',
        name: 'সকল নিবন্ধিত সদস্য (All Members)',
        desc: 'মিজান কম্পিউটার অ্যান্ড কসমেটিকসের সর্বমোট সক্রিয় লয়্যালটি মেম্বার তালিকা',
        count: totalCount,
        criteria: 'All Registered Customers'
      }
    ];

    res.json(segments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/campaigns', async (req, res) => {
  try {
    let campaigns = await Campaign.find().sort({ sent_at: -1, createdAt: -1, id: -1 }).lean();
    if (!campaigns || campaigns.length === 0) {
      try {
        await Campaign.insertMany(DEFAULT_CAMPAIGNS);
        campaigns = await Campaign.find().sort({ sent_at: -1, createdAt: -1, id: -1 }).lean();
      } catch (insertErr) {
        campaigns = DEFAULT_CAMPAIGNS;
      }
    }
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/campaigns', async (req, res) => {
  try {
    const { name, channel, target_segment, subject, content, coupon_code } = req.body;
    if (!name || !channel || !target_segment || !subject || !content) {
      return res.status(400).json({ error: 'ক্যাম্পেইনের নাম, মাধ্যম, টার্গেট সেগমেন্ট, বিষয় ও মূল বার্তা প্রদান আবশ্যক' });
    }

    const id = 'cmp_' + Date.now();
    const created = await Campaign.create({
      id,
      name: name.trim(),
      channel: channel || 'SMS',
      target_segment: target_segment.trim(),
      subject: subject.trim(),
      content: content.trim(),
      coupon_code: coupon_code ? coupon_code.trim().toUpperCase() : null,
      status: 'Draft',
      audience_count: 0
    });

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/campaigns/:id/send', async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ id: req.params.id });
    if (!campaign) return res.status(404).json({ error: 'ক্যাম্পেইন পাওয়া যায়নি' });

    let filter = {};
    const seg = campaign.target_segment;
    if (seg.includes('VIP') || seg === 'VIP') {
      filter = { tier: 'VIP' };
    } else if (seg.includes('গোল্ড') || seg.includes('প্ল্যাটিনাম') || seg === 'GoldPlus') {
      filter = { tier: { $in: ['Platinum', 'Gold', 'VIP'] } };
    } else if (seg.includes('ঝুঁকিপূর্ণ') || seg.includes('Churn') || seg === 'ChurnRisk') {
      filter = { churn_risk: 'High' };
    } else if (seg.includes('এলটিভি') || seg.includes('LTV') || seg === 'HighLTV') {
      filter = { $or: [{ lifetime_points: { $gte: 3000 } }, { total_spent: { $gte: 25000 } }] };
    } else if (seg.includes('নতুন') || seg.includes('New') || seg === 'NewMembers') {
      filter = { tags: 'নতুন মেম্বার' };
    } else {
      filter = {};
    }

    const targetCustomers = await Customer.find(filter).lean();
    const audienceCount = targetCustomers.length;

    // Real database driven basket value
    const avgBasket = targetCustomers.length > 0
      ? targetCustomers.reduce((acc, c) => acc + (c.total_spent / Math.max(1, c.visit_count)), 0) / targetCustomers.length
      : 850;

    const openRate = Number((65 + Math.random() * 25).toFixed(1));
    const clickRate = Number((25 + Math.random() * 20).toFixed(1));
    const conversionRate = Number((12 + Math.random() * 15).toFixed(1));
    const convertingCustomers = Math.max(1, Math.round(audienceCount * (conversionRate / 100)));
    const revenue = Number((convertingCustomers * avgBasket).toFixed(2));
    const sentAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

    campaign.status = 'Sent';
    campaign.audience_count = audienceCount;
    campaign.open_rate = openRate;
    campaign.click_rate = clickRate;
    campaign.conversion_rate = conversionRate;
    campaign.revenue_generated = revenue;
    campaign.sent_at = sentAt;
    await campaign.save();

    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/campaigns/:id', async (req, res) => {
  try {
    const deleted = await Campaign.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'ক্যাম্পেইন পাওয়া যায়নি' });
    res.json({ success: true, message: 'ক্যাম্পেইন সফলভাবে মুছে ফেলা হয়েছে।' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== SUPPORT TICKETS ===================
router.get('/tickets', async (req, res) => {
  try {
    const { status, priority, department } = req.query;
    const filter = {};

    if (status && status !== 'All') filter.status = status;
    if (priority && priority !== 'All') filter.priority = priority;
    if (department && department !== 'All') filter.department = department;

    const tickets = await SupportTicket.find(filter).sort({ created_at: -1 }).lean();

    const customerIds = tickets.map(t => t.customer_id).filter(Boolean);
    const customers = await Customer.find({ id: { $in: customerIds } }).lean();
    const custMap = {};
    for (const c of customers) custMap[c.id] = c;

    const enriched = tickets.map(t => ({
      ...t,
      first_name: custMap[t.customer_id]?.first_name || '',
      last_name: custMap[t.customer_id]?.last_name || '',
      email: custMap[t.customer_id]?.email || '',
      phone: custMap[t.customer_id]?.phone || '',
      card_number: custMap[t.customer_id]?.card_number || '',
      customer_tier: custMap[t.customer_id]?.tier || 'Bronze'
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tickets', async (req, res) => {
  try {
    const { customer_id, subject, department, type, priority, details, assigned_to } = req.body;
    if (!customer_id || !subject || !department || !type || !details) {
      return res.status(400).json({ error: 'Customer, subject, department, type, and details are required' });
    }

    const id = 'tkt_' + Date.now();
    const ticket_number = 'TCK-' + Math.floor(1000 + Math.random() * 9000);
    const created_at = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const created = await SupportTicket.create({
      id,
      ticket_number,
      customer_id,
      subject,
      department,
      type,
      priority: priority || 'Medium',
      status: 'Open',
      assigned_to: assigned_to || 'স্টোর সাপোর্ট ডেস্ক',
      details,
      created_at
    });

    const customer = await Customer.findOne({ id: customer_id }).lean();
    res.status(201).json({
      ...created.toObject(),
      first_name: customer?.first_name || '',
      last_name: customer?.last_name || '',
      email: customer?.email || '',
      phone: customer?.phone || '',
      card_number: customer?.card_number || ''
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/tickets/:id', async (req, res) => {
  try {
    const { status, resolution_notes, csat_score, assigned_to } = req.body;
    const ticket = await SupportTicket.findOne({ id: req.params.id });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    if (status) ticket.status = status;
    if (resolution_notes) ticket.resolution_notes = resolution_notes;
    if (csat_score !== undefined) ticket.csat_score = csat_score;
    if (assigned_to) ticket.assigned_to = assigned_to;
    if (status === 'Resolved' && !ticket.resolved_at) {
      ticket.resolved_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
    }

    await ticket.save();
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== EXPENSES (দোকান ব্যয় ও পরিচালন খরচ) ===================
router.get('/expenses', async (req, res) => {
  try {
    const { period, from_date, to_date, category } = req.query;
    const today = new Date().toISOString().split('T')[0];

    const filter = {};
    if (category && category !== 'all') {
      filter.category = category;
    }

    if (period === 'today') {
      filter.date = today;
    } else if (period === 'yesterday') {
      const yd = new Date();
      yd.setDate(yd.getDate() - 1);
      filter.date = yd.toISOString().split('T')[0];
    } else if (period === 'last_7_days') {
      const d7 = new Date();
      d7.setDate(d7.getDate() - 7);
      filter.date = { $gte: d7.toISOString().split('T')[0] };
    } else if (period === 'last_30_days') {
      const d30 = new Date();
      d30.setDate(d30.getDate() - 30);
      filter.date = { $gte: d30.toISOString().split('T')[0] };
    } else if (period === 'this_month') {
      filter.date = new RegExp('^' + today.substring(0, 7));
    } else if (from_date || to_date) {
      filter.date = {};
      if (from_date) filter.date.$gte = from_date;
      if (to_date) filter.date.$lte = to_date;
    }

    const expenses = await Expense.find(filter).sort({ date: -1, createdAt: -1 }).lean();
    let totalAmount = 0;
    const catMap = {};
    for (const exp of expenses) {
      const amt = Number(exp.amount || 0);
      totalAmount += amt;
      const cat = exp.category || 'অন্যান্য বিবিধ খরচ';
      if (!catMap[cat]) catMap[cat] = { category: cat, totalAmount: 0, count: 0 };
      catMap[cat].totalAmount += amt;
      catMap[cat].count += 1;
    }
    const categoryBreakdown = Object.values(catMap).sort((a, b) => b.totalAmount - a.totalAmount);

    res.json({
      expenses,
      totalAmount: Number(totalAmount.toFixed(2)),
      count: expenses.length,
      categoryBreakdown
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/expenses', async (req, res) => {
  try {
    const { title, category, amount, date, payment_method, notes, store_id } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'খরচের শিরোনাম প্রদান করুন' });
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'সঠিক খরচের পরিমাণ প্রদান করুন (৳)' });
    }
    const expenseDate = date || new Date().toISOString().split('T')[0];
    const newExpense = await Expense.create({
      id: `exp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      title: title.trim(),
      category: category || 'অন্যান্য বিবিধ খরচ',
      amount: numAmount,
      date: expenseDate,
      payment_method: payment_method || 'নগদ (Cash)',
      notes: notes ? notes.trim() : '',
      store_id: store_id || 'store_1',
      created_by: 'মিজানুর রহমান'
    });
    res.status(201).json(newExpense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Expense.deleteOne({ id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'খরচের হিসাব পাওয়া যায়নি' });
    }
    res.json({ success: true, message: 'খরচের হিসাব সফলভাবে মুছে ফেলা হয়েছে' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== EXECUTIVE BI ANALYTICS ===================
router.get('/analytics', async (req, res) => {
  try {
    const { period, from_date, to_date } = req.query;
    const today = new Date().toISOString().split('T')[0];

    const orderFilter = {};
    const expenseFilter = {};

    if (period === 'today') {
      orderFilter.created_at = new RegExp('^' + today);
      expenseFilter.date = today;
    } else if (period === 'yesterday') {
      const yd = new Date();
      yd.setDate(yd.getDate() - 1);
      const ydStr = yd.toISOString().split('T')[0];
      orderFilter.created_at = new RegExp('^' + ydStr);
      expenseFilter.date = ydStr;
    } else if (period === 'last_7_days') {
      const d7 = new Date();
      d7.setDate(d7.getDate() - 7);
      const d7Str = d7.toISOString().split('T')[0];
      orderFilter.created_at = { $gte: d7Str };
      expenseFilter.date = { $gte: d7Str };
    } else if (period === 'last_30_days') {
      const d30 = new Date();
      d30.setDate(d30.getDate() - 30);
      const d30Str = d30.toISOString().split('T')[0];
      orderFilter.created_at = { $gte: d30Str };
      expenseFilter.date = { $gte: d30Str };
    } else if (period === 'this_month') {
      const monthPrefix = today.substring(0, 7);
      orderFilter.created_at = new RegExp('^' + monthPrefix);
      expenseFilter.date = new RegExp('^' + monthPrefix);
    } else if (from_date || to_date) {
      orderFilter.created_at = {};
      expenseFilter.date = {};
      if (from_date) {
        orderFilter.created_at.$gte = from_date;
        expenseFilter.date.$gte = from_date;
      }
      if (to_date) {
        orderFilter.created_at.$lte = to_date + ' 23:59:59';
        expenseFilter.date.$lte = to_date;
      }
    }

    const [customers, orders, topSpenders, tickets, products, expenses] = await Promise.all([
      Customer.find().lean(),
      Order.find(orderFilter).sort({ created_at: -1 }).lean(),
      Customer.find().sort({ total_spent: -1 }).limit(5).lean(),
      SupportTicket.find().lean(),
      Product.find().lean(),
      Expense.find(expenseFilter).sort({ date: -1, createdAt: -1 }).lean()
    ]);

    // Product cost mapping for COGS
    const productCostMap = {};
    for (const p of products) {
      productCostMap[p.id] = (p.cost !== undefined && p.cost !== null) ? Number(p.cost) : 0;
    }

    let totalRevenue = 0;
    let totalDiscountsGiven = 0;
    let totalCogs = 0;
    let totalUnitsSold = 0;
    const deptSalesMap = {};

    for (const o of orders) {
      totalRevenue += (o.total || 0);
      totalDiscountsGiven += ((o.discount_amount || 0) + (o.points_discount || 0) + (o.manual_discount || 0));

      if (o.items && Array.isArray(o.items)) {
        for (const it of o.items) {
          const qty = Number(it.quantity || 1);
          totalUnitsSold += qty;

          // Calculate Cost of Goods Sold (COGS)
          let unitCost = 0;
          if (it.product_id && productCostMap[it.product_id] !== undefined && productCostMap[it.product_id] > 0) {
            unitCost = productCostMap[it.product_id];
          } else {
            // Default reasonable margin (70% COGS / 30% margin) if cost is 0
            unitCost = (it.unit_price || 0) * 0.70;
          }
          totalCogs += (unitCost * qty);

          const dept = it.department_name || 'সাধারণ স্টেশনারি';
          if (!deptSalesMap[dept]) {
            deptSalesMap[dept] = { department_name: dept, orders_count: 0, units_sold: 0, revenue: 0 };
          }
          deptSalesMap[dept].orders_count += 1;
          deptSalesMap[dept].units_sold += qty;
          deptSalesMap[dept].revenue += (it.total_price || 0);
        }
      }
    }

    const deptSales = Object.values(deptSalesMap).sort((a, b) => b.revenue - a.revenue);

    // Expenses aggregation
    let totalExpenses = 0;
    const expenseCategoryMap = {};
    for (const exp of expenses) {
      const amt = Number(exp.amount || 0);
      totalExpenses += amt;
      const cat = exp.category || 'অন্যান্য বিবিধ খরচ';
      if (!expenseCategoryMap[cat]) {
        expenseCategoryMap[cat] = { category: cat, totalAmount: 0, count: 0 };
      }
      expenseCategoryMap[cat].totalAmount += amt;
      expenseCategoryMap[cat].count += 1;
    }

    const expenseBreakdown = Object.values(expenseCategoryMap)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .map(cat => ({
        ...cat,
        totalAmount: Number(cat.totalAmount.toFixed(2)),
        percentage: totalExpenses > 0 ? Number(((cat.totalAmount / totalExpenses) * 100).toFixed(1)) : 0
      }));

    // Financial profit calculations
    const grossProfit = Number(Math.max(0, totalRevenue - totalCogs).toFixed(2));
    const grossMarginPct = totalRevenue > 0 ? Number(((grossProfit / totalRevenue) * 100).toFixed(1)) : 0;
    const netProfit = Number((grossProfit - totalExpenses).toFixed(2));
    const netMarginPct = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;

    let vip_count = 0, platinum_count = 0, gold_count = 0, silver_count = 0, bronze_count = 0;
    let churn_high_count = 0, total_liability_points = 0;

    for (const c of customers) {
      if (c.tier === 'VIP') vip_count++;
      else if (c.tier === 'Platinum') platinum_count++;
      else if (c.tier === 'Gold') gold_count++;
      else if (c.tier === 'Silver') silver_count++;
      else bronze_count++;

      if (c.churn_risk === 'High') churn_high_count++;
      total_liability_points += (c.points_balance || 0);
    }

    const tierDistribution = [
      { tier: 'VIP', count: vip_count, color: '#ec4899' },
      { tier: 'Platinum', count: platinum_count, color: '#8b5cf6' },
      { tier: 'Gold', count: gold_count, color: '#f59e0b' },
      { tier: 'Silver', count: silver_count, color: '#94a3b8' },
      { tier: 'Bronze', count: bronze_count, color: '#d97706' }
    ];

    const churnCounts = { Low: 0, Medium: 0, High: 0 };
    for (const c of customers) {
      churnCounts[c.churn_risk || 'Low'] = (churnCounts[c.churn_risk || 'Low'] || 0) + 1;
    }
    const churnDistribution = Object.keys(churnCounts).map(k => ({ churn_risk: k, count: churnCounts[k] }));

    const recentOrders = orders.slice(0, 8);
    const recentExpenses = expenses.slice(0, 8);

    const ticketSummary = {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'Open').length,
      inProgress: tickets.filter(t => t.status === 'In Progress').length,
      resolved: tickets.filter(t => t.status === 'Resolved').length,
      avgCsat: 4.8
    };

    res.json({
      kpis: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalCogs: Number(totalCogs.toFixed(2)),
        grossProfit,
        grossMarginPct,
        totalExpenses: Number(totalExpenses.toFixed(2)),
        netProfit,
        netMarginPct,
        totalOrders: orders.length,
        totalUnitsSold,
        avgBasketSize: orders.length > 0 ? Number((totalRevenue / orders.length).toFixed(2)) : 0,
        totalCustomers: customers.length,
        totalPointsLiability: total_liability_points,
        churnAtRiskCount: churn_high_count,
        totalDiscountsGiven: Number(totalDiscountsGiven.toFixed(2))
      },
      deptSales,
      expenseBreakdown,
      recentExpenses,
      tierDistribution,
      churnDistribution,
      topSpenders,
      recentOrders,
      ticketSummary
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/clean-data', async (req, res) => {
  try {
    const { wipeAllCollections } = require('./mongoConnection');
    const result = await wipeAllCollections();
    res.json({
      success: true,
      message: 'MongoDB database has been completely cleaned. All collections are now 100% blank (0 records).',
      deletedCounts: result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reset-data', async (req, res) => {
  try {
    const { resetMongoDatabase } = require('./mongoConnection');
    await resetMongoDatabase();
    res.json({ success: true, message: 'মিজান কম্পিউটার অ্যান্ড কসমেটিকস ডাটাবেজ সফলভাবে রিসেট ও সিড করা হয়েছে।' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
