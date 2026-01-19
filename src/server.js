const cors = require("cors");

("use strict");

const express = require("express");
require("dotenv").config();

const connectDB = require("./config/db");
const bookingRoutes = require("./routes/bookingRoutes");

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/api", bookingRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server running" });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
};

startServer();
