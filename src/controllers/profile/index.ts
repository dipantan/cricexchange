import { Router } from "express";
import { ErrorResponse, SuccessResponse } from "../../templates/response";
import { PostWithdraw, UpdateProfileDto, UpdateWallet } from "./dto";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import dbConfig from "../../config/db";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const sql = `select id,name,email,image,dob,gender,address,wallet,mobile,refer_code from user where id = ?`;
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
    const sql = `select data from portfolio where user_id = ?`;
    const values = [req.body.id];
    const row: any = await dbConfig(sql, values);
    if (row[0].data.length == 0) {
      return res.send(SuccessResponse([], 200));
    }

    const mapped_data = await Promise.all(
      row[0]?.data?.map(async (column: any) => {
        delete column.token;
        const player_id = column.player_id;

        const sql = `select players.id, players.firstname, players.lastname, players.image_path, players.country, players.position, prices.curr_price from players inner join prices on players.id = prices.player_id where players.id = ?`;

        const data = await dbConfig(sql, [player_id]);
        if (data?.constructor === Array && data.length > 0) {
          column.player_details = data[0];
        }

        return column;
      })
    );

    return res.send(SuccessResponse(mapped_data, 200));
  } catch (error) {
    console.log(error);
    res.send(ErrorResponse("Something went wrong", 500));
  }
});

router.get("/wallet", async (req, res) => {
  try {
    const { type } = req.query;

    if (!type) {
      const row = await dbConfig(
        `select * from transaction where user_id = ?`,
        [req.body.id]
      );
      return res.send(SuccessResponse(row, 200));
    } else if (type !== "credit" && type !== "debit") {
      throw new Error("Type can be only credit or debit");
    } else {
      const row = await dbConfig(
        `select * from transaction where user_id = ? and type = ?`,
        [req.body.id, type]
      );
      return res.send(SuccessResponse(row, 200));
    }
  } catch (error) {
    res.send(ErrorResponse(error.message || "Something went wrong", 500));
  }
});

router.post("/withdraw", async (req, res) => {
  try {
    const withdrawDto = plainToInstance(PostWithdraw, req.body);
    const error = await validate(withdrawDto);
    if (error.length > 0) {
      const err: any = error.map((err: any) => {
        return Object.values(err.constraints)[0];
      });
      return res.status(400).send(ErrorResponse(err, 400));
    }

    // check if amount is greater than user wallet
    const user = await dbConfig("select * from user where id = ?", [
      req.body.id,
    ]);
    if (user[0].wallet < withdrawDto.amount) {
      return res.status(400).send(ErrorResponse("Insufficient balance", 400));
    }

    const insertWithdrawal = await dbConfig(
      `insert into withdrawal_requests (user_id, amount, date) values (?, ?, ?)`,
      [req.body.id, withdrawDto.amount, new Date().toISOString()],
      true
    );

    const updateWallet = await dbConfig(
      `update user set wallet = wallet - ? where id = ?`,
      [withdrawDto.amount, req.body.id],
      true
    );

    const insertTransaction = await dbConfig(
      `insert into transaction (user_id, type, date, message, amount) values (?, ?, ?, ?, ?)`,
      [
        req.body.id,
        "debit",
        new Date().toISOString(),
        "Withdrawal request",
        withdrawDto.amount,
      ],
      true
    );

    res.send(SuccessResponse("Withdrawal request sent successfully", 200));
  } catch (error) {
    res.send(ErrorResponse(error.message || "Something went wrong", 500));
  }
});

export default router;
