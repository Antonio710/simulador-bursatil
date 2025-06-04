// script.js completo usando proxy Vercel en tu dominio

const STORAGE_KEY = "simulador_datos";
const STORAGE_GRAFICOS = "simulador_graficos";
const proxyBase = "https://simulador-bursatil-bach-afhq86qo2-antonios-projects-31497896.vercel.app";

let datos = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
  dinero: 10000,
  acciones: {},
  precios: {},
  historial: [],
  ultimaActualizacion: null,
  anteriores: {}
};

const top25 = [
  { ticker: "AAPL", nombre: "Apple" },
  { ticker: "MSFT", nombre: "Microsoft" },
  { ticker: "AMZN", nombre: "Amazon" },
  { ticker: "GOOGL", nombre: "Alphabet" },
  { ticker: "META", nombre: "Meta Platforms" },
  { ticker: "NVDA", nombre: "NVIDIA" },
  { ticker: "TSLA", nombre: "Tesla" },
  { ticker: "BRK-B", nombre: "Berkshire Hathaway" },
  { ticker: "UNH", nombre: "UnitedHealth" },
  { ticker: "JNJ", nombre: "Johnson & Johnson" },
  { ticker: "XOM", nombre: "Exxon Mobil" },
  { ticker: "JPM", nombre: "JPMorgan Chase" },
  { ticker: "PG", nombre: "Procter & Gamble" },
  { ticker: "LLY", nombre: "Eli Lilly" },
  { ticker: "V", nombre: "Visa" },
  { ticker: "HD", nombre: "Home Depot" },
  { ticker: "MA", nombre: "Mastercard" },
  { ticker: "ABBV", nombre: "AbbVie" },
  { ticker: "CVX", nombre: "Chevron" },
  { ticker: "PEP", nombre: "PepsiCo" },
  { ticker: "AVGO", nombre: "Broadcom" },
  { ticker: "KO", nombre: "Coca-Cola" },
  { ticker: "MRK", nombre: "Merck" },
  { ticker: "COST", nombre: "Costco" },
  { ticker: "WMT", nombre: "Walmart" }
];

document.getElementById("modo-btn").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

function guardar() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
}

