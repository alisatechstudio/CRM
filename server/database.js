const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'crm.db');
const db = new Database(dbPath, {
  // verbose: console.log
});

// Enable foreign keys and WAL mode for high performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      location TEXT NOT NULL,
      manager TEXT,
      phone TEXT
    );

    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      icon TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      card_number TEXT NOT NULL UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      tier TEXT DEFAULT 'Bronze',
      points_balance INTEGER DEFAULT 0,
      lifetime_points INTEGER DEFAULT 0,
      total_spent REAL DEFAULT 0.0,
      visit_count INTEGER DEFAULT 0,
      last_visit TEXT,
      join_date TEXT NOT NULL,
      birthday TEXT,
      churn_risk TEXT DEFAULT 'Low',
      tags TEXT DEFAULT '[]',
      notes TEXT DEFAULT '',
      preferred_department TEXT DEFAULT 'Grocery & Fresh'
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      barcode TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      department_id TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      cost REAL NOT NULL,
      stock_qty INTEGER NOT NULL DEFAULT 0,
      min_threshold INTEGER NOT NULL DEFAULT 10,
      unit TEXT DEFAULT 'pcs',
      expiry_date TEXT DEFAULT NULL,
      has_expiry INTEGER DEFAULT 0,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      customer_id TEXT,
      store_id TEXT NOT NULL,
      cashier_name TEXT NOT NULL,
      subtotal REAL NOT NULL,
      discount_amount REAL DEFAULT 0.0,
      manual_discount REAL DEFAULT 0.0,
      manual_discount_reason TEXT DEFAULT '',
      points_redeemed INTEGER DEFAULT 0,
      points_discount REAL DEFAULT 0.0,
      tax REAL NOT NULL,
      total REAL NOT NULL,
      payment_method TEXT NOT NULL,
      status TEXT DEFAULT 'Completed',
      created_at TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      department_name TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      total_price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS loyalty_transactions (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      order_id TEXT,
      type TEXT NOT NULL, -- 'Earned', 'Redeemed', 'Adjusted', 'Bonus'
      points INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      discount_type TEXT NOT NULL, -- 'percentage', 'fixed'
      discount_value REAL NOT NULL,
      min_spend REAL DEFAULT 0.0,
      max_discount REAL DEFAULT 0.0,
      target_tier TEXT DEFAULT 'All',
      expiry_date TEXT NOT NULL,
      usage_limit INTEGER DEFAULT 100,
      used_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      channel TEXT NOT NULL, -- 'SMS', 'Email', 'Omnichannel'
      target_segment TEXT NOT NULL,
      subject TEXT NOT NULL,
      content TEXT NOT NULL,
      coupon_code TEXT,
      status TEXT DEFAULT 'Draft', -- 'Draft', 'Scheduled', 'Sent'
      audience_count INTEGER DEFAULT 0,
      open_rate REAL DEFAULT 0.0,
      click_rate REAL DEFAULT 0.0,
      conversion_rate REAL DEFAULT 0.0,
      revenue_generated REAL DEFAULT 0.0,
      sent_at TEXT
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      ticket_number TEXT NOT NULL UNIQUE,
      customer_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      department TEXT NOT NULL,
      type TEXT NOT NULL, -- 'Complaint', 'Return/Exchange', 'Inquiry', 'Loyalty Issue', 'Feedback'
      priority TEXT DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Urgent'
      status TEXT DEFAULT 'Open', -- 'Open', 'In Progress', 'Resolved', 'Escalated'
      assigned_to TEXT,
      details TEXT NOT NULL,
      resolution_notes TEXT DEFAULT '',
      csat_score INTEGER,
      created_at TEXT NOT NULL,
      resolved_at TEXT,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    -- Performance indexes
    CREATE INDEX IF NOT EXISTS idx_customers_card ON customers(card_number);
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
    CREATE INDEX IF NOT EXISTS idx_customers_tier ON customers(tier);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_products_dept ON products(department_id);
    CREATE INDEX IF NOT EXISTS idx_loyalty_customer ON loyalty_transactions(customer_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_customer ON support_tickets(customer_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
  `);
}

initSchema();

// Safe schema migration for existing databases
try {
  db.exec("ALTER TABLE orders ADD COLUMN manual_discount REAL DEFAULT 0.0;");
} catch (e) {
  // column already exists
}
try {
  db.exec("ALTER TABLE orders ADD COLUMN manual_discount_reason TEXT DEFAULT '';");
} catch (e) {
  // column already exists
}
try {
  db.exec("ALTER TABLE products ADD COLUMN expiry_date TEXT DEFAULT NULL;");
} catch (e) {
  // column already exists
}
try {
  db.exec("ALTER TABLE products ADD COLUMN has_expiry INTEGER DEFAULT 0;");
} catch (e) {
  // column already exists
}

module.exports = db;
