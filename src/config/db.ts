import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "3306"),
  password: process.env.DB_PASS,
  multipleStatements: true,
});

const dbConfig = async (
  sql: string,
  values: any[] = [],
  transaction = false
) => {
  
  const connection = await pool.getConnection();
  try {
    if (transaction) {
      await connection.beginTransaction(); // Start a transaction
    }
    const [rows] = await connection.execute(sql, values);
    if (transaction) {
      await connection.commit(); // Commit the transaction
    }
    return rows;
  } catch (err) {
    if (transaction) {
      await connection.rollback(); // Rollback the transaction on error
    }
    throw err;
  } finally {
    connection.release(); // Ensure connection is released
  }
};

export default dbConfig;
