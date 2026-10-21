/**
 * WhatsApp integration utilities for Mijan Computer & Cosmetics CRM & POS
 */

/**
 * Normalizes Bangladeshi phone numbers into international WhatsApp format (8801XXXXXXXXX)
 */
export function normalizeWhatsAppNumber(rawPhone) {
  if (!rawPhone) return '';
  // Remove spaces, dashes, parentheses, plus
  let digits = String(rawPhone).replace(/\D/g, '');
  if (!digits) return '';

  // 01XXXXXXXXX (11 digits) -> 8801XXXXXXXXX
  if (digits.startsWith('01') && digits.length === 11) {
    return '88' + digits;
  }
  // 1XXXXXXXXX (10 digits) -> 8801XXXXXXXXX
  if (digits.startsWith('1') && digits.length === 10) {
    return '880' + digits;
  }
  // 8801XXXXXXXXX (13 digits)
  if (digits.startsWith('8801') && digits.length === 13) {
    return digits;
  }
  // Starts with 880
  if (digits.startsWith('880')) {
    return digits;
  }
  return digits;
}

/**
 * Formats a clean display phone number (e.g. 01309-965422)
 */
export function formatDisplayPhone(rawPhone) {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('01')) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  if (digits.length === 13 && digits.startsWith('8801')) {
    const local = '0' + digits.slice(3);
    return `${local.slice(0, 5)}-${local.slice(5)}`;
  }
  return rawPhone;
}

/**
 * Builds formatted WhatsApp receipt text for an order
 */
