const path = require("path");
const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const cors = require("cors");
const favicon = require("serve-favicon");

const studentRouter = require("./routes/studentRoutes.js");
const apartmentRouter = require("./routes/apartmentRoutes.js");
const chatRouter = require("./routes/chatRoutes.js");
const messageRouter = require("./routes/messageRoutes.js");
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

app.use("/api/v1/students", studentRouter);
app.use("/api/v1/apartments", apartmentRouter);
app.use("/api/v1/chats", chatRouter);
app.use("/api/v1/messages", messageRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

// socket.io
const server = http.createServer(app);
const io = new socketio.Server(server, {
  cors: {
    origin: "https://finalprojectserver0-5.onrender.com",
    credentials: true,
  },
});
let activeUsers = [];

server.listen(8800);

io.on("connection", (socket) => {
  // add new User
  socket.on("new-user-add", (newUserId) => {
    // if user is not added previously
    if (!activeUsers.some((user) => user.userId === newUserId)) {
      activeUsers.push({
        userId: newUserId,
        socketId: socket.id,
      });
    }
    // console.log("Connected Users", activeUsers);
    io.emit("get-users", activeUsers);
  });

  // send message
  socket.on("send-message", (data) => {
    const { ouid } = data;
    const user = activeUsers.find((user) => user.userId === ouid);
    // console.log("Data", data);
    // console.log(user);
    if (user) {
      io.to(user.socketId).emit("receive-message", data);
    }
  });

  socket.on("disconnect", () => {
    activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
    // console.log("User Disconnected", activeUsers);
    io.emit("get-users", activeUsers);
  });
});

module.exports = app;
