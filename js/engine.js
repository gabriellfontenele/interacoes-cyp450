/*
 * Motor de interações CYP450.
 *
 * Regra: para cada par (A, B) de itens selecionados, toda enzima que A inibe ou induz
 * e que aparece entre as enzimas que metabolizam B gera um efeito de A sobre B.
 *   inibe → níveis de B tendem a aumentar
 *   induz → níveis de B tendem a diminuir
 * Competição entre substratos (mesma enzima, sem inibição/indução) não é sinalizada.
 *
 * Interação múltipla: dois ou mais itens diferentes produzindo efeitos sobre o mesmo
 * fármaco (mesma enzima = efeito somado; enzimas diferentes; ou efeitos opostos).
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CYPEngine = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var NIVEIS = { "forte": 5, "moderada a forte": 4, "moderada": 3, "fraca a moderada": 2, "fraca": 1 };

  function nivel(potencia) { return NIVEIS[potencia] || 0; }

  // Peso usado só para ordenar: potência descrita × importância da via no fármaco afetado.
  // Potência não especificada entra no meio da escala.
  function peso(potencia, via) {
    var n = nivel(potencia) || 2.5;
    var v = via === "principal" ? 1 : via === "menor" ? 0.4 : 0.75;
    return n * v;
  }

  function efeitosDe(perp, vitima) {
    if (perp.id === vitima.id) return [];
    var efeitos = [];
    (vitima.substrato || []).forEach(function (s) {
      (perp.inibe || []).forEach(function (i) {
        if (i.enzima === s.enzima) efeitos.push({ enzima: s.enzima, direcao: "inibe", potencia: i.potencia, via: s.via, peso: peso(i.potencia, s.via) });
      });
      (perp.induz || []).forEach(function (i) {
        if (i.enzima === s.enzima) efeitos.push({ enzima: s.enzima, direcao: "induz", potencia: i.potencia, via: s.via, peso: peso(i.potencia, s.via) });
      });
    });
    return efeitos.sort(function (a, b) { return b.peso - a.peso; });
  }

  function direcaoGeral(efeitos) {
    var sobe = efeitos.some(function (e) { return e.direcao === "inibe"; });
    var desce = efeitos.some(function (e) { return e.direcao === "induz"; });
    return sobe && desce ? "misto" : sobe ? "aumenta" : "reduz";
  }

  function alertasPara(vitima, efeitos) {
    return (vitima.alertas || []).filter(function (a) {
      return efeitos.some(function (e) {
        return a.enzimas.indexOf(e.enzima) !== -1 && (a.efeito === "ambos" || a.efeito === e.direcao);
      });
    });
  }

  function citacoesPara(perp, vitima) {
    return (perp.citacoes || []).filter(function (c) { return c.alvo === vitima.id; });
  }

  function maxPeso(lista) {
    return lista.reduce(function (m, x) { return Math.max(m, x.peso); }, 0);
  }

  // Gravidade do alerta descrito: 2 = contraindicação, 1 = risco, 0 = demais
  function gravidade(direcionais) {
    var g = 0;
    direcionais.forEach(function (d) {
      d.alertas.forEach(function (a) {
        if (a.tipo === "contraindicacao") g = 2;
        else if (a.tipo === "risco" && g < 1) g = 1;
      });
    });
    return g;
  }

  function unicos(lista) {
    return lista.filter(function (x, i) { return lista.indexOf(x) === i; });
  }

  /**
   * @param {Array} itens  objetos de fármaco (de CYP_DATA.farmacos), sem repetição
   * @returns {{direcionais, pares, multiplas, semInteracao}}
   */
  function analisar(itens) {
    var direcionais = [];
    itens.forEach(function (v) {
      itens.forEach(function (p) {
        if (p === v) return;
        var ef = efeitosDe(p, v);
        if (!ef.length) return;
        direcionais.push({
          perp: p, vitima: v, efeitos: ef,
          direcao: direcaoGeral(ef),
          peso: maxPeso(ef),
          alertas: alertasPara(v, ef),
          citacoes: citacoesPara(p, v)
        });
      });
    });

    // Pares não ordenados (A + B), cada um com até duas direções (A→B, B→A)
    var pares = [], semInteracao = [];
    for (var i = 0; i < itens.length; i++) {
      for (var j = i + 1; j < itens.length; j++) {
        var a = itens[i], b = itens[j];
        var d = direcionais.filter(function (x) {
          return (x.perp === a && x.vitima === b) || (x.perp === b && x.vitima === a);
        }).sort(function (x, y) { return y.peso - x.peso; });
        if (d.length) pares.push({ a: a, b: b, direcoes: d, peso: maxPeso(d), gravidade: gravidade(d) });
        else semInteracao.push({ a: a, b: b });
      }
    }
    pares.sort(function (x, y) {
      return (y.gravidade - x.gravidade) || (y.peso - x.peso);
    });

    // Interações múltiplas: um fármaco afetado por dois ou mais itens diferentes
    var multiplas = [];
    itens.forEach(function (v) {
      var d = direcionais.filter(function (x) { return x.vitima === v; });
      if (d.length < 2) return;

      var porEnzima = {};
      d.forEach(function (x) {
        x.efeitos.forEach(function (e) {
          var z = porEnzima[e.enzima] || (porEnzima[e.enzima] = { enzima: e.enzima, via: e.via, inibidores: [], indutores: [] });
          (e.direcao === "inibe" ? z.inibidores : z.indutores).push({ perp: x.perp, potencia: e.potencia });
        });
      });
      // na ordem em que aparecem nas vias do fármaco afetado
      var enzimas = (v.substrato || []).map(function (s) { return porEnzima[s.enzima]; }).filter(Boolean);

      var inibidores = unicos(d.filter(function (x) { return x.efeitos.some(function (e) { return e.direcao === "inibe"; }); }).map(function (x) { return x.perp; }));
      var indutores = unicos(d.filter(function (x) { return x.efeitos.some(function (e) { return e.direcao === "induz"; }); }).map(function (x) { return x.perp; }));
      var enzimasInibidas = enzimas.filter(function (z) { return z.inibidores.length; }).map(function (z) { return z.enzima; });
      var enzimasInduzidas = enzimas.filter(function (z) { return z.indutores.length; }).map(function (z) { return z.enzima; });
      var viasCyp = (v.substrato || []).map(function (s) { return s.enzima; });

      var todosEfeitos = [];
      d.forEach(function (x) { todosEfeitos = todosEfeitos.concat(x.efeitos); });

      multiplas.push({
        vitima: v,
        perps: d.map(function (x) { return x.perp; }),
        direcionais: d,
        enzimas: enzimas,
        somaInibicao: enzimas.filter(function (z) { return z.inibidores.length >= 2; }),
        somaInducao: enzimas.filter(function (z) { return z.indutores.length >= 2; }),
        viasDiferentesInibidas: inibidores.length >= 2 && enzimasInibidas.length >= 2,
        viasDiferentesInduzidas: indutores.length >= 2 && enzimasInduzidas.length >= 2,
        todasViasInibidas: viasCyp.length >= 2 && viasCyp.every(function (e) { return enzimasInibidas.indexOf(e) !== -1; }),
        opostos: inibidores.some(function (p) { return indutores.some(function (q) { return q !== p; }); }),
        enzimasInibidas: enzimasInibidas,
        enzimasInduzidas: enzimasInduzidas,
        direcao: direcaoGeral(todosEfeitos),
        alertas: alertasPara(v, todosEfeitos),
        peso: d.reduce(function (s, x) { return s + x.peso; }, 0),
        gravidade: gravidade(d)
      });
    });
    multiplas.sort(function (x, y) {
      return (y.gravidade - x.gravidade) || (y.perps.length - x.perps.length) || (y.peso - x.peso);
    });

    return { direcionais: direcionais, pares: pares, multiplas: multiplas, semInteracao: semInteracao };
  }

  function normalizar(texto) {
    return String(texto || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  }

  return { analisar: analisar, efeitosDe: efeitosDe, nivel: nivel, normalizar: normalizar, NIVEIS: NIVEIS };
});
