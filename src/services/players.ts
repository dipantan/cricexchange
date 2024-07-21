import dbConfig from "../config/db";
import instance from "../config/instance";
import { ErrorResponse, SuccessResponse } from "../templates/response";
import { Metadata, Player } from "../types";

const fetchPoints = async (id: string) => {
  try {
    const sql = `select * from players`;
    const data = await dbConfig(sql);
    if (data?.constructor === Array && data.length > 0) {
      return data;
    } else {
      return ErrorResponse("Something went wrong", 500);
    }
  } catch (error) {
    throw error;
  }
};

// fetch all players from api and store it in database
const setAllPlayers = async () => {
  try {
    const { data } = await instance.get("/players");
    if (data?.constructor === Array && data.length > 0) {
      // clear players table
      const sql = `DELETE FROM players`;
      await dbConfig(sql);
      const results = await Promise.all(
        data.map(async (player: Player) => {
          const sql = `
            INSERT INTO players (
              id, country_id, firstname, lastname, fullname, image_path,
              dateofbirth, gender, battingstyle, bowlingstyle, position_id, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              country_id = VALUES(country_id),
              firstname = VALUES(firstname),
              lastname = VALUES(lastname),
              fullname = VALUES(fullname),
              image_path = VALUES(image_path),
              dateofbirth = VALUES(dateofbirth),
              gender = VALUES(gender),
              battingstyle = VALUES(battingstyle),
              bowlingstyle = VALUES(bowlingstyle),
              position_id = VALUES(position_id),
              updated_at = VALUES(updated_at)
          `;
          const values = [
            player.id,
            player.country_id,
            player.firstname,
            player.lastname,
            player.fullname,
            player.image_path,
            player.dateofbirth,
            player.gender,
            player.battingstyle,
            player.bowlingstyle,
            player.position.id,
            player.updated_at,
          ];
          return dbConfig(sql, values);
        })
      );
      return SuccessResponse("All players refreshed successfully", 200);
    } else {
      return ErrorResponse("Something went wrong", 500);
    }
  } catch (error) {
    console.error("Error inserting/updating players:", error);
    return ErrorResponse("Something went wrong", 500);
  }
};

const fetchAllPlayers = async (
  limit?: string,
  page?: string,
  search?: string
) => {
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
  let baseSql = "FROM players";
  const values: any[] = [];

  if (search) {
    baseSql += " WHERE fullname LIKE ? OR firstname LIKE ? OR lastname LIKE ?";
    const searchTerm = `%${search}%`;
    values.push(searchTerm, searchTerm, searchTerm);
  }

  // Count total number of players matching the search criteria
  const countSql = `SELECT COUNT(*) AS total ${baseSql}`;
  const countResult: any = await dbConfig(countSql, values);

  const total = countResult[0]?.total || 0;

  // Fetch the players with limit and offset
  const sql = `SELECT * ${baseSql} LIMIT ? OFFSET ?`;
  values.push(parseInt(limit as string), offset);

  try {
    const players = (await dbConfig(sql, values)) as Player[];
    const totalPages = Math.ceil(total / parseInt(limit as string));
    const metadata: Metadata = {
      total,
      totalPages,
      currentPage: parseInt(page as string) || 1,
      limit: parseInt(limit as string),
    };

    return { metadata, players };
  } catch (err) {
    console.error("Error fetching players:", err);
    throw err;
  }
};

const refreshPlayerPrice = async () => {
  try {
    // code to generate price for all players
    const players: any = await dbConfig("SELECT * FROM players");
    if (players?.constructor === Array && players.length > 0) {
      const results = await Promise.all(
        players.map(async (player: any) => {
          const id = player.id;
          const data = await instance.get(`/players/${id}?include=career`);
          console.log(data);
        })
      );
      return SuccessResponse("All players refreshed successfully", 200);
    }
  } catch (error) {
    return ErrorResponse("Something went wrong", 500);
  }
};

const fetchUpcomingMatches = async () => {
  try {
    const today = new Date().toISOString().split("T")[0]; // Today's date
    const targetDate = new Date(new Date().setDate(new Date().getDate() + 7)) // 7 days from today
      .toISOString()
      .split("T")[0];

    const data = await instance.get(
      `/fixtures?filter[starts_between]=${today},${targetDate}&include=venue,visitorteam,localteam`
    );

    return SuccessResponse(data.data, 200);
  } catch (error) {
    return ErrorResponse("Something went wrong", 500);
  }
};

export {
  fetchPoints,
  setAllPlayers,
  fetchAllPlayers,
  refreshPlayerPrice,
  fetchUpcomingMatches,
};
