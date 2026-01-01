// ================= MAPA BASE =================
const map = L.map("map").setView([-8.5, -37.5], 6);

// PANES (ORDEM IMPORTANTE)
map.createPane("base");
map.createPane("municipios");
map.createPane("estados");
map.createPane("labels");

map.getPane("municipios").style.zIndex = 400;
map.getPane("estados").style.zIndex = 600;
map.getPane("labels").style.zIndex = 650;

// ================= TILE BASE =================
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  pane: "base",
  maxZoom: 18,
}).addTo(map);

// ================= VARIÁVEIS =================
const TOTAL_PE = 186;
let kmTotal = 0;

let municipiosSelecionados = new Set();
let estadosVisitados = new Set();
let municipiosPE = [];

// ================= ELEMENTOS =================
const kmInput = document.getElementById("kmInput");
const kmTotalEl = document.getElementById("kmTotal");
const totalCidadesEl = document.getElementById("totalCidades");
const totalEstadosEl = document.getElementById("totalEstados");
const peVisitadasEl = document.getElementById("peVisitadas");
const peFaltamEl = document.getElementById("peFaltam");
const pePercentualEl = document.getElementById("pePercentual");

// ================= KM =================
kmInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const valor = Number(kmInput.value);
    if (valor > 0) {
      kmTotal += valor;
      kmTotalEl.textContent = kmTotal;
      kmInput.value = "";
      salvarProgresso();
    }
  }
});

// ================= ATUALIZA PAINEL =================
function atualizarPainel() {
  totalCidadesEl.textContent = municipiosSelecionados.size;
  totalEstadosEl.textContent = estadosVisitados.size;

  const peVisitadas = municipiosPE.filter((m) => m._selected).length;
  peVisitadasEl.textContent = peVisitadas;
  peFaltamEl.textContent = TOTAL_PE - peVisitadas;
  pePercentualEl.textContent =
    ((peVisitadas / TOTAL_PE) * 100).toFixed(2) + "%";
}

// ================= ESTILOS MUNICÍPIOS =================
const normal = {
  color: "#6b7280",
  weight: 0.7,
  fillColor: "#cfe4ff", // FUNDO AZUL
  fillOpacity: 0.45,
};

const selecionado = {
  color: "#1f4fd8",
  weight: 2,
  fillColor: "#60a5fa",
  fillOpacity: 0.65,
};

// ================= MUNICÍPIOS =================
function carregarMunicipios(arquivo, siglaUF) {
  fetch(arquivo)
    .then((r) => r.json())
    .then((data) => {
      L.geoJSON(data, {
        pane: "municipios",
        style: normal,
        onEachFeature: (f, layer) => {
          layer._selected = false;

          if (siglaUF === "PE") municipiosPE.push(layer);

          layer.on("click", () => {
            layer._selected = !layer._selected;
            layer.setStyle(layer._selected ? selecionado : normal);

            const id = f.properties.CD_MUN;

            if (layer._selected) {
              municipiosSelecionados.add(id);
              estadosVisitados.add(siglaUF);
            } else {
              municipiosSelecionados.delete(id);
            }

            atualizarPainel();
            salvarProgresso();
          });
        },
      }).addTo(map);
    });
}

// ================= CARREGAR MUNICÍPIOS =================
carregarMunicipios("data/municipios/pe_municipios.geojson", "PE");
carregarMunicipios("data/municipios/ba_municipios.geojson", "BA");
carregarMunicipios("data/municipios/al_municipios.geojson", "AL");
carregarMunicipios("data/municipios/se_municipios.geojson", "SE");
carregarMunicipios("data/municipios/pi_municipios.geojson", "PI");
carregarMunicipios("data/municipios/ce_municipios.geojson", "CE");

// ================= BORDAS DOS ESTADOS =================
fetch("data/estados/nordeste_ufs.geojson")
  .then((r) => r.json())
  .then((data) => {
    L.geoJSON(data, {
      pane: "estados",
      interactive: false,
      style: (f) => ({
        color: f.properties.SIGLA_UF === "PE" ? "#0b1f44" : "#4b5563",
        weight: f.properties.SIGLA_UF === "PE" ? 4.5 : 2,
        opacity: 1,       // BORDA SEMPRE FORTE
        fillOpacity: 0,
      }),
    }).addTo(map);
  });

// ================= SALVAR =================
function salvarProgresso() {
  localStorage.setItem(
    "curados_dados",
    JSON.stringify({
      cidades: Array.from(municipiosSelecionados),
      estados: Array.from(estadosVisitados),
      km: kmTotal,
    })
  );
}
