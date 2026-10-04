// Testes do motor de interações: node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

global.window = {};
require(path.join(__dirname, "..", "js", "data.js"));
const DATA = global.window.CYP_DATA;
const { analisar } = require(path.join(__dirname, "..", "js", "engine.js"));

const F = Object.fromEntries(DATA.farmacos.map((f) => [f.id, f]));
const run = (...ids) => analisar(ids.map((id) => F[id]));

test("base de dados: ids únicos, classes e enzimas válidas", () => {
  const ids = DATA.farmacos.map((f) => f.id);
  assert.equal(new Set(ids).size, ids.length);
  const classes = new Set(DATA.classes.map((c) => c.id));
  for (const f of DATA.farmacos) {
    assert.ok(classes.has(f.classe), `${f.id}: classe ${f.classe}`);
    for (const lista of [f.substrato, f.inibe, f.induz]) {
      for (const x of lista) assert.ok(DATA.enzimas.includes(x.enzima), `${f.id}: enzima ${x.enzima}`);
    }
    for (const c of f.citacoes || []) assert.ok(F[c.alvo], `${f.id}: citação para ${c.alvo}`);
  }
  // 33 linhas da planilha + Tabagismo
  assert.equal(DATA.farmacos.length, 34);
});

test("toda combinação citada nas notas é detectada pelo cruzamento de enzimas", () => {
  for (const f of DATA.farmacos) {
    for (const c of f.citacoes || []) {
      const r = run(f.id, c.alvo);
      assert.ok(r.direcionais.some((d) => d.perp.id === f.id && d.vitima.id === c.alvo), `${f.id} → ${c.alvo}`);
    }
  }
});

test("Fluoxetina + Risperidona: inibição da 2D6 aumenta risperidona", () => {
  const r = run("fluoxetina", "risperidona");
  assert.equal(r.pares.length, 1);
  const d = r.pares[0].direcoes;
  assert.equal(d.length, 1);
  assert.equal(d[0].perp.id, "fluoxetina");
  assert.equal(d[0].direcao, "aumenta");
  assert.deepEqual(d[0].efeitos.map((e) => [e.enzima, e.potencia]), [["CYP2D6", "forte"]]);
  assert.equal(d[0].alertas.length, 1);
  assert.equal(r.multiplas.length, 0);
});

test("Fluoxetina + Paroxetina: efeito nas duas direções", () => {
  const r = run("fluoxetina", "paroxetina");
  assert.equal(r.pares[0].direcoes.length, 2);
});

test("Fluoxetina + Fluvoxamina + Aripiprazol: interação múltipla", () => {
  const r = run("fluoxetina", "fluvoxamina", "aripiprazol");
  const m = r.multiplas.find((x) => x.vitima.id === "aripiprazol");
  assert.ok(m);
  assert.deepEqual(m.perps.map((p) => p.id).sort(), ["fluoxetina", "fluvoxamina"]);
  assert.deepEqual(m.somaInibicao.map((z) => z.enzima), ["CYP3A4"]);
  assert.equal(m.viasDiferentesInibidas, true);
  assert.equal(m.todasViasInibidas, true);
  assert.equal(m.opostos, false);
  assert.equal(m.direcao, "aumenta");
  // alerta de ajuste de dose do aripiprazol
  assert.ok(m.alertas.some((a) => a.tipo === "ajuste"));
});

test("Carbamazepina + Fluvoxamina + Clozapina: efeitos opostos e citações", () => {
  const r = run("carbamazepina", "fluvoxamina", "clozapina");
  const m = r.multiplas.find((x) => x.vitima.id === "clozapina");
  assert.ok(m);
  assert.equal(m.opostos, true);
  assert.equal(m.direcao, "misto");
  const cbz = r.direcionais.find((d) => d.perp.id === "carbamazepina" && d.vitima.id === "clozapina");
  const fvx = r.direcionais.find((d) => d.perp.id === "fluvoxamina" && d.vitima.id === "clozapina");
  assert.equal(cbz.citacoes.length, 1);
  assert.equal(fvx.citacoes.length, 1);
  assert.equal(cbz.direcao, "reduz");
  assert.equal(fvx.direcao, "aumenta");
});

test("Escitalopram + Venlafaxina: sem interação por CYP", () => {
  const r = run("escitalopram", "venlafaxina");
  assert.equal(r.pares.length, 0);
  assert.equal(r.semInteracao.length, 1);
});

test("Competição pelo mesmo substrato não é sinalizada", () => {
  // Quetiapina e Cariprazina: ambas só CYP3A4, nenhuma inibe/induz
  const r = run("quetiapina", "cariprazina");
  assert.equal(r.pares.length, 0);
});

test("Tabagismo + Clozapina: indução da 1A2 (via principal) reduz clozapina", () => {
  const r = run("tabagismo", "clozapina");
  const d = r.pares[0].direcoes[0];
  assert.equal(d.direcao, "reduz");
  assert.equal(d.efeitos[0].via, "principal");
  assert.equal(d.citacoes.length, 1);
});

test("Alerta do tabagismo não aparece para outro indutor da 1A2", () => {
  const r = run("carbamazepina", "clozapina");
  const d = r.pares[0].direcoes[0];
  assert.equal(d.alertas.length, 0);
  assert.ok(d.citacoes.every((c) => !c.fonte));
});

test("Tioridazina + Fluoxetina: risco descrito (não contraindicação)", () => {
  const r = run("tioridazina", "fluoxetina");
  assert.equal(r.pares[0].gravidade, 1);
});

test("Enzimas da interação múltipla seguem a ordem das vias do fármaco afetado", () => {
  const r = run("fluoxetina", "fluvoxamina", "carbamazepina", "clozapina");
  const m = r.multiplas.find((x) => x.vitima.id === "clozapina");
  assert.deepEqual(m.enzimas.map((z) => z.enzima), ["CYP1A2", "CYP2C19", "CYP3A4", "CYP2D6"]);
});

test("Lurasidona + Carbamazepina: contraindicação da tabela vem primeiro", () => {
  const r = run("buspirona", "fluvoxamina", "lurasidona", "carbamazepina");
  assert.equal(r.pares[0].gravidade, 2);
  assert.ok([r.pares[0].a.id, r.pares[0].b.id].includes("lurasidona"));
});

test("Um fármaco não interage consigo mesmo (paroxetina sozinha)", () => {
  const r = run("paroxetina");
  assert.equal(r.direcionais.length, 0);
});

test("Oxcarbazepina sem substrato CYP não é afetada", () => {
  const r = run("oxcarbazepina", "fluvoxamina");
  assert.ok(!r.direcionais.some((d) => d.vitima.id === "oxcarbazepina"));
});
