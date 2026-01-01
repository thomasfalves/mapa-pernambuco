// ================= MAPA =================
const map = L.map("map", {
  zoomControl: true,
  tap: true,
}).setView([-8.5, -37.5], 6);

// PANES
map.createPane("base");
map.createPane("municipios");
map.createPane("estados");

map.getPane("municipios").style.zIndex = 500;
map.getPane("estados").style.zIndex = 700;

// TILE
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  pane: "base",
  maxZoom: 18,
}).addTo(map);

// MOBILE FIX
setTimeout(() => map.invalidateSize(), 500);

// ================= VARIÁVEIS =================
const TOTAL_PE = 186;
let kmTotal = 0;

const municipiosSelecionados = new Set();
const estadosVisitados = new Set();

const municipiosPE = [];
const layersMunicipios = [];

// ================= ELEMENTOS =================
const kmInput = document.getElementById("kmInput");
const kmTotalEl = document.getElementById("kmTotal");
const totalCidadesEl = document.getElementById("totalCidades");
const totalEstadosEl = document.getElementById("totalEstados");
const peVisitadasEl = document.getElementById("peVisitadas");
const peFaltamEl = document.getElementById("peFaltam");
const pePercentualEl = document.getElementById("pePercentual");

// ================= ESTILOS =================
const normal = {
  color: "#6b7280",
  weight: 0.7,
  fillColor: "#cfe4ff",
  fillOpacity: 0.45,
};

const selecionado = {
  color: "#1f4fd8",
  weight: 2,
  fillColor: "#60a5fa",
  fillOpacity: 0.65,
};

// ================= RESTAURAR PROGRESSO =================
function carregarProgresso() {
  const salvo = localStorage.getItem("curados_progresso");
  if (!salvo) return;

  const dados = JSON.parse(salvo);
  kmTotal = dados.kmTotal || 0;

  (dados.municipios || []).forEach((id) => municipiosSelecionados.add(id));
}

// ================= SALVAR =================
function salvarProgresso() {
  localStorage.setItem(
    "curados_progresso",
    JSON.stringify({
      kmTotal,
      municipios: [...municipiosSelecionados],
      estados: [...estadosVisitados],
    })
  );
}

// ================= RECALCULAR ESTADOS =================
function recalcularEstados() {
  estadosVisitados.clear();

  layersMunicipios.forEach((layer) => {
    if (layer._selected) {
      estadosVisitados.add(layer._uf);
    }
  });
}

// ================= PAINEL =================
function atualizarPainel() {
  recalcularEstados();

  totalCidadesEl.textContent = municipiosSelecionados.size;
  totalEstadosEl.textContent = estadosVisitados.size;

  const peVisitadas = municipiosPE.filter((m) => m._selected).length;
  peVisitadasEl.textContent = peVisitadas;
  peFaltamEl.textContent = TOTAL_PE - peVisitadas;
  pePercentualEl.textContent =
    ((peVisitadas / TOTAL_PE) * 100).toFixed(2) + "%";

  kmTotalEl.textContent = kmTotal;
}

// ================= MUNICÍPIOS =================
function carregarMunicipios(arquivo, uf) {
  fetch(arquivo)
    .then((r) => r.json())
    .then((data) => {
      L.geoJSON(data, {
        pane: "municipios",
        style: normal,
        onEachFeature: (f, layer) => {
          const id = f.properties.CD_MUN;

          layer._id = id;
          layer._uf = uf;
          layer._selected = municipiosSelecionados.has(id);

          if (uf === "PE") municipiosPE.push(layer);
          layersMunicipios.push(layer);

          if (layer._selected) {
            layer.setStyle(selecionado);
          }

          layer.on("click", () => {
            layer._selected = !layer._selected;
            layer.setStyle(layer._selected ? selecionado : normal);

            if (layer._selected) {
              municipiosSelecionados.add(id);
            } else {
              municipiosSelecionados.delete(id);
            }

            atualizarPainel();
            salvarProgresso();
          });
        },
      }).addTo(map);

      atualizarPainel();
    });
}

// ================= CARREGAR PROGRESSO ANTES =================
carregarProgresso();

// ================= CARREGAR MUNICÍPIOS =================
carregarMunicipios("data/municipios/pe_municipios.geojson", "PE");
carregarMunicipios("data/municipios/ba_municipios.geojson", "BA");
carregarMunicipios("data/municipios/al_municipios.geojson", "AL");
carregarMunicipios("data/municipios/se_municipios.geojson", "SE");
carregarMunicipios("data/municipios/pi_municipios.geojson", "PI");
carregarMunicipios("data/municipios/ce_municipios.geojson", "CE");
carregarMunicipios("data/municipios/pb_municipios.geojson", "PB");
carregarMunicipios("data/municipios/rn_municipios.geojson", "RN");
carregarMunicipios("data/municipios/pi_municipios.geojson", "PI");
carregarMunicipios("data/municipios/ma_municipios.geojson", "MA");



// ================= BORDAS =================
fetch("data/estados/nordeste_ufs.geojson")
  .then((r) => r.json())
  .then((data) => {
    L.geoJSON(data, {
      pane: "estados",
      interactive: false,
      style: (f) => ({
        color: f.properties.SIGLA_UF === "PE" ? "#0b1f44" : "#4b5563",
        weight: f.properties.SIGLA_UF === "PE" ? 4 : 2,
        fillOpacity: 0,
      }),
    }).addTo(map);
  });

// ================= KM =================
kmInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && kmInput.value > 0) {
    kmTotal += Number(kmInput.value);
    kmInput.value = "";
    atualizarPainel();
    salvarProgresso();
  }
});

// ================= BOTÕES =================
document.getElementById("btnFullscreen").onclick = () => {
  document.fullscreenElement
    ? document.exitFullscreen()
    : document.documentElement.requestFullscreen();
};

document.getElementById("btnReset").onclick = () => {
  if (confirm("Deseja resetar toda a viagem?")) {
    localStorage.removeItem("curados_progresso");
    location.reload();
  }
};

document.getElementById("btnExport").onclick = () => {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          kmTotal,
          municipios: [...municipiosSelecionados],
          estados: [...estadosVisitados],
          data: new Date().toISOString(),
        },
        null,
        2
      ),
    ],
    { type: "application/json" }
  );

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "curados_pelo_vento.json";
  a.click();
};

// ================= TOGGLE PAINEL =================
document.getElementById("togglePainel").onclick = () => {
  document.getElementById("painel").classList.toggle("hidden");
};
