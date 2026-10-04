(function () {
  "use strict";

  var DATA = window.CYP_DATA;
  var E = window.CYPEngine;
  var FARMACOS = DATA.farmacos;
  var POR_ID = {};
  var CLASSES = {};
  DATA.classes.forEach(function (c) { CLASSES[c.id] = c; });
  FARMACOS.forEach(function (f) {
    POR_ID[f.id] = f;
    var enz = [].concat(f.substrato, f.inibe, f.induz).map(function (x) { return x.enzima + " " + x.enzima.replace("CYP", ""); });
    f._busca = E.normalizar([f.nome, f.subclasse, CLASSES[f.classe].nome, f.exemplos || ""].concat(f.aliases || [], enz).join(" "));
  });

  /* ───────────── Estado ───────────── */
  var state = {
    sel: [],
    busca: "",
    ordem: "az",
    filtros: { classe: [], inibe: [], induz: [], substrato: [], soSelecionados: false },
    view: "farmacos",
    tema: "auto"
  };
  var scrollFarmacos = 0;
  var installEvent = null;

  function ler(chave, padrao) {
    try { var v = localStorage.getItem(chave); return v === null ? padrao : JSON.parse(v); } catch (e) { return padrao; }
  }
  function gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { /* armazenamento indisponível */ }
  }

  /* ───────────── Utilidades ───────────── */
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  // Remove os marcadores numéricos da fonte (ex.: "[1, 2]"), que não correspondem às referências do app
  function nota(texto) {
    return esc(String(texto || "").replace(/\s?\[[\d,\s\-–]+\]/g, ""));
  }
  function curta(enzima) { return enzima.replace("CYP", ""); }
  function porNome(a, b) { return a.nome.localeCompare(b.nome, "pt"); }
  function lista(nomes) {
    if (nomes.length <= 1) return nomes.join("");
    return nomes.slice(0, -1).join(", ") + " e " + nomes[nomes.length - 1];
  }
  function plural(n, um, varios) { return n + " " + (n === 1 ? um : varios); }

  var ICON = {
    check: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    info: '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/></svg>',
    close: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    up: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/></svg>',
    down: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14M5.5 12.5 12 19l6.5-6.5"/></svg>',
    mixed: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 20V5M4 9l4-4 4 4M16 4v15M12 15l4 4 4-4"/></svg>',
    chevron: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
    alert: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17v.01"/></svg>',
    layers: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5"/></svg>',
    share: '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/></svg>',
    plus: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    pill: '<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-45 12 12)"/><path d="m9.2 9.2 5.6 5.6"/></svg>',
    ok: '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/></svg>'
  };

  function iconeDirecao(d) { return d === "aumenta" || d === "inibe" ? ICON.up : d === "reduz" || d === "induz" ? ICON.down : ICON.mixed; }
  function classeDirecao(d) { return d === "aumenta" || d === "inibe" ? "up" : d === "reduz" || d === "induz" ? "down" : "mixed"; }

  function potenciaTexto(p) {
    return p === "não especificada" ? "potência não especificada" : "potência " + p;
  }
  function viaTexto(via, nome) {
    if (via === "principal") return "via principal de " + nome;
    if (via === "menor") return "via menor de " + nome;
    return "via de metabolização de " + nome;
  }

  /* ───────────── Seleção ───────────── */
  function selecionado(id) { return state.sel.indexOf(id) !== -1; }
  function alternar(id) {
    if (selecionado(id)) state.sel = state.sel.filter(function (x) { return x !== id; });
    else state.sel = state.sel.concat(id);
    gravar("cyp.sel", state.sel);
    atualizarSelecao();
  }
  function limparSelecao() {
    state.sel = [];
    gravar("cyp.sel", state.sel);
    atualizarSelecao();
  }
  function itensSelecionados() { return state.sel.map(function (id) { return POR_ID[id]; }).filter(Boolean); }

  function atualizarSelecao() {
    $$(".drug").forEach(function (li) {
      var on = selecionado(li.dataset.id);
      li.classList.toggle("is-selected", on);
      var b = $(".drug-main", li);
      if (b) b.setAttribute("aria-checked", on ? "true" : "false");
    });
    if (state.filtros.soSelecionados) renderLista();
    renderBandeja();
    if (state.view === "interacoes") renderResultado();
    var dlg = $("#sheet-detalhe");
    if (dlg.open && dlg.dataset.id) atualizarBotaoDetalhe(dlg.dataset.id);
  }

  /* ───────────── Lista ───────────── */
  function filtrados() {
    var q = E.normalizar(state.busca);
    var F = state.filtros;
    return FARMACOS.filter(function (f) {
      if (q && f._busca.indexOf(q) === -1) return false;
      if (F.classe.length && F.classe.indexOf(f.classe) === -1) return false;
      if (F.inibe.length && !f.inibe.some(function (x) { return F.inibe.indexOf(x.enzima) !== -1; })) return false;
      if (F.induz.length && !f.induz.some(function (x) { return F.induz.indexOf(x.enzima) !== -1; })) return false;
      if (F.substrato.length && !f.substrato.some(function (x) { return F.substrato.indexOf(x.enzima) !== -1; })) return false;
      if (F.soSelecionados && !selecionado(f.id)) return false;
      return true;
    });
  }

  function chipsDe(f) {
    var subs = f.substrato.length
      ? f.substrato.map(function (s) {
          var extra = s.via === "principal" ? " <i>principal</i>" : s.via === "menor" ? " <i>menor</i>" : "";
          return '<span class="chip chip-sub' + (s.via === "menor" ? " is-menor" : "") + '">' + curta(s.enzima) + extra + "</span>";
        }).join("")
      : '<span class="chip chip-none">não CYP</span>';
    var h = '<span class="chip-group"><span class="chip-label">metab.</span>' + subs + "</span>";
    if (f.inibe.length) {
      h += '<span class="chip-group"><span class="chip-label">inibe</span>' +
        f.inibe.map(function (x) { return '<span class="chip chip-inibe">' + curta(x.enzima) + "</span>"; }).join("") + "</span>";
    }
    if (f.induz.length) {
      h += '<span class="chip-group"><span class="chip-label">induz</span>' +
        f.induz.map(function (x) { return '<span class="chip chip-induz">' + curta(x.enzima) + "</span>"; }).join("") + "</span>";
    }
    return h;
  }

  function rotuloClasse(f) {
    var c = CLASSES[f.classe];
    return c.singular ? c.singular + " · " + f.subclasse : f.subclasse;
  }

  function linha(f) {
    var on = selecionado(f.id);
    var sub = esc(rotuloClasse(f));
    if (f.exemplos) sub += "<br>ex.: " + esc(f.exemplos);
    return '<li class="drug' + (on ? " is-selected" : "") + '" data-id="' + f.id + '">' +
      '<button type="button" class="drug-main" role="checkbox" aria-checked="' + on + '" data-toggle="' + f.id + '">' +
        '<span class="check">' + ICON.check + "</span>" +
        '<span class="drug-text">' +
          '<span class="drug-name">' + esc(f.nome) + "</span>" +
          '<span class="drug-class">' + sub + "</span>" +
          '<span class="drug-chips">' + chipsDe(f) + "</span>" +
        "</span>" +
      "</button>" +
      '<button type="button" class="drug-info" data-info="' + f.id + '" aria-label="Detalhes de ' + esc(f.nome) + '">' + ICON.info + "</button>" +
    "</li>";
  }

  function renderLista() {
    var itens = filtrados();
    var alvo = $("#lista");
    $("#lista-meta").textContent = itens.length === FARMACOS.length
      ? plural(itens.length, "item", "itens")
      : plural(itens.length, "item encontrado", "itens encontrados") + " de " + FARMACOS.length;

    if (!itens.length) {
      alvo.innerHTML = '<div class="empty"><div class="empty-art">' + ICON.pill + '</div><h2>Nada encontrado</h2><p>Revise a busca ou os filtros.</p>' +
        '<button type="button" class="btn btn-outline" data-acao="limpar-tudo">Limpar busca e filtros</button></div>';
      return;
    }
    if (state.ordem === "classe") {
      var html = "";
      DATA.classes.forEach(function (c) {
        var grupo = itens.filter(function (f) { return f.classe === c.id; }).sort(function (a, b) {
          return a.subclasse.localeCompare(b.subclasse, "pt") || porNome(a, b);
        });
        if (!grupo.length) return;
        html += '<h2 class="group-title">' + esc(c.nome) + " <span>(" + grupo.length + ")</span></h2>" +
          '<ul class="drug-list">' + grupo.map(linha).join("") + "</ul>";
      });
      alvo.innerHTML = html;
    } else {
      alvo.innerHTML = '<ul class="drug-list">' + itens.slice().sort(porNome).map(linha).join("") + "</ul>";
    }
  }

  /* ───────────── Filtros ───────────── */
  var GRUPOS_FILTRO = [
    { chave: "classe", titulo: "Tipo de medicamento", opcoes: function () { return DATA.classes.map(function (c) { return { v: c.id, t: c.nome }; }); } },
    { chave: "inibe", titulo: "Enzima inibida", ajuda: "Fármacos que inibem a enzima (aumentam os níveis de quem ela metaboliza).", estilo: "option-inibe", opcoes: function () { return enzimasEm("inibe"); } },
    { chave: "induz", titulo: "Enzima induzida (estimulada)", ajuda: "Fármacos que induzem a enzima (reduzem os níveis de quem ela metaboliza).", estilo: "option-induz", opcoes: function () { return enzimasEm("induz"); } },
    { chave: "substrato", titulo: "Metabolizado por", opcoes: function () { return enzimasEm("substrato"); } }
  ];
  function enzimasEm(campo) {
    return DATA.enzimas.filter(function (e) {
      return FARMACOS.some(function (f) { return f[campo].some(function (x) { return x.enzima === e; }); });
    }).map(function (e) { return { v: e, t: curta(e) }; });
  }
  function rotuloFiltro(chave, v) {
    if (chave === "classe") return CLASSES[v].nome;
    return { inibe: "Inibe ", induz: "Induz ", substrato: "Metab. " }[chave] + curta(v);
  }
  function nFiltros() {
    var F = state.filtros;
    return F.classe.length + F.inibe.length + F.induz.length + F.substrato.length + (F.soSelecionados ? 1 : 0);
  }

  function renderFiltrosCorpo() {
    var F = state.filtros;
    var html = GRUPOS_FILTRO.map(function (g) {
      return '<div class="filter-group"><h3>' + esc(g.titulo) + "</h3>" + (g.ajuda ? "<p>" + esc(g.ajuda) + "</p>" : "") +
        '<div class="option-chips">' + g.opcoes().map(function (o) {
          var on = F[g.chave].indexOf(o.v) !== -1;
          return '<button type="button" class="option ' + (g.estilo || "") + '" aria-pressed="' + on + '" data-filtro="' + g.chave + '" data-valor="' + o.v + '">' + esc(o.t) + "</button>";
        }).join("") + "</div></div>";
    }).join("");
    html += '<div class="filter-group"><h3>Seleção</h3><div class="option-chips">' +
      '<button type="button" class="option" aria-pressed="' + F.soSelecionados + '" data-filtro="soSelecionados">Somente selecionados</button></div></div>';
    $("#filtros-corpo").innerHTML = html;
    var n = filtrados().length;
    $("#filtros-aplicar").textContent = "Ver " + plural(n, "resultado", "resultados");
  }

  function renderFiltrosAtivos() {
    var F = state.filtros, pills = [];
    ["classe", "inibe", "induz", "substrato"].forEach(function (k) {
      F[k].forEach(function (v) {
        pills.push('<button type="button" class="filter-pill" data-remover-filtro="' + k + '" data-valor="' + v + '" aria-label="Remover filtro ' + esc(rotuloFiltro(k, v)) + '">' + esc(rotuloFiltro(k, v)) + ICON.close + "</button>");
      });
    });
    if (F.soSelecionados) pills.push('<button type="button" class="filter-pill" data-remover-filtro="soSelecionados" aria-label="Remover filtro Somente selecionados">Somente selecionados' + ICON.close + "</button>");
    $("#filtros-ativos").innerHTML = pills.join("");
    var n = nFiltros();
    var badge = $("#filtros-n");
    badge.hidden = n === 0;
    badge.textContent = n;
  }

  function alternarFiltro(chave, valor) {
    var F = state.filtros;
    if (chave === "soSelecionados") F.soSelecionados = !F.soSelecionados;
    else if (F[chave].indexOf(valor) !== -1) F[chave] = F[chave].filter(function (x) { return x !== valor; });
    else F[chave] = F[chave].concat(valor);
    gravar("cyp.filtros", F);
    renderFiltrosAtivos();
    renderLista();
    if ($("#sheet-filtros").open) renderFiltrosCorpo();
  }

  function limparFiltros() {
    state.filtros = { classe: [], inibe: [], induz: [], substrato: [], soSelecionados: false };
    gravar("cyp.filtros", state.filtros);
    renderFiltrosAtivos();
    renderLista();
    if ($("#sheet-filtros").open) renderFiltrosCorpo();
  }

  /* ───────────── Bandeja e badge ───────────── */
  var analiseCache = null;
  function analise() {
    var chave = state.sel.join(",");
    if (!analiseCache || analiseCache.chave !== chave) analiseCache = { chave: chave, r: E.analisar(itensSelecionados()) };
    return analiseCache.r;
  }

  function renderBandeja() {
    var n = state.sel.length;
    var r = n >= 2 ? analise() : null;
    var bandeja = $("#bandeja");
    bandeja.hidden = !(n > 0 && state.view === "farmacos");
    $("#bandeja-n").textContent = plural(n, "selecionado", "selecionados");
    if (r) {
      $("#bandeja-resumo").textContent = r.multiplas.length
        ? plural(r.pares.length, "par", "pares") + " · " + plural(r.multiplas.length, "múltipla", "múltiplas")
        : r.pares.length ? plural(r.pares.length, "par com interação", "pares com interação") : "Nenhuma interação por CYP";
    } else {
      $("#bandeja-resumo").textContent = n === 1 ? "Selecione mais um para cruzar" : "";
    }
    var badge = $("#tab-badge");
    var total = r ? r.pares.length : 0;
    badge.hidden = total === 0;
    badge.textContent = total;
    var tab = $('.tabbar [data-view="interacoes"]');
    tab.setAttribute("aria-label", "Interações" + (total ? ", " + plural(total, "par com interação", "pares com interação") : ""));
  }

  /* ───────────── Interações ───────────── */
  function quoteAlerta(a, nome) {
    var rot = { contraindicacao: "Contraindicação · ", risco: "Risco descrito · ", ajuste: "Ajuste de dose · " }[a.tipo] || "Observação · ";
    return '<div class="quote is-' + a.tipo + '"><b>' + esc(rot + nome) + "</b>" + esc(a.texto) + "</div>";
  }
  function quoteCitacao(c, nome) {
    return '<div class="quote"><b>Combinação citada · ' + esc(nome) + "</b>" + esc(c.texto) + "</div>";
  }

  function blocoDirecao(d) {
    var v = d.vitima.nome;
    var titulo = d.direcao === "aumenta" ? "Níveis de " + v + " podem aumentar"
      : d.direcao === "reduz" ? "Níveis de " + v + " podem diminuir"
      : "Efeitos opostos sobre os níveis de " + v;
    var itens = d.efeitos.map(function (e) {
      var acao = e.direcao === "inibe" ? "inibe" : "induz";
      return "<li>" + esc(d.perp.nome) + ' <span class="' + (e.direcao === "inibe" ? "is-up" : "is-down") + '">' + acao + " a " + e.enzima + "</span>" +
        '<span class="meta">' + esc(potenciaTexto(e.potencia)) + " · " + esc(viaTexto(e.via, v)) + "</span></li>";
    }).join("");
    return '<div class="dir">' +
      '<div class="dir-head"><span class="effect-dot ' + classeDirecao(d.direcao) + '">' + iconeDirecao(d.direcao) + "</span><span>" + esc(titulo) + "</span></div>" +
      '<ul class="mech">' + itens + "</ul>" +
      d.alertas.map(function (a) { return quoteAlerta(a, v); }).join("") +
      d.citacoes.map(function (c) { return quoteCitacao(c, c.fonte ? POR_ID[c.fonte].nome : d.perp.nome); }).join("") +
    "</div>";
  }

  function cardPar(p) {
    var tags = p.gravidade ? '<span class="tag tag-danger">' + ICON.alert + (p.gravidade === 2 ? "Contraindicação" : "Risco descrito") + "</span>" : "";
    return '<article class="card' + (p.gravidade ? " is-danger" : "") + '">' +
      '<div class="card-head"><h3 class="card-title">' + esc(p.a.nome) + '<span class="plus"> + </span>' + esc(p.b.nome) + "</h3>" + tags + "</div>" +
      p.direcoes.map(blocoDirecao).join("") +
    "</article>";
  }

  function tagDirecao(d) {
    var t = d === "aumenta" ? "níveis ↑" : d === "reduz" ? "níveis ↓" : "efeito misto";
    return '<span class="tag tag-' + classeDirecao(d) + '">' + esc(t) + "</span>";
  }

  function cardMultipla(m) {
    var v = m.vitima.nome;
    var nomes = function (lst) { return lista(lst.map(function (x) { return x.perp.nome; })); };
    var flags = [];
    m.somaInibicao.forEach(function (z) {
      flags.push('<li class="is-up">' + ICON.up + "<span><b>Inibição somada da " + z.enzima + ":</b> " + esc(nomes(z.inibidores)) + " inibem a mesma enzima.</span></li>");
    });
    m.somaInducao.forEach(function (z) {
      flags.push('<li class="is-down">' + ICON.down + "<span><b>Indução somada da " + z.enzima + ":</b> " + esc(nomes(z.indutores)) + " induzem a mesma enzima.</span></li>");
    });
    if (m.viasDiferentesInibidas && !m.todasViasInibidas) {
      flags.push('<li class="is-up">' + ICON.layers + "<span><b>Vias diferentes inibidas ao mesmo tempo:</b> " + esc(lista(m.enzimasInibidas)) + ".</span></li>");
    }
    if (m.todasViasInibidas) {
      flags.push('<li class="is-up">' + ICON.layers + "<span><b>Todas as vias CYP de " + esc(v) + " estão inibidas ao mesmo tempo:</b> " + esc(lista(m.enzimasInibidas)) + ".</span></li>");
    }
    if (m.viasDiferentesInduzidas) {
      flags.push('<li class="is-down">' + ICON.layers + "<span><b>Vias diferentes induzidas ao mesmo tempo:</b> " + esc(lista(m.enzimasInduzidas)) + ".</span></li>");
    }
    if (m.opostos) {
      flags.push("<li>" + ICON.mixed + "<span><b>Efeitos opostos:</b> há inibição e indução sobre o metabolismo de " + esc(v) + "; o resultado final é difícil de prever.</span></li>");
    }
    if (!flags.length) flags.push("<li>" + ICON.layers + "<span>Dois ou mais fármacos atuam sobre o metabolismo de " + esc(v) + ".</span></li>");

    var linhas = m.enzimas.map(function (z) {
      var via = z.via === "principal" ? "via principal" : z.via === "menor" ? "via menor" : "";
      var cel = z.inibidores.map(function (x) {
        return '<span><span class="txt-up">↑ ' + esc(x.perp.nome) + "</span> · " + esc(x.potencia) + "</span>";
      }).concat(z.indutores.map(function (x) {
        return '<span><span class="txt-down">↓ ' + esc(x.perp.nome) + "</span> · " + esc(x.potencia) + "</span>";
      })).join("");
      return "<tr><th scope=\"row\">" + z.enzima + (via ? "<i>" + via + "</i>" : "") + "</th><td>" + cel + "</td></tr>";
    }).join("");

    return '<article class="card is-multi' + (m.gravidade ? " is-danger" : "") + '">' +
      '<div class="card-head"><div><h3 class="card-title">' + esc(v) + "</h3>" +
        '<p class="card-sub">afetado por ' + esc(lista(m.perps.map(function (p) { return p.nome; }))) + "</p></div>" +
        tagDirecao(m.direcao) + "</div>" +
      '<ul class="flags">' + flags.join("") + "</ul>" +
      '<table class="enz-table"><caption class="sr-only">Enzimas de ' + esc(v) + " afetadas</caption><tbody>" + linhas + "</tbody></table>" +
      m.alertas.map(function (a) { return quoteAlerta(a, v); }).join("") +
    "</article>";
  }

  function blocoNotas(itens) {
    return '<details class="block"><summary>Observações dos selecionados' + ICON.chevron + "</summary>" +
      '<div class="block-body">' + itens.map(function (f) {
        return '<div class="note-item"><h3>' + esc(f.nome) + "</h3><p>" + nota(f.original.notas) + "</p>" +
          (f.outrasVias ? '<p class="card-sub">Outras vias: ' + esc(f.outrasVias) + "</p>" : "") + "</div>";
      }).join("") + "</div></details>";
  }

  function renderResultado() {
    var alvo = $("#resultado");
    var itens = itensSelecionados();

    if (!itens.length) {
      alvo.innerHTML = '<div class="empty"><div class="empty-art">' + ICON.pill + "</div><h2>Nenhum fármaco selecionado</h2>" +
        "<p>Escolha dois ou mais fármacos na lista para cruzar as interações pelo CYP450.</p>" +
        '<button type="button" class="btn btn-primary" data-ir="farmacos">Escolher fármacos</button></div>';
      return;
    }

    var html = '<div class="sel-bar">' + itens.map(function (f) {
      return '<span class="sel-chip">' + esc(f.nome) + '<button type="button" data-remover="' + f.id + '" aria-label="Remover ' + esc(f.nome) + '">' + ICON.close + "</button></span>";
    }).join("") +
      '<div class="sel-actions">' +
        '<button type="button" class="btn btn-outline btn-sm" data-ir="farmacos">' + ICON.plus + "Adicionar</button>" +
        '<button type="button" class="btn btn-ghost btn-sm" data-acao="limpar-selecao">Limpar</button>' +
      "</div></div>";

    if (itens.length < 2) {
      html += '<div class="empty"><div class="empty-art">' + ICON.plus + "</div><h2>Selecione mais um fármaco</h2>" +
        "<p>São necessários pelo menos dois itens para cruzar as interações.</p>" +
        '<button type="button" class="btn btn-primary" data-ir="farmacos">Escolher fármacos</button></div>';
      html += blocoNotas(itens);
      alvo.innerHTML = html;
      return;
    }

    var r = analise();
    html += '<div class="summary">' +
      '<div class="stat' + (r.pares.length ? " is-alert" : "") + '"><b>' + r.pares.length + "</b><span>" + (r.pares.length === 1 ? "par com interação" : "pares com interação") + "</span></div>" +
      '<div class="stat' + (r.multiplas.length ? " is-alert" : "") + '"><b>' + r.multiplas.length + "</b><span>" + (r.multiplas.length === 1 ? "interação múltipla" : "interações múltiplas") + "</span></div>" +
      '<div class="stat"><b>' + r.semInteracao.length + "</b><span>" + (r.semInteracao.length === 1 ? "par sem interação" : "pares sem interação") + "</span></div>" +
    "</div>";

    if (r.multiplas.length) {
      html += '<h2 class="section-title">Interações múltiplas</h2>' +
        '<p class="section-help">Fármacos afetados por dois ou mais itens ao mesmo tempo.</p>' +
        '<div class="cards">' + r.multiplas.map(cardMultipla).join("") + "</div>";
    }

    html += '<h2 class="section-title">Interações entre pares</h2>';
    if (r.pares.length) {
      html += '<div class="cards">' + r.pares.map(cardPar).join("") + "</div>";
    } else {
      html += '<div class="card"><div class="dir-head"><span class="effect-dot mixed">' + ICON.ok + "</span><span>Nenhuma interação por inibição ou indução do CYP450 foi identificada entre os selecionados.</span></div></div>";
    }

    html += '<h2 class="section-title">Mais informações</h2>';
    if (r.semInteracao.length) {
      html += '<details class="block"><summary>' + plural(r.semInteracao.length, "par sem interação", "pares sem interação") + " por CYP450" + ICON.chevron + "</summary>" +
        '<div class="block-body"><ul class="plain-list">' + r.semInteracao.map(function (p) {
          return "<li>" + esc(p.a.nome) + " + " + esc(p.b.nome) + "</li>";
        }).join("") + "</ul></div></details>";
    }
    html += blocoNotas(itens);
    html += '<div class="disclaimer" role="note"><strong>Aviso.</strong> Resultado restrito às interações por inibição e indução do CYP450 descritas nas referências do app. Não substitui o julgamento clínico, a bula nem fontes atualizadas.</div>';
    html += '<p class="share-row"><button type="button" class="btn btn-outline" data-acao="compartilhar">' + ICON.share + "Compartilhar combinação</button></p>";

    alvo.innerHTML = html;
  }

  /* ───────────── Detalhe ───────────── */
  function renderDetalhe(id) {
    var f = POR_ID[id];
    var dlg = $("#sheet-detalhe");
    dlg.dataset.id = id;
    $("#t-detalhe").textContent = f.nome;

    var subs = f.substrato.length
      ? '<div class="drug-chips">' + f.substrato.map(function (s) {
          var extra = s.via === "principal" ? " <i>principal</i>" : s.via === "menor" ? " <i>menor</i>" : "";
          return '<span class="chip chip-sub' + (s.via === "menor" ? " is-menor" : "") + '">' + s.enzima + extra + "</span>";
        }).join("") + "</div>"
      : "<p>Nenhuma enzima CYP listada.</p>";
    if (f.outrasVias) subs += '<p class="card-sub outras-vias">Outras vias: ' + esc(f.outrasVias) + "</p>";

    function kv(lst, cls, vazio) {
      if (!lst.length) return "<p>" + vazio + "</p>";
      return '<ul class="kv">' + lst.map(function (x) {
        return '<li><span class="chip ' + cls + '">' + x.enzima + '</span><span class="pot">' + esc(potenciaTexto(x.potencia)) + "</span></li>";
      }).join("") + "</ul>";
    }

    var html = '<p class="detail-meta">' + esc(rotuloClasse(f)) + (f.exemplos ? "<br>ex.: " + esc(f.exemplos) : "") + "</p>" +
      '<section class="detail-sec"><h3>Metabolizado por</h3>' + subs + "</section>" +
      '<section class="detail-sec"><h3>Inibe</h3>' + kv(f.inibe, "chip-inibe", "Nenhuma inibição relevante descrita.") + "</section>" +
      '<section class="detail-sec"><h3>Induz</h3>' + kv(f.induz, "chip-induz", "Nenhuma indução descrita.") + "</section>";

    if ((f.alertas || []).length) {
      html += '<section class="detail-sec"><h3>Quando combinado</h3>' + f.alertas.map(function (a) {
        var alvo = a.efeito === "inibe" ? "inibidores" : a.efeito === "induz" ? "indutores" : "inibidores ou indutores";
        return quoteAlerta(a, alvo + " da " + a.enzimas.map(curta).join("/"));
      }).join("") + "</section>";
    }

    var o = f.original;
    html += '<section class="detail-sec"><h3>Descrição completa</h3><table class="source-table"><tbody>' +
      (o.metabolizado ? '<tr><th scope="row">Metabolizado por</th><td>' + esc(o.metabolizado) + "</td></tr>" : "") +
      (o.acao ? '<tr><th scope="row">Ação na enzima</th><td>' + esc(o.acao) + "</td></tr>" : '<tr><th scope="row">Ação na enzima</th><td>—</td></tr>') +
      '<tr><th scope="row">Potência / notas</th><td>' + nota(o.notas) + "</td></tr>" +
    "</tbody></table></section>";

    $("#detalhe-corpo").innerHTML = html;
    $("#detalhe-corpo").scrollTop = 0;
    atualizarBotaoDetalhe(id);
  }
  function atualizarBotaoDetalhe(id) {
    var b = $("#detalhe-selecionar");
    var on = selecionado(id);
    b.textContent = on ? "Remover da seleção" : "Selecionar";
    b.className = "btn btn-block " + (on ? "btn-outline" : "btn-primary");
  }

  /* ───────────── Dialogs ───────────── */
  var ultimoFoco = null;
  function abrir(dlg) {
    ultimoFoco = document.activeElement;
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    document.documentElement.style.overflow = "hidden";
  }
  function fechar(dlg) {
    if (typeof dlg.close === "function") dlg.close(); else dlg.removeAttribute("open");
  }
  $$("dialog.sheet").forEach(function (dlg) {
    dlg.addEventListener("close", function () {
      document.documentElement.style.overflow = "";
      if (ultimoFoco && document.contains(ultimoFoco)) ultimoFoco.focus({ preventScroll: true });
    });
    dlg.addEventListener("click", function (ev) {
      if (ev.target === dlg) fechar(dlg);
      if (ev.target.closest("[data-fechar]")) fechar(dlg);
    });
  });

  /* ───────────── Navegação ───────────── */
  var VIEWS = ["farmacos", "interacoes", "sobre"];
  function mostrar(view, rolar) {
    if (VIEWS.indexOf(view) === -1) view = "farmacos";
    if (state.view === "farmacos") scrollFarmacos = window.scrollY;
    state.view = view;
    VIEWS.forEach(function (v) { $("#view-" + v).hidden = v !== view; });
    $$(".tabbar button").forEach(function (b) {
      if (b.dataset.view === view) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
    if (view === "interacoes") renderResultado();
    renderBandeja();
    if (rolar !== false) window.scrollTo(0, view === "farmacos" ? scrollFarmacos : 0);
  }
  function irPara(view) {
    if (location.hash !== "#" + view) location.hash = view;
    else mostrar(view);
  }
  window.addEventListener("hashchange", function () { mostrar(location.hash.slice(1)); });

  /* ───────────── Tema ───────────── */
  function aplicarTema(t) {
    state.tema = t;
    var root = document.documentElement;
    if (t === "light" || t === "dark") root.dataset.theme = t; else delete root.dataset.theme;
    try { if (t === "auto") localStorage.removeItem("cyp.tema"); else localStorage.setItem("cyp.tema", t); } catch (e) {}
    $$("[data-tema]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.tema === t ? "true" : "false"); });
    var escuro = t === "dark" || (t === "auto" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
    $$('meta[name="theme-color"]').forEach(function (m) { m.setAttribute("content", escuro ? "#0e2c3d" : "#ffffff"); });
  }

  /* ───────────── Compartilhar ───────────── */
  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.hidden = true; }, 2400);
  }
  function compartilhar() {
    var url = location.origin + location.pathname + "?s=" + encodeURIComponent(state.sel.join(",")) + "#interacoes";
    var texto = "Interações CYP450: " + itensSelecionados().map(function (f) { return f.nome; }).join(" + ");
    if (navigator.share) {
      navigator.share({ title: "Interações CYP450", text: texto, url: url }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function () { toast("Link copiado"); }, function () { toast("Não foi possível copiar o link"); });
    }
  }

  /* ───────────── Eventos ───────────── */
  document.addEventListener("click", function (ev) {
    var el = ev.target.closest("[data-toggle],[data-info],[data-ir],[data-view],[data-remover],[data-acao],[data-filtro],[data-remover-filtro],[data-ordem],[data-tema]");
    if (!el) return;
    var d = el.dataset;
    if (d.toggle) return alternar(d.toggle);
    if (d.info) { renderDetalhe(d.info); return abrir($("#sheet-detalhe")); }
    if (d.ir) return irPara(d.ir);
    if (d.view) return irPara(d.view);
    if (d.remover) return alternar(d.remover);
    if (d.filtro) return alternarFiltro(d.filtro, d.valor);
    if (d.removerFiltro) return alternarFiltro(d.removerFiltro, d.valor);
    if (d.ordem) {
      state.ordem = d.ordem;
      gravar("cyp.ordem", state.ordem);
      $$("[data-ordem]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.ordem === state.ordem ? "true" : "false"); });
      return renderLista();
    }
    if (d.tema) return aplicarTema(d.tema);
    if (d.acao === "limpar-selecao") return limparSelecao();
    if (d.acao === "compartilhar") return compartilhar();
    if (d.acao === "limpar-tudo") {
      state.busca = ""; $("#busca").value = ""; $("#busca-limpar").hidden = true;
      return limparFiltros();
    }
  });

  var busca = $("#busca");
  busca.addEventListener("input", function () {
    state.busca = busca.value;
    $("#busca-limpar").hidden = !busca.value;
    renderLista();
  });
  busca.addEventListener("keydown", function (ev) { if (ev.key === "Enter") busca.blur(); });
  $("#busca-limpar").addEventListener("click", function () {
    busca.value = ""; state.busca = "";
    $("#busca-limpar").hidden = true;
    renderLista();
    busca.focus();
  });

  $("#abrir-filtros").addEventListener("click", function () { renderFiltrosCorpo(); abrir($("#sheet-filtros")); });
  $("#filtros-limpar").addEventListener("click", limparFiltros);
  $("#bandeja-ver").addEventListener("click", function () { irPara("interacoes"); });
  $("#detalhe-selecionar").addEventListener("click", function () {
    var id = $("#sheet-detalhe").dataset.id;
    if (id) alternar(id);
  });

  window.addEventListener("beforeinstallprompt", function (ev) {
    ev.preventDefault();
    installEvent = ev;
    $("#instalar").hidden = false;
  });
  $("#instalar").addEventListener("click", function () {
    if (!installEvent) return;
    installEvent.prompt();
    installEvent.userChoice.finally(function () { installEvent = null; $("#instalar").hidden = true; });
  });
  window.addEventListener("appinstalled", function () { $("#instalar").hidden = true; });

  /* ───────────── Início ───────────── */
  function iniciar() {
    state.sel = ler("cyp.sel", []).filter(function (id) { return POR_ID[id]; });
    state.ordem = ler("cyp.ordem", "az") === "classe" ? "classe" : "az";
    var f = ler("cyp.filtros", null);
    if (f && typeof f === "object") {
      ["classe", "inibe", "induz", "substrato"].forEach(function (k) { if (Array.isArray(f[k])) state.filtros[k] = f[k]; });
      state.filtros.soSelecionados = !!f.soSelecionados;
    }

    // Link compartilhado: ?s=id1,id2
    var params = new URLSearchParams(location.search);
    if (params.has("s")) {
      var ids = params.get("s").split(",").filter(function (id, i, arr) { return POR_ID[id] && arr.indexOf(id) === i; });
      if (ids.length) { state.sel = ids; gravar("cyp.sel", ids); }
      history.replaceState(null, "", location.pathname + location.hash);
    }

    var tema = "auto";
    try { tema = localStorage.getItem("cyp.tema") || "auto"; } catch (e) {}
    aplicarTema(tema === "light" || tema === "dark" ? tema : "auto");
    if (window.matchMedia) {
      var mq = matchMedia("(prefers-color-scheme: dark)");
      var onChange = function () { if (state.tema === "auto") aplicarTema("auto"); };
      if (mq.addEventListener) mq.addEventListener("change", onChange); else if (mq.addListener) mq.addListener(onChange);
    }

    $$("[data-ordem]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.ordem === state.ordem ? "true" : "false"); });
    var nTab = FARMACOS.filter(function (x) { return x.classe !== "fatores"; }).length;
    $("#sobre-refs").innerHTML = DATA.referencias.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("");
    $("#sobre-fonte").textContent = "Base de dados com " + nTab + " fármacos (antidepressivos, antipsicóticos, anticonvulsivantes e outros) " +
      "e o tabagismo como fator. Versão dos dados: " + DATA.versao.split("-").reverse().join("/") + ".";

    renderFiltrosAtivos();
    renderLista();
    mostrar(location.hash.slice(1) || "farmacos", false);

    if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
      window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
    }
  }

  iniciar();
})();
