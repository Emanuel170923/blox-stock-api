const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const PARSE_API_KEY = process.env.PARSE_API_KEY;

const PARSE_STOCK_URL =
  "https://api.parse.bot/scraper/78cf8155-3819-45d0-b799-92f840a94827/get_stock";

const PARSE_FRUITS_URL =
  "https://api.parse.bot/scraper/78cf8155-3819-45d0-b799-92f840a94827/get_fruits";

let cachedStock = null;
let fruitsInfo = [];
let lastUpdate = null;

async function updateStock() {
  if (!PARSE_API_KEY) {
    throw new Error("PARSE_API_KEY não configurada no Render");
  }

  const [stockResponse, fruitsResponse] = await Promise.all([
    fetch(PARSE_STOCK_URL, {
      headers: {
        "X-API-Key": PARSE_API_KEY
      }
    }),

    fetch(PARSE_FRUITS_URL, {
      headers: {
        "X-API-Key": PARSE_API_KEY
      }
    })
  ]);

  if (!stockResponse.ok) {
    throw new Error(
      `Erro no estoque: ${stockResponse.status}`
    );
  }

  if (!fruitsResponse.ok) {
    throw new Error(
      `Erro nas frutas: ${fruitsResponse.status}`
    );
  }

  const stockData = await stockResponse.json();
  const fruitsData = await fruitsResponse.json();

  const stock = stockData.data || stockData;
  const fruits = fruitsData.data || fruitsData;

  cachedStock = stock;

  fruitsInfo = fruits.fruits || fruits || [];

  lastUpdate = new Date().toISOString();

  return cachedStock;
}

function adicionarRaridade(fruta) {
  const info = fruitsInfo.find(
    (item) =>
      item.name?.toLowerCase() ===
      fruta.name?.toLowerCase()
  );

  let rarity = null;

  if (info) {
    rarity =
      info.rarity ||
      info.Rarity ||
      null;
  }

  return {
    ...fruta,
    rarity,
    mythical:
      rarity?.toLowerCase() === "mythical"
  };
}

app.get("/", (req, res) => {
  res.json({
    name: "Blox Stock API",
    status: "online",
    version: "3.0.0"
  });
});

app.get("/api/stock", async (req, res) => {
  try {
    if (!cachedStock) {
      await updateStock();
    }

    const normal = (cachedStock.normal || [])
      .map(adicionarRaridade);

    const mirage = (cachedStock.mirage || [])
      .map(adicionarRaridade);

    res.json({
      success: true,
      normal,
      mirage,
      updatedAt: lastUpdate,
      normalResetsAt:
        cachedStock.normal_resets_at || null,
      mirageResetsAt:
        cachedStock.mirage_resets_at || null
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `Blox Stock API rodando na porta ${PORT}`
  );
});