"use strict";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmt = (n) => BRL.format(Number.isFinite(n) ? n : 0);
const $ = (id) => document.getElementById(id);

const form = $("form");
const truckSelect = $("truckSelect");
const trucksTable = $("trucks");
const ajudantesInput = $("nAjudantes");
const ajudantesAutoCheck = $("ajudantesAuto");
const embaladoresInput = $("nEmbaladores");
const embaladoresAutoCheck = $("embaladoresAuto");
const materialInput = $("materialEmbalagem");
const materialAutoCheck = $("materialAuto");

let caminhaoModo = "auto";
let ajudantesTocado = false;
let embaladoresTocado = false;
let materialTocado = false;

// Tabela tarifária (manual Fev/2026). Colunas: VUC15, TOCO30, TOCO45, TOCO60, TRUCK75, CARRETA90.
const TABELA_DIRETA = [
  [0, 50, 3299.61, 6600.03, 8284.01, 12066.01, 13666.25, 18783.28],
  [51, 100, 4930.87, 8836.85, 10906.56, 13781.37, 16604.84, 20823.15],
  [101, 200, 5219.04, 9146.62, 11265.52, 14140.32, 17034.21, 21313.62],
  [201, 300, 6358.75, 10411.51, 12517.89, 15392.69, 18608.71, 22964.22],
  [301, 400, 6646.91, 10721.28, 12876.85, 15751.65, 19038.09, 23454.69],
  [401, 500, 6935.07, 11031.06, 13235.8, 16110.61, 19467.46, 23945.16],
  [501, 600, 7223.23, 11340.83, 13594.76, 16469.56, 19896.83, 24435.64],
  [601, 700, 7511.39, 11650.6, 13953.72, 16828.52, 20326.2, 24926.11],
  [701, 800, 8651.1, 12915.49, 15206.09, 18080.89, 21900.71, 26576.71],
  [801, 900, 8939.26, 13225.26, 15565.04, 18439.85, 22330.08, 27067.18],
  [901, 1000, 9227.42, 13535.03, 15924.0, 18798.8, 22759.45, 27557.66],
  [1001, 1100, 9515.58, 13844.8, 16282.96, 19157.76, 23188.82, 28048.13],
  [1101, 1200, 9803.74, 14154.57, 16641.91, 19516.72, 23618.2, 28538.6],
  [1201, 1300, 10943.45, 15419.46, 17894.28, 20769.09, 25192.7, 30189.2],
  [1301, 1400, 11231.61, 15729.23, 18253.24, 21128.04, 25622.07, 30679.68],
  [1401, 1500, 11519.78, 16039.0, 18612.2, 21487.0, 26051.45, 31170.15],
  [1501, 1600, 11807.94, 16348.78, 18971.15, 21845.96, 26480.82, 31660.62],
  [1601, 1700, 12096.1, 16658.55, 19330.11, 22204.91, 26910.19, 32151.1],
  [1701, 1800, 13235.81, 17923.44, 20582.48, 23457.28, 28484.7, 33801.69],
  [1801, 1900, 13523.97, 18233.21, 20941.44, 23816.24, 28914.07, 34292.17],
  [1901, 2000, 13812.13, 18542.98, 21300.39, 24175.2, 29343.44, 34782.64],
  [2001, 2200, 14388.45, 19162.52, 22018.31, 24893.11, 30202.18, 35763.59],
  [2201, 2400, 15816.32, 20737.18, 23629.63, 26504.44, 32206.06, 37904.66],
  [2401, 2600, 16392.64, 21356.73, 24347.55, 27222.35, 33064.81, 38885.61],
  [2601, 2800, 16968.97, 21976.27, 25065.46, 27940.26, 33923.55, 39866.56],
  [2801, 3000, 17545.29, 22595.81, 25783.37, 28658.18, 34782.29, 40847.5],
  [3001, 3200, 18973.16, 24170.47, 27394.7, 30269.5, 36786.17, 42988.58],
  [3201, 3400, 19549.48, 24790.02, 28112.61, 30987.42, 37644.92, 43969.52],
  [3401, 3600, 20125.8, 25409.56, 28830.53, 31705.33, 38503.66, 44950.47],
  [3601, 3800, 20702.12, 26029.1, 29548.44, 32423.24, 39362.4, 45931.42],
  [3801, 4000, 22130.0, 27603.76, 31159.77, 34034.57, 41366.28, 48072.49],
];
const VOLUMES_TABELA = [15, 30, 45, 60, 75, 90];