function mostrarTabla() {
  const cuerpo = document.getElementById("tabla-acciones");
  cuerpo.innerHTML = "";

  top25.forEach((accion) => {
    const ticker = accion.ticker;
    const precio = datos.precios[ticker] || 0;
    const cantidad = datos.acciones[ticker] || 0;
    const anterior = datos.anteriores[ticker];
    const valorTotal = precio * cantidad;

    let variacionHTML = "-";
    if (anterior && anterior > 0) {
      const variacion = ((precio - anterior) / anterior) * 100;
      const clase = variacion >= 0 ? "positivo" : "negativo";
      variacionHTML = `<span class="${clase}">${variacion.toFixed(2)}%</span>`;
    }

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${ticker}</td>
      <td>${accion.nombre}</td>
      <td>${precio > 0 ? precio.toFixed(2) : "-"}</td>
      <td>${variacionHTML}</td>
      <td>${cantidad}</td>
      <td>${valorTotal.toFixed(2)}</td>
      <td><button onclick="comprar('${ticker}')">Comprar</button></td>
      <td><button onclick="vender('${ticker}')">Vender</button></td>
      <td><button onclick="verGrafico('${ticker}')">📈</button></td>
    `;
    cuerpo.appendChild(fila);
  });

  document.getElementById("dinero").textContent = datos.dinero.toFixed(2);
  actualizarCartera();
  actualizarHistorial();
}

function actualizarCartera() {
  let valorActual = 0;
  let valorInvertido = 0;

  top25.forEach(acc => {
    const ticker = acc.ticker;
    const precioActual = datos.precios[ticker] || 0;
    const cantidad = datos.acciones[ticker] || 0;
    const precioCompra = datos.anteriores[ticker] || 0;

    valorActual += precioActual * cantidad;
    valorInvertido += precioCompra * cantidad;
  });

  const variacion = valorActual - valorInvertido;
  const porcentaje = valorInvertido > 0 ? (variacion / valorInvertido) * 100 : 0;

  document.getElementById("valor-cartera").textContent = valorActual.toFixed(2);
  document.getElementById("valor-total").textContent = (valorActual + datos.dinero).toFixed(2);
  document.getElementById("ultima-actualizacion").textContent = datos.ultimaActualizacion || "---";

  const contenedorVariacion = document.getElementById("variacion-cartera");
  if (valorInvertido > 0) {
    const color = variacion >= 0 ? "positivo" : "negativo";
    const simbolo = variacion >= 0 ? "+" : "";
    contenedorVariacion.className = `variacion-texto ${color}`;
    contenedorVariacion.innerHTML = `${simbolo}${variacion.toFixed(2)} € · ${simbolo}${porcentaje.toFixed(2)} %`;
  } else {
    contenedorVariacion.className = "variacion-texto";
    contenedorVariacion.textContent = "–";
  }
}

function comprar(ticker) {
  const precio = datos.precios[ticker];
  if (!precio || precio > datos.dinero) return alert("Fondos insuficientes o precio no disponible.");
  datos.dinero -= precio;
  datos.acciones[ticker] = (datos.acciones[ticker] || 0) + 1;
  datos.historial.unshift(`🟢 Compra ${ticker} a ${precio.toFixed(2)} €`);
  guardar();
  mostrarTabla();
}

function vender(ticker) {
  if (!datos.acciones[ticker]) return alert("No tienes acciones de esta empresa.");
  const precio = datos.precios[ticker];
  datos.dinero += precio;
  datos.acciones[ticker]--;
  datos.historial.unshift(`🔴 Venta ${ticker} a ${precio.toFixed(2)} €`);
  guardar();
  mostrarTabla();
}

function actualizarHistorial() {
  const ul = document.getElementById("historial");
  ul.innerHTML = "";
  datos.historial.slice(0, 25).forEach(linea => {
    const li = document.createElement("li");
    li.textContent = linea;
    ul.appendChild(li);
  });
}

async function actualizarPrecios(forzar = false) {
  const hoy = new Date().toISOString().slice(0, 10);
  if (!forzar && datos.ultimaActualizacion === hoy) {
    mostrarTabla();
    return;
  }

  try {
    for (const { ticker } of top25) {
      const res = await fetch(`${proxyBase}/api/precio?ticker=${ticker}`);
      const data = await res.json();

      if (data.precio) {
        datos.anteriores[ticker] = datos.precios[ticker] || 0;
        datos.precios[ticker] = data.precio;
        console.log(`✅ Precio actualizado de ${ticker}: ${data.precio}`);
      } else {
        console.warn(`⚠️ No se encontró el precio de ${ticker}:`, data);
      }
    }

    datos.ultimaActualizacion = hoy;
    guardar();
    mostrarTabla();

  } catch (err) {
    console.error("🛑 Error al obtener datos desde proxy Vercel:", err);
  }
}

function resetearSimulador() {
  if (confirm("¿Seguro que deseas reiniciar todo?")) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_GRAFICOS);
    location.reload();
  }
}

function cerrarModal() {
  document.getElementById("modal").style.display = "none";
}

function mostrarDefinicion(clave) {
  const definiciones = {
    accion: "Una acción representa una parte del capital social de una empresa.",
    dividendo: "Parte de los beneficios que una empresa reparte entre sus accionistas.",
    per: "Relación entre el precio de una acción y el beneficio por acción.",
    volumen: "Cantidad de acciones negociadas en un periodo de tiempo.",
    volatilidad: "Mide la variación del precio de una acción.",
    stoploss: "Orden automática para vender una acción si baja de cierto precio.",
    capitalizacion: "Valor total en bolsa de una empresa.",
    tendencia: "Dirección general del precio de una acción: alcista, bajista o lateral.",
    cartera: "Conjunto de inversiones que posee un inversor.",
    liquidez: "Facilidad con la que una acción se puede comprar o vender sin cambiar mucho su precio."
  };

  document.getElementById("glosario-titulo").textContent = clave.charAt(0).toUpperCase() + clave.slice(1);
  document.getElementById("glosario-texto").textContent = definiciones[clave] || "Definición no disponible.";
  document.getElementById("modal-glosario").style.display = "block";
}

function cerrarGlosario() {
  document.getElementById("modal-glosario").style.display = "none";
}

// 🚀 Lanzamiento
mostrarTabla();
actualizarPrecios();

