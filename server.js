const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    name: "Blox Stock API",
    status: "online",
    version: "1.0.0"
  });
});

app.get("/api/stock", (req, res) => {
  res.json({
    success: true,
    normal: [],
    mirage: [],
    updatedAt: null
  });
});

app.listen(PORT, () => {
  console.log(`Blox Stock API rodando na porta ${PORT}`);
});