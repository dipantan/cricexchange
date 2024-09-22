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

    if (Number(user[0].wallet) < totalPrice) {
      return res.status(400).send(ErrorResponse("Insufficient balance", 400));
    }

    // check if player id exists in portfolio data json column
    const sqlPortfolio = `select data from portfolio where user_id = ?`;
    const portfolio = await dbConfig(sqlPortfolio, [body.id]);

    const existingPlayer: any = portfolio[0]?.data.find((row: any) => {
      if (Object.keys(row).length === 0) return false;

      return row.player_id == checkOutDto.player_id;
    });

    // generate order id based on user_id and current datetime
    const order_id = `ORD${body.id}${new Date().getTime()}`;

    if (existingPlayer) {
      existingPlayer.order_id += `,${order_id}`;
      existingPlayer.quantity += checkOutDto.quantity;
      existingPlayer.total_price += checkOutDto.quantity * playerPrice;

      const total_array = portfolio[0].data?.map((row: any) => {
        if (row.player_id == checkOutDto.player_id) {
          return existingPlayer;
        } else {
          return row;
        }
      });

      await dbConfig(
        `update portfolio set data = CAST (? AS JSON) where user_id = ?`,
        [JSON.stringify(total_array), body.id],
        true
      );
    } else {
      delete checkOutDto.id;

      // update portfolio table
      await dbConfig(
        `update portfolio set data = JSON_ARRAY_APPEND(data, '$', CAST(? AS JSON)) where user_id = ?`,
        [
          {
            ...checkOutDto,
            order_id,
            total_price: totalPrice,
          },
          body.id,
        ],
        true
      );
    }

    // insert to order table
    const sql = `insert into orders (user_id, order_id, data, date) values (?, ?, ?, ?)`;
    const values = [
      body.id,
      order_id,
      JSON.stringify({
        quantity: checkOutDto.quantity,
        player_id: checkOutDto.player_id,
        amount: totalPrice,
      }),
      new Date().toISOString(),
    ];
    await dbConfig(sql, values, true); // insert to order table

    // deduct from wallet
    await dbConfig(
      `update user set wallet = wallet - ? where id = ?`,
      [totalPrice, body.id],
      true
    );

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
    res.send(ErrorResponse("Something went wrong", 500));
  }
});

router.post("/sell", async ({ body }, res) => {
  try {
    const checkOutDto = plainToInstance(CheckoutDto, body);
    const error = await validate(checkOutDto);

    if (error.length > 0) {
      const err: any = error.map((err: any) => {
        return Object.values(err.constraints)[0];
      });
      return res.status(400).send(ErrorResponse(err, 400));
    }

    const user_row = await dbConfig(
      `select data from portfolio where user_id = ?`,
      [body.id]
    );

    const user_portfolio = user_row[0].data;

    if (user_portfolio.length == 0) {
      return res.send(ErrorResponse("No data found", 400));
    }

    // find player by id
    const player = user_portfolio.find((row: any) => {
      return row.player_id == checkOutDto.player_id;
    });

    if (!player) {
      return res.send(ErrorResponse("Invalid player", 400));
    }

    //  generate order id based on user_id and current datetime
    const order_id = `ORD${body.id}${new Date().getTime()}`;

    // compare quantity
    if (player.quantity < checkOutDto.quantity) {
      return res.send(ErrorResponse("Invalid quantity", 400));
    }

    // get player current price
    const playerRow = await dbConfig(
      `select curr_price from prices where player_id = ?`,
      [checkOutDto.player_id]
    );

    const playerPrice = playerRow[0].curr_price; //player current price
    const totalPrice = checkOutDto.quantity * Number(playerPrice); //price to be added to wallet

    const GST = totalPrice * 0.18; // 18% GST
    const PLATFORM_FEE = totalPrice * 0.02; // 2% platform fee

    const TOTAL = totalPrice - (GST + PLATFORM_FEE); //final price to be added to wallet

    // add to wallet
    await dbConfig(
      `update user set wallet = wallet + ? where id = ?`,
      [TOTAL, body.id],
      true
    );

    if (player.quantity == checkOutDto.quantity) {
      // remove the object from array
      user_portfolio.splice(user_portfolio.indexOf(player), 1);
    } else {
      // update quantity
      user_portfolio[user_portfolio.indexOf(player)].quantity -=
        checkOutDto.quantity;
    }

    // update portfolio table
    await dbConfig(
      `update portfolio set data = ? where user_id = ?`,
      [user_portfolio, body.id],
      true
    );

    // insert to order table
    await dbConfig(
      `insert into orders (user_id, order_id, data, date, type) values (?, ?, CAST(? AS JSON), ?, ?)`,
      [
        body.id,
        order_id,
        JSON.stringify({
          quantity: checkOutDto.quantity,
          player_id: checkOutDto.player_id,
          amount: totalPrice,
        }),
        new Date().toISOString(),
        "sell",
      ],
      true
    );

    // insert to transactions table
    await dbConfig(
      `insert into transaction (user_id, type, date, message, amount) values (?, ?, ?, ?, ?)`,
      [body.id, "credit", new Date().toISOString(), "Order placed", TOTAL],
      true
    );

    res.send(SuccessResponse("Sell successful", 200));
  } catch (error) {
    console.log(error);

    res.send(ErrorResponse("Something went wrong", 500));
  }
});

router.get("/orders", async (req, res) => {
  try {
    const rows = await dbConfig(
      `select id, order_id, data, type, date from orders where user_id = ?`,
      [req.body.id]
    );

    if (rows.constructor === Array) {
      if (rows.length == 0) {
        return res.send(SuccessResponse([], 200));
      } else {
        const mapped_rows = await Promise.all(
          rows.map(async (row: any) => {
            const data = row.data;

            // const sql = `select curr_price from prices where player_id = ?`;
            // const price = await dbConfig(sql, [data.player_id]);

            const player_sql = `select fullname, image_path, country, position from players where id = ?`;
            const player = await dbConfig(player_sql, [data.player_id]);

            return {
              ...row,
              data: {
                ...data,
                // curr_price: price[0].curr_price,
                ...player[0],
              },
            };
          })
        );

        return res.send(SuccessResponse(mapped_rows, 200));
      }
    }

    // res.send(SuccessResponse(row, 200));
  } catch (error) {
    res.send(ErrorResponse("Something went wrong", 500));
  }
});

export default router;
