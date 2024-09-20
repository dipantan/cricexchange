import express, { Request, Response } from "express";
import "dotenv/config";
import router from "./controllers";
import path from "path";
import "reflect-metadata";
import cron from "node-cron";
import { ErrorResponse, SuccessResponse } from "./templates/response";
import { callApiServer } from "./utils";

// Creating an Express application
const app = express();
const port = process.env.PORT || 4000; // Port number on which the server will listen

// Middleware to parse JSON requests
app.use(express.json());

// add static sources
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Routes
app.use("/api", router);

app.use("/", (req: Request, res: Response) => {
  res.status(200).send(SuccessResponse("Server is running", 200));
});

// Catch-all for 404 errors
app.use("*", (req: Request, res: Response) => {
  res.status(404).send(ErrorResponse("Page not found", 404));
});

// Starting the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

// Schedule a task to run every 14 minutes
cron.schedule("*/14 * * * *", async () => {
  await callApiServer();
});
