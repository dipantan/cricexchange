import { Router, Request, Response } from "express";
import { ErrorResponse, SuccessResponse } from "../templates/response";
import dbConfig from "../config/db";
import { ResultSetHeader } from "mysql2/promise";
import { log } from "node:console";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const body = req.body;

    if (!body.name || !body.email || !body.query) {
      return res
        .status(400)
        .send(ErrorResponse("Name, email and query are required", 400));
    }

    // email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return res.status(400).send(ErrorResponse("Invalid email", 400));
    }

    // insert to database
    const insert = (await dbConfig(
      "insert into contact_us (name,email,query,user_id) values (?,?,?,?)",
      [body.name, body.email, body.query, body.id]
    )) as ResultSetHeader;

    if (insert.affectedRows == 0) {
      return res.status(400).send(ErrorResponse("Something went wrong", 400));
    }

    res.send(SuccessResponse("Thank you for your feedback", 200));
  } catch (error) {
    console.log(error);
    
    res.status(500).send(ErrorResponse("Something went wrong", 500));
  }
});

export default router;
