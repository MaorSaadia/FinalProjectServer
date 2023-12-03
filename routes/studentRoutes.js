const express = require("express");
const authController = require("./../controllers/authController");
const studentController = require("./../controllers/studentController");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword", authController.resetPassword);

// Protect all routes after this middleware
// router.use(authController.protect);

router.patch(
  "/updateMe",
  authController.protect,
  studentController.uploadUserAvatar,
  studentController.updateMe
);
router.patch(
  "/updateMyPassword",
  authController.protect,
  authController.updatePassword
);

router.route("/").get(studentController.getAllStudents);
router
  .route("/:id")
  .get(studentController.getStudent)
  .patch(studentController.updateStudent)
  .delete(studentController.deleteStudent);
module.exports = router;
