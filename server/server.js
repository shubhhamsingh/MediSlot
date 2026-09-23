const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("MediSlot Backend Connected!");
});

app.post("/book", (req, res) => {
  console.log("Appointment received:", req.body);

  res.status(200).json({
    success: true,
    message: "Appointment booked successfully!"
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});