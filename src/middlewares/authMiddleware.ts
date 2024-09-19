import { Request, Response, NextFunction } from "express";
import { ErrorResponse } from "../templates/response";
import { verifyLoginToken } from "../utils";
import dbConfig from "../config/db";

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .send(ErrorResponse("Unauthorized: No token provided", 401));
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = verifyLoginToken(token) as { id: string; mobile: string }; // Adjust type based on your token structure

    const sql = `select * from user where mobile = ?`;
    const values = [decoded.mobile];

    const user = await dbConfig(sql, values);
    if (user.constructor === Array && user.length == 0) {
      return res
        .status(401)
        .send(ErrorResponse("Unauthorized: User does not exist", 401));
    }

    req.body.token = token;
    req.body.id = decoded.id;
    next();
  } catch (err: any) {
    return res
      .status(401)
      .send(ErrorResponse(err?.message || "Unauthorized: Invalid token", 401));
  }
};

export default authMiddleware;
