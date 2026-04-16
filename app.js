"use strict";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmt = (n) => BRL.format(Number.isFinite(n) ? n : 0);

const $ = (id) => document.getElementById(id);
const form = $("form");
const truckSelect = $("truckSelect");
const trucksTable = $("trucks");
const ajudantesInput = $("nAjudantes");
const ajudantesAutoCheck = $("ajudantesAuto");

let caminhaoModo = "auto";
let ajudantesTocadoManualmente = false;

const numVal = (el) => {
  const v = Number(el.value);
  return Number.isFinite(v) ? v : 0;
};

function lerCaminhoes() {
  const linhas = trucksTable.querySelectorAll("tbody tr");
  return Array.from(linhas).map((tr) => {
    const nome = tr.querySelector('[data-truck="nome"]').value.trim() || "Caminhão";
    const volMax = Number(tr.querySelector('[data-truck="volMax"]').value) || 0;
    const tb = Number(tr.querySelector('[data-truck="tb"]').value) || 0;
    return { nome, volMax, tb };
  }).sort((a, b) => a.volMax - b.volMax);
}

function sugerirCaminhao(V, faixas) {
  if (!faixas.length) return null;
  const compat = faixas.find((f) => V <= f.volMax);
  return compat || faixas[faixas.length - 1];
}

function sugerirAjudantes(V, minAjud, passo) {
  const p = passo > 0 ? passo : 8;
  const base = Math.max(0, minAjud);
  const extras = Math.ceil(Math.max(0, V - p) / p);
  return base + extras;
}

function atualizarOpcoesCaminhao(faixas, sugerido) {
  const valorAtual = truckSelect.value;
  truckSelect.innerHTML = "";
  const optAuto = document.createElement("option");
  optAuto.value = "auto";
  optAuto.textContent = sugerido
    ? `Automático (seguir volume) — ${sugerido.nome}`
    : "Automático (seguir volume)";
  truckSelect.appendChild(optAuto);
  faixas.forEach((f, i) => {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `${f.nome} (até ${f.volMax} m³ · TB ${fmt(f.tb)})`;
    truckSelect.appendChild(opt);
  });
  if (caminhaoModo === "auto") {
    truckSelect.value = "auto";
  } else if (valorAtual && Array.from(truckSelect.options).some((o) => o.value === valorAtual)) {
    truckSelect.value = valorAtual;
  } else {
    truckSelect.value = "auto";
    caminhaoModo = "auto";
  }
}

function custoDiario(tipo, salario, diasUteis, multEncargos, diaria) {
  if (tipo === "clt") {
    const du = diasUteis > 0 ? diasUteis : 22;
    return (salario / du) * multEncargos;
  }
  return diaria;
}

function calcular() {
  const D = numVal($("D"));
  const CD = numVal($("CD"));
  const V = numVal($("V"));

  const faixas = lerCaminhoes();
  const sugeridoPorVolume = sugerirCaminhao(V, faixas);
  atualizarOpcoesCaminhao(faixas, sugeridoPorVolume);

  let caminhaoSelecionado;
  if (caminhaoModo === "auto") {
    caminhaoSelecionado = sugeridoPorVolume;
  } else {
    const idx = Number(truckSelect.value);
    caminhaoSelecionado = faixas[idx] || sugeridoPorVolume;
  }
  const tb = caminhaoSelecionado ? caminhaoSelecionado.tb : 0;

  const tipo = $("tipoContratacao").value;
  const dias = numVal($("dias"));
  const minAjud = numVal($("minAjudantes"));
  const passoAjud = numVal($("passoAjudantes"));
  const ajudSugeridos = sugerirAjudantes(V, minAjud, passoAjud);

  if (ajudantesAutoCheck.checked && !ajudantesTocadoManualmente) {
    if (Number(ajudantesInput.value) !== ajudSugeridos) {
      ajudantesInput.value = ajudSugeridos;
    }
  }

  const nMotoristas = numVal($("nMotoristas"));
  const nAjudantes = numVal(ajudantesInput);

  const custoMotDia = custoDiario(
    tipo,
    numVal($("salarioMotorista")),
    numVal($("diasUteisMes")),
    numVal($("multiplicadorEncargos")),
    numVal($("diariaMotorista"))
  );
  const custoAjudDia = custoDiario(
    tipo,
    numVal($("salarioAjudante")),
    numVal($("diasUteisMes")),
    numVal($("multiplicadorEncargos")),
    numVal($("diariaAjudante"))
  );

  const deslocamento = D * CD;
  const cmoMotoristas = dias * nMotoristas * custoMotDia;
  const cmoAjudantes = dias * nAjudantes * custoAjudDia;
  const cmo = cmoMotoristas + cmoAjudantes;

  const baseAndares = tb + deslocamento + cmo;
  const andares = numVal($("andares"));
  const percAndar = numVal($("percAndar"));
  const adicionalAndar = andares * (percAndar / 100) * baseAndares;

  const icamento = numVal($("icamento"));
  const desmontagem = numVal($("desmontagem"));
  const embalagem = numVal($("embalagem"));
  const itensEspeciais = numVal($("itensEspeciais"));
  const adicionais = icamento + desmontagem + embalagem + adicionalAndar + itensEspeciais;

  const VD = numVal($("VD"));
  const S = numVal($("S"));
  const seguro = VD * (S / 100);

  const subtotal = tb + deslocamento + cmo + adicionais + seguro;
  const margemPct = numVal($("margem"));
  const valorMargem = subtotal * (margemPct / 100);
  const precoFinal = subtotal + valorMargem;
  const precoPorM3 = V > 0 ? precoFinal / V : 0;

  return {
    D, CD, V,
    caminhaoSelecionado,
    sugeridoPorVolume,
    tb,
    dias,
    tipo,
    nMotoristas,
    nAjudantes,
    ajudSugeridos,
    minAjud,
    passoAjud,
    custoMotDia,
    custoAjudDia,
    cmoMotoristas,
    cmoAjudantes,
    cmo,
    deslocamento,
    icamento, desmontagem, embalagem, itensEspeciais,
    andares, percAndar, adicionalAndar,
    adicionais,
    VD, S, seguro,
    subtotal,
    margemPct,
    valorMargem,
    precoFinal,
    precoPorM3,
  };
}