// Sugestões de embaladores e material por faixa (extraídas da planilha — editáveis na UI).
const EMBALAGEM_POR_FAIXA = [
  { volMax: 15, embaladores: 3, material: 654 },
  { volMax: 30, embaladores: 2, material: 1305 },
  { volMax: 45, embaladores: 3, material: 1984 },
  { volMax: 60, embaladores: 3, material: 2570 },
  { volMax: 75, embaladores: 4, material: 2898 },
  { volMax: 90, embaladores: 6, material: 3750 },
];

const numVal = (el) => {
  const v = Number(el && el.value);
  return Number.isFinite(v) ? v : 0;
};

function lerCaminhoes() {
  return Array.from(trucksTable.querySelectorAll("tbody tr")).map((tr) => ({
    nome: tr.querySelector('[data-truck="nome"]').value.trim() || "Caminhão",
    volMax: Number(tr.querySelector('[data-truck="volMax"]').value) || 0,
    diariaParada: Number(tr.querySelector('[data-truck="diariaParada"]').value) || 0,
    custoKm: Number(tr.querySelector('[data-truck="custoKm"]').value) || 0,
  })).sort((a, b) => a.volMax - b.volMax);
}

function sugerirCaminhao(V, faixas) {
  if (!faixas.length) return null;
  return faixas.find((f) => V <= f.volMax) || faixas[faixas.length - 1];
}

function sugerirAjudantes(V, minAjud, passo) {
  const p = passo > 0 ? passo : 15;
  const base = Math.max(0, minAjud);
  return base + Math.ceil(Math.max(0, V - p) / p);
}

function sugerirEmbalagem(V) {
  return EMBALAGEM_POR_FAIXA.find((f) => V <= f.volMax) || EMBALAGEM_POR_FAIXA[EMBALAGEM_POR_FAIXA.length - 1];
}

function indiceColunaPorVolume(volMax) {
  const idx = VOLUMES_TABELA.findIndex((v) => v >= volMax);
  return idx === -1 ? VOLUMES_TABELA.length - 1 : idx;
}

function lookupTabela(D, volMax) {
  const linha = TABELA_DIRETA.find(([kmDe, kmAte]) => D >= kmDe && D <= kmAte)
              || TABELA_DIRETA[TABELA_DIRETA.length - 1];
  const col = indiceColunaPorVolume(volMax);
  return { valor: linha[2 + col], kmDe: linha[0], kmAte: linha[1] };
}

function atualizarOpcoesCaminhao(faixas) {
  const valorAtual = truckSelect.value;
  truckSelect.innerHTML = "";
  const optAuto = document.createElement("option");
  optAuto.value = "auto";
  optAuto.textContent = "Automático (seguir volume)";
  truckSelect.appendChild(optAuto);
  faixas.forEach((f, i) => {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `${f.nome} (até ${f.volMax} m³)`;
    truckSelect.appendChild(opt);
  });
  if (caminhaoModo === "auto") {
    truckSelect.value = "auto";
  } else if (Array.from(truckSelect.options).some((o) => o.value === valorAtual)) {
    truckSelect.value = valorAtual;
  } else {
    truckSelect.value = "auto";
    caminhaoModo = "auto";
  }
}

