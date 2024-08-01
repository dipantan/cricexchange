import { Router } from "express";
import players from "./players";
import upload from "./upload";

const router = Router();

router.use("/players", players);
router.use("/upload", upload);

export default router;
