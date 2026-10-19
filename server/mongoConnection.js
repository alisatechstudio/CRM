const mongoose = require('mongoose');

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

function getMongoUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  if (process.env.MONGO_URI) return process.env.MONGO_URI;
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('mongodb')) return process.env.DATABASE_URL;

  // Check for any Vercel integration injected environment variable matching mongodb protocol
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === 'string' && (value.startsWith('mongodb+srv://') || value.startsWith('mongodb://'))) {
      console.log(`Auto-detected MongoDB URI from env variable: ${key}`);
      return value;
    }
  }

  // Fallback search for any env key containing 'MONGO'
  for (const [key, value] of Object.entries(process.env)) {
    if (/mongo/i.test(key) && typeof value === 'string' && value.includes('mongodb')) {
      return value;
    }
  }

  return null;
}

async function connectToMongo() {
  const uri = getMongoUri();
  if (!uri) {
    console.error('No MongoDB URI found in environment variables. Available keys:', Object.keys(process.env));
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000
    };

    cached.promise = mongoose.connect(uri, opts).then(async (m) => {
      console.log('MongoDB successfully connected!');
      await seedMongoIfEmpty();
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

async function seedMongoIfEmpty(force = false) {
  try {
    const Store = require('./models/Store');
    const Department = require('./models/Department');
    const Product = require('./models/Product');
    const Customer = require('./models/Customer');
    const Coupon = require('./models/Coupon');
    const Order = require('./models/Order');
    const SystemMeta = require('./models/SystemMeta');

    if (!force) {
      if (process.env.AUTO_SEED === 'false') {
        console.log('AUTO_SEED is disabled via environment variable.');
        return;
      }

      const cleanMeta = await SystemMeta.findOne({ key: 'is_cleaned_blank' }).lean();
      if (cleanMeta && cleanMeta.value === true) {
        console.log('Database was wiped blank by admin. Skipping automatic re-seeding.');
        return;
      }

      const storeCount = await Store.countDocuments();
      if (storeCount > 0) {
        // Ensure all default departments exist
        const defaultDepts = [
          { id: 'dept_cosmetics', name: 'কসমেটিকস ও রূপচর্চা', code: 'COSM', icon: 'Sparkles', description: 'ফেসওয়াশ, লোশন, ক্রিম, শ্যাম্পু, পারফিউম, লিপস্টিক ও স্কিন কেয়ার' },
          { id: 'dept_gifts', name: 'গিফট আইটেম ও খেলনা', code: 'GIFT', icon: 'Gift', description: 'ফটোফ্রেম, শোপিস, কাস্টমাইজড মগ, হাতঘড়ি, খেলনা ও গিফট বক্স' },
          { id: 'dept_computer', name: 'কম্পিউটার ও ডিজিটাল সামগ্রী', code: 'COMP', icon: 'Monitor', description: 'মাউস, কিবোর্ড, পেনড্রাইভ, হেডফোন, ইউএসবি ক্যাবল ও চার্জার' },
          { id: 'dept_paper', name: 'খাতা, ডায়েরি ও কাগজ সামগ্রী', code: 'PAPR', icon: 'BookOpen', description: 'লেকচার খাতা, স্পাইরাল নোটবুক, এ৪ রিম পেপার ও এক্সিকিউটিভ ডায়েরি' },
          { id: 'dept_pens', name: 'কলম, পেন্সিল ও মার্কার', code: 'PENS', icon: 'Edit3', description: 'বলপেন, জেল পেন, রোলিং বল, ড্রয়িং পেন্সিল ও হাইলাইটার' },
          { id: 'dept_art', name: 'আর্ট, ক্রাফট ও ড্রয়িং', code: 'ARTS', icon: 'Palette', description: 'জলরং, এক্রিলিক, ক্যানভাস, তুলি, গ্লু গান ও পোস্টার পেপার' },
          { id: 'dept_office', name: 'অফিস সাপ্লাই ও ফাইল ফোল্ডার', code: 'OFFC', icon: 'Folder', description: 'বক্স ফাইল, পাঞ্চিং মেশিন, স্ট্যাপলার, ক্লিপবোর্ড ও ডেস্ক অর্গানাইজার' },
          { id: 'dept_tools', name: 'ক্যালকুলেটর, জ্যামিতি ও ব্যাগ', code: 'TOOL', icon: 'Briefcase', description: 'সায়েন্টিফিক ক্যালকুলেটর, জ্যামিতি বক্স, মেটাল স্কেল ও স্কুল ব্যাকপ্যাক' }
        ];
        for (const d of defaultDepts) {
          await Department.updateOne({ id: d.id }, { $setOnInsert: d }, { upsert: true });
        }

        // Check if cosmetics & gifts sample products are present, if not add a few
        const cosCount = await Product.countDocuments({ department_id: 'dept_cosmetics' });
        if (cosCount === 0) {
          await Product.insertMany([
            { id: 'prod_cos01', barcode: '890600101', name: 'পন্ডস হোয়াইট বিউটি ফেসওয়াশ (১০০ গ্রাম)', department_id: 'dept_cosmetics', category: 'ফেসওয়াশ ও ক্লিনজার', price: 230.00, cost: 175.00, stock_qty: 45, min_threshold: 10, unit: 'টিউব', expiry_date: '2027-12-31', has_expiry: 1 },
            { id: 'prod_cos02', barcode: '890600102', name: 'নিভিয়া নারিশিং বডি মিল্ক লোশন (২০০ মিলি)', department_id: 'dept_cosmetics', category: 'ক্রিম, লোশন ও ময়েশ্চারাইজার', price: 380.00, cost: 290.00, stock_qty: 35, min_threshold: 8, unit: 'বোতল', expiry_date: '2028-06-30', has_expiry: 1 },
            { id: 'prod_cos03', barcode: '890600103', name: 'ফগ রয়েল লং লাস্টিং বডি স্প্রে (১২০ মিলি)', department_id: 'dept_cosmetics', category: 'পারফিউম, বডি স্প্রে ও আতর', price: 320.00, cost: 240.00, stock_qty: 40, min_threshold: 10, unit: 'ক্যান', expiry_date: '2028-12-31', has_expiry: 1 }
          ]);
        }

        const gftCount = await Product.countDocuments({ department_id: 'dept_gifts' });
        if (gftCount === 0) {
          await Product.insertMany([
            { id: 'prod_gft01', barcode: '890700101', name: 'রোমান্টিক মার্বেল ডিজাইন কাপল ফটোফ্রেম (৮x১০ ইঞ্চি)', department_id: 'dept_gifts', category: 'ফটোফ্রেম ও ওয়ালমেট', price: 450.00, cost: 280.00, stock_qty: 25, min_threshold: 5, unit: 'পিস', expiry_date: null, has_expiry: 0 },
            { id: 'prod_gft02', barcode: '890700102', name: 'ম্যাজিক কালার চেঞ্জিং প্রিন্টেড সিরামিক মগ', department_id: 'dept_gifts', category: 'কাস্টমাইজড মগ ও কাপ', price: 280.00, cost: 160.00, stock_qty: 35, min_threshold: 8, unit: 'পিস', expiry_date: null, has_expiry: 0 },
            { id: 'prod_gft03', barcode: '890700103', name: 'কিউট পোলার টেডি বিয়ার সফট টয় (১২ ইঞ্চি)', department_id: 'dept_gifts', category: 'খেলনা ও টেডি বিয়ার', price: 550.00, cost: 340.00, stock_qty: 20, min_threshold: 5, unit: 'পিস', expiry_date: null, has_expiry: 0 }
          ]);
        }

        const Expense = require('./models/Expense');
        const expCount = await Expense.countDocuments();
        if (expCount === 0) {
          const today = new Date().toISOString().split('T')[0];
          const d5 = new Date(); d5.setDate(d5.getDate() - 5);
          const d10 = new Date(); d10.setDate(d10.getDate() - 10);
          const d15 = new Date(); d15.setDate(d15.getDate() - 15);
          await Expense.insertMany([
            { id: 'exp_01', title: 'দোকান ভাড়া (চলতি মাস)', category: 'দোকান ভাড়া', amount: 12000, date: d15.toISOString().split('T')[0], payment_method: 'ব্যাংক ট্রান্সফার', notes: 'পুরান বাজার দোকান ঘরের মাসিক চুক্তি অনুযায়ী ভাড়া পরিশোধ' },
            { id: 'exp_02', title: 'স্টাফ বেতন ও সহকারী পারিশ্রমিক', category: 'স্টাফ বেতন ও বোনাস', amount: 15000, date: d10.toISOString().split('T')[0], payment_method: 'নগদ (Cash)', notes: 'দোকান সহকারী সেলসম্যান বেতন' },
            { id: 'exp_03', title: 'পল্লী বিদ্যুৎ অফিস বিল', category: 'বিদ্যুৎ ও ইউটিলিটি বিল', amount: 3450, date: d5.toISOString().split('T')[0], payment_method: 'বিকাশ (bKash)', notes: 'মিটার নং: ৯৪২৩৮' },
            { id: 'exp_04', title: 'সুন্দরবন কুরিয়ার পণ্য পরিবহন খরচ', category: 'পণ্য পরিবহন ও কুরিয়ার', amount: 1850, date: d5.toISOString().split('T')[0], payment_method: 'নগদ (Cash)', notes: 'ঢাকা চকবাজার থেকে কসমেটিকস ও স্টেশনারি পার্সেল পরিবহন' },
            { id: 'exp_05', title: 'দোকানের ব্র্যান্ডেড শপিং ব্যাগ ও পলি', category: 'প্যাকেজিং ও শপিং ব্যাগ', amount: 1200, date: today, payment_method: 'নগদ (Cash)', notes: '১০০০ পিস প্রিন্টেড হ্যান্ডেল ব্যাগ' },
            { id: 'exp_06', title: 'ক্রেতা ও অতিথি আপ্যায়ন (চা-নাস্তা)', category: 'চা-নাস্তা ও আপ্যায়ন', amount: 750, date: today, payment_method: 'নগদ (Cash)', notes: 'দৈনিক আপ্যায়ন খরচ' },
            { id: 'exp_07', title: 'দোকানের এলইডি লাইট ও মেরামত', category: 'দোকান মেরামত ও রক্ষণাবেক্ষণ', amount: 950, date: d10.toISOString().split('T')[0], payment_method: 'নগদ (Cash)', notes: 'কাউন্টার লাইট পরিবর্তন' }
          ]);
        }

        console.log('MongoDB store data, departments and expenses verified.');
        return;
      }
    }

    console.log('Seeding initial Mijan Computer & Cosmetics data into MongoDB...');

    // Single Store: চন্ডিপুর পুরান বাজার, নড়িয়া, শরীয়তপুর
    await Store.create({
      id: 'store_1',
      name: 'মিজান কম্পিউটার অ্যান্ড কসমেটিকস',
      code: 'MJN-NR01',
      location: 'চন্ডিপুর পুরান বাজার, নড়িয়া, শরীয়তপুর',
      phone: '+৮৮০ ১৭৯৮-১২৩৪৫৬',
      manager: 'মিজানুর রহমান',
      status: 'Active'
    });

    // Departments
    await Department.insertMany([
      { id: 'dept_cosmetics', name: 'কসমেটিকস ও রূপচর্চা', code: 'COSM', icon: 'Sparkles', description: 'ফেসওয়াশ, লোশন, ক্রিম, শ্যাম্পু, পারফিউম, লিপস্টিক ও স্কিন কেয়ার' },
      { id: 'dept_gifts', name: 'গিফট আইটেম ও খেলনা', code: 'GIFT', icon: 'Gift', description: 'ফটোফ্রেম, শোপিস, কাস্টমাইজড মগ, হাতঘড়ি, খেলনা ও গিফট বক্স' },
      { id: 'dept_computer', name: 'কম্পিউটার ও ডিজিটাল সামগ্রী', code: 'COMP', icon: 'Monitor', description: 'মাউস, কিবোর্ড, পেনড্রাইভ, হেডফোন, ইউএসবি ক্যাবল ও চার্জার' },
      { id: 'dept_paper', name: 'খাতা, ডায়েরি ও কাগজ সামগ্রী', code: 'PAPR', icon: 'BookOpen', description: 'লেকচার খাতা, স্পাইরাল নোটবুক, এ৪ রিম পেপার ও এক্সিকিউটিভ ডায়েরি' },
      { id: 'dept_pens', name: 'কলম, পেন্সিল ও মার্কার', code: 'PENS', icon: 'Edit3', description: 'বলপেন, জেল পেন, রোলিং বল, ড্রয়িং পেন্সিল ও হাইলাইটার' },
      { id: 'dept_art', name: 'আর্ট, ক্রাফট ও ড্রয়িং', code: 'ARTS', icon: 'Palette', description: 'জলরং, এক্রিলিক, ক্যানভাস, তুলি, গ্লু গান ও পোস্টার পেপার' },
      { id: 'dept_office', name: 'অফিস সাপ্লাই ও ফাইল ফোল্ডার', code: 'OFFC', icon: 'Folder', description: 'বক্স ফাইল, পাঞ্চিং মেশিন, স্ট্যাপলার, ক্লিপবোর্ড ও ডেস্ক অর্গানাইজার' },
      { id: 'dept_tools', name: 'ক্যালকুলেটর, জ্যামিতি ও ব্যাগ', code: 'TOOL', icon: 'Briefcase', description: 'সায়েন্টিফিক ক্যালকুলেটর, জ্যামিতি বক্স, মেটাল স্কেল ও স্কুল ব্যাকপ্যাক' }
    ]);

    // Products (with realistic expiry date / not applicable setup)
    await Product.insertMany([
      // খাতা ও পেপার (মেয়াদ প্রযোজ্য নয়)
      { id: 'prod_p01', barcode: '890100101', name: 'বসুন্ধরা এ৪ ফটোকপি পেপার (৮০ জিএসএম, ৫০০ শিট রিম)', department_id: 'dept_paper', category: 'ফটোকপি পেপার', price: 450.00, cost: 360.00, stock_qty: 120, min_threshold: 25, unit: 'রিম', expiry_date: null, has_expiry: 0 },
      { id: 'prod_p02', barcode: '890100102', name: 'বাশার প্রিমিয়াম লেকচার খাতা (১২০ পৃষ্ঠা, রুলড)', department_id: 'dept_paper', category: 'লেকচার খাতা', price: 85.00, cost: 58.00, stock_qty: 240, min_threshold: 40, unit: 'পিস', expiry_date: null, has_expiry: 0 },
      { id: 'prod_p03', barcode: '890100103', name: 'পেপারমেট স্পাইরাল নোটবুক (এ৪ সাইজ, ২০০ পৃষ্ঠা)', department_id: 'dept_paper', category: 'স্পাইরাল খাতা', price: 140.00, cost: 95.00, stock_qty: 85, min_threshold: 20, unit: 'পিস', expiry_date: null, has_expiry: 0 },
      { id: 'prod_p04', barcode: '890100104', name: 'এক্সিকিউটিভ লেদার বাইন্ডিং ডায়রি ২০২৬', department_id: 'dept_paper', category: 'ডায়েরি', price: 450.00, cost: 280.00, stock_qty: 50, min_threshold: 15, unit: 'পিস', expiry_date: '2026-12-31', has_expiry: 1 },
      { id: 'prod_p05', barcode: '890100105', name: 'আর্ট পেপার ড্রয়িং প্যাড (১৫০ জিএসএম, ৩০ পাতা)', department_id: 'dept_paper', category: 'ড্রয়িং খাতা', price: 160.00, cost: 110.00, stock_qty: 60, min_threshold: 15, unit: 'পিস', expiry_date: null, has_expiry: 0 },
      { id: 'prod_p06', barcode: '890100106', name: 'রঙিন পোস্ট-ইট স্টিকি নোটস (৩x৩ ইঞ্চি, ৫ কালার প্যাক)', department_id: 'dept_paper', category: 'স্টিকি নোট', price: 75.00, cost: 45.00, stock_qty: 110, min_threshold: 30, unit: 'প্যাক', expiry_date: null, has_expiry: 0 },

      // কলম ও পেন্সিল
      { id: 'prod_pen01', barcode: '890200201', name: 'ম্যাটাডোর পিন-পয়েন্ট বলপেন বক্স (২০ পিস)', department_id: 'dept_pens', category: 'বলপেন', price: 100.00, cost: 78.00, stock_qty: 150, min_threshold: 30, unit: 'বক্স', expiry_date: null, has_expiry: 0 },
      { id: 'prod_pen02', barcode: '890200202', name: 'ইকোনো ডিএক্স জেল পেন বক্স (০.৫ মিমি, ১২ পিস)', department_id: 'dept_pens', category: 'জেল পেন', price: 120.00, cost: 90.00, stock_qty: 95, min_threshold: 20, unit: 'বক্স', expiry_date: null, has_expiry: 0 },
      { id: 'prod_pen03', barcode: '890200203', name: 'পাইলট জি-২ প্রিমিয়াম রিফিলযোগ্য জেল পেন', department_id: 'dept_pens', category: 'প্রিমিয়াম পেন', price: 150.00, cost: 110.00, stock_qty: 80, min_threshold: 20, unit: 'পিস', expiry_date: null, has_expiry: 0 },
      { id: 'prod_pen04', barcode: '890200204', name: 'স্নোম্যান হোয়াইটবোর্ড মার্কার সেট (৪ রঙের প্যাক)', department_id: 'dept_pens', category: 'মার্কার', price: 180.00, cost: 130.00, stock_qty: 75, min_threshold: 15, unit: 'প্যাক', expiry_date: '2027-05-30', has_expiry: 1 },
      { id: 'prod_pen05', barcode: '890200205', name: 'স্ট্যাবিলো বস অরিজিনাল হাইলাইটার সেট (৬ কালার)', department_id: 'dept_pens', category: 'হাইলাইটার', price: 350.00, cost: 240.00, stock_qty: 45, min_threshold: 12, unit: 'প্যাক', expiry_date: '2027-08-31', has_expiry: 1 },
      { id: 'prod_pen06', barcode: '890200206', name: 'ফ্যাবার-ক্যাসেল ২বি ড্রয়িং পেন্সিল বক্স (১২ পিস)', department_id: 'dept_pens', category: 'পেন্সিল', price: 140.00, cost: 95.00, stock_qty: 100, min_threshold: 25, unit: 'বক্স', expiry_date: null, has_expiry: 0 },

      // আর্ট ও ক্রাফট
      { id: 'prod_art01', barcode: '890300301', name: 'ক্যামেল আর্টিস্ট ওয়াটার কালার কেক সেট (২৪ শেড)', department_id: 'dept_art', category: 'জলরং', price: 320.00, cost: 220.00, stock_qty: 40, min_threshold: 10, unit: 'সেট', expiry_date: '2027-11-30', has_expiry: 1 },
      { id: 'prod_art02', barcode: '890300302', name: 'ক্যামলিন এক্রিলিক কালার সেট (১২ টিউব x ২০ মিলি)', department_id: 'dept_art', category: 'এক্রিলিক পেইন্ট', price: 420.00, cost: 290.00, stock_qty: 35, min_threshold: 10, unit: 'সেট', expiry_date: '2027-04-15', has_expiry: 1 },
      { id: 'prod_art03', barcode: '890300303', name: 'আর্টিস্ট তুলি সেট (৭ পিস ফ্ল্যাট ও রাউন্ড সিন্থেটিক)', department_id: 'dept_art', category: 'ড্রয়িং তুলি', price: 250.00, cost: 160.00, stock_qty: 55, min_threshold: 15, unit: 'সেট', expiry_date: null, has_expiry: 0 },
      { id: 'prod_art04', barcode: '890300304', name: 'ফেভিকল এসএইচ ক্রাফট গ্লু (২০০ গ্রাম জার)', department_id: 'dept_art', category: 'আঠা ও গ্লু', price: 90.00, cost: 65.00, stock_qty: 90, min_threshold: 20, unit: 'জার', expiry_date: '2026-11-25', has_expiry: 1 },
      { id: 'prod_art05', barcode: '890300305', name: 'মডেলিং ক্লে ও প্লাস্টিসিন ক্রাফট কিট', department_id: 'dept_art', category: 'মডেলিং ক্লে', price: 180.00, cost: 120.00, stock_qty: 50, min_threshold: 15, unit: 'সেট', expiry_date: '2027-02-28', has_expiry: 1 },

      // অফিস ও ফাইল সামগ্রী
      { id: 'prod_off01', barcode: '890400401', name: 'ডেল্টা প্রিমিয়াম পিভিসি লেজার বক্স ফাইল', department_id: 'dept_office', category: 'ফাইল ফোল্ডার', price: 120.00, cost: 80.00, stock_qty: 140, min_threshold: 30, unit: 'পিস', expiry_date: null, has_expiry: 0 },
      { id: 'prod_off02', barcode: '890400402', name: 'কাংগারু স্ট্যাপলার মেশিন ও পিন বক্স (নং ১০)', department_id: 'dept_office', category: 'স্ট্যাপলার', price: 180.00, cost: 125.00, stock_qty: 85, min_threshold: 20, unit: 'সেট', expiry_date: null, has_expiry: 0 },
      { id: 'prod_off03', barcode: '890400403', name: 'হেভি ডিউটি টু-হোল পেপার পাঞ্চিং মেশিন', department_id: 'dept_office', category: 'পাঞ্চ মেশিন', price: 280.00, cost: 190.00, stock_qty: 45, min_threshold: 10, unit: 'পিস', expiry_date: null, has_expiry: 0 },
      { id: 'prod_off04', barcode: '890400404', name: 'অফিস মেটাল ক্লিপবোর্ড ও এ৪ ডক হোল্ডার', department_id: 'dept_office', category: 'ক্লিপবোর্ড', price: 110.00, cost: 70.00, stock_qty: 65, min_threshold: 15, unit: 'পিস', expiry_date: null, has_expiry: 0 },
      { id: 'prod_off05', barcode: '890400405', name: 'কেভি ১২-ডিজিট ডেস্কটপ অফিস ক্যালকুলেটর', department_id: 'dept_office', category: 'অফিস ক্যালকুলেটর', price: 550.00, cost: 380.00, stock_qty: 35, min_threshold: 10, unit: 'পিস', expiry_date: null, has_expiry: 0 },

      // ক্যালকুলেটর, জ্যামিতি ও ব্যাগ
      { id: 'prod_tl01', barcode: '890500501', name: 'ক্যাসিও এফএক্স-৯৯১ সিডব্লিউ সায়েন্টিফিক ক্যালকুলেটর (অরিজিনাল)', department_id: 'dept_tools', category: 'সায়েন্টিফিক ক্যালকুলেটর', price: 3200.00, cost: 2450.00, stock_qty: 30, min_threshold: 8, unit: 'পিস', expiry_date: null, has_expiry: 0 },
      { id: 'prod_tl02', barcode: '890500502', name: 'ক্যামলিন ডিলাক্স জ্যামিতি বক্স (কম্পাস ও প্রোটেক্টর)', department_id: 'dept_tools', category: 'জ্যামিতি বক্স', price: 180.00, cost: 120.00, stock_qty: 90, min_threshold: 20, unit: 'সেট', expiry_date: null, has_expiry: 0 },
      { id: 'prod_tl03', barcode: '890500503', name: 'মেটাডোর প্রিমিয়াম স্কুল ও কলেজ ব্যাকপ্যাক', department_id: 'dept_tools', category: 'স্কুল ব্যাগ', price: 1250.00, cost: 800.00, stock_qty: 25, min_threshold: 6, unit: 'পিস', expiry_date: null, has_expiry: 0 },
      { id: 'prod_tl04', barcode: '890500504', name: 'স্টেইনলেস স্টিল আনব্রেকেবল স্কেল (৩০ সেমি)', department_id: 'dept_tools', category: 'স্কেল ও রুলার', price: 40.00, cost: 22.00, stock_qty: 180, min_threshold: 40, unit: 'পিস', expiry_date: null, has_expiry: 0 },
      { id: 'prod_tl05', barcode: '890500505', name: 'রোটারি মেকানিক্যাল পেন্সিল ০.৫ মিমি + লিড বক্স', department_id: 'dept_tools', category: 'মেকানিক্যাল পেন', price: 130.00, cost: 85.00, stock_qty: 70, min_threshold: 20, unit: 'সেট', expiry_date: null, has_expiry: 0 }
    ]);

    // Customers
    await Customer.insertMany([
      { id: 'cust_01', card_number: 'MIJAN-VIP-101', first_name: 'ড. আরিফুল', last_name: 'ইসলাম', email: 'dr.ariful@du.ac.bd', phone: '+৮৮০ ১৭১১-২৩৪৮৯০', tier: 'VIP', points_balance: 3450, lifetime_points: 12800, total_spent: 58400.00, visit_count: 46, last_visit: '2026-10-15', join_date: '2024-03-12', birthday: '1982-07-22', churn_risk: 'Low', tags: ['বিশ্ববিদ্যালয় শিক্ষক', 'করপোরেট ক্লায়েন্ট', 'ভিআইপি মেম্বার'], notes: 'ডিপার্টমেন্টাল পরীক্ষার পেপার ও অফিস খাতা একবারে পাইকারি কেনেন।', preferred_department: 'খাতা, ডায়েরি ও কাগজ সামগ্রী' },
      { id: 'cust_02', card_number: 'MIJAN-PLT-102', first_name: 'নুসরাত', last_name: 'জাহান', email: 'nusrat.arch@buet.ac.bd', phone: '+৮৮০ ১৭১২-৩৪৫৯০১', tier: 'Platinum', points_balance: 2100, lifetime_points: 8900, total_spent: 38500.00, visit_count: 32, last_visit: '2026-10-12', join_date: '2024-05-18', birthday: '1998-11-04', churn_risk: 'Low', tags: ['বুয়েট শিক্ষার্থী', 'আর্কিটেকচার', 'ড্রয়িং স্পেশালিস্ট'], notes: 'আর্ট পেপার, টেকনিক্যাল কলম ও মডেলিং সামগ্রী নিয়মিত নেন।', preferred_department: 'আর্ট, ক্রাফট ও ড্রয়িং' },
      { id: 'cust_03', card_number: 'MIJAN-GLD-103', first_name: 'মেহেদী', last_name: 'হাসান', email: 'mehedi.coaching@dhaka.net', phone: '+৮৮০ ১৭২৩-৪৫৬৭৮৯', tier: 'Gold', points_balance: 1420, lifetime_points: 5200, total_spent: 26800.00, visit_count: 24, last_visit: '2026-10-16', join_date: '2024-09-02', birthday: '1989-03-15', churn_risk: 'Low', tags: ['কোচিং সেন্টার পরিচালক', 'বাল্ক বায়ার'], notes: 'মডেল টেস্টের খাতা ও ফটোকপি পেপার রিম নেন।', preferred_department: 'খাতা, ডায়েরি ও কাগজ সামগ্রী' },
      { id: 'cust_04', card_number: 'MIJAN-GLD-104', first_name: 'জান্নাতুল ফেরদৌস', last_name: 'শিমু', email: 'jannat.teacher@viqarunnisa.edu.bd', phone: '+৮৮০ ১৭৩৪-৫৬৭৮৯০', tier: 'Gold', points_balance: 980, lifetime_points: 4800, total_spent: 21200.00, visit_count: 19, last_visit: '2026-10-08', join_date: '2024-11-10', birthday: '1985-08-30', churn_risk: 'Low', tags: ['স্কুল শিক্ষিকা', 'হোয়াইটবোর্ড মার্কার ক্রেতা'], notes: 'ক্লাসরুম মার্কার ও শিক্ষার্থীদের পুরস্কার সামগ্রী কেনেন।', preferred_department: 'কলম, পেন্সিল ও মার্কার' },
      { id: 'cust_05', card_number: 'MIJAN-SLV-105', first_name: 'তানজিম', last_name: 'আহমেদ', email: 'tanzim.du@gmail.com', phone: '+৮৮০ ১৭৪৫-৬৭৮৯০১', tier: 'Silver', points_balance: 640, lifetime_points: 2800, total_spent: 14200.00, visit_count: 14, last_visit: '2026-09-28', join_date: '2025-01-14', birthday: '2001-12-09', churn_risk: 'Medium', tags: ['ঢাবি শিক্ষার্থী', 'বিসিএস পরীক্ষার্থী'], notes: 'বিসিএস গাইড ও নোটবুক নিয়মিত খোঁজেন।', preferred_department: 'খাতা, ডায়েরি ও কাগজ সামগ্রী' },
      { id: 'cust_06', card_number: 'MIJAN-BRZ-106', first_name: 'নাজমুল', last_name: 'হক', email: 'nazmul.h@gmail.com', phone: '+৮৮০ ১৭৫৬-৭৮৯০১২', tier: 'Bronze', points_balance: 210, lifetime_points: 850, total_spent: 4200.00, visit_count: 5, last_visit: '2026-08-14', join_date: '2025-04-20', birthday: '2004-06-18', churn_risk: 'High', tags: ['কলেজ শিক্ষার্থী', 'অনিয়মিত ক্রেতা'], notes: 'ঝুঁকিপূর্ণ গ্রাহক। পরীক্ষার মৌসুম ছাড়া খুব একটা আসেন না।', preferred_department: 'কলম, পেন্সিল ও মার্কার' },
      { id: 'cust_07', card_number: 'MIJAN-VIP-107', first_name: 'ফারহানা', last_name: 'চৌধুরী', email: 'farhana.banker@ebl.com.bd', phone: '+৮৮০ ১৭৬৭-৮৯০১২২', tier: 'VIP', points_balance: 4890, lifetime_points: 16500, total_spent: 78600.00, visit_count: 54, last_visit: '2026-10-14', join_date: '2023-11-05', birthday: '1980-04-11', churn_risk: 'Low', tags: ['ব্যাংক কর্মকর্তা', 'কর্পোরেট গিফট বায়ার'], notes: 'ব্যাংকের জন্য এক্সিকিউটিভ ডায়েরি ও প্রিমিয়াম পেন সেট কেনেন।', preferred_department: 'অফিস সাপ্লাই ও ফাইল ফোল্ডার' },
      { id: 'cust_08', card_number: 'MIJAN-PLT-108', first_name: 'শামীম', last_name: 'রেজা', email: 'shamim.admin@squarebd.com', phone: '+৮৮০ ১৭৭৮-৯০১২২৩', tier: 'Platinum', points_balance: 1850, lifetime_points: 7600, total_spent: 34500.00, visit_count: 29, last_visit: '2026-10-11', join_date: '2024-06-22', birthday: '1986-09-25', churn_risk: 'Low', tags: ['অফিস অ্যাডমিন', 'বক্স ফাইল ও স্ট্যাপলার'], notes: 'অফিসের মাসিক স্টেশনারি রিকুইজিশন সরবরাহকারী।', preferred_department: 'অফিস সাপ্লাই ও ফাইল ফোল্ডার' },
      { id: 'cust_09', card_number: 'MIJAN-SLV-109', first_name: 'আফরিন', last_name: 'সুলতানা', email: 'afrin.finearts@du.ac.bd', phone: '+৮৮০ ১৭৮৯-০১২৩৪১', tier: 'Silver', points_balance: 520, lifetime_points: 2100, total_spent: 9800.00, visit_count: 11, last_visit: '2026-10-02', join_date: '2025-02-10', birthday: '2000-01-31', churn_risk: 'Low', tags: ['চারুকলা শিক্ষার্থী', 'জলরং ও স্কেচ'], notes: 'জলরং ও ক্যালিগ্রাফি নিব নিয়মিত সংগ্রহ করেন।', preferred_department: 'আর্ট, ক্রাফট ও ড্রয়িং' },
      { id: 'cust_10', card_number: 'MIJAN-BRZ-110', first_name: 'আব্দুল্লাহ আল', last_name: 'মামুন', email: 'mamun.school@gmail.com', phone: '+৮৮০ ১৭৯০-১২৩৪৫২', tier: 'Bronze', points_balance: 120, lifetime_points: 450, total_spent: 2600.00, visit_count: 3, last_visit: '2026-09-01', join_date: '2025-07-04', birthday: '1995-10-14', churn_risk: 'High', tags: ['নতুন ক্রেতা', 'জ্যামিতি বক্স ক্রেতা'], notes: 'বাচ্চাদের স্কুল ভর্তির সময় কেনাকাটা করেছিলেন।', preferred_department: 'ক্যালকুলেটর, জ্যামিতি ও ব্যাগ' }
    ]);

    // Coupons
    await Coupon.insertMany([
      { id: 'cp_01', code: 'MIJANVIP20', title: 'মিজান কম্পিউটার অ্যান্ড কসমেটিকস ভিআইপি ২০% স্পেশাল ছাড়', discount_type: 'percentage', discount_value: 20.0, min_spend: 2000.0, max_discount: 1500.0, target_tier: 'VIP', expiry_date: '2026-12-31', usage_limit: 200, used_count: 42, is_active: 1 },
      { id: 'cp_02', code: 'STUDENT10', title: 'সকল শিক্ষার্থীদের জন্য ১০% স্টুডেন্ট ছাড়', discount_type: 'percentage', discount_value: 10.0, min_spend: 500.0, max_discount: 300.0, target_tier: 'All', expiry_date: '2026-11-15', usage_limit: 500, used_count: 184, is_active: 1 },
      { id: 'cp_03', code: 'BULK500', title: '৫,০০০ টাকার অফিস স্টেশনারিতে ৫০০ টাকা ক্যাশব্যাক', discount_type: 'fixed', discount_value: 500.0, min_spend: 5000.0, max_discount: 500.0, target_tier: 'All', expiry_date: '2026-11-30', usage_limit: 300, used_count: 89, is_active: 1 },
      { id: 'cp_04', code: 'EXAMSPECIAL', title: 'পরীক্ষার মৌসুম স্পেশাল ১৫% ছাড় ভাউচার', discount_type: 'percentage', discount_value: 15.0, min_spend: 1000.0, max_discount: 400.0, target_tier: 'Gold+', expiry_date: '2026-12-15', usage_limit: 100, used_count: 28, is_active: 1 },
      { id: 'cp_05', code: 'BOISHAKH15', title: 'পহেলা বৈশাখ খাতা-কলম মেগা ডিসকাউন্ট', discount_type: 'percentage', discount_value: 15.0, min_spend: 1200.0, max_discount: 500.0, target_tier: 'All', expiry_date: '2026-11-20', usage_limit: 250, used_count: 77, is_active: 1 }
    ]);

    // Sample Orders
    await Order.create({
      id: 'ord_101',
      order_number: 'ORD-2026-8901',
      customer_id: 'cust_01',
      store_id: 'store_1',
      cashier_name: 'মিজানুর রহমান',
      subtotal: 4500.00,
      discount_amount: 900.00,
      manual_discount: 0.00,
      manual_discount_reason: '',
      points_redeemed: 200,
      points_discount: 200.00,
      tax: 272.00,
      total: 3672.00,
      payment_method: 'কার্ড (Card)',
      status: 'Completed',
      created_at: '2026-10-15 14:22:10',
      items: [
        { id: 'item_1', product_id: 'prod_p01', product_name: 'বসুন্ধরা এ৪ ফটোকপি পেপার (৮০ জিএসএম, ৫০০ শিট রিম)', department_name: 'খাতা, ডায়েরি ও কাগজ সামগ্রী', unit_price: 450.00, quantity: 6, total_price: 2700.00 },
        { id: 'item_2', product_id: 'prod_p04', product_name: 'এক্সিকিউটিভ লেদার বাইন্ডিং ডায়রি ২০২৬', department_name: 'খাতা, ডায়েরি ও কাগজ সামগ্রী', unit_price: 450.00, quantity: 4, total_price: 1800.00 }
      ]
    });

    // Expenses Seed
    const Expense = require('./models/Expense');
    const today = new Date().toISOString().split('T')[0];
    const d5 = new Date(); d5.setDate(d5.getDate() - 5);
    const d10 = new Date(); d10.setDate(d10.getDate() - 10);
    const d15 = new Date(); d15.setDate(d15.getDate() - 15);
    await Expense.insertMany([
      { id: 'exp_01', title: 'দোকান ভাড়া (চলতি মাস)', category: 'দোকান ভাড়া', amount: 12000, date: d15.toISOString().split('T')[0], payment_method: 'ব্যাংক ট্রান্সফার', notes: 'পুরান বাজার দোকান ঘরের মাসিক চুক্তি অনুযায়ী ভাড়া পরিশোধ' },
      { id: 'exp_02', title: 'স্টাফ বেতন ও সহকারী পারিশ্রমিক', category: 'স্টাফ বেতন ও বোনাস', amount: 15000, date: d10.toISOString().split('T')[0], payment_method: 'নগদ (Cash)', notes: 'দোকান সহকারী সেলসম্যান বেতন' },
      { id: 'exp_03', title: 'পল্লী বিদ্যুৎ অফিস বিল', category: 'বিদ্যুৎ ও ইউটিলিটি বিল', amount: 3450, date: d5.toISOString().split('T')[0], payment_method: 'বিকাশ (bKash)', notes: 'মিটার নং: ৯৪২৩৮' },
      { id: 'exp_04', title: 'সুন্দরবন কুরিয়ার পণ্য পরিবহন খরচ', category: 'পণ্য পরিবহন ও কুরিয়ার', amount: 1850, date: d5.toISOString().split('T')[0], payment_method: 'নগদ (Cash)', notes: 'ঢাকা চকবাজার থেকে কসমেটিকস ও স্টেশনারি পার্সেল পরিবহন' },
      { id: 'exp_05', title: 'দোকানের ব্র্যান্ডেড শপিং ব্যাগ ও পলি', category: 'প্যাকেজিং ও শপিং ব্যাগ', amount: 1200, date: today, payment_method: 'নগদ (Cash)', notes: '১০০০ পিস প্রিন্টেড হ্যান্ডেল ব্যাগ' },
      { id: 'exp_06', title: 'ক্রেতা ও অতিথি আপ্যায়ন (চা-নাস্তা)', category: 'চা-নাস্তা ও আপ্যায়ন', amount: 750, date: today, payment_method: 'নগদ (Cash)', notes: 'দৈনিক আপ্যায়ন খরচ' },
      { id: 'exp_07', title: 'দোকানের এলইডি লাইট ও মেরামত', category: 'দোকান মেরামত ও রক্ষণাবেক্ষণ', amount: 950, date: d10.toISOString().split('T')[0], payment_method: 'নগদ (Cash)', notes: 'কাউন্টার লাইট পরিবর্তন' }
    ]);

    console.log('MongoDB seeding completed successfully!');
  } catch (err) {
    console.error('Error seeding MongoDB:', err);
  }
}

async function wipeAllCollections() {
  const Store = require('./models/Store');
  const Department = require('./models/Department');
  const Product = require('./models/Product');
  const Customer = require('./models/Customer');
  const Coupon = require('./models/Coupon');
  const Order = require('./models/Order');
  const LoyaltyTransaction = require('./models/LoyaltyTransaction');
  const Campaign = require('./models/Campaign');
  const SupportTicket = require('./models/SupportTicket');
  const Expense = require('./models/Expense');
  const SystemMeta = require('./models/SystemMeta');

  const [stores, departments, products, customers, coupons, orders, loyalty, campaigns, tickets, expenses] = await Promise.all([
    Store.deleteMany({}),
    Department.deleteMany({}),
    Product.deleteMany({}),
    Customer.deleteMany({}),
    Coupon.deleteMany({}),
    Order.deleteMany({}),
    LoyaltyTransaction.deleteMany({}),
    Campaign.deleteMany({}),
    SupportTicket.deleteMany({}),
    Expense.deleteMany({})
  ]);

  // Set flag so auto-seeding will not repopulate on subsequent connections
  await SystemMeta.findOneAndUpdate(
    { key: 'is_cleaned_blank' },
    { value: true, updated_at: new Date() },
    { upsert: true, new: true }
  );

  return {
    stores: stores.deletedCount,
    departments: departments.deletedCount,
    products: products.deletedCount,
    customers: customers.deletedCount,
    coupons: coupons.deletedCount,
    orders: orders.deletedCount,
    loyaltyTransactions: loyalty.deletedCount,
    campaigns: campaigns.deletedCount,
    supportTickets: tickets.deletedCount,
    expenses: expenses.deletedCount
  };
}

async function resetMongoDatabase() {
  const SystemMeta = require('./models/SystemMeta');
  await SystemMeta.findOneAndUpdate(
    { key: 'is_cleaned_blank' },
    { value: false, updated_at: new Date() },
    { upsert: true }
  );
  await wipeAllCollections();
  await seedMongoIfEmpty(true);
}

module.exports = {
  connectToMongo,
  seedMongoIfEmpty,
  resetMongoDatabase,
  wipeAllCollections
};