function markupDivisor() {
  const modo = $("modo").value;
  const admin = numVal($("mkAdmin")) / 100;
  const comissao = numVal($("mkComissao")) / 100;
  const impostos = numVal($("mkImpostos")) / 100;
  const lucro = numVal($("mkLucro")) / 100;
  const iss = numVal($("mkIss")) / 100;
  const icms = numVal($("mkIcms")) / 100;
  const impostoLocal = modo === "local" ? iss : icms;
  const soma = admin + comissao + impostos + lucro + impostoLocal;
  const divisor = soma < 1 ? 1 / (1 - soma) : Infinity;
  return { modo, soma, divisor, iss, icms, impostoLocal };
}

function calcular() {
  const D = numVal($("D"));
  const V = numVal($("V"));
  const dias = numVal($("dias"));
  const VD = numVal($("VD"));

  const faixas = lerCaminhoes();
  const sugeridoPorVolume = sugerirCaminhao(V, faixas);
  atualizarOpcoesCaminhao(faixas);

  let caminhao;
  if (caminhaoModo === "auto") {
    caminhao = sugeridoPorVolume;
  } else {
    const idx = Number(truckSelect.value);
    caminhao = faixas[idx] || sugeridoPorVolume;
  }
  const diariaParada = caminhao ? caminhao.diariaParada : 0;
  const custoKm = caminhao ? caminhao.custoKm : 0;

  const minAjud = numVal($("minAjudantes"));
  const passoAjud = numVal($("passoAjudantes"));
  const ajudSugeridos = sugerirAjudantes(V, minAjud, passoAjud);
  if (ajudantesAutoCheck.checked && !ajudantesTocado) {
    if (Number(ajudantesInput.value) !== ajudSugeridos) {
      ajudantesInput.value = ajudSugeridos;
    }
  }
  const nAjudantes = numVal(ajudantesInput);
  const diariaAjudante = numVal($("diariaAjudante"));

  const embSug = sugerirEmbalagem(V);
  if (embaladoresAutoCheck.checked && !embaladoresTocado) {
    if (Number(embaladoresInput.value) !== embSug.embaladores) {
      embaladoresInput.value = embSug.embaladores;
    }
  }
  if (materialAutoCheck.checked && !materialTocado) {
    if (Number(materialInput.value) !== embSug.material) {
      materialInput.value = embSug.material;
    }
  }

  const embalagemAtiva = $("embalagemAtiva").checked;
  const diasEmbalagem = numVal($("diasEmbalagem"));
  const nChefes = numVal($("nChefes"));
  const nEmbaladores = numVal(embaladoresInput);
  const diariaChefe = numVal($("diariaChefe"));
  const diariaEmbalador = numVal($("diariaEmbalador"));
  const materialEmbalagem = numVal(materialInput);

  const custoVeiculoParada = dias * diariaParada;
  const custoVeiculoKm = D * custoKm;
  const custoVeiculo = custoVeiculoParada + custoVeiculoKm;

  const custoEquipe = dias * nAjudantes * diariaAjudante;

  let custoEmbalagemEquipe = 0, custoEmbalagemMaterial = 0;
  if (embalagemAtiva) {
    custoEmbalagemEquipe = diasEmbalagem * (nChefes * diariaChefe + nEmbaladores * diariaEmbalador);
    custoEmbalagemMaterial = materialEmbalagem;
  }
  const custoEmbalagem = custoEmbalagemEquipe + custoEmbalagemMaterial;

  const icamento = numVal($("icamento"));
  const desmontagem = numVal($("desmontagem"));
  const itensEspeciais = numVal($("itensEspeciais"));
  const outros = numVal($("outros"));
  const andares = numVal($("andares"));
  const percAndar = numVal($("percAndar"));
  const baseAndares = custoVeiculo + custoEquipe;
  const adicionalAndar = andares * (percAndar / 100) * baseAndares;
  const adicionais = icamento + desmontagem + itensEspeciais + outros + adicionalAndar;

  const grisPct = numVal($("gris"));
  const seguroPct = numVal($("S"));
  const gris = VD * (grisPct / 100);
  const seguro = VD * (seguroPct / 100);

  const custoTotal = custoVeiculo + custoEquipe + custoEmbalagem + adicionais + gris + seguro;

  const mk = markupDivisor();
  const precoFinal = Number.isFinite(mk.divisor) ? custoTotal * mk.divisor : 0;
  const markupValor = precoFinal - custoTotal;
  const precoPorM3 = V > 0 ? precoFinal / V : 0;

  const refTabela = caminhao ? lookupTabela(D, caminhao.volMax) : null;

  return {
    D, V, dias, VD,
    caminhao, sugeridoPorVolume,
    diariaParada, custoKm,
    custoVeiculo, custoVeiculoParada, custoVeiculoKm,
    nAjudantes, ajudSugeridos, diariaAjudante, minAjud,
    custoEquipe,
    embalagemAtiva, diasEmbalagem, nChefes, nEmbaladores,
    diariaChefe, diariaEmbalador, materialEmbalagem,
    custoEmbalagemEquipe, custoEmbalagemMaterial, custoEmbalagem,
    icamento, desmontagem, itensEspeciais, outros, andares, percAndar, adicionalAndar,
    adicionais,
    grisPct, seguroPct, gris, seguro,
    custoTotal,
    mk, markupValor, precoFinal, precoPorM3,
    refTabela,
  };
}

