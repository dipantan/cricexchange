import { plainToInstance } from "class-transformer";
import { Router } from "express";
import { LoginDto, RegisterDto } from "./dto";
import { validate } from "class-validator";
import { ErrorResponse, SuccessResponse } from "../../templates/response";
import dbConfig from "../../config/db";
import { comparePassword, generateLoginToken, hashPassword } from "../../utils";
import { ResultSetHeader } from "mysql2";
import authMiddleware from "../../middlewares/authMiddleware";
import {} from "jsonwebtoken";

const router = Router();

router.post("/login", async ({ body }, res) => {
  const loginDto = plainToInstance(LoginDto, body);
  const error = await validate(loginDto);

  if (error.length > 0) {
    const err: any = error.map((err: any) => {
      return Object.values(err.constraints)[0];
    });
    return res.status(400).send(ErrorResponse(err, 400));
  }

  // check if user exists
  const user: any = await dbConfig("select * from user where mobile = ?", [
    loginDto.mobile,
  ]);

  if (user?.constructor === Array && user.length > 0) {
    const isMatched = await comparePassword(loginDto.password, user[0].pass);
    if (isMatched) {
      // generate token
      const token = generateLoginToken({
        mobile: loginDto.mobile,
        name: user[0].name,
        id: user[0].id,
      });
      return res.send(SuccessResponse({ token }, 200));
    } else {
      return res.status(400).send(ErrorResponse("Invalid credentials", 400));
    }
  } else {
    return res.status(400).send(ErrorResponse("User not found", 400));
  }
});

router.post("/register", async ({ body }, res) => {
  try {
    const registerDto = plainToInstance(RegisterDto, body);
    const error = await validate(registerDto);

    if (error.length > 0) {
      const err: any = error.map((err: any) => {
        return Object.values(err.constraints)[0];
      });
      return res.status(400).send(ErrorResponse(err, 400));
    }

    // check if user exists
    const user: any = await dbConfig("select * from user where mobile = ?", [
      registerDto.mobile,
    ]);

    if (user?.constructor === Array && user.length > 0) {
      return res.status(400).send(ErrorResponse("User already exists", 400));
    } else {
      // insert to user table
      const sql = `insert into user (name, mobile, pass, date) values (?, ?, ?, ?)`;
      const password = await hashPassword(registerDto.password);
      const values = [
        registerDto.name,
        registerDto.mobile,
        password,
        new Date().toISOString(),
      ];
      const data = await dbConfig(sql, values, true);

      // Cast result to ResultSetHeader for type-checking
      const { affectedRows, insertId } = data as ResultSetHeader;

      await dbConfig(
        `insert into portfolio (user_id, data, date) values (?, CAST('[]' AS JSON), ?)`,
        [insertId, new Date().toISOString()],
        true
      );

      if (affectedRows > 0) {
        return res.send(SuccessResponse("User registered successfully", 200));
      } else {
        return res.send(ErrorResponse("Something went wrong", 500));
      }
    }
  } catch (error) {
    console.log(error);
    res.send(ErrorResponse("Something went wrong", 500));
  }
});

// router.post("/logout", authMiddleware, async ({ body }, res) => {
//   try {
//     const { token } = body;
//     console.log(token);
//   } catch (error) {
//     res.send(ErrorResponse("Something went wrong", 500));
//   }
// });

export default router;
