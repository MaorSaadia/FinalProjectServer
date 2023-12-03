const multer = require("multer");
const cloudinary = require("cloudinary");

const AppError = require("../utils/appError");
const Student = require("../models/studentModel");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");
const { getDataUri } = require("../utils/features");

const multerStorage = multer.memoryStorage({
  destination: (req, file, cb) => {
    cb(null, "public/img/users");
  },
  filename: (req, file, cb) => {
    // user-543gfgfgf-43656565.jpg
    const ext = file.mimetype.split("/")[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  },
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else cb(new AppError("ניתן לעלות רק תמונות!", 400), false);
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserAvatar = upload.single("avatar");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllStudents = catchAsync(async (req, res, next) => {
  const students = await Student.find();
  res.status(200).json({
    // status: "success",
    results: students.length,
    data: {
      students,
    },
  });
});

exports.getStudent = factory.getOne(Student);

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError("This route is not for password updates", 400));
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filterdedBody = filterObj(
    req.body,
    "name",
    "age",
    "academic",
    "department",
    "yearbook",
    "email"
  );

  if (req.file) {
    const file = getDataUri(req.file);

    if (req.user.avatar.public_id) {
      await cloudinary.v2.uploader.destroy(req.user.avatar.public_id);
    }

    const uploadToCloud = await cloudinary.v2.uploader.upload(file.content);
    filterdedBody.avatar = {
      public_id: uploadToCloud.public_id,
      url: uploadToCloud.secure_url,
    };
  }

  // 3) Update student document
  const updatedStudent = await Student.findByIdAndUpdate(
    req.user.id,
    filterdedBody,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: "success",
    data: {
      updatedStudent,
    },
  });
});

exports.updateStudent = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined!",
  });
};

exports.deleteStudent = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined!",
  });
};