export function buildWhatsAppReceiptText(order) {
  if (!order) return '';

  const storeName = order.store_name || 'মিজান কম্পিউটার অ্যান্ড কসমেটিকস';
  const storeSub = 'MIJAN COMPUTER & COSMETICS';
  const storeLocation = order.store_location || 'চন্ডিপুর পুরান বাজার, নড়িয়া, শরীয়তপুর';
  const storePhone = order.store_phone || '+880 1309-965422';

  const orderNum = order.order_number || order.id || 'N/A';
  const dateStr = order.dhaka_date || (order.created_at ? order.created_at.split(' ')[0] : '');
  const timeStr = order.dhaka_time || (order.created_at ? order.created_at.split(' ').slice(1).join(' ') : '');
  const dateTime = [dateStr, timeStr].filter(Boolean).join(' | ');

  const customerName = order.first_name 
    ? `${order.first_name} ${order.last_name || ''}`.trim()
    : (order.customer_first_name ? `${order.customer_first_name} ${order.customer_last_name || ''}`.trim() : '');

  const paidAmount = Number((order.paid_amount !== undefined ? order.paid_amount : order.total).toFixed(2));
  const dueAmount = Number((order.due_amount || Math.max(0, (order.total || 0) - paidAmount)).toFixed(2));
  const changeAmount = Number((order.change_amount || 0).toFixed(2));
  const customerTotalDue = Number((order.customer_due_balance || 0).toFixed(2));

  let msg = `🧾 *ক্যাশ মেমো / ক্যাশ রসিদ*\n`;
  msg += `*${storeName}*\n`;
  msg += `_${storeSub}_\n`;
  msg += `📍 ${storeLocation}\n`;
  msg += `📞 হেল্পলাইন: ${storePhone}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📄 *চালান নং:* ${orderNum}\n`;
  if (dateTime) msg += `📅 *তারিখ:* ${dateTime}\n`;
  if (customerName) {
    msg += `👤 *গ্রাহক:* ${customerName}${order.card_number ? ` (কার্ড: ${order.card_number})` : ''}\n`;
  }
  const custPhone = order.phone || order.customer_phone || '';
  if (custPhone) {
    const digitsOnly = String(custPhone).replace(/\D/g, '');
    const last6 = digitsOnly.length >= 6 ? digitsOnly.slice(-6) : digitsOnly;
    msg += `📱 *মোবাইল:* ...${last6} (${formatDisplayPhone(custPhone)})\n`;
  }
  if (order.cashier_name) {
    msg += `👨‍💼 *ক্যাশিয়ার:* ${order.cashier_name}\n`;
  }
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🛒 *ক্রয়কৃত পণ্যের বিবরণ:*\n`;

  if (Array.isArray(order.items) && order.items.length > 0) {
    order.items.forEach((it, idx) => {
      const pName = it.product_name || it.name || 'পণ্য';
      const qty = it.quantity || it.qty || 1;
      const unit = Number(it.unit_price || it.unitPrice || 0).toFixed(2);
      const lineTotal = Number(it.total_price || (qty * (it.unit_price || 0))).toFixed(2);
      msg += `${idx + 1}. *${pName}*\n   ${qty} পিস x ৳${unit} = ৳${lineTotal}\n`;
    });
  } else {
    msg += `কোনো পণ্য বিবরণ নেই\n`;
  }

  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `💵 সাবটোটাল: ৳${Number(order.subtotal || order.total || 0).toFixed(2)}\n`;

  if (order.discount_amount > 0) {
    msg += `🏷️ ভাউচার ছাড়: -৳${Number(order.discount_amount).toFixed(2)}\n`;
  }
  if (order.manual_discount > 0) {
    msg += `✂️ বিশেষ ছাড়: -৳${Number(order.manual_discount).toFixed(2)}\n`;
  }
  if (order.points_discount > 0) {
    msg += `🎁 পয়েন্ট ছাড়: -৳${Number(order.points_discount).toFixed(2)}\n`;
  }

  msg += `💰 *সর্বমোট বিল: ৳${Number(order.total || 0).toFixed(2)}*\n`;
  msg += `✅ জমা / পরিশোধ: ৳${paidAmount.toFixed(2)}\n`;

  if (dueAmount > 0) {
    msg += `⚠️ *এই চালানে বাকি (Due): ৳${dueAmount.toFixed(2)}*\n`;
  }
  if (changeAmount > 0) {
    msg += `🔄 ফেরত (Change): ৳${changeAmount.toFixed(2)}\n`;
  }

  if (customerTotalDue > 0) {
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🔴 *আপনার সর্বমোট বকেয়া (Total Due): ৳${customerTotalDue.toFixed(2)}*\n`;
  }

  if (order.earned_points > 0) {
    msg += `⭐ অর্জিত পয়েন্ট: +${order.earned_points} pt\n`;
  }

  msg += `💳 মাধ্যম: ${order.payment_method || 'নগদ (Cash)'}\n`;

  const customerPhone = order.phone || order.customer_phone || '';
  if (customerPhone && typeof window !== 'undefined' && window.location?.origin) {
    const cleanDigits = customerPhone.replace(/\D/g, '');
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🌐 আপনার সম্পূর্ণ হিসাব ও রসিদ দেখতে ভিজিট করুন:\n${window.location.origin}/?phone=${cleanDigits}&portal=true\n`;
  }

  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `কেনাকাটার জন্য আপনাকে আন্তরিক ধন্যবাদ! 🙏\n`;
  msg += `যেকোনো প্রয়োজনে যোগাযোগ: ${storePhone}`;

  return msg;
}

/**
 * Builds formatted WhatsApp due statement reminder text
 */
export function buildWhatsAppDueStatementText({ customer, storePhone = '+880 1309-965422' }) {
  if (!customer) return '';
  const name = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'সম্মানিত গ্রাহক';
  const due = Number((customer.due_balance || 0).toFixed(2));

  let msg = `📢 *বকেয়া হিসাব বিবরণী*\n`;
  msg += `*মিজান কম্পিউটার অ্যান্ড কসমেটিকস*\n`;
  msg += `📍 চন্ডিপুর পুরান বাজার, নড়িয়া, শরীয়তপুর\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `প্রিয় ${name},\n`;
  if (customer.card_number) msg += `💳 মেম্বার কার্ড নং: ${customer.card_number}\n`;
  if (customer.phone) {
    const digitsOnly = String(customer.phone).replace(/\D/g, '');
    const last6 = digitsOnly.length >= 6 ? digitsOnly.slice(-6) : digitsOnly;
    msg += `📱 *মোবাইল:* ...${last6} (${formatDisplayPhone(customer.phone)})\n`;
  }
  msg += `🔴 *আপনার বর্তমান সর্বমোট বকেয়া (Due): ৳${due.toFixed(2)}*\n`;
  if (customer.points_balance > 0) {
    msg += `⭐ আপনার অর্জিত পয়েন্ট: ${customer.points_balance} pt\n`;
  }

  if (customer.phone && typeof window !== 'undefined' && window.location?.origin) {
    const cleanDigits = customer.phone.replace(/\D/g, '');
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🌐 লাইভ বকেয়া হিসাব ও পরিশোধ দেখতে ভিজিট করুন:\n${window.location.origin}/?phone=${cleanDigits}&portal=true\n`;
  }

  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `দয়া করে সুবিধাজনক সময়ে দোকানে এসে অথবা বিকাশ/নগদে বকেয়া পরিশোধ করার অনুরোধ করা যাচ্ছে।\n\n`;
  msg += `📲 বিকাশ/নগদ নম্বর: ${storePhone}\n`;
  msg += `যেকোনো তথ্যের জন্য কল করুন: ${storePhone}\n`;
  msg += `ধন্যবাদ! 🙏`;

  return msg;
}

/**
 * Opens WhatsApp Web or WhatsApp App with the specified message
 */
export function sendToWhatsApp({ phone, message }) {
  const normPhone = normalizeWhatsAppNumber(phone);
  const encodedText = encodeURIComponent(message || '');
  
  let url = '';
  if (normPhone) {
    url = `https://wa.me/${normPhone}?text=${encodedText}`;
  } else {
    // If no phone is provided, open WhatsApp with pre-filled message so sender can pick contact
    url = `https://api.whatsapp.com/send?text=${encodedText}`;
  }
  
  window.open(url, '_blank', 'noopener,noreferrer');
}
