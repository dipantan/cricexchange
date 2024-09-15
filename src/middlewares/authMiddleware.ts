import { Request, Response } from "express";
import { ErrorResponse } from "../templates/response";
import { verifyLoginToken } from "../utils";

const authMiddleware = (req: Request, res: Response, next: () => void) => {
  if (!req.headers.authorization) {
    return res.status(401).send(ErrorResponse("Unauthorized", 401));
  }

  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded: any = verifyLoginToken(token);
    req.body.id = decoded.id;
    next();
  } catch (err: any) {
    return res.status(401).send(ErrorResponse(err?.message, 401));
  }
};

export default authMiddleware;
