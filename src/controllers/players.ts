import { Router } from "express";
import {
  fetchAllPlayers,
  fetchPoints,
  setAllPlayers,
  refreshPlayerPrice,
  fetchUpcomingMatches,
  fetchLineUps,
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
  const data = await fetchAllPlayers(
    req.query.limit?.toString() || "10",
    req.query.page?.toString() || "1"
  );
  res.send(data);
});

export default router;