function render(r) {
  $("outTruck").textContent = r.caminhaoSelecionado
    ? `${r.caminhaoSelecionado.nome} (TB ${fmt(r.tb)})`
    : "—";

  const sugText = r.sugeridoPorVolume
    ? `${r.ajudSugeridos} (base ${r.minAjud} + ${Math.max(0, r.ajudSugeridos - r.minAjud)} pelo volume de ${r.V} m³)`
    : "—";
  $("outAjudantesSugeridos").textContent = sugText;

  $("outTB").textContent = fmt(r.tb);
  $("lblDeslocamento").textContent = `Deslocamento (${r.D} km × ${fmt(r.CD)}/km)`;
  $("outDeslocamento").textContent = fmt(r.deslocamento);

  $("outCMO").textContent = fmt(r.cmo);
  $("breakMotoristas").textContent =
    `Motoristas: ${r.nMotoristas} × ${r.dias} dias × ${fmt(r.custoMotDia)} = ${fmt(r.cmoMotoristas)}`;
  $("breakAjudantes").textContent =
    `Ajudantes: ${r.nAjudantes} × ${r.dias} dias × ${fmt(r.custoAjudDia)} = ${fmt(r.cmoAjudantes)}`;

  $("outAdicionais").textContent = fmt(r.adicionais);
  const breakAd = $("breakAdicionais");
  breakAd.innerHTML = "";
  const partes = [
    ["Içamento", r.icamento],
    ["Desmontagem", r.desmontagem],
    ["Embalagem", r.embalagem],
    [`Andares s/ elevador (${r.andares} × ${r.percAndar}%)`, r.adicionalAndar],
    ["Itens especiais", r.itensEspeciais],
  ];
  partes.forEach(([label, valor]) => {
    if (valor > 0) {
      const li = document.createElement("li");
      li.textContent = `${label}: ${fmt(valor)}`;
      breakAd.appendChild(li);
    }
  });

  $("lblSeguro").textContent = `Seguro (${fmt(r.VD)} × ${r.S}%)`;
  $("outSeguro").textContent = fmt(r.seguro);

  $("outSubtotal").textContent = fmt(r.subtotal);
  $("lblMargem").textContent = `Margem (${r.margemPct}%)`;
  $("outMargem").textContent = fmt(r.valorMargem);

  $("outFinal").textContent = fmt(r.precoFinal);
  $("outPorM3").textContent = r.V > 0 ? `${fmt(r.precoPorM3)}/m³` : "—";

  validar();
}

function validar() {
  ["D", "V", "dias", "nMotoristas"].forEach((id) => {
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

ajudantesInput.addEventListener("input", () => {
  ajudantesTocadoManualmente = true;
});
ajudantesAutoCheck.addEventListener("change", () => {
  if (ajudantesAutoCheck.checked) {
    ajudantesTocadoManualmente = false;
  }
});
truckSelect.addEventListener("change", () => {
  caminhaoModo = truckSelect.value === "auto" ? "auto" : "manual";
});

form.addEventListener("input", () => render(calcular()));
form.addEventListener("change", () => render(calcular()));

form.addEventListener("reset", () => {
  caminhaoModo = "auto";
  ajudantesTocadoManualmente = false;
  setTimeout(() => {
    definirDataRecibo();
    render(calcular());
  }, 0);
});

$("imprimir").addEventListener("click", () => window.print());

definirDataRecibo();
render(calcular());
