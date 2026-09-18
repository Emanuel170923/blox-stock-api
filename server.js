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
  "https://api.parse.bot/scraper/78cf8155-3819-45d0-b799-92f840a94827/get_fruits?rarity=Mythical";

let cachedStock = null;
let cachedMythicals = [];
let lastUpdate = null;

async function updateStock() {
  if (!PARSE_API_KEY) {
    throw new Error("PARSE_API_KEY não configurada no Render");
  }

  const [stockResponse, mythicalResponse] = await Promise.all([
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
    throw new Error(`Erro no estoque: ${stockResponse.status}`);
  }

  if (!mythicalResponse.ok) {
    throw new Error(`Erro nas frutas Mythical: ${mythicalResponse.status}`);
  }

  const stockData = await stockResponse.json();
  const mythicalData = await mythicalResponse.json();

  const stock = stockData.data || stockData;
  const mythical = mythicalData.data || mythicalData;

  cachedStock = {
    normal: stock.normal || [],
    mirage: stock.mirage || [],
    previous_normal: stock.previous_normal || [],
    previous_mirage: stock.previous_mirage || [],
    normal_resets_at: stock.normal_resets_at || null,
    mirage_resets_at: stock.mirage_resets_at || null
  };

  cachedMythicals = (mythical.fruits || []).map((fruit) =>
    fruit.name
  );

  lastUpdate = new Date().toISOString();

  return cachedStock;
}

app.get("/", (req, res) => {
  res.json({
    name: "Blox Stock API",
    status: "online",
    version: "2.0.0"
  });
});

app.get("/api/stock", async (req, res) => {
  try {
    if (!cachedStock) {
      await updateStock();
    }

    const normal = cachedStock.normal.map((fruit) => ({
      ...fruit,
      mythical: cachedMythicals.includes(fruit.name)
    }));

    const mirage = cachedStock.mirage.map((fruit) => ({
      ...fruit,
      mythical: cachedMythicals.includes(fruit.name)
    }));

    res.json({
      success: true,
      normal,
      mirage,
      updatedAt: lastUpdate,
      normalResetsAt: cachedStock.normal_resets_at,
      mirageResetsAt: cachedStock.mirage_resets_at
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
  console.log(`Blox Stock API rodando na porta ${PORT}`);
});