import { Router } from "express";
import {
  fetchAllPlayers,
  fetchPoints,
  setAllPlayers,
  refreshPlayerPrice,
  fetchUpcomingMatches,
  fetchLineUps,
  fetchPreviousMatches,
} from "../services/players";

const router = Router();

router.get("/player/:id", async (req, res) => {
  const data = await fetchPoints(req.params.id);
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

router.get("/all", async (req, res) => {
  try {
    const limit = req.query.limit?.toString() || "10";
    const page = req.query.page?.toString() || "1";
    const search = req.query.search?.toString() || "";

    const data = await fetchAllPlayers(limit, page, search);
    res.send(data);
  } catch (err) {
    console.error("Error fetching players:", err);
    res
      .status(500)
      .send({ error: "An error occurred while fetching players." });
  }
});

export default router;
