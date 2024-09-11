import moment from "moment";
import dbConfig from "../config/db";
import instance from "../config/instance";
import { insertOrUpdatePrice } from "../helpers";
import { ErrorResponse, SuccessResponse } from "../templates/response";
import { CartItem, Metadata, Player } from "../types";
import {
  calculateTotalPoints,
  getRandomNumber,
  getThirdPreviousMonthFirstDate,
} from "../utils";

import { allrounder, batsman, bowler, keeper } from "../resources/data";
import { ResultSetHeader } from "mysql2";

const fetchPoints = async (id: string) => {
  try {
    const sql = `select players.id, firstname, lastname, fullname, image_path, dateofbirth, gender, battingstyle, bowlingstyle, career, country, players.position, prices.curr_price, prices.updated_at from players inner join prices on players.id = prices.player_id where players.id = ?`;
    const data: any = await dbConfig(sql, [id]);
    if (data?.constructor === Array && data.length > 0) {
      const res = {
        ...data[0],
        career: JSON.parse(data[0].career),
        country: JSON.parse(data[0].country),
      };
      return SuccessResponse(res, 200);
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
      await dbConfig(sql, [], true);
      const results = await Promise.all(
        data.map(async (player: Player) => {
          const sql = `
            INSERT INTO players (id, country_id, firstname, lastname, fullname, image_path, dateofbirth, gender, battingstyle, bowlingstyle, career, country, position, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

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
            player.position,
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
    // console.error("Error inserting/updating players:", error);
    return ErrorResponse("Something went wrong", 500);
  }
};

// get all players stored in db with pagination, limit and search
const fetchAllPlayers = async (
  limit?: string,
  page?: string,
  search?: string
) => {
  try {
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    let baseSql = "FROM players";
    const values: any[] = [];

    if (search) {
      baseSql += ` WHERE fullname LIKE '%${search}%' OR firstname LIKE '%${search}%' OR lastname LIKE '%${search}%'`;
    }

    // Count total number of players matching the search criteria
    const countSql = `SELECT COUNT(*) AS total ${baseSql}`;
    const countResult: any = await dbConfig(countSql, []);

    const total = countResult[0]?.total || 0;

    // Fetch the players with limit and offset
    const sql = `SELECT id, firstname, lastname, fullname, image_path, dateofbirth, gender, battingstyle, bowlingstyle, country, position ${baseSql} LIMIT ${limit} OFFSET ${offset}`;

    const players: any = await dbConfig(sql, []);

    const totalPages = Math.ceil(total / parseInt(limit as string));
    const metadata: Metadata = {
      total,
      totalPages,
      currentPage: parseInt(page as string) || 1,
      limit: parseInt(limit as string),
    };

    const finalPlayers = players.map(
      (player: { country: string; career: string }) => {
        return {
          ...player,
          country: JSON.parse(player.country),
          // career: JSON.parse(player.career),
        };
      }
    );

    const response: any = SuccessResponse(finalPlayers, 200);
    response.metadata = metadata;
    return response;
  } catch (err) {
    console.error("Error fetching players:", err);
    throw err;
  }
};

const refreshPlayerPrice = async () => {
  try {
    // code to generate price for all players
    const sql = "SELECT id, career FROM players";
    const data = await dbConfig(sql);

    if (Array.isArray(data) && data.length > 0) {
      const promises = data.map(async (player: any) => {
        const parsedData = JSON.parse(player.career);

        let price;
        if (parsedData.length > 0) {
          price = calculateTotalPoints(parsedData, player.id);
        } else {
          price = getRandomNumber(10, 12);
        }

        const result = await insertOrUpdatePrice(player.id, price);
        return result;
      });

      const results = await Promise.all(promises);
      return SuccessResponse(results, 200);
    } else {
      return SuccessResponse([], 200); // Return an empty array if no players are found
    }
  } catch (error) {
    return ErrorResponse("Something went wrong", 500);
  }
};

const fetchUpcomingMatches = async () => {
  try {
    const today = new Date().toISOString().split("T")[0]; // Today's date
    const targetDate = new Date(new Date().setDate(new Date().getDate() + 30)) // 7 days from today
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
      const squadLocal: [] = dataLocal.data.squad;
      const squadLocalFinal = squadLocal
        .map((player: any) => {
          return {
            ...player,
            lineup: {
              team_id: localteamId,
            },
          };
        })
        .slice(0, 11);

      const dataVisitor = await instance.get(
        `teams/${visitorteamId}?include=squad`
      );
      const squadVisitor: [] = dataVisitor.data.squad;
      const squadVisitorFinal = squadVisitor
        .map((player: any) => {
          return {
            ...player,
            lineup: {
              team_id: visitorteamId,
            },
          };
        })
        .slice(0, 11);

      const combinedSquad = [...squadLocalFinal, ...squadVisitorFinal];

      return SuccessResponse({ ...data.data, lineup: combinedSquad }, 200);
    }
  } catch (error) {
    return ErrorResponse("Something went wrong", 500);
  }
};

const fetchPreviousMatches = async () => {
  try {
    const data = await instance.get(
      `/fixtures?filter[starts_between]=${getThirdPreviousMonthFirstDate()},${moment().format(
        "YYYY-MM-DD"
      )}&include=runs,venue,stage,league,visitorteam,localteam,manofseries,manofmatch,tosswon`
    );
    return SuccessResponse(data.data?.slice(0, 10), 200);
  } catch (error) {
    return ErrorResponse("Something went wrong", 500);
  }
};

const fetchSections = async () => {
  return SuccessResponse(
    {
      batsman,
      keeper,
      bowler,
      allrounder,
    },
    200
  );
};

const insertToCart = async (body: CartItem) => {
  try {
    if (body.user_id && body.player_id && body.quantity) {
      // check user_id and player_id exists
      const user = await dbConfig("select * from user where id = ?", [
        body.user_id,
      ]);
      const player = await dbConfig("select * from players where id = ?", [
        body.player_id,
      ]);
      if (
        user?.constructor === Array &&
        user.length > 0 &&
        player?.constructor === Array &&
        player.length > 0
      ) {
        // check if player and user exists increase quantity to +1
        const sqlCheck = `select * from cart where user_id = ? and player_id = ?`;
        const data = await dbConfig(sqlCheck, [body.user_id, body.player_id]);
        if (data?.constructor === Array && data.length > 0) {
          const sql = `update cart set quantity = quantity + ${body.quantity} where user_id = ? and player_id = ?`;
          const values = [body.user_id, body.player_id];
          await dbConfig(sql, values);
          return SuccessResponse(
            {
              message: "Added to cart successfully",
              payload: body,
            },
            200
          );
        } else {
          const sql = `insert into cart (user_id,player_id,quantity) values (?,?,?)`;
          const values = [body.user_id, body.player_id, body.quantity];
          await dbConfig(sql, values);
          return SuccessResponse(
            {
              message: "Added to cart successfully",
              payload: body,
            },
            200
          );
        }
      } else {
        // clear cart if user or player not found
        const sql = `delete from cart where user_id = ? and player_id = ?`;
        const values = [body.user_id, body.player_id];
        await dbConfig(sql, values);
        return ErrorResponse("Something went wrong", 500);
      }
    } else {
      return ErrorResponse("Something went wrong", 500);
    }
  } catch (error) {
    console.log(error);
    return ErrorResponse("Something went wrong", 500);
  }
};

const getCart = async ( user_id: number ) => {
  try {
    if (user_id) {
      const sql = `SELECT
        cart.id,
        cart.quantity,
        cart.DATE,
        players.firstname,
        players.lastname,
        players.image_path,
        players.country,
        players.id as player_id,
        prices.curr_price
        FROM
            cart
        INNER JOIN players ON players.id = cart.player_id
        INNER JOIN prices ON prices.player_id = cart.player_id
        WHERE
        cart.user_id = ?;
      `;
      const data = await dbConfig(sql, [user_id]);
      return SuccessResponse(data, 200);
    } else {
      return ErrorResponse("Something went wrong", 500);
    }
  } catch (error) {
    return ErrorResponse("Something went wrong", 500);
  }
};

const updateCart = async (body: { id: number; quantity: number }) => {
  try {
    const { id, quantity } = body;
    const sql = `update cart set quantity = ? where id = ?`;
    const values = [quantity, id];
    const data: any = await dbConfig(sql, values);

    console.log(data.constructor);

    if (data?.affectedRows > 0) {
      return SuccessResponse(
        {
          message: "Updated successfully",
          payload: body,
        },
        200
      );
    } else {
      return ErrorResponse("Something went wrong", 500);
    }
  } catch (error) {
    console.log(error);

    return ErrorResponse("Something went wrong", 500);
  }
};

const deleteCart = async (body: { id: number }) => {
  try {
    const { id } = body;
    const sql = `delete from cart where id = ?`;
    const data = await dbConfig(sql, [id]);
    if (data?.constructor === Array && data.length > 0) {
      return SuccessResponse("Deleted successfully", 200);
    } else {
      return ErrorResponse("Something went wrong", 500);
    }
  } catch (error) {
    console.log(error);
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
  fetchPreviousMatches,
  fetchSections,
  insertToCart,
  getCart,
  updateCart,
  deleteCart,
};
