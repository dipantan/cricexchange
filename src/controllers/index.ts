import { Router } from "express";
import players from "./players";
import upload from "./upload";
import checkout from "./checkout";
import auth from "./auth";
import profile from "./profile";
import authMiddleware from "../middlewares/authMiddleware";

const router = Router();

router.use("/auth", auth);

router.use("/players", authMiddleware, players);
router.use("/upload", authMiddleware, upload);
router.use("/checkout", authMiddleware, checkout);
router.use("/profile", authMiddleware, profile);

export default router;