function render(r) {
  $("outTruck").textContent = r.caminhao ? `${r.caminhao.nome} (até ${r.caminhao.volMax} m³)` : "—";
  $("outAjudantesSugeridos").textContent = r.sugeridoPorVolume
    ? `${r.ajudSugeridos} (base ${r.minAjud} + ${Math.max(0, r.ajudSugeridos - r.minAjud)} pelo volume de ${r.V} m³)`
    : "—";

  $("outVeiculo").textContent = fmt(r.custoVeiculo);
  $("breakDiariaParada").textContent =
    `Diária parada: ${r.dias} × ${fmt(r.diariaParada)} = ${fmt(r.custoVeiculoParada)}`;
  $("breakKm").textContent =
    `Rodagem: ${r.D} km × ${fmt(r.custoKm)}/km = ${fmt(r.custoVeiculoKm)}`;

  $("outEquipe").textContent = fmt(r.custoEquipe);
  $("breakAjudantes").textContent =
    `Ajudantes: ${r.nAjudantes} × ${r.dias} dias × ${fmt(r.diariaAjudante)} = ${fmt(r.custoEquipe)}`;

  const grupoEmb = $("grupoEmbalagem");
  const breakEmb = $("breakEmbalagem");
  breakEmb.innerHTML = "";
  if (r.embalagemAtiva) {
    grupoEmb.hidden = false;
    $("outEmbalagem").textContent = fmt(r.custoEmbalagem);
    const partes = [
      [`Chefes: ${r.nChefes} × ${r.diasEmbalagem} dias × ${fmt(r.diariaChefe)}`,
        r.diasEmbalagem * r.nChefes * r.diariaChefe],
      [`Embaladores: ${r.nEmbaladores} × ${r.diasEmbalagem} dias × ${fmt(r.diariaEmbalador)}`,
        r.diasEmbalagem * r.nEmbaladores * r.diariaEmbalador],
      ["Material de embalagem", r.custoEmbalagemMaterial],
    ];
    partes.forEach(([label, val]) => {
      if (val > 0) {
        const li = document.createElement("li");
        li.textContent = `${label} = ${fmt(val)}`;
        breakEmb.appendChild(li);
      }
    });
  } else {
    grupoEmb.hidden = true;
  }

  $("outAdicionais").textContent = fmt(r.adicionais);
  const breakAd = $("breakAdicionais");
  breakAd.innerHTML = "";
  const adicParts = [
    ["Içamento", r.icamento],
    ["Desmontagem", r.desmontagem],
    ["Itens especiais", r.itensEspeciais],
    ["Outros", r.outros],
    [`Andares s/ elevador (${r.andares} × ${r.percAndar}%)`, r.adicionalAndar],
  ];
  adicParts.forEach(([label, val]) => {
    if (val > 0) {
      const li = document.createElement("li");
      li.textContent = `${label}: ${fmt(val)}`;
      breakAd.appendChild(li);
    }
  });

  $("lblGris").textContent = `GRIS (${r.grisPct}% sobre ${fmt(r.VD)})`;
  $("outGris").textContent = fmt(r.gris);
  $("lblSeguro").textContent = `Seguro (${r.seguroPct}% sobre ${fmt(r.VD)})`;
  $("outSeguro").textContent = fmt(r.seguro);

  $("outCustoTotal").textContent = fmt(r.custoTotal);
  const modoLabel = r.mk.modo === "local" ? "Local · ISS" : "Intermunicipal · ICMS";
  $("lblMarkup").textContent = `Markup (${modoLabel}, divisor ${r.mk.divisor.toFixed(4)})`;
  $("outMarkupValor").textContent = fmt(r.markupValor);

  $("outFinal").textContent = fmt(r.precoFinal);
  $("outPorM3").textContent = r.V > 0 ? `${fmt(r.precoPorM3)}/m³` : "—";

  if (r.refTabela) {
    $("outTabelaRef").textContent =
      `${fmt(r.refTabela.valor)} (faixa ${r.refTabela.kmDe}–${r.refTabela.kmAte} km · até ${r.caminhao.volMax} m³)`;
  } else {
    $("outTabelaRef").textContent = "—";
  }

  $("markupResumo").textContent =
    `Soma: ${(r.mk.soma * 100).toFixed(2)}% · Divisor: ${r.mk.divisor.toFixed(4)} · Multiplicador: × ${r.mk.divisor.toFixed(2)}`;
  $("modoResumo").textContent = r.mk.modo === "local"
    ? `ISS ${(r.mk.iss * 100).toFixed(2)}% aplicado`
    : `ICMS ${(r.mk.icms * 100).toFixed(2)}% aplicado`;

  validar();
}

