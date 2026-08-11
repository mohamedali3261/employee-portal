const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'employees.db');
let sqlDb = null;
let dbReady = false;
let inTransaction = false;

async function initDatabase() {
  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    sqlDb = new SQL.Database(fileBuffer);
  } else {
    sqlDb = new SQL.Database();
  }

  sqlDb.run('PRAGMA foreign_keys = ON');

  sqlDb.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add new columns if they don't exist (for existing databases)
  const newColumns = [
    'category TEXT',
    'insurance_number TEXT',
    'bank TEXT',
    'bank_account TEXT',
    'attendance_base TEXT',
    'route TEXT',
    'education TEXT',
    'graduation_year TEXT',
    'job_title_ar TEXT',
    'job_title_en TEXT',
    'employment_start TEXT',
    'languages TEXT',
    'documents TEXT',
    'password TEXT',
    'must_change_password INTEGER DEFAULT 0',
    'email TEXT',
    'sector TEXT',
    'hire_date TEXT',
    'address TEXT',
    'custom_fields TEXT',
    'age INTEGER'
  ];

  for (const col of newColumns) {
    const colName = col.split(' ')[0];
    try {
      sqlDb.run(`ALTER TABLE employees ADD COLUMN ${col}`);
    } catch (e) {
      // Column already exists, ignore
    }
  }

  sqlDb.run(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      must_change_password INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try { sqlDb.run(`ALTER TABLE admin_users ADD COLUMN role TEXT DEFAULT 'admin'`); } catch(e) {}
  try { sqlDb.run(`ALTER TABLE admin_users ADD COLUMN must_change_password INTEGER DEFAULT 0`); } catch(e) {}
  try { sqlDb.run(`ALTER TABLE admin_users ADD COLUMN security_question TEXT`); } catch(e) {}
  try { sqlDb.run(`ALTER TABLE admin_users ADD COLUMN security_answer TEXT`); } catch(e) {}

  sqlDb.run(`
    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  sqlDb.run(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity TEXT,
      entity_id INTEGER,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  sqlDb.run(`
    CREATE TABLE IF NOT EXISTS custom_fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      field_key TEXT UNIQUE NOT NULL,
      type TEXT DEFAULT 'text',
      options TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try { sqlDb.run(`ALTER TABLE custom_fields ADD COLUMN type TEXT DEFAULT 'text'`); } catch(e) {}
  try { sqlDb.run(`ALTER TABLE custom_fields ADD COLUMN options TEXT`); } catch(e) {}
  try { sqlDb.run(`ALTER TABLE custom_fields ADD COLUMN section_id INTEGER`); } catch(e) {}

  sqlDb.run(`
    CREATE TABLE IF NOT EXISTS profile_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_key TEXT UNIQUE NOT NULL,
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      column_no INTEGER DEFAULT 2,
      is_builtin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try { sqlDb.run(`ALTER TABLE profile_sections ADD COLUMN sort_order INTEGER DEFAULT 0`); } catch(e) {}
  try { sqlDb.run(`ALTER TABLE profile_sections ADD COLUMN column_no INTEGER DEFAULT 2`); } catch(e) {}
  try { sqlDb.run(`ALTER TABLE profile_sections ADD COLUMN is_builtin INTEGER DEFAULT 0`); } catch(e) {}

  sqlDb.run(`
    CREATE TABLE IF NOT EXISTS section_fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      field_key TEXT UNIQUE NOT NULL,
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      type TEXT DEFAULT 'text',
      options TEXT,
      section_id INTEGER,
      is_builtin INTEGER DEFAULT 0,
      is_visible INTEGER DEFAULT 1,
      required INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (section_id) REFERENCES profile_sections(id) ON DELETE SET NULL
    )
  `);

  try { sqlDb.run(`ALTER TABLE section_fields ADD COLUMN options TEXT`); } catch(e) {}
  try { sqlDb.run(`ALTER TABLE section_fields ADD COLUMN section_id INTEGER`); } catch(e) {}
  try { sqlDb.run(`ALTER TABLE section_fields ADD COLUMN is_builtin INTEGER DEFAULT 0`); } catch(e) {}
  try { sqlDb.run(`ALTER TABLE section_fields ADD COLUMN is_visible INTEGER DEFAULT 1`); } catch(e) {}
  try { sqlDb.run(`ALTER TABLE section_fields ADD COLUMN required INTEGER DEFAULT 0`); } catch(e) {}
  try { sqlDb.run(`ALTER TABLE section_fields ADD COLUMN sort_order INTEGER DEFAULT 0`); } catch(e) {}

  const adminResult = sqlDb.exec('SELECT id FROM admin_users WHERE username = ?', ['admin']);
  if (adminResult.length === 0 || adminResult[0].values.length === 0) {
    const hashedPassword = bcrypt.hashSync(process.env.ADMIN_DEFAULT_PASSWORD || 'admin123', 12);
    sqlDb.run('INSERT INTO admin_users (username, password, role) VALUES (?, ?, ?)', ['admin', hashedPassword, 'admin']);
  }

  const superAdminResult = sqlDb.exec('SELECT id FROM admin_users WHERE username = ?', ['mohamed']);
  if (superAdminResult.length === 0 || superAdminResult[0].values.length === 0) {
    const hashedSuperPassword = bcrypt.hashSync('2000', 12);
    sqlDb.run('INSERT INTO admin_users (username, password, role) VALUES (?, ?, ?)', ['mohamed', hashedSuperPassword, 'super_admin']);
  }

  // Seed sections if empty
  const sectionCount = sqlDb.exec('SELECT COUNT(*) as count FROM sections');
  const sCount = sectionCount[0]?.values[0][0] || 0;
  if (sCount === 0) {
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
    const sStmt = sqlDb.prepare('INSERT INTO sections (name_en, name_ar) VALUES (?, ?)');
    for (const s of defaultSections) {
      sStmt.run([s.name_en, s.name_ar]);
    }
    sStmt.free();
  }

  // Seed profile sections if empty (built-in sections that control the profile layout)
  const profileSectionCount = sqlDb.exec('SELECT COUNT(*) as count FROM profile_sections');
  const psCount = profileSectionCount[0]?.values[0][0] || 0;
  if (psCount === 0) {
    const defaultProfileSections = [
      { key: 'personal', name_en: 'Personal Information', name_ar: 'المعلومات الشخصية', sort_order: 10, column_no: 1 },
      { key: 'contact', name_en: 'Contact Information', name_ar: 'معلومات الاتصال', sort_order: 20, column_no: 2 },
      { key: 'employment', name_en: 'Employment Details', name_ar: 'بيانات التوظيف', sort_order: 30, column_no: 2 },
      { key: 'languages', name_en: 'Languages', name_ar: 'اللغات', sort_order: 40, column_no: 1 },
      { key: 'documents', name_en: 'Documents', name_ar: 'المستندات', sort_order: 50, column_no: 2 },
      { key: 'notes', name_en: 'Notes', name_ar: 'ملاحظات', sort_order: 60, column_no: 2 },
      { key: 'custom', name_en: 'Custom Fields', name_ar: 'الحقول المخصصة', sort_order: 70, column_no: 2 },
    ];
    const psStmt = sqlDb.prepare('INSERT INTO profile_sections (section_key, name_en, name_ar, sort_order, column_no, is_builtin) VALUES (?, ?, ?, ?, ?, 1)');
    for (const s of defaultProfileSections) {
      psStmt.run([s.key, s.name_en, s.name_ar, s.sort_order, s.column_no]);
    }
    psStmt.free();
  }

  // Seed built-in section fields if empty (fields like address, phone, email per section)
  const sectionFieldCount = sqlDb.exec('SELECT COUNT(*) as count FROM section_fields');
  const sfCount = sectionFieldCount[0]?.values[0][0] || 0;
  const sectionKeyToId = {};
  const sectionRows = sqlDb.exec('SELECT id, section_key FROM profile_sections');
  if (sectionRows.length > 0) {
    const cols = sectionRows[0].columns;
    const idIdx = cols.indexOf('id');
    const keyIdx = cols.indexOf('section_key');
    sectionRows[0].values.forEach((row) => { sectionKeyToId[row[keyIdx]] = row[idIdx]; });
  }

  const defaultSectionFields = [
    // personal
    { key: 'employeeId', name_en: 'Employee ID', name_ar: 'رقم الموظف', type: 'text', section: 'personal', required: 1, sort: 10 },
    { key: 'arabicName', name_en: 'Arabic Name', name_ar: 'الاسم بالعربية', type: 'text', section: 'personal', required: 1, sort: 20 },
    { key: 'englishName', name_en: 'English Name', name_ar: 'الاسم بالإنجليزية', type: 'text', section: 'personal', required: 1, sort: 30 },
    { key: 'age', name_en: 'Age', name_ar: 'العمر', type: 'number', section: 'personal', sort: 40 },
    { key: 'education', name_en: 'Education', name_ar: 'المؤهل العلمي', type: 'text', section: 'personal', sort: 50 },
    // contact
    { key: 'phone', name_en: 'Phone', name_ar: 'رقم الهاتف', type: 'text', section: 'contact', sort: 10 },
    { key: 'email', name_en: 'Email', name_ar: 'البريد الإلكتروني', type: 'text', section: 'contact', sort: 20 },
    { key: 'address', name_en: 'Address', name_ar: 'العنوان', type: 'text', section: 'contact', sort: 30 },
    // employment
    { key: 'jobTitleAr', name_en: 'Job Title (Arabic)', name_ar: 'المسمى الوظيفي (عربي)', type: 'text', section: 'employment', sort: 10 },
    { key: 'jobTitleEn', name_en: 'Job Title (English)', name_ar: 'المسمى الوظيفي (إنجليزي)', type: 'text', section: 'employment', sort: 20 },
    { key: 'department', name_en: 'Department', name_ar: 'القسم', type: 'dropdown', section: 'employment', sort: 30 },
    { key: 'status', name_en: 'Employment Status', name_ar: 'حالة التوظيف', type: 'status', section: 'employment', sort: 40 },
    { key: 'sector', name_en: 'Sector', name_ar: 'القطاع', type: 'text', section: 'employment', sort: 50 },
    { key: 'hireDate', name_en: 'Hire Date', name_ar: 'تاريخ التعيين', type: 'date', section: 'employment', sort: 60 },
    { key: 'employmentStart', name_en: 'Employment Start Date', name_ar: 'تاريخ بداية العمل', type: 'date', section: 'employment', sort: 70 },
    { key: 'insuranceNumber', name_en: 'Insurance Number', name_ar: 'رقم التأمين', type: 'text', section: 'employment', sort: 80 },
    // notes
    { key: 'notes', name_en: 'Notes', name_ar: 'ملاحظات', type: 'textarea', section: 'notes', sort: 10 },
  ];

  if (sfCount === 0) {
    const sfStmt = sqlDb.prepare('INSERT INTO section_fields (field_key, name_en, name_ar, type, section_id, is_builtin, is_visible, required, sort_order) VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?)');
    let builtinSort = 100;
    for (const f of defaultSectionFields) {
      const sectionId = sectionKeyToId[f.section];
      if (sectionId === undefined) continue;
      sfStmt.run([f.key, f.name_en, f.name_ar, f.type, sectionId, f.required || 0, f.sort || builtinSort++]);
    }
    sfStmt.free();
  }

  // v2/v3 migration: move built-in fields to their correct sections and
  // restore any missing built-in fields (runs once).
  const versionRow = sqlDb.exec('PRAGMA user_version');
  const currentVersion = versionRow.length > 0 ? Number(versionRow[0].values[0][0]) || 0 : 0;
  if (currentVersion < 3) {
    const sfUpsert = sqlDb.prepare(
      'INSERT INTO section_fields (field_key, name_en, name_ar, type, section_id, is_builtin, is_visible, required, sort_order) VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?)'
    );
    for (const f of defaultSectionFields) {
      const sectionId = sectionKeyToId[f.section];
      if (sectionId === undefined) continue;
      const existing = sqlDb.exec(`SELECT id FROM section_fields WHERE field_key = '${f.key}'`);
      if (existing.length === 0 || existing[0].values.length === 0) {
        sfUpsert.run([f.key, f.name_en, f.name_ar, f.type, sectionId, f.required || 0, f.sort]);
      }
    }
    sfUpsert.free();

    const sfUpdate = sqlDb.prepare('UPDATE section_fields SET section_id = ?, sort_order = ? WHERE field_key = ?');
    for (const f of defaultSectionFields) {
      const sectionId = sectionKeyToId[f.section];
      if (sectionId === undefined) continue;
      sfUpdate.run([sectionId, f.sort, f.key]);
    }
    sfUpdate.free();
    sqlDb.run('PRAGMA user_version = 3');
  }

  const countResult = sqlDb.exec('SELECT COUNT(*) as count FROM employees');
  const employeeCount = countResult[0]?.values[0][0] || 0;
  if (employeeCount === 0) {
    const employee = { employee_id: '1001', name_ar: 'محمد علي', name_en: 'Mohamed Ali', job_title: 'مدير تقنية المعلومات', department: 'IT', email: 'mohamed.ali@company.com', sector: 'تقنية المعلومات', hire_date: '2020-01-15', address: 'القاهرة, مصر', phone: '+20 100 000 0000', status: 'active', notes: 'موظف متميز', insurance_number: '123456789', bank: 'البنك الأهلي المصري', bank_account: '123456789012', attendance_base: 'مقر الشركة الرئيسي', route: 'خط المقر الرئيسي', education: 'بكالوريوس هندسة حاسبات', graduation_year: '2008' };

    const stmt = sqlDb.prepare('INSERT INTO employees (employee_id, name_ar, name_en, job_title, department, email, sector, hire_date, address, phone, status, notes, insurance_number, bank, bank_account, attendance_base, route, education, graduation_year, password, must_change_password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const defaultHash = bcrypt.hashSync('123456', 12);
    stmt.run([employee.employee_id, employee.name_ar, employee.name_en, employee.job_title, employee.department, employee.email, employee.sector, employee.hire_date, employee.address, employee.phone, employee.status, employee.notes, employee.insurance_number, employee.bank, employee.bank_account, employee.attendance_base, employee.route, employee.education, employee.graduation_year, defaultHash, 1]);
    stmt.free();
  }

  saveDatabase();
  dbReady = true;
  return sqlDb;
}

function saveDatabase() {
  if (sqlDb) {
    const data = sqlDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

function runQuery(sql, params = []) {
  sqlDb.run(sql, params);
  if (!inTransaction) {
    saveDatabase();
  }
}

function getOne(sql, params = []) {
  const result = sqlDb.exec(sql, params);
  if (result.length === 0 || result[0].values.length === 0) return null;
  const cols = result[0].columns;
  const vals = result[0].values[0];
  const row = {};
  cols.forEach((col, i) => { row[col] = vals[i]; });
  return row;
}

function getAll(sql, params = []) {
  const result = sqlDb.exec(sql, params);
  if (result.length === 0) return [];
  const cols = result[0].columns;
  return result[0].values.map(vals => {
    const row = {};
    cols.forEach((col, i) => { row[col] = vals[i]; });
    return row;
  });
}

function getDatabase() {
  if (!sqlDb || !dbReady) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return {
      prepare(sql) {
        return {
          get(...params) {
            return getOne(sql, params);
          },
          all(...params) {
            return getAll(sql, params);
          },
          run(...params) {
            sqlDb.run(sql, params);
            const lastId = getOne('SELECT last_insert_rowid() as id');
            const changes = sqlDb.getRowsModified();
            if (!inTransaction) {
              saveDatabase();
            }
            return { lastInsertRowid: lastId?.id || 0, changes };
          }
        };
      },
    exec(sql, params) {
      if (params && params.length > 0) {
        runQuery(sql, params);
      } else {
        sqlDb.exec(sql);
        if (!inTransaction) {
          saveDatabase();
        }
      }
    },
    transaction(fn) {
      return (...args) => {
        inTransaction = true;
        sqlDb.run('BEGIN TRANSACTION');
        try {
          fn(...args);
          sqlDb.run('COMMIT');
          inTransaction = false;
          saveDatabase();
        } catch (err) {
          inTransaction = false;
          try {
            sqlDb.run('ROLLBACK');
          } catch (_) {
            // Transaction may already be aborted by a failed statement
          }
          throw err;
        }
      };
    },
    getRowsModified() {
      return sqlDb.getRowsModified();
    }
  };
}

module.exports = { getDatabase, initDatabase, saveDatabase };