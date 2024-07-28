import dbConfig from "../config/db";
import instance from "../config/instance";
import { insertOrUpdatePrice } from "../helpers";
import { ErrorResponse, SuccessResponse } from "../templates/response";
import { Metadata, Player } from "../types";
import { calculateTotalPoints, getRandomNumber } from "../utils";

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
    const { data } = await instance.get("/players?include=career,country");
    if (data?.constructor === Array && data.length > 0) {
      // clear players table
      const sql = `DELETE FROM players`;
      await dbConfig(sql);
      const results = await Promise.all(
        data.map(async (player: Player) => {
          const sql = `
            INSERT INTO players (id, country_id, firstname, lastname, fullname, image_path, dateofbirth, gender, battingstyle, bowlingstyle, career, country, position_id, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

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
            JSON.stringify(player.career),
            JSON.stringify(player.country),
            player.position.id,
            player.updated_at,
          ];

          return dbConfig(sql, values, true);
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

// get all players stored in db with pagination, limit and search
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
    const sql = "select id, career from players";
    const data = await dbConfig(sql);
    if (data.constructor === Array && data.length > 0) {
      const arr = data.map(async (player: any) => {
        const parsedData = JSON.parse(player.career);
        if (parsedData.length > 0) {
          const price = calculateTotalPoints(parsedData, player.id);
          const result = await insertOrUpdatePrice(player.id, price);
        } else {
          const price = getRandomNumber(10, 12);
          const result = await insertOrUpdatePrice(player.id, price);
        }
      });
      return SuccessResponse(arr, 200);
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
      `/fixtures?filter[starts_between]=${today},${targetDate}&include=venue,stage,league,visitorteam,localteam`
    );

    // const sql = ``;
    // await dbConfig()

    return SuccessResponse(data.data, 200);
  } catch (error) {
    return ErrorResponse("Something went wrong", 500);
  }
};

const fetchLineUps = async (id: string) => {
  try {
    const data = await instance.get(
      `/fixtures/${id}?include=venue,stage,season,league,visitorteam,localteam,scoreboards,lineup`
    );
    const lineup: [] = data.data.lineup;

    if (lineup.length > 0) {
      return SuccessResponse(data.data, 200);
    } else {
      const localteamId = data.data.localteam.id;
      const visitorteamId = data.data.visitorteam.id;

      const dataLocal = await instance.get(
        `teams/${localteamId}?include=squad`
      );
      const squadLocal = dataLocal.data.squad;
      const squadLocalFinal = squadLocal.map((player: any) => {
        return {
          ...player,
          lineup: {
            team_id: localteamId,
          },
        };
      });

      const dataVisitor = await instance.get(
        `teams/${visitorteamId}?include=squad`
      );
      const squadVisitor = dataVisitor.data.squad;
      const squadVisitorFinal = squadVisitor.map((player: any) => {
        return {
          ...player,
          lineup: {
            team_id: visitorteamId,
          },
        };
      });

      const combinedSquad = [...squadLocalFinal, ...squadVisitorFinal];

      return SuccessResponse({ ...data.data, lineup: combinedSquad }, 200);
    }
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
  fetchLineUps,
};
