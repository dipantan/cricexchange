import { Router } from "express";
import { ErrorResponse, SuccessResponse } from "../../templates/response";
import { UpdateProfileDto, UpdateWallet } from "./dto";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import dbConfig from "../../config/db";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const sql = `select * from user where id = ?`;
    const values = [req.body.id];
    const data = await dbConfig(sql, values);
    if (data?.constructor === Array && data.length > 0) {
      return res.send(SuccessResponse(data[0], 200));
    } else {
      return res.send(ErrorResponse("User not found", 400));
    }
  } catch (error) {
    res.send(ErrorResponse("Something went wrong", 500));
  }
});

router.put("/", async (req, res) => {
  try {
    const updateProfileDto = plainToInstance(UpdateProfileDto, req.body);

    const error = await validate(updateProfileDto);
    if (error.length > 0) {
      const err: any = error.map((err: any) => {
        return Object.values(err.constraints)[0];
      });
      return res.status(400).send(ErrorResponse(err, 400));
    }

    // check if user exists
    const user = await dbConfig("select * from user where id = ?", [
      req.body.id,
    ]);
    if (user?.constructor === Array && user.length == 0) {
      return res.status(400).send(ErrorResponse("User not found", 400));
    }

    const sql = `update user set name = ?, email = ?, dob = ?, gender = ?, address = ?, image = ? where id = ?`;
    const values = [
      updateProfileDto.name || user[0].name,
      updateProfileDto.email || user[0].email,
      updateProfileDto.dob || user[0].dob,
      updateProfileDto.gender || user[0].gender,
      updateProfileDto.address || user[0].address,
      updateProfileDto.image || user[0].image,
      req.body.id,
    ];
    const updateProfile = await dbConfig(sql, values);
    res.send(SuccessResponse("Profile updated successfully", 200));
  } catch (error) {
    console.log(error);
    res.send(ErrorResponse("Something went wrong", 500));
  }
});

router.put("/wallet", async (req, res) => {
  try {
    const updateWalletDto = plainToInstance(UpdateWallet, req.body);
    const error = await validate(updateWalletDto);
    if (error.length > 0) {
      const err: any = error.map((err: any) => {
        return Object.values(err.constraints)[0];
      });
      return res.status(400).send(ErrorResponse(err, 400));
    }

    const sql = `update user set wallet = wallet + ? where id = ?`;
    const values = [updateWalletDto.amount, req.body.id];
    const updateWallet = await dbConfig(sql, values);
    res.send(SuccessResponse("Wallet updated successfully", 200));
  } catch (error) {
    res.send(ErrorResponse("Something went wrong", 500));
  }
});

router.get("/portfolio", async (req, res) => {
  try {
    const sql = `select data, date from portfolio where user_id = ?`;
    const values = [req.body.id];
    const data = await dbConfig(sql, values);

    if (data?.constructor === Array && data.length > 0) {
      const mapped_data = data.map((item: any) => {
        return {
          ...item,
          data: JSON.parse(item.data),
        };
      });

      return res.send(SuccessResponse(mapped_data, 200));
    } else {
      return res.send(ErrorResponse("Portfolio not found", 400));
    }
  } catch (error) {
    res.send(ErrorResponse("Something went wrong", 500));
  }
});

export default router;
