import { Router, Request, Response } from "express";
import { ErrorResponse, SuccessResponse } from "../templates/response";
import dbConfig from "../config/db";
import { ResultSetHeader } from "mysql2/promise";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const body = req.body;

    if (!body.title || !body.body) {
      return res
        .status(400)
        .send(ErrorResponse("Title and body are required", 400));
    }

    // insert to database
    const insert = (await dbConfig(
      "insert into contact_us (title,user_id,body) values (?,?,?)",
      [body.title, body.id, body.body]
    )) as ResultSetHeader;

    if (insert.affectedRows == 0) {
      return res.status(400).send(ErrorResponse("Something went wrong", 400));
    }

    res.send(SuccessResponse("Thank you for your feedback", 200));
  } catch (error) {
    res.status(500).send(ErrorResponse("Something went wrong", 500));
  }
});

export default router;
