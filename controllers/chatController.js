const Chat = require("../models/chatModal");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.createChat = catchAsync(async (req, res, next) => {
  const newChat = new Chat({
    members: [req.body.senderId, req.body.receiverId],
  });

  const result = await newChat.save();
  res.status(200).json(result);
});

exports.userChats = catchAsync(async (req, res, next) => {
  //   try {
  //     const chat = await Chat.find({
  //       members: { $in: [req.params.userId] },
  //     });
  //     res.status(200).json(chat);
  //   } catch (err) {
  //     return next(new AppError(err.message, 500));
  //   }

  const chat = await Chat.find({
    members: { $in: [req.params.userId] },
  });
  res.status(200).json(chat);
});

exports.findChat = catchAsync(async (req, res, next) => {
  const chat = await Chat.findOne({
    members: { $all: [req.params.firstId, req.params.secondId] },
  });
  res.status(200).json(chat);
});
