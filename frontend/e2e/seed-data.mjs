/**
 * Test Data Seeder for Educomm
 *
 * Injects rich test data into the Supabase DB via API endpoints.
 * Run:  node e2e/seed-data.mjs
 *
 * What it creates:
 *   - 3 categories (Programming, Electronics, Science)
 *   - 5 courses per category (15 total) across difficulties
 *   - 2 kits per course (30 total) with varied prices
 *   - 3 course contents per course (45 total)
 *   - 5 enrollments for the test customer
 *   - 3 items in the customer's cart
 *   - 2 addresses for the customer
 *   - 2 orders via checkout
 *
 * Idempotent: checks existing data before creating duplicates.
 * Edit the SEED_DATA section below to change quantities/values.
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const API = 'https://localhost:50135/api';

const ADMIN = { email: 'shreshth@10', password: 'shreshth@10' };
const CUSTOMER = { email: 'shreshth@1', password: 'shreshth1' };

// ─── helpers ────────────────────────────────────────────────
async function login(email, password) {
  const res = await fetch(`${API}/auth/Login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed for ${email}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return typeof data === 'string' ? data : data.token || data.jwtToken;
}

async function api(method, path, token, body) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  const text = await res.text();
  if (!res.ok) {
    // Return null on conflict/duplicate/validation/not-found errors instead of throwing
    if (res.status === 409 || res.status === 400 || res.status === 500 || res.status === 404) return null;
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  try { return JSON.parse(text); } catch { return text; }
}

async function getAll(path, token, pageSize = 100) {
  return api('GET', `${path}?page=1&pageSize=${pageSize}`, token);
}

// ─── SEED DATA CONFIG (edit these!) ─────────────────────────
const CATEGORIES = [
  { name: 'Programming', description: 'Software development and coding courses' },
  { name: 'Electronics', description: 'Hardware, circuits, and IoT courses' },
  { name: 'Science', description: 'Physics, chemistry, and biology courses' },
];

function makeCourses(categoryId, categoryName) {
  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
  const durations = [30, 60, 90, 120, 180];
  return Array.from({ length: 5 }, (_, i) => ({
    courseId: 0,
    categoryId,
    name: `${categoryName} Course ${i + 1}`,
    description: `A comprehensive ${difficulties[i % 3].toLowerCase()} level ${categoryName.toLowerCase()} course covering essential topics. Module ${i + 1}.`,
    difficulty: difficulties[i % 3],
    durationMinutes: durations[i],
    thumbnailUrl: `https://picsum.photos/seed/${categoryName}${i}/400/300`,
    isActive: true,
  }));
}

function makeKits(courseId, courseName, categoryId, index) {
  const prices = [199, 499, 999, 1499, 1999, 2499, 2999, 3499, 3999, 4999];
  return [
    {
      kitId: 0,
      categoryId,
      courseId,
      name: `${courseName} - Starter Kit`,
      description: `Everything you need to get started with ${courseName}. Includes basic components and guide.`,
      sku: `SKU-SEED-${categoryId}-${courseId}-S-${Date.now()}`,
      price: prices[index % prices.length],
      stockQuantity: 20 + (index * 3),
      imageUrl: `https://picsum.photos/seed/kit${courseId}a/400/300`,
      weight: 0.5 + (index * 0.1),
      dimensions: '20x15x10 cm',
      isActive: true,
    },
    {
      kitId: 0,
      categoryId,
      courseId,
      name: `${courseName} - Pro Kit`,
      description: `Advanced kit for ${courseName}. Includes premium components, tools, and detailed manual.`,
      sku: `SKU-SEED-${categoryId}-${courseId}-P-${Date.now()}`,
      price: prices[(index + 3) % prices.length],
      stockQuantity: 10 + index,
      imageUrl: `https://picsum.photos/seed/kit${courseId}b/400/300`,
      weight: 1.0 + (index * 0.2),
      dimensions: '30x20x15 cm',
      isActive: true,
    },
  ];
}

function makeContents(courseId) {
  return [
    {
      contentId: 0,
      courseId,
      contentType: 'video',
      title: 'Introduction & Overview',
      contentUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      sequenceOrder: 1,
      durationSeconds: 300,
    },
    {
      contentId: 0,
      courseId,
      contentType: 'video',
      title: 'Core Concepts Deep Dive',
      contentUrl: 'https://www.w3schools.com/html/movie.mp4',
      sequenceOrder: 2,
      durationSeconds: 600,
    },
    {
      contentId: 0,
      courseId,
      contentType: 'embed',
      title: 'Interactive Lab Session',
      contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      sequenceOrder: 3,
      durationSeconds: 900,
    },
  ];
}

const ADDRESSES = [
  {
    title: 'Home',
    street: '123 MG Road, Sector 15',
    city: 'Bangalore',
    state: 'Karnataka',
    zipCode: '560001',
    country: 'India',
    phoneNumber: '9876543210',
  },
  {
    title: 'Office',
    street: '456 Cyber Park, Hitech City',
    city: 'Hyderabad',
    state: 'Telangana',
    zipCode: '500081',
    country: 'India',
    phoneNumber: '9876543211',
  },
];

// ─── MAIN ───────────────────────────────────────────────────
async function main() {
  console.log('🔑 Logging in as admin...');
  const adminToken = await login(ADMIN.email, ADMIN.password);
  console.log('✅ Admin token obtained\n');

  // ── Categories ──
  console.log('📁 Seeding categories...');
  const existingCats = await getAll('/categories', adminToken);
  const existingCatNames = new Set((existingCats?.items || []).map(c => c.name));
  const categoryMap = {};

  // Map existing categories
  for (const cat of (existingCats?.items || [])) {
    categoryMap[cat.name] = cat.categoryId;
  }

  for (const cat of CATEGORIES) {
    if (existingCatNames.has(cat.name)) {
      console.log(`   ⏭  Category "${cat.name}" already exists (id=${categoryMap[cat.name]})`);
    } else {
      const created = await api('POST', '/categories', adminToken, cat);
      if (created) {
        categoryMap[cat.name] = created.categoryId;
        console.log(`   ✅ Created category "${cat.name}" (id=${created.categoryId})`);
      }
    }
  }
  console.log(`   Total categories: ${Object.keys(categoryMap).length}\n`);

  // ── Courses ──
  console.log('📚 Seeding courses...');
  const existingCourses = await getAll('/courses', adminToken);
  const existingCourseNames = new Set((existingCourses?.items || []).map(c => c.name));
  const courseIds = [];
  const courseMap = {}; // name → { courseId, categoryId }

  // Map existing courses
  for (const c of (existingCourses?.items || [])) {
    courseMap[c.name] = { courseId: c.courseId, categoryId: c.categoryId };
    courseIds.push(c.courseId);
  }

  for (const [catName, catId] of Object.entries(categoryMap)) {
    const courses = makeCourses(catId, catName);
    for (const course of courses) {
      if (existingCourseNames.has(course.name)) {
        console.log(`   ⏭  Course "${course.name}" exists`);
        courseIds.push(courseMap[course.name]?.courseId);
      } else {
        const created = await api('POST', '/courses', adminToken, course);
        if (created) {
          courseMap[created.name] = { courseId: created.courseId, categoryId: catId };
          courseIds.push(created.courseId);
          console.log(`   ✅ Created course "${created.name}" (id=${created.courseId})`);
        }
      }
    }
  }
  const uniqueCourseIds = [...new Set(courseIds.filter(Boolean))];
  console.log(`   Total courses: ${uniqueCourseIds.length}\n`);

  // ── Kits ──
  console.log('🧰 Seeding kits...');
  const existingKits = await getAll('/kits', adminToken);
  const existingKitNames = new Set((existingKits?.items || []).map(k => k.name));
  const kitIds = [];

  // Collect existing kit IDs
  for (const k of (existingKits?.items || [])) {
    kitIds.push(k.kitId);
  }

  let kitIndex = 0;
  for (const [courseName, info] of Object.entries(courseMap)) {
    const kits = makeKits(info.courseId, courseName, info.categoryId, kitIndex++);
    for (const kit of kits) {
      if (existingKitNames.has(kit.name)) {
        console.log(`   ⏭  Kit "${kit.name}" exists`);
      } else {
        const created = await api('POST', '/kits', adminToken, kit);
        if (created) {
          kitIds.push(created.kitId);
          console.log(`   ✅ Created kit "${created.name}" (id=${created.kitId})`);
        }
      }
    }
  }
  const uniqueKitIds = [...new Set(kitIds.filter(Boolean))];
  console.log(`   Total kits: ${uniqueKitIds.length}\n`);

  // ── Course Contents ──
  console.log('🎬 Seeding course contents...');
  let contentCount = 0;
  for (const courseId of uniqueCourseIds.slice(0, 15)) {
    // Check if contents already exist
    const existing = await api('GET', `/coursecontents/${courseId}`, adminToken);
    if (Array.isArray(existing) && existing.length > 0) {
      console.log(`   ⏭  Course ${courseId} already has ${existing.length} contents`);
      continue;
    }
    const contents = makeContents(courseId);
    for (const content of contents) {
      const created = await api('POST', '/coursecontents', adminToken, content);
      if (created) contentCount++;
    }
    console.log(`   ✅ Added 3 contents for course ${courseId}`);
  }
  console.log(`   New contents created: ${contentCount}\n`);

  // ── Customer data ──
  console.log('🔑 Logging in as customer...');
  const customerToken = await login(CUSTOMER.email, CUSTOMER.password);
  console.log('✅ Customer token obtained\n');

  // Decode userId from JWT
  const payload = JSON.parse(Buffer.from(customerToken.split('.')[1], 'base64').toString());
  const userId = parseInt(payload.nameid || payload.sub || payload.UserId);
  console.log(`   Customer userId: ${userId}\n`);

  // ── Enrollments ──
  console.log('🎓 Seeding enrollments...');
  const existingEnrollments = await api('GET', '/enrollments/MyEnrollments?page=1&pageSize=100', customerToken);
  const enrolledCourseIds = new Set((existingEnrollments?.items || []).map(e => e.courseId));

  let enrollCount = 0;
  for (const courseId of uniqueCourseIds.slice(0, 5)) {
    if (enrolledCourseIds.has(courseId)) {
      console.log(`   ⏭  Already enrolled in course ${courseId}`);
      continue;
    }
    const created = await api('POST', '/enrollments', adminToken, { userId, courseId });
    if (created) {
      enrollCount++;
      console.log(`   ✅ Enrolled customer in course ${courseId}`);
    }
  }
  console.log(`   New enrollments: ${enrollCount}\n`);

  // ── Addresses ──
  console.log('🏠 Seeding addresses...');
  const existingAddresses = await api('GET', '/addresses/MyAddresses', customerToken);
  const existingAddrTitles = new Set((Array.isArray(existingAddresses) ? existingAddresses : []).map(a => a.title));

  let addrCount = 0;
  for (const addr of ADDRESSES) {
    if (existingAddrTitles.has(addr.title)) {
      console.log(`   ⏭  Address "${addr.title}" exists`);
      continue;
    }
    const created = await api('POST', '/addresses', customerToken, addr);
    if (created) {
      addrCount++;
      console.log(`   ✅ Created address "${addr.title}"`);
    }
  }
  console.log(`   New addresses: ${addrCount}\n`);

  // ── Cart items ──
  console.log('🛒 Seeding cart items...');
  // Clear cart first
  await api('DELETE', '/carts/Clear', customerToken);
  console.log('   🗑  Cart cleared');

  const kitsToAdd = uniqueKitIds.slice(0, 3);
  for (const kitId of kitsToAdd) {
    const added = await api('POST', '/carts/Add', customerToken, { kitId, quantity: 1 + (kitId % 3) });
    if (added) {
      console.log(`   ✅ Added kit ${kitId} to cart (qty: ${1 + (kitId % 3)})`);
    }
  }
  console.log('');

  // ── Orders via Checkout ──
  console.log('📦 Seeding orders via checkout...');
  const existingOrders = await api('GET', '/orders/MyOrders?page=1&pageSize=100', customerToken);
  const orderCount = existingOrders?.items?.length || 0;

  if (orderCount >= 2) {
    console.log(`   ⏭  Already have ${orderCount} orders, skipping checkout`);
  } else {
    // Add items to cart and checkout twice
    for (let i = 0; i < 2; i++) {
      // Clear and re-add items
      await api('DELETE', '/carts/Clear', customerToken);
      const batchKits = uniqueKitIds.slice(i * 2, i * 2 + 2);
      for (const kitId of batchKits) {
        await api('POST', '/carts/Add', customerToken, { kitId, quantity: 1 });
      }

      const address = `${ADDRESSES[i].street}, ${ADDRESSES[i].city}, ${ADDRESSES[i].state} ${ADDRESSES[i].zipCode}, ${ADDRESSES[i].country}`;
      const order = await api('POST', '/orders/Checkout', customerToken, address);
      if (order) {
        console.log(`   ✅ Order ${i + 1} created (id=${order.orderId}, total=₹${order.totalAmount})`);
      } else {
        console.log(`   ⚠  Order ${i + 1} failed (cart may be empty or stock depleted)`);
      }
    }
  }
  console.log('');

  // ── Re-add cart items for tests ──
  console.log('🛒 Re-adding cart items for E2E tests...');
  await api('DELETE', '/carts/Clear', customerToken);
  for (const kitId of uniqueKitIds.slice(4, 7)) {
    await api('POST', '/carts/Add', customerToken, { kitId, quantity: 2 });
    console.log(`   ✅ Added kit ${kitId} (qty: 2)`);
  }
  console.log('');

  // ── Summary ──
  console.log('═══════════════════════════════════════');
  console.log('  SEED COMPLETE');
  console.log('═══════════════════════════════════════');
  console.log(`  Categories : ${Object.keys(categoryMap).length}`);
  console.log(`  Courses    : ${uniqueCourseIds.length}`);
  console.log(`  Kits       : ${uniqueKitIds.length}`);
  console.log(`  Contents   : ${contentCount} new`);
  console.log(`  Enrollments: ${enrollCount} new (${enrolledCourseIds.size} existing)`);
  console.log(`  Addresses  : ${addrCount} new`);
  console.log(`  Orders     : ${orderCount >= 2 ? orderCount + ' existing' : '2 new'}`);
  console.log(`  Cart items : 3 kits re-added`);
  console.log('═══════════════════════════════════════\n');
}

main().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
