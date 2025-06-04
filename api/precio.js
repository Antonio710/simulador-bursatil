export default async function handler(req, res) {
  const { ticker } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: "Ticker requerido" });
  }

  try {
    const response = await fetch(`https://yahoo-finance15.p.rapidapi.com/api/yahoo/qu/quote/${ticker}`, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
        "X-RapidAPI-Host": "yahoo-finance15.p.rapidapi.com"
      }
    });

    const data = await response.json();
    const precio = data.body?.[0]?.regularMarketPrice;

    if (!precio) {
      return res.status(404).json({ error: "Precio no encontrado para " + ticker });
    }

    res.status(200).json({ precio });

  } catch (error) {
    console.error("Error en proxy:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
}
