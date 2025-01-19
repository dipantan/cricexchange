import { Router } from "express";
import {
  fetchAllPlayers,
  fetchPoints,
  setAllPlayers,
  refreshPlayerPrice,
  fetchUpcomingMatches,
  fetchLineUps,
  fetchPreviousMatches,
  fetchSections,
  insertToCart,
  getCart,
  updateCart,
  deleteCart,
} from "../services/players";
import { ErrorResponse, SuccessResponse } from "../templates/response";
import dbConfig from "../config/db";

const router = Router();

router.get("/player/:id", async (req, res) => {
  const data = await fetchPoints(req);
  res.send(data);
});

router.get("/upcoming", async (req, res) => {
  const data = await fetchUpcomingMatches();
  res.send(data);
});

router.get("/previous", async (req, res) => {
  const data = await fetchPreviousMatches();
  res.send(data);
});

router.get("/upcoming/:id", async (req, res) => {
  const param = req.params.id;
  const data = await fetchLineUps(param);
  res.send(data);
});

router.get("/admin/refreshPlayerData", async (req, res) => {
  const data = await setAllPlayers();
  res.send(data);
});

router.get("/admin/refreshPlayerPrice", async (req, res) => {
  const data = await refreshPlayerPrice();
  res.send(data);
});

router.post("/cart", async (req, res) => {
  const data = await insertToCart(req.body);
  res.send(data);
});

router.get("/cart", async (req, res) => {
  const user_id = Number(req.body.id);
  if (!user_id || isNaN(user_id))
    return res.status(400).send(ErrorResponse("Missing user_id", 400));
  const data = await getCart(user_id);
  res.send(data);
});

router.put("/cart", async (req, res) => {
  const data = await updateCart(req.body);
  res.send(data);
});

router.delete("/cart", async (req, res) => {
  const data = await deleteCart(req.body);
  res.send(data);
});

router.get("/all", async (req, res) => {
  try {
    const limit = req.query.limit?.toString() || "10";
    const page = req.query.page?.toString() || "1";
    const search = req.query.search?.toString() || "";

    const data = await fetchAllPlayers(limit, page, search);
    res.send(data);
  } catch (err) {
    res
      .status(500)
      .send({ error: "An error occurred while fetching players." });
  }
});

router.get("/top_players", async (req, res) => {
  try {
    const row = await dbConfig(`
      select top_players.id,players.firstname, players.lastname, players.position, top_players.player_id, top_players.type, top_players.date, players.fullname, players.image_path, players.country, players.gender, prices.curr_price from top_players inner join players on top_players.player_id = players.id inner join prices on top_players.player_id = prices.player_id 
      `);
    return res.send(SuccessResponse(row, 200));
  } catch (error) {
    console.log(error);
    res.send(ErrorResponse("Something went wrong", 500));
  }
});

router.get("/recommended_players", async (req, res) => {
  try {
    const row = await dbConfig(`
      select recommended_players.id, recommended_players.player_id, players.position, players.fullname, players.image_path, players.country, players.gender, prices.curr_price from recommended_players inner join players on recommended_players.player_id = players.id  inner join prices on recommended_players.player_id = prices.player_id
      `);
    return res.send(SuccessResponse(row, 200));
  } catch (error) {
    console.log(error);
    res.send(ErrorResponse("Something went wrong", 500));
  }
});

router.get("/section", async (req, res) => {
  const data = await fetchSections();
  res.send(data);
});

export default router;
