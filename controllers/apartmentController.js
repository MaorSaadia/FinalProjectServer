exports.getAllApartments = (req, res) => {
  res.status(200).json({
    status: "success",
    name: "apartment name",
  });
};

exports.createApartment = (req, res) => {
  res.send("Done");
};
