import { Router } from "express";
import players from "./players";

const router = Router();

router.use("/players", players);

export default router;
