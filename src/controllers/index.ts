import { Router } from "express";
import players from "./players";
import upload from "./upload";
import checkout from "./checkout";
import auth from "./auth";
import profile from "./profile";
import contact from "./contactUs";
import authMiddleware from "../middlewares/authMiddleware";

const router = Router();

router.use("/auth", auth);

router.use("/players", authMiddleware, players);
router.use("/upload", authMiddleware, upload);
router.use("/checkout", authMiddleware, checkout);
router.use("/profile", authMiddleware, profile);
router.use("/contact-us", authMiddleware, contact);

export default router;
