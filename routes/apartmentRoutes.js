const express = require("express");
const apartmentController = require("../controllers/apartmentController");

const router = express.Router();

router
  .route("/")
  .get(apartmentController.getAllApartments)
  .post(apartmentController.createApartment);

module.exports = router;
