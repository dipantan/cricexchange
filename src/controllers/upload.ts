import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import dbConfig from "../config/db";
import { ErrorResponse, SuccessResponse } from "../templates/response";
import { verifyLoginToken } from "../utils";

// Configure storage to save with original name
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "uploads/");
  },
  filename: (req, file, callback) => {
    callback(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, callback) => {
    // Example: Filter files by type (optional)
    const ext = path.extname(file.originalname);
    if (ext !== ".jpg" && ext !== ".png" && ext !== ".jpeg") {
      return callback(new Error("Only images are allowed"));
    }
    callback(null, true);
  },
});

const router = Router();

router.post(
  "/image",
  upload.single("file"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      return res.send(ErrorResponse("File not found", 400));
    }
    const token = req.headers.authorization.split(" ")[1];
    const decoded = verifyLoginToken(token) as { id: string; mobile: string };

    try {
      const sql = `update user set image = ? where id = ?`;
      const values = [req.file?.path, decoded.id];
      await dbConfig(sql, values);
      res.send(SuccessResponse("Profile uploaded successfully", 200));
    } catch (error) {
      console.log(error);
      res.send(ErrorResponse("Something went wrong", 500));
    }
  }
);

router.get("/banner", async (req: Request, res: Response) => {
  console.log(req.body);

  try {
    const sql = `select * from banner`;
    const data = await dbConfig(sql);
    res.send(SuccessResponse(data, 200));
  } catch (error) {
    res.send(ErrorResponse("Something went wrong", 500));
  }
});

export default router;
