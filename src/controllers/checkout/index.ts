import { Router } from "express";
import { ErrorResponse, SuccessResponse } from "../../templates/response";
import { CheckoutDto } from "./dto";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import dbConfig from "../../config/db";

const router = Router();

router.post("/", async ({ body }, res) => {
  try {
    const checkOutDto = plainToInstance(CheckoutDto, body);
    const error = await validate(checkOutDto);

    if (error.length > 0) {
      const err: any = error.map((err: any) => {
        return Object.values(err.constraints)[0];
      });
      return res.status(400).send(ErrorResponse(err, 400));
    }

    // check if user exists
    const user = await dbConfig("select * from user where id = ?", [body.id]);
    if (user?.constructor === Array && user.length == 0) {
      return res.status(400).send(ErrorResponse("User not found", 400));
    }

    const priceArr: any = await dbConfig(
      `select curr_price from prices where player_id = ?`,
      [checkOutDto.player_id]
    );
    const playerPrice = priceArr[0]?.curr_price; //player price
    const totalPrice = checkOutDto.quantity * playerPrice; //price to be deducted from wallet

    // console.log(Number(user[0].wallet), totalPrice);

    if (Number(user[0].wallet) < totalPrice) {
      return res.status(400).send(ErrorResponse("Insufficient balance", 400));
    }

    // generate order id based on user_id and current datetime
    const order_id = `ORD${body.id}${new Date().getTime()}`;

    // insert to order table
    const sql = `insert into orders (user_id, order_id, data, date) values (?, ?, ?, ?)`;
    const values = [
      body.id,
      order_id,
      JSON.stringify({
        ...checkOutDto,
      }),
      new Date().toISOString(),
    ];

    // update portfolio table
    await dbConfig(
      `update portfolio set data = JSON_ARRAY_APPEND(data, '$', ?) where user_id = ?`,
      [
        JSON.stringify({
          ...checkOutDto,
          order_id,
          total_price: totalPrice,
          player_price: playerPrice,
        }),
        body.id,
      ],
      true
    );

    await dbConfig(sql, values, true); // insert to order table
    await dbConfig(
      `update user set wallet = wallet - ? where id = ?`,
      [totalPrice, body.id],
      true
    ); // deduct from wallet

    // insert to transactions table
    await dbConfig(
      `insert into transaction (user_id, type, date, message, amount) values (?, ?, ?, ?, ?)`,
      [body.id, "debit", new Date().toISOString(), "Order placed", totalPrice],
      true
    );

    return res.send(SuccessResponse("Checkout successful", 200));
    // if (data?.constructor === Array && data.length > 0) {
    //   // delete cart based on user_id
    //   const sql = `delete from cart where user_id = ?`;
    //   await dbConfig(sql, [body.id]);
    //   return res.send(SuccessResponse("Checkout successful", 200));
    // } else {
    //   return res.send(ErrorResponse("Something went wrong", 500));
    // }
  } catch (error) {
    console.log(error);
    res.send(ErrorResponse("Something went wrong", 500));
  }
});

export default router;
