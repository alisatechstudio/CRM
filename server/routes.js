const express = require('express');
const router = express.Router();
const db = require('./database');
const { seedDatabase } = require('./seedData');

// =================== STORES & DEPARTMENTS ===================
router.get('/stores', (req, res) => {
  try {
    const stores = db.prepare('SELECT * FROM stores ORDER BY name ASC').all();
    res.json(stores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/departments', (req, res) => {
  try {
    const departments = db.prepare(`
      SELECT d.*, COUNT(p.id) as product_count 
      FROM departments d
      LEFT JOIN products p ON p.department_id = d.id
      GROUP BY d.id
      ORDER BY d.name ASC
    `).all();
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== CUSTOMERS (360° CRM) ===================
router.get('/customers', (req, res) => {
  try {
    const { search, tier, churn_risk, sort_by = 'total_spent', order = 'DESC' } = req.query;
    let query = 'SELECT * FROM customers WHERE 1=1';
    const params = [];

    if (search) {
      query += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ? OR card_number LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    if (tier && tier !== 'All') {
      query += ` AND tier = ?`;
      params.push(tier);
    }

    if (churn_risk && churn_risk !== 'All') {
      query += ` AND churn_risk = ?`;
      params.push(churn_risk);
    }

    const allowedSort = ['total_spent', 'points_balance', 'visit_count', 'last_visit', 'first_name', 'join_date'];
    const sortCol = allowedSort.includes(sort_by) ? sort_by : 'total_spent';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${sortCol} ${sortOrder}`;

    const customers = db.prepare(query).all(...params);
    const parsed = customers.map(c => ({
      ...c,
      tags: JSON.parse(c.tags || '[]')
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/customers/:id', (req, res) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Purchase history
    const orders = db.prepare(`
      SELECT o.*, s.name as store_name
      FROM orders o
      JOIN stores s ON s.id = o.store_id
      WHERE o.customer_id = ?
      ORDER BY o.created_at DESC
      LIMIT 10
    `).all(customer.id);

    // Items for each order
    const orderItemsStmt = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    const enrichedOrders = orders.map(ord => ({
      ...ord,
      items: orderItemsStmt.all(ord.id)
    }));

    // Loyalty ledger
    const loyalty = db.prepare(`
      SELECT * FROM loyalty_transactions
      WHERE customer_id = ?
      ORDER BY created_at DESC
      LIMIT 15
    `).all(customer.id);

    // Support tickets
    const tickets = db.prepare(`
      SELECT * FROM support_tickets
      WHERE customer_id = ?
      ORDER BY created_at DESC
    `).all(customer.id);

    // RFM calculation
    // Recency: days since last visit
    const lastVisitDate = customer.last_visit ? new Date(customer.last_visit) : null;
    const now = new Date('2026-10-17'); // contextual reference time
    const daysSinceLastVisit = lastVisitDate ? Math.max(0, Math.round((now - lastVisitDate) / (1000 * 60 * 60 * 24))) : 999;
    
    // Average order value
    const aov = customer.visit_count > 0 ? (customer.total_spent / customer.visit_count).toFixed(2) : '0.00';

    res.json({
      ...customer,
      tags: JSON.parse(customer.tags || '[]'),
      daysSinceLastVisit,
      aov: Number(aov),
      orders: enrichedOrders,
      loyalty,
      tickets
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/customers', (req, res) => {
  try {
    const { first_name, last_name, email, phone, birthday, preferred_department, notes, tags } = req.body;
    if (!first_name || !last_name || !email || !phone) {
      return res.status(400).json({ error: 'First name, last name, email, and phone are required' });
    }

    const id = 'cust_' + Date.now();
    const randNum = Math.floor(10000 + Math.random() * 90000);
    const card_number = `BRZ-${randNum}`;
    const join_date = new Date().toISOString().split('T')[0];
    const tagsJson = JSON.stringify(tags || ['New Member']);

    db.prepare(`
      INSERT INTO customers (
        id, card_number, first_name, last_name, email, phone,
        tier, points_balance, lifetime_points, total_spent, visit_count,
        join_date, birthday, churn_risk, tags, notes, preferred_department
      ) VALUES (?, ?, ?, ?, ?, ?, 'Bronze', 50, 50, 0, 0, ?, ?, 'Low', ?, ?, ?)
    `).run(
      id, card_number, first_name, last_name, email, phone,
      join_date, birthday || null, tagsJson, notes || '', preferred_department || 'Grocery & Gourmet Fresh'
    );

    // Give welcome bonus 50 points
    db.prepare(`
      INSERT INTO loyalty_transactions (id, customer_id, type, points, balance_after, description, created_at)
      VALUES (?, ?, 'Bonus', 50, 50, 'Welcome Member Bonus Points', datetime('now'))
    `).run('lt_' + Date.now(), id);

    const created = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    res.status(201).json({ ...created, tags: JSON.parse(created.tags || '[]') });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/customers/:id', (req, res) => {
  try {
    const { first_name, last_name, phone, tier, churn_risk, preferred_department, notes, tags } = req.body;
    const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Customer not found' });

    db.prepare(`
      UPDATE customers SET
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        phone = COALESCE(?, phone),
        tier = COALESCE(?, tier),
        churn_risk = COALESCE(?, churn_risk),
        preferred_department = COALESCE(?, preferred_department),
        notes = COALESCE(?, notes),
        tags = COALESCE(?, tags)
      WHERE id = ?
    `).run(
      first_name, last_name, phone, tier, churn_risk,
      preferred_department, notes, tags ? JSON.stringify(tags) : null,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    res.json({ ...updated, tags: JSON.parse(updated.tags || '[]') });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/customers/:id/points', (req, res) => {
  try {
    const { points, reason, type = 'Adjusted' } = req.body;
    const delta = parseInt(points, 10);
    if (isNaN(delta) || delta === 0) {
      return res.status(400).json({ error: 'Valid points integer is required' });
    }

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const newBalance = Math.max(0, customer.points_balance + delta);
    const newLifetime = delta > 0 ? customer.lifetime_points + delta : customer.lifetime_points;

    // Auto tier calculation based on lifetime points
    let newTier = customer.tier;
    if (newLifetime >= 12000) newTier = 'VIP';
    else if (newLifetime >= 7000) newTier = 'Platinum';
    else if (newLifetime >= 3500) newTier = 'Gold';
    else if (newLifetime >= 1500) newTier = 'Silver';
    else newTier = 'Bronze';

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE customers SET points_balance = ?, lifetime_points = ?, tier = ? WHERE id = ?
      `).run(newBalance, newLifetime, newTier, customer.id);

      db.prepare(`
        INSERT INTO loyalty_transactions (id, customer_id, type, points, balance_after, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).run('lt_' + Date.now(), customer.id, type, delta, newBalance, reason || 'Manual points adjustment');
    });

    tx();

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
router.get('/products', (req, res) => {
  try {
    const { department_id, search, low_stock } = req.query;
    let query = `
      SELECT p.*, d.name as department_name, d.code as department_code
      FROM products p
      JOIN departments d ON d.id = p.department_id
      WHERE 1=1
    `;
    const params = [];

    if (department_id && department_id !== 'all') {
      query += ` AND p.department_id = ?`;
      params.push(department_id);
    }

    if (search) {
      query += ` AND (p.name LIKE ? OR p.barcode LIKE ? OR p.category LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    if (low_stock === 'true') {
      query += ` AND p.stock_qty <= p.min_threshold`;
    }

    query += ` ORDER BY p.name ASC`;
    const products = db.prepare(query).all(...params);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/products/:id', (req, res) => {
  try {
    const product = db.prepare(`
      SELECT p.*, d.name as department_name, d.code as department_code
      FROM products p
      JOIN departments d ON d.id = p.department_id
      WHERE p.id = ?
    `).get(req.params.id);
    if (!product) return res.status(404).json({ error: 'পণ্যটি খুঁজে পাওয়া যায়নি' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products', (req, res) => {
  try {
    const { name, barcode, department_id, category, price, cost, stock_qty, min_threshold, unit, expiry_date, has_expiry } = req.body;
    if (!name || !barcode || !department_id || price === undefined) {
      return res.status(400).json({ error: 'পণ্যের নাম, বারকোড, বিভাগ এবং বিক্রয়মূল্য প্রদান করা আবশ্যক' });
    }

    const existingBarcode = db.prepare('SELECT id FROM products WHERE barcode = ?').get(barcode.trim());
    if (existingBarcode) {
      return res.status(400).json({ error: 'এই বারকোডটি ইতিমধ্যে ক্যাটালগে রয়েছে' });
    }

    const isExpApplicable = (has_expiry === true || has_expiry === 1 || has_expiry === '1' || has_expiry === 'true') && expiry_date ? 1 : 0;
    const finalExpiry = isExpApplicable ? expiry_date.trim() : null;

    const id = 'prod_' + Date.now();
    db.prepare(`
      INSERT INTO products (id, barcode, name, department_id, category, price, cost, stock_qty, min_threshold, unit, expiry_date, has_expiry)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, barcode.trim(), name.trim(), department_id, category || 'সাধারণ স্টেশনারি',
      parseFloat(price), parseFloat(cost || 0), parseInt(stock_qty || 0, 10),
      parseInt(min_threshold || 10, 10), unit || 'পিস',
      finalExpiry, isExpApplicable
    );

    const created = db.prepare(`
      SELECT p.*, d.name as department_name, d.code as department_code
      FROM products p
      JOIN departments d ON d.id = p.department_id WHERE p.id = ?
    `).get(id);

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/products/:id', (req, res) => {
  try {
    const { name, barcode, department_id, category, price, cost, stock_qty, min_threshold, unit, expiry_date, has_expiry } = req.body;
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'পণ্যটি খুঁজে পাওয়া যায়নি' });

    if (barcode && barcode.trim() !== existing.barcode) {
      const duplicate = db.prepare('SELECT id FROM products WHERE barcode = ? AND id != ?').get(barcode.trim(), req.params.id);
      if (duplicate) {
        return res.status(400).json({ error: 'এই বারকোডটি অন্য একটি পণ্যে ইতিমধ্যে ব্যবহৃত হচ্ছে' });
      }
    }

    let isExpApplicable = existing.has_expiry;
    let finalExpiry = existing.expiry_date;
    if (has_expiry !== undefined) {
      isExpApplicable = (has_expiry === true || has_expiry === 1 || has_expiry === '1' || has_expiry === 'true') ? 1 : 0;
      finalExpiry = isExpApplicable ? (expiry_date ? expiry_date.trim() : existing.expiry_date) : null;
    } else if (expiry_date !== undefined) {
      finalExpiry = expiry_date ? expiry_date.trim() : null;
      isExpApplicable = finalExpiry ? 1 : 0;
    }

    db.prepare(`
      UPDATE products SET
        name = COALESCE(?, name),
        barcode = COALESCE(?, barcode),
        department_id = COALESCE(?, department_id),
        category = COALESCE(?, category),
        price = CASE WHEN ? IS NOT NULL THEN ? ELSE price END,
        cost = CASE WHEN ? IS NOT NULL THEN ? ELSE cost END,
        stock_qty = CASE WHEN ? IS NOT NULL THEN ? ELSE stock_qty END,
        min_threshold = CASE WHEN ? IS NOT NULL THEN ? ELSE min_threshold END,
        unit = COALESCE(?, unit),
        expiry_date = ?,
        has_expiry = ?
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      barcode ? barcode.trim() : null,
      department_id || null,
      category || null,
      price !== undefined ? parseFloat(price) : null,
      price !== undefined ? parseFloat(price) : null,
      cost !== undefined ? parseFloat(cost) : null,
      cost !== undefined ? parseFloat(cost) : null,
      stock_qty !== undefined ? parseInt(stock_qty, 10) : null,
      stock_qty !== undefined ? parseInt(stock_qty, 10) : null,
      min_threshold !== undefined ? parseInt(min_threshold, 10) : null,
      min_threshold !== undefined ? parseInt(min_threshold, 10) : null,
      unit || null,
      finalExpiry,
      isExpApplicable,
      req.params.id
    );

    const updated = db.prepare(`
      SELECT p.*, d.name as department_name, d.code as department_code
      FROM products p
      JOIN departments d ON d.id = p.department_id
      WHERE p.id = ?
    `).get(req.params.id);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/products/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'পণ্যটি খুঁজে পাওয়া যায়নি' });

    // Check if product is referenced in order_items
    const orderItemCount = db.prepare('SELECT COUNT(*) as count FROM order_items WHERE product_id = ?').get(req.params.id);
    if (orderItemCount && orderItemCount.count > 0) {
      return res.status(400).json({
        error: `এই পণ্যের ${orderItemCount.count} টি পূর্ববর্তী বিক্রয় রেকর্ড রয়েছে। হিসাবের ভারসাম্য রক্ষার্থে এটি সরাসরি মোছা সম্ভব নয়। অনুগ্রহ করে স্টক সংখ্যা ০ করে রাখুন।`
      });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'পণ্যটি ক্যাটালগ থেকে সফলভাবে মুছে ফেলা হয়েছে', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/products/:id/stock', (req, res) => {
  try {
    const { change, new_qty, reason } = req.body;
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ error: 'পণ্যটি খুঁজে পাওয়া যায়নি' });

    let updatedStock = product.stock_qty;
    if (new_qty !== undefined) {
      updatedStock = Math.max(0, parseInt(new_qty, 10));
    } else if (change !== undefined) {
      updatedStock = Math.max(0, product.stock_qty + parseInt(change, 10));
    }

    db.prepare('UPDATE products SET stock_qty = ? WHERE id = ?').run(updatedStock, req.params.id);
    
    const updated = db.prepare(`
      SELECT p.*, d.name as department_name, d.code as department_code
      FROM products p
      JOIN departments d ON d.id = p.department_id
      WHERE p.id = ?
    `).get(req.params.id);

    res.json({ ...updated, adjustReason: reason || 'স্টক আপডেট' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== POS & CHECKOUT ===================
router.post('/pos/checkout', (req, res) => {
  try {
    const {
      customer_id,
      store_id = 'store_1',
      cashier_name = 'মিজানুর রহমান',
      items = [],
      coupon_code,
      manual_discount_type = 'fixed',
      manual_discount_value = 0,
      manual_discount_amount = 0,
      manual_discount_reason = '',
      points_to_redeem = 0,
      payment_method = 'কার্ড (Card)'
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'কার্টে কমপক্ষে একটি পণ্য থাকতে হবে' });
    }

    // Begin atomic checkout transaction
    const checkoutTx = db.transaction(() => {
      let subtotal = 0;
      const verifiedItems = [];

      // Validate products and check stock
      for (const item of items) {
        const prod = db.prepare('SELECT * FROM products WHERE id = ?').get(item.id);
        if (!prod) throw new Error(`পণ্যটি পাওয়া যায়নি: ${item.id}`);
        const qty = parseInt(item.quantity, 10) || 1;
        const lineTotal = prod.price * qty;
        subtotal += lineTotal;

        const dept = db.prepare('SELECT name FROM departments WHERE id = ?').get(prod.department_id);

        verifiedItems.push({
          productId: prod.id,
          name: prod.name,
          deptName: dept ? dept.name : 'সাধারণ',
          unitPrice: prod.price,
          qty,
          lineTotal
        });

        // Decrement stock
        db.prepare('UPDATE products SET stock_qty = MAX(0, stock_qty - ?) WHERE id = ?').run(qty, prod.id);
      }

      // Check coupon
      let discountAmount = 0;
      if (coupon_code) {
        const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1').get(coupon_code.toUpperCase().trim());
        if (coupon) {
          if (subtotal >= coupon.min_spend) {
            if (coupon.discount_type === 'percentage') {
              discountAmount = (subtotal * coupon.discount_value) / 100;
              if (coupon.max_discount > 0 && discountAmount > coupon.max_discount) {
                discountAmount = coupon.max_discount;
              }
            } else {
              discountAmount = Math.min(coupon.discount_value, subtotal);
            }

            // Increment coupon usage
            db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?').run(coupon.id);
          }
        }
      }

      // Calculate manual cashier discount
      let calculatedManualDiscount = 0;
      const parsedManualVal = parseFloat(manual_discount_value || manual_discount_amount || 0);
      if (parsedManualVal > 0) {
        if (manual_discount_type === 'percentage') {
          calculatedManualDiscount = (subtotal * parsedManualVal) / 100;
        } else {
          calculatedManualDiscount = parsedManualVal;
        }
        // Cap manual discount so that subtotal - couponDiscount - manualDiscount >= 0
        const maxPossibleManual = Math.max(0, subtotal - discountAmount);
        if (calculatedManualDiscount > maxPossibleManual) {
          calculatedManualDiscount = maxPossibleManual;
        }
        calculatedManualDiscount = Number(calculatedManualDiscount.toFixed(2));
      }

      // Customer loyalty points validation
      let pointsRedeemed = 0;
      let pointsDiscount = 0;
      let customer = null;

      if (customer_id) {
        customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer_id);
        if (customer && points_to_redeem > 0) {
          pointsRedeemed = Math.min(customer.points_balance, parseInt(points_to_redeem, 10));
          // Rule: 1 point = ৳1.00 discount
          pointsDiscount = Number((pointsRedeemed * 1.0).toFixed(2));
          // Cannot discount more than remaining total
          const remainingBeforePoints = Math.max(0, subtotal - discountAmount - calculatedManualDiscount);
          if (pointsDiscount > remainingBeforePoints) {
            pointsDiscount = remainingBeforePoints;
            pointsRedeemed = Math.round(pointsDiscount);
          }
        }
      }

      const taxableAmount = Math.max(0, subtotal - discountAmount - calculatedManualDiscount - pointsDiscount);
      const taxRate = 0.08; // 8% sales tax
      const tax = Number((taxableAmount * taxRate).toFixed(2));
      const total = Number((taxableAmount + tax).toFixed(2));

      const orderId = 'ord_' + Date.now();
      const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
      const createdAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

      // Insert Order with manual_discount & manual_discount_reason
      db.prepare(`
        INSERT INTO orders (
          id, order_number, customer_id, store_id, cashier_name,
          subtotal, discount_amount, manual_discount, manual_discount_reason,
          points_redeemed, points_discount,
          tax, total, payment_method, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Completed', ?)
      `).run(
        orderId, orderNumber, customer ? customer.id : null, store_id, cashier_name,
        subtotal, discountAmount, calculatedManualDiscount, manual_discount_reason.trim(),
        pointsRedeemed, pointsDiscount,
        tax, total, payment_method, createdAt
      );

      // Insert Order Items
      let itemIndex = 1;
      const insertItemStmt = db.prepare(`
        INSERT INTO order_items (id, order_id, product_id, product_name, department_name, unit_price, quantity, total_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const it of verifiedItems) {
        insertItemStmt.run(
          `item_${orderId}_${itemIndex++}`,
          orderId,
          it.productId,
          it.name,
          it.deptName,
          it.unitPrice,
          it.qty,
          it.lineTotal
        );
      }

      // Handle customer points accrual and stats
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

        // Auto tier progression
        let newTier = customer.tier;
        if (newLifetime >= 12000) newTier = 'VIP';
        else if (newLifetime >= 7000) newTier = 'Platinum';
        else if (newLifetime >= 3500) newTier = 'Gold';
        else if (newLifetime >= 1500) newTier = 'Silver';

        db.prepare(`
          UPDATE customers SET
            points_balance = ?,
            lifetime_points = ?,
            total_spent = ?,
            visit_count = ?,
            last_visit = ?,
            tier = ?,
            churn_risk = 'Low'
          WHERE id = ?
        `).run(newBalance, newLifetime, newTotalSpent, newVisitCount, createdAt.split(' ')[0], newTier, customer.id);

        if (pointsRedeemed > 0) {
          db.prepare(`
            INSERT INTO loyalty_transactions (id, customer_id, order_id, type, points, balance_after, description, created_at)
            VALUES (?, ?, ?, 'Redeemed', ?, ?, ?, ?)
          `).run(
            'lt_' + Date.now() + '_red',
            customer.id,
            orderId,
            -pointsRedeemed,
            customer.points_balance - pointsRedeemed,
            `Redeemed ${pointsRedeemed} pts (৳${pointsDiscount.toFixed(2)}) on #${orderNumber}`,
            createdAt
          );
        }

        db.prepare(`
          INSERT INTO loyalty_transactions (id, customer_id, order_id, type, points, balance_after, description, created_at)
          VALUES (?, ?, ?, 'Earned', ?, ?, ?, ?)
        `).run(
          'lt_' + Date.now() + '_earn',
          customer.id,
          orderId,
          earnedPoints,
          newBalance,
          `Earned ${earnedPoints} pts (${multiplier}x tier rate) on #${orderNumber}`,
          createdAt
        );
      }

      return {
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
      };
    });

    const result = checkoutTx();
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== ORDERS & RECEIPTS ===================
router.get('/orders', (req, res) => {
  try {
    const { customer_id, limit = 50 } = req.query;
    let query = `
      SELECT o.*, 
        c.first_name as customer_first_name, 
        c.last_name as customer_last_name, 
        c.card_number as customer_card,
        s.name as store_name
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
      LEFT JOIN stores s ON s.id = o.store_id
    `;
    const params = [];

    if (customer_id) {
      query += ` WHERE o.customer_id = ?`;
      params.push(customer_id);
    }

    query += ` ORDER BY o.created_at DESC LIMIT ?`;
    params.push(parseInt(limit, 10));

    const orders = db.prepare(query).all(...params);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/orders/:id', (req, res) => {
  try {
    const order = db.prepare(`
      SELECT o.*, 
        c.first_name, c.last_name, c.email, c.phone, c.card_number, c.tier,
        s.name as store_name, s.location as store_location, s.phone as store_phone
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
      LEFT JOIN stores s ON s.id = o.store_id
      WHERE o.id = ?
    `).get(req.params.id);

    if (!order) return res.status(404).json({ error: 'Order not found' });

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    res.json({ ...order, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== COUPONS ===================
router.get('/coupons', (req, res) => {
  try {
    const coupons = db.prepare('SELECT * FROM coupons ORDER BY is_active DESC, expiry_date ASC').all();
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/coupons', (req, res) => {
  try {
    const { code, title, discount_type, discount_value, min_spend, max_discount, target_tier, expiry_date, usage_limit } = req.body;
    if (!code || !title || !discount_type || discount_value === undefined || !expiry_date) {
      return res.status(400).json({ error: 'Code, title, discount type, value, and expiry date are required' });
    }

    const id = 'cp_' + Date.now();
    db.prepare(`
      INSERT INTO coupons (id, code, title, discount_type, discount_value, min_spend, max_discount, target_tier, expiry_date, usage_limit, used_count, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)
    `).run(
      id, code.toUpperCase().trim(), title, discount_type,
      parseFloat(discount_value), parseFloat(min_spend || 0),
      parseFloat(max_discount || 0), target_tier || 'All',
      expiry_date, parseInt(usage_limit || 100, 10)
    );

    const created = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/coupons/validate', (req, res) => {
  try {
    const { code, cart_subtotal = 0, customer_tier = 'Bronze' } = req.body;
    if (!code) return res.status(400).json({ valid: false, message: 'Coupon code is required' });

    const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1').get(code.toUpperCase().trim());
    if (!coupon) {
      return res.status(404).json({ valid: false, message: 'Invalid or expired coupon code' });
    }

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
        message: `Minimum spend of $${coupon.min_spend.toFixed(2)} required for this coupon`
      });
    }

    // Check tier eligibility
    if (coupon.target_tier !== 'All') {
      const tierRank = { 'Bronze': 1, 'Silver': 2, 'Gold': 3, 'Platinum': 4, 'VIP': 5 };
      const customerRank = tierRank[customer_tier] || 1;
      let minRequiredRank = 1;
      if (coupon.target_tier === 'Silver+') minRequiredRank = 2;
      else if (coupon.target_tier === 'Gold+') minRequiredRank = 3;
      else if (coupon.target_tier === 'Platinum+') minRequiredRank = 4;
      else if (coupon.target_tier === 'VIP') minRequiredRank = 5;

      if (customerRank < minRequiredRank) {
        return res.status(400).json({
          valid: false,
          message: `This promo requires ${coupon.target_tier} membership`
        });
      }
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

// =================== MARKETING CAMPAIGNS & RFM ===================
router.get('/campaigns', (req, res) => {
  try {
    const campaigns = db.prepare('SELECT * FROM campaigns ORDER BY sent_at DESC, id DESC').all();
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/campaigns', (req, res) => {
  try {
    const { name, channel, target_segment, subject, content, coupon_code } = req.body;
    if (!name || !channel || !target_segment || !subject || !content) {
      return res.status(400).json({ error: 'Name, channel, target segment, subject, and content are required' });
    }

    const id = 'cmp_' + Date.now();
    db.prepare(`
      INSERT INTO campaigns (id, name, channel, target_segment, subject, content, coupon_code, status, audience_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Draft', 0)
    `).run(id, name, channel, target_segment, subject, content, coupon_code || null);

    const created = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/campaigns/:id/send', (req, res) => {
  try {
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    // Calculate realistic audience count based on segment
    let countQuery = 'SELECT COUNT(*) as count FROM customers WHERE 1=1';
    if (campaign.target_segment === 'VIP Shoppers') countQuery += " AND tier = 'VIP'";
    else if (campaign.target_segment === 'Churn Risk') countQuery += " AND churn_risk = 'High'";
    else if (campaign.target_segment === 'High LTV') countQuery += " AND total_spent >= 3000";
    else if (campaign.target_segment === 'Fresh Food Lovers') countQuery += " AND preferred_department LIKE '%Grocery%'";

    const segResult = db.prepare(countQuery).get();
    const audienceCount = Math.max(12, segResult.count * 15); // scaled for realism

    // Realistic marketing response rates
    const openRate = Number((55 + Math.random() * 30).toFixed(1));
    const clickRate = Number((20 + Math.random() * 20).toFixed(1));
    const conversionRate = Number((10 + Math.random() * 15).toFixed(1));
    const revenue = Number((audienceCount * (conversionRate / 100) * 85).toFixed(2));
    const sentAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

    db.prepare(`
      UPDATE campaigns SET
        status = 'Sent',
        audience_count = ?,
        open_rate = ?,
        click_rate = ?,
        conversion_rate = ?,
        revenue_generated = ?,
        sent_at = ?
      WHERE id = ?
    `).run(audienceCount, openRate, clickRate, conversionRate, revenue, sentAt, campaign.id);

    const updated = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaign.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== SUPPORT & SERVICE TICKETS ===================
router.get('/tickets', (req, res) => {
  try {
    const { status, priority, department } = req.query;
    let query = `
      SELECT t.*, 
        c.first_name, c.last_name, c.email, c.phone, c.tier as customer_tier, c.card_number
      FROM support_tickets t
      JOIN customers c ON c.id = t.customer_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'All') {
      query += ` AND t.status = ?`;
      params.push(status);
    }
    if (priority && priority !== 'All') {
      query += ` AND t.priority = ?`;
      params.push(priority);
    }
    if (department && department !== 'All') {
      query += ` AND t.department = ?`;
      params.push(department);
    }

    query += ` ORDER BY CASE t.priority WHEN 'Urgent' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END, t.created_at DESC`;
    const tickets = db.prepare(query).all(...params);
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tickets', (req, res) => {
  try {
    const { customer_id, subject, department, type, priority, details, assigned_to } = req.body;
    if (!customer_id || !subject || !department || !type || !details) {
      return res.status(400).json({ error: 'Customer, subject, department, type, and details are required' });
    }

    const id = 'tkt_' + Date.now();
    const ticket_number = 'TCK-' + Math.floor(1000 + Math.random() * 9000);
    const created_at = new Date().toISOString().replace('T', ' ').substring(0, 19);

    db.prepare(`
      INSERT INTO support_tickets (id, ticket_number, customer_id, subject, department, type, priority, status, assigned_to, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Open', ?, ?, ?)
    `).run(
      id, ticket_number, customer_id, subject, department, type,
      priority || 'Medium', assigned_to || 'Store Support Desk', details, created_at
    );

    const created = db.prepare(`
      SELECT t.*, c.first_name, c.last_name, c.email, c.phone, c.card_number
      FROM support_tickets t
      JOIN customers c ON c.id = t.customer_id
      WHERE t.id = ?
    `).get(id);

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/tickets/:id', (req, res) => {
  try {
    const { status, resolution_notes, csat_score, assigned_to } = req.body;
    const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    let resolved_at = ticket.resolved_at;
    if (status === 'Resolved' && !ticket.resolved_at) {
      resolved_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
    }

    db.prepare(`
      UPDATE support_tickets SET
        status = COALESCE(?, status),
        resolution_notes = COALESCE(?, resolution_notes),
        csat_score = COALESCE(?, csat_score),
        assigned_to = COALESCE(?, assigned_to),
        resolved_at = ?
      WHERE id = ?
    `).run(status, resolution_notes, csat_score, assigned_to, resolved_at, req.params.id);

    const updated = db.prepare(`
      SELECT t.*, c.first_name, c.last_name, c.email, c.phone, c.card_number
      FROM support_tickets t
      JOIN customers c ON c.id = t.customer_id
      WHERE t.id = ?
    `).get(req.params.id);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== EXECUTIVE BI ANALYTICS ===================
router.get('/analytics', (req, res) => {
  try {
    // 1. High level KPIs
    const customerStats = db.prepare(`
      SELECT 
        COUNT(*) as total_customers,
        SUM(CASE WHEN tier = 'VIP' THEN 1 ELSE 0 END) as vip_count,
        SUM(CASE WHEN tier = 'Platinum' THEN 1 ELSE 0 END) as platinum_count,
        SUM(CASE WHEN tier = 'Gold' THEN 1 ELSE 0 END) as gold_count,
        SUM(CASE WHEN tier = 'Silver' THEN 1 ELSE 0 END) as silver_count,
        SUM(CASE WHEN tier = 'Bronze' THEN 1 ELSE 0 END) as bronze_count,
        SUM(CASE WHEN churn_risk = 'High' THEN 1 ELSE 0 END) as churn_high_count,
        SUM(points_balance) as total_liability_points,
        SUM(total_spent) as total_customer_spent
      FROM customers
    `).get();

    const orderStats = db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(AVG(total), 0) as avg_basket_size,
        COALESCE(SUM(discount_amount + points_discount), 0) as total_discounts_given
      FROM orders
    `).get();

    // 2. Department-wise Revenue Breakdown
    const deptSales = db.prepare(`
      SELECT 
        oi.department_name,
        COUNT(DISTINCT oi.order_id) as orders_count,
        SUM(oi.quantity) as units_sold,
        ROUND(SUM(oi.total_price), 2) as revenue
      FROM order_items oi
      GROUP BY oi.department_name
      ORDER BY revenue DESC
    `).all();

    // 3. Customer Tier Distribution
    const tierDistribution = [
      { tier: 'VIP', count: customerStats.vip_count, color: '#ec4899' },
      { tier: 'Platinum', count: customerStats.platinum_count, color: '#8b5cf6' },
      { tier: 'Gold', count: customerStats.gold_count, color: '#f59e0b' },
      { tier: 'Silver', count: customerStats.silver_count, color: '#94a3b8' },
      { tier: 'Bronze', count: customerStats.bronze_count, color: '#d97706' }
    ];

    // 4. Churn Risk Distribution
    const churnDistribution = db.prepare(`
      SELECT churn_risk, COUNT(*) as count 
      FROM customers 
      GROUP BY churn_risk
    `).all();

    // 5. Top 5 VIP Spenders
    const topSpenders = db.prepare(`
      SELECT id, first_name, last_name, card_number, tier, total_spent, points_balance, visit_count, last_visit
      FROM customers
      ORDER BY total_spent DESC
      LIMIT 5
    `).all();

    // 6. Recent Orders
    const recentOrders = db.prepare(`
      SELECT o.*, c.first_name, c.last_name, c.card_number, s.name as store_name
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
      LEFT JOIN stores s ON s.id = o.store_id
      ORDER BY o.created_at DESC
      LIMIT 6
    `).all();

    // 7. Support Ticket summary
    const ticketSummary = db.prepare(`
      SELECT 
        COUNT(*) as total_tickets,
        SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open_tickets,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_tickets,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_tickets,
        AVG(CASE WHEN csat_score IS NOT NULL THEN csat_score ELSE NULL END) as avg_csat
      FROM support_tickets
    `).get();

    res.json({
      kpis: {
        totalRevenue: Number(orderStats.total_revenue.toFixed(2)),
        totalOrders: orderStats.total_orders,
        avgBasketSize: Number(orderStats.avg_basket_size.toFixed(2)),
        totalCustomers: customerStats.total_customers,
        totalPointsLiability: customerStats.total_liability_points || 0,
        churnAtRiskCount: customerStats.churn_high_count || 0,
        totalDiscountsGiven: Number(orderStats.total_discounts_given.toFixed(2))
      },
      deptSales,
      tierDistribution,
      churnDistribution,
      topSpenders,
      recentOrders,
      ticketSummary: {
        total: ticketSummary.total_tickets,
        open: ticketSummary.open_tickets,
        inProgress: ticketSummary.in_progress_tickets,
        resolved: ticketSummary.resolved_tickets,
        avgCsat: ticketSummary.avg_csat ? Number(ticketSummary.avg_csat.toFixed(1)) : 4.8
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================== DATA RESET FOR DEMO ===================
router.post('/reset-data', (req, res) => {
  try {
    db.exec(`
      DELETE FROM order_items;
      DELETE FROM orders;
      DELETE FROM loyalty_transactions;
      DELETE FROM support_tickets;
      DELETE FROM campaigns;
      DELETE FROM coupons;
      DELETE FROM products;
      DELETE FROM customers;
      DELETE FROM departments;
      DELETE FROM stores;
    `);

    seedDatabase();
    res.json({ success: true, message: 'Database reset to default seed data successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
