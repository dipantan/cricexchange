import dbConfig from "../config/db";

export const insertOrUpdatePrice = async (id: any, price: any) => {
  try {
    const sql = `select * from prices where player_id = ?`;
    const data = await dbConfig(sql, [id]);
    if (data?.constructor === Array && data.length > 0) {
      const sql = `update prices set curr_price = ? where player_id = ?`;
      await dbConfig(sql, [price, id]);
      return true;
    } else {
      const sql = `insert into prices (player_id, curr_price) values (?, ?)`;
      await dbConfig(sql, [id, price]);
      return true;
    }
  } catch (error) {
    throw error;
  }
};
