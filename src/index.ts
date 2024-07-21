import express, { Request, Response } from "express";
import "dotenv/config";
import router from "./controllers";

// Creating an Express application
const app = express();
const port = process.env.PORT || 4000; // Port number on which the server will listen

// Middleware to parse JSON requests
app.use(express.json());

// Routes
app.use("/api", router);

// Starting the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