function validar() {
  ["D", "V", "dias"].forEach((id) => {
    const el = $(id);
    if (!el) return;
    const v = Number(el.value);
    el.classList.toggle("invalid", !Number.isFinite(v) || v <= 0);
  });
}

function definirDataRecibo() {
  const d = new Date();
  $("receiptDate").textContent =
    "Gerado em " + d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR");
}

ajudantesInput.addEventListener("input", () => { ajudantesTocado = true; });
ajudantesAutoCheck.addEventListener("change", () => {
  if (ajudantesAutoCheck.checked) ajudantesTocado = false;
});
embaladoresInput.addEventListener("input", () => { embaladoresTocado = true; });
embaladoresAutoCheck.addEventListener("change", () => {
  if (embaladoresAutoCheck.checked) embaladoresTocado = false;
});
materialInput.addEventListener("input", () => { materialTocado = true; });
materialAutoCheck.addEventListener("change", () => {
  if (materialAutoCheck.checked) materialTocado = false;
});
truckSelect.addEventListener("change", () => {
  caminhaoModo = truckSelect.value === "auto" ? "auto" : "manual";
});

form.addEventListener("input", () => render(calcular()));
form.addEventListener("change", () => render(calcular()));
form.addEventListener("reset", () => {
  caminhaoModo = "auto";
  ajudantesTocado = false;
  embaladoresTocado = false;
  materialTocado = false;
  setTimeout(() => {
    definirDataRecibo();
    render(calcular());
  }, 0);
});

$("imprimir").addEventListener("click", () => window.print());

definirDataRecibo();
render(calcular());
