const Message = require("../models/messageModal");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.addMessage = catchAsync(async (req, res, next) => {
  const { chatId, senderId, text } = req.body;

  const message = new Message({
    chatId,
    senderId,
    text,
  });
  const result = await message.save();
  res.status(200).json(result);
});

exports.getMessage = catchAsync(async (req, res, next) => {
  const { chatId } = req.params;

  const result = await Message.find({ chatId });

  if (!result) {
    return next(new AppError("לא נמצא צ'אט", 404));
  }

  res.status(200).json(result);
});
