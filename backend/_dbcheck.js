const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");
initSqlJs().then(SQL => {
  const db = new SQL.Database(fs.readFileSync(path.join(__dirname, "database", "employees.db")));
  const r1 = db.exec("SELECT employee_id, typeof(employee_id) as t FROM employees WHERE employee_id = '1001'");
  console.log("string compare:", r1.length ? r1[0].values : "NO MATCH");
  const r2 = db.exec("SELECT employee_id, typeof(employee_id) as t FROM employees");
  console.log("all rows:", JSON.stringify(r2[0].values));
  const schema = db.exec("SELECT sql FROM sqlite_master WHERE name='employees'");
  console.log("schema:", schema[0].values[0][0]);
});
