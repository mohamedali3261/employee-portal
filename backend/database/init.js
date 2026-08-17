const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// ── PostgreSQL connection from environment (with sane defaults) ──
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
  database: process.env.PGDATABASE || 'employee_portal',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

let dbReady = false;
let currentClient = null;

// ── Convert SQLite '?' placeholders to PostgreSQL '$1, $2, ...' ──
function convert(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

// ── Run a query on the transaction client (if any) or a pooled connection ──
async function runQuery(sql, params = []) {
  if (currentClient) {
    return currentClient.query(sql, params);
  }
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

// ── Run a single-row SELECT (first row or undefined) ──
async function getOne(sql, params = []) {
  const res = await runQuery(sql, params);
  return res.rows[0] || undefined;
}

// ── Run a SELECT and return all rows ──
async function getAll(sql, params = []) {
  const res = await runQuery(sql, params);
  return res.rows;
}

// ── Initialize schema (idempotent) ──
async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        employee_id TEXT UNIQUE NOT NULL,
        name_ar TEXT NOT NULL,
        name_en TEXT NOT NULL,
        job_title TEXT,
        department TEXT,
        email TEXT,
        sector TEXT,
        hire_date TEXT,
        address TEXT,
        phone TEXT,
        phone2 TEXT,
        status TEXT DEFAULT 'active',
        notes TEXT,
        profile_image TEXT,
        insurance_number TEXT,
        bank TEXT,
        bank_account TEXT,
        attendance_base TEXT,
        route TEXT,
        education TEXT,
        graduation_year TEXT,
        category TEXT,
        job_title_ar TEXT,
        job_title_en TEXT,
        employment_start TEXT,
        languages TEXT,
        documents TEXT,
        password TEXT,
        must_change_password INTEGER DEFAULT 0,
        custom_fields TEXT,
        birthdate TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        must_change_password INTEGER DEFAULT 0,
        security_question TEXT,
        security_answer TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sections (
        id SERIAL PRIMARY KEY,
        name_en TEXT NOT NULL,
        name_ar TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id SERIAL PRIMARY KEY,
        action TEXT NOT NULL,
        entity TEXT,
        entity_id INTEGER,
        details TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS custom_fields (
        id SERIAL PRIMARY KEY,
        name_en TEXT NOT NULL,
        name_ar TEXT NOT NULL,
        field_key TEXT UNIQUE NOT NULL,
        type TEXT DEFAULT 'text',
        options TEXT,
        section_id INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS profile_sections (
        id SERIAL PRIMARY KEY,
        section_key TEXT UNIQUE NOT NULL,
        name_en TEXT NOT NULL,
        name_ar TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        column_no INTEGER DEFAULT 2,
        is_builtin INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS section_fields (
        id SERIAL PRIMARY KEY,
        field_key TEXT UNIQUE NOT NULL,
        name_en TEXT NOT NULL,
        name_ar TEXT NOT NULL,
        type TEXT DEFAULT 'text',
        options TEXT,
        section_id INTEGER REFERENCES profile_sections(id) ON DELETE SET NULL,
        is_builtin INTEGER DEFAULT 0,
        is_visible INTEGER DEFAULT 1,
        required INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── Seed admin users ──
    const adminCount = await getOne('SELECT COUNT(*) AS count FROM admin_users');
    if (!adminCount || Number(adminCount.count) === 0) {
      const adminPassword = bcrypt.hashSync(process.env.ADMIN_DEFAULT_PASSWORD || 'admin123', 12);
      await client.query('INSERT INTO admin_users (username, password, role) VALUES ($1, $2, $3)', ['admin', adminPassword, 'admin']);
      const superPassword = bcrypt.hashSync('2000', 12);
      await client.query('INSERT INTO admin_users (username, password, role) VALUES ($1, $2, $3)', ['mohamed', superPassword, 'super_admin']);
    }

    // ── Seed sections ──
    const sectionCount = await getOne('SELECT COUNT(*) AS count FROM sections');
    if (!sectionCount || Number(sectionCount.count) === 0) {
      const defaultSections = [
        { name_en: 'IT', name_ar: 'تقنية المعلومات' },
        { name_en: 'HR', name_ar: 'الموارد البشرية' },
        { name_en: 'Finance', name_ar: 'المالية' },
        { name_en: 'Marketing', name_ar: 'التسويق' },
        { name_en: 'Sales', name_ar: 'المبيعات' },
        { name_en: 'Operations', name_ar: 'العمليات' },
        { name_en: 'Engineering', name_ar: 'الهندسة' },
        { name_en: 'Legal', name_ar: 'القانونية' },
      ];
      for (const s of defaultSections) {
        await client.query('INSERT INTO sections (name_en, name_ar) VALUES ($1, $2)', [s.name_en, s.name_ar]);
      }
    }

    // ── Seed profile sections ──
    const profileSectionCount = await getOne('SELECT COUNT(*) AS count FROM profile_sections');
    if (!profileSectionCount || Number(profileSectionCount.count) === 0) {
      const defaultProfileSections = [
        { key: 'personal', name_en: 'Personal Information', name_ar: 'المعلومات الشخصية', sort_order: 10, column_no: 1 },
        { key: 'contact', name_en: 'Contact Information', name_ar: 'معلومات الاتصال', sort_order: 20, column_no: 2 },
        { key: 'employment', name_en: 'Employment Details', name_ar: 'بيانات التوظيف', sort_order: 30, column_no: 2 },
        { key: 'languages', name_en: 'Languages', name_ar: 'اللغات', sort_order: 35, column_no: 2 },
        { key: 'documents', name_en: 'Documents', name_ar: 'المستندات', sort_order: 50, column_no: 2 },
        { key: 'notes', name_en: 'Notes', name_ar: 'ملاحظات', sort_order: 60, column_no: 2 },
        { key: 'custom', name_en: 'Custom Fields', name_ar: 'الحقول المخصصة', sort_order: 70, column_no: 2 },
      ];
      for (const s of defaultProfileSections) {
        await client.query(
          'INSERT INTO profile_sections (section_key, name_en, name_ar, sort_order, column_no, is_builtin) VALUES ($1, $2, $3, $4, $5, 1)',
          [s.key, s.name_en, s.name_ar, s.sort_order, s.column_no]
        );
      }
    }

    // ── Seed built-in section fields ──
    const sectionFieldCount = await getOne('SELECT COUNT(*) AS count FROM section_fields');
    if (!sectionFieldCount || Number(sectionFieldCount.count) === 0) {
      const sectionRows = await getAll('SELECT id, section_key FROM profile_sections');
      const sectionKeyToId = {};
      for (const row of sectionRows) sectionKeyToId[row.section_key] = row.id;

      const defaultSectionFields = [
        { key: 'employeeId', name_en: 'Employee ID', name_ar: 'رقم الموظف', type: 'text', section: 'personal', required: 1, sort: 10 },
        { key: 'arabicName', name_en: 'Arabic Name', name_ar: 'الاسم بالعربية', type: 'text', section: 'personal', required: 1, sort: 20 },
        { key: 'englishName', name_en: 'English Name', name_ar: 'الاسم بالإنجليزية', type: 'text', section: 'personal', required: 1, sort: 30 },
        { key: 'age', name_en: 'Age', name_ar: 'العمر', type: 'number', section: 'personal', sort: 40 },
        { key: 'education', name_en: 'Education', name_ar: 'المؤهل العلمي', type: 'text', section: 'personal', sort: 50 },
        { key: 'phone', name_en: 'Phone', name_ar: 'رقم الهاتف', type: 'text', section: 'contact', sort: 10 },
        { key: 'email', name_en: 'Email', name_ar: 'البريد الإلكتروني', type: 'text', section: 'contact', sort: 20 },
        { key: 'address', name_en: 'Address', name_ar: 'العنوان', type: 'text', section: 'contact', sort: 30 },
        { key: 'jobTitleAr', name_en: 'Job Title (Arabic)', name_ar: 'المسمى الوظيفي (عربي)', type: 'text', section: 'employment', sort: 10 },
        { key: 'jobTitleEn', name_en: 'Job Title (English)', name_ar: 'المسمى الوظيفي (إنجليزي)', type: 'text', section: 'employment', sort: 20 },
        { key: 'department', name_en: 'Department', name_ar: 'القسم', type: 'dropdown', section: 'employment', sort: 30 },
        { key: 'status', name_en: 'Employment Status', name_ar: 'حالة التوظيف', type: 'status', section: 'employment', sort: 40 },
        { key: 'sector', name_en: 'Sector', name_ar: 'القطاع', type: 'text', section: 'employment', sort: 50 },
        { key: 'hireDate', name_en: 'Hire Date', name_ar: 'تاريخ التعيين', type: 'date', section: 'employment', sort: 60 },
        { key: 'employmentStart', name_en: 'Employment Start Date', name_ar: 'تاريخ بداية العمل', type: 'date', section: 'employment', sort: 70 },
        { key: 'insuranceNumber', name_en: 'Insurance Number', name_ar: 'رقم التأمين', type: 'text', section: 'employment', sort: 80 },
        { key: 'notes', name_en: 'Notes', name_ar: 'ملاحظات', type: 'textarea', section: 'notes', sort: 10 },
      ];

      for (const f of defaultSectionFields) {
        const sectionId = sectionKeyToId[f.section];
        if (sectionId === undefined) continue;
        await client.query(
          'INSERT INTO section_fields (field_key, name_en, name_ar, type, section_id, is_builtin, is_visible, required, sort_order) VALUES ($1, $2, $3, $4, $5, 1, 1, $6, $7)',
          [f.key, f.name_en, f.name_ar, f.type, sectionId, f.required || 0, f.sort]
        );
      }
    }

    // ── Seed default employee if none exist ──
    const employeeCount = await getOne('SELECT COUNT(*) AS count FROM employees');
    if (!employeeCount || Number(employeeCount.count) === 0) {
      const employee = { employee_id: '1001', name_ar: 'محمد علي', name_en: 'Mohamed Ali', job_title: 'مدير تقنية المعلومات', department: 'IT', email: 'mohamed.ali@company.com', sector: 'تقنية المعلومات', hire_date: '2020-01-15', address: 'القاهرة, مصر', phone: '+20 100 000 0000', status: 'active', notes: 'موظف متميز', insurance_number: '123456789', bank: 'البنك الأهلي المصري', bank_account: '123456789012', attendance_base: 'مقر الشركة الرئيسي', route: 'خط المقر الرئيسي', education: 'بكالوريوس هندسة حاسبات', graduation_year: '2008' };
      const defaultHash = bcrypt.hashSync('123456', 12);
      await client.query(
        `INSERT INTO employees (employee_id, name_ar, name_en, job_title, department, email, sector, hire_date, address, phone, status, notes, insurance_number, bank, bank_account, attendance_base, route, education, graduation_year, password, must_change_password)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,1)`,
        [employee.employee_id, employee.name_ar, employee.name_en, employee.job_title, employee.department, employee.email, employee.sector, employee.hire_date, employee.address, employee.phone, employee.status, employee.notes, employee.insurance_number, employee.bank, employee.bank_account, employee.attendance_base, employee.route, employee.education, employee.graduation_year, defaultHash]
      );
    }
  } finally {
    client.release();
  }

  dbReady = true;
}

function saveDatabase() {
  // No-op: data persists automatically in PostgreSQL
}

// ── Database wrapper exposing the same API the routes expect ──
function getDatabase() {
  if (!dbReady) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }

  return {
    prepare(sql) {
      const queryText = convert(sql);
      return {
        async get(...params) {
          return getOne(queryText, params);
        },
        async all(...params) {
          return getAll(queryText, params);
        },
        async run(...params) {
          const isInsert = /^\s*insert\s/i.test(queryText);
          if (isInsert && !currentClient) {
            const client = await pool.connect();
            try {
              const res = await client.query(queryText, params);
              let lastInsertRowid = null;
              try {
                const lr = await client.query('SELECT lastval() AS id');
                lastInsertRowid = lr.rows[0] ? lr.rows[0].id : null;
              } catch (_) {
                // lastval() unavailable (e.g. INSERT with explicit id / no sequence)
              }
              return { lastInsertRowid, changes: res.rowCount || 0 };
            } finally {
              client.release();
            }
          }
          const res = await runQuery(queryText, params);
          return { lastInsertRowid: null, changes: res.rowCount || 0 };
        },
      };
    },
    async exec(sql, params = []) {
      const res = await runQuery(convert(sql), params);
      return res.rows;
    },
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        currentClient = client;
        try {
          const result = await fn();
          await client.query('COMMIT');
          return result;
        } catch (err) {
          try {
            await client.query('ROLLBACK');
          } catch (_) {
            // Transaction may already be aborted
          }
          throw err;
        } finally {
          currentClient = null;
        }
      } finally {
        client.release();
      }
    },
    getRowsModified() {
      return 0;
    },
  };
}

module.exports = { getDatabase, initDatabase, saveDatabase, pool };
