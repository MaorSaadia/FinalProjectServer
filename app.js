const path = require("path");
const express = require("express");
const cors = require("cors");
const favicon = require("serve-favicon");

const studentRouter = require("./routes/studentRoutes.js");
const apartmentRouter = require("./routes/apartmentRoutes.js");
const AppError = require("./utils/appError.js");
const globalErrorHandler = require("./controllers/errorController.js");

const app = express();

app.use(express.json());
app.use(
  cors({
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
  })
);
app.use(favicon(path.join(__dirname, "public", "favicon.ico")));

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => {
  res.send("Server is Live");
});

app.use((req, res, next) => {
  res.requestTime = new Date().toISOString();
  next();
});

app.use("/api/v1/apartments", apartmentRouter);
app.use("/api/v1/students", studentRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
