const jwt = require("jsonwebtoken");
const { promisify } = require("util");

const Student = require("./../models/studentModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const Email = require("../utils/email");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  // Remove the password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const { userType } = req.body;
  if (userType === "student") {
    // Check if any of the required fields are empty
    const requiredFields = [
      "name",
      "age",
      "academic",
      "department",
      "yearbook",
      "gender",
      "email",
      "password",
      "passwordConfirm",
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return next(new AppError("יש למלא את כל השדות", 400));
      }
    }

    const newStudent = await Student.create({
      name: req.body.name,
      age: req.body.age,
      academic: req.body.academic,
      department: req.body.department,
      yearbook: req.body.yearbook,
      gender: req.body.gender,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });

    createSendToken(newStudent, 200, res);
  }
});

exports.login = catchAsync(async (req, res, next) => {
  const { userType, email, password } = req.body;

  let User = userType;

  if (userType === "student") {
    User = Student;
  }

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError("אנא ספק אימייל וסיסמה", 400));
  }

  // 2) Check if student exists && password is correct
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("אימייל או סיסמה שגויים", 401));
  }

  // 3) If everything ok, send token to client
  createSendToken(user, 200, res);
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { userType, email } = req.body;
  let User = userType;

  const requiredFields = ["email"];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      return next(new AppError("יש למלא אימייל", 400));
    }
  }

  let re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!re.test(email)) {
    return next(new AppError("אנא ספק אימייל חוקי", 400));
  }

  if (userType === "student") {
    User = Student;
  }

  // 1) Get user based on POSTED email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("אין משתמש עם כתובת אימייל זו", 404));
  }

  const randomNumber = Math.random() * (999999 - 100000) + 100000;
  const OTP = Math.floor(randomNumber);
  const otpExpire = 10 * 60 * 1000;

  user.otp = OTP;
  user.otpExpire = new Date(Date.now() + otpExpire);
  console.log("OTP: ", OTP);

  await user.save({ validateBeforeSave: false });
  try {
    await new Email(user, OTP).sendPasswordReset();

    res.status(200).json({
      status: "success",
      message: "OTP sent to email!",
    });
  } catch (err) {
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError("הייתה שגיאה בשליחת האימייל. נסה שוב מאוחר יותר!", 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { userType, otp, password } = req.body;

  let User = userType;

  if (userType === "student") {
    User = Student;
  }

  const user = await User.findOne({
    otp,
    otpExpire: {
      $gt: Date.now(),
    },
  });

  if (!user) {
    return next(new AppError("קוד האימות לא תקין או לא בתוקף", 400));
  }

  if (!password) {
    return next(new AppError("יש למלא סיסמה חדשה", 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.otp = undefined;
  user.otpExpire = undefined;

  await user.save();

  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError("אתה לא מחובר! אנא היכנס כדי לקבל גישה", 401));
  }
  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await Student.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError("המשתמש זה אינו קיים יותר!", 401));
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError("משתמש שינה לאחרונה סיסמה! נא להיכנס שוב", 401));
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { userType } = req.body;
  let User = userType;

  if (userType === "student") {
    User = Student;
  }

  // 1) Get student from collection
  const user = await User.findById(req.user.id).select("+password");

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("הסיסמה הנוכחית שלך שגויה", 401));
  }

  // 3) if so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});
