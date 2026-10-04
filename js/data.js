/*
 * Base de dados do app — gerada a partir de
 * dados_referenciais/Psicofármacos e Interações CYP450.xlsx (abas Table 1, 2 e 3).
 *
 * Cada fármaco guarda:
 *  - substrato: enzimas que o metabolizam (via: "principal" | "menor" | null)
 *  - outrasVias: vias não CYP citadas na planilha (texto)
 *  - inibe / induz: enzimas inibidas / induzidas e a potência descrita na planilha
 *  - alertas: frases da planilha sobre o próprio fármaco quando outro inibe/induz suas vias
 *  - citacoes: combinações citadas explicitamente nas notas (alvo = id de outro fármaco;
 *    fonte = id do fármaco em cuja nota a frase aparece, quando não é o próprio)
 *  - alertas.tipo: contraindicacao | risco | ajuste | atencao
 *  - original: texto literal das colunas da planilha (os números entre colchetes são
 *    marcadores da fonte e não são exibidos no app)
 *  - revisao: interpretações feitas na estruturação, para conferência
 *
 * Potências reconhecidas (ordem decrescente): forte, moderada a forte, moderada,
 * fraca a moderada, fraca. Qualquer outro texto é exibido como está.
 */
window.CYP_DATA = {
  versao: "2026-10-03",
  fonte: "Psicofármacos e Interações CYP450.xlsx",

  // Referências exibidas no app (Vancouver)
  referencias: [
    "Cordioli AV, Gallois CB, Passos IC, organizadores. Psicofármacos: consulta rápida. 6. ed. Porto Alegre: Artmed; 2023.",
    "Stahl SM. Stahl psicofarmacologia: bases neurocientíficas e aplicações práticas. 5. ed. Rio de Janeiro: Guanabara Koogan; 2022.",
    "Meyer JM, Stahl SM. The clozapine handbook. Cambridge: Cambridge University Press; 2020.",
    "Stahl SM. Fundamentos de psicofarmacologia de Stahl: guia de prescrição. 6. ed. Porto Alegre: Artmed; 2019."
  ],

  enzimas: ["CYP1A2", "CYP2B6", "CYP2C9", "CYP2C19", "CYP2D6", "CYP3A4"],

  classes: [
    { id: "antidepressivos", nome: "Antidepressivos", singular: "Antidepressivo", aba: "Table 1" },
    { id: "antipsicoticos", nome: "Antipsicóticos", singular: "Antipsicótico", aba: "Table 2" },
    { id: "outros", nome: "Anticonvulsivantes e outros", aba: "Table 3" },
    { id: "fatores", nome: "Fatores", aba: null }
  ],

  farmacos: [
    /* ───────────── Table 1 — Antidepressivos ───────────── */
    {
      id: "fluoxetina", nome: "Fluoxetina", classe: "antidepressivos", subclasse: "ISRS",
      substrato: [{ enzima: "CYP2D6", via: "principal" }],
      inibe: [
        { enzima: "CYP2D6", potencia: "forte" },
        { enzima: "CYP2C19", potencia: "forte" },
        { enzima: "CYP3A4", potencia: "moderada a forte" }
      ],
      induz: [],
      citacoes: [{ alvo: "triciclicos", texto: "Aumenta níveis de tricíclicos e betabloqueadores." }],
      original: {
        metabolizado: "CYP2D6 (principal)",
        acao: "Inibe CYP2D6 · Inibe CYP3A4 · Inibe CYP2C19",
        notas: "Forte inibidor da 2D6 e 2C19; moderada a forte na 3A4 [1, 2]. Aumenta níveis de tricíclicos e betabloqueadores [2, 3]."
      }
    },
    {
      id: "paroxetina", nome: "Paroxetina", classe: "antidepressivos", subclasse: "ISRS",
      substrato: [{ enzima: "CYP2D6", via: null }],
      inibe: [{ enzima: "CYP2D6", potencia: "forte" }],
      induz: [],
      original: {
        metabolizado: "CYP2D6",
        acao: "Inibe CYP2D6",
        notas: "Forte inibidor da 2D6. Inibe seu próprio metabolismo (cinética não linear) [4]."
      }
    },
    {
      id: "fluvoxamina", nome: "Fluvoxamina", classe: "antidepressivos", subclasse: "ISRS",
      substrato: [{ enzima: "CYP1A2", via: null }, { enzima: "CYP2D6", via: null }],
      inibe: [
        { enzima: "CYP1A2", potencia: "forte" },
        { enzima: "CYP2C19", potencia: "forte" },
        { enzima: "CYP3A4", potencia: "moderada a forte" }
      ],
      induz: [],
      citacoes: [{ alvo: "clozapina", texto: "Aumenta drasticamente níveis de clozapina, teofilina e cafeína." }],
      original: {
        metabolizado: "CYP1A2, 2D6",
        acao: "Inibe CYP1A2 · Inibe CYP2C19 · Inibe CYP3A4",
        notas: "Forte inibidor da 1A2 e 2C19; moderada/forte na 3A4. Aumenta drasticamente níveis de clozapina, teofilina e cafeína [3, 5]."
      },
      revisao: ["\"moderada/forte\" na 3A4 registrada como \"moderada a forte\"."]
    },
    {
      id: "sertralina", nome: "Sertralina", classe: "antidepressivos", subclasse: "ISRS",
      substrato: [
        { enzima: "CYP2C19", via: null }, { enzima: "CYP2B6", via: null },
        { enzima: "CYP2C9", via: null }, { enzima: "CYP3A4", via: null },
        { enzima: "CYP2D6", via: null }
      ],
      inibe: [
        { enzima: "CYP2D6", potencia: "fraca a moderada" },
        { enzima: "CYP2C19", potencia: "não especificada" },
        { enzima: "CYP3A4", potencia: "não especificada" }
      ],
      induz: [],
      original: {
        metabolizado: "CYP2C19, 2B6, 2C9, 3A4, 2D6",
        acao: "Inibe CYP2D6 · Inibe CYP2C19 e 3A4",
        notas: "Inibição da 2D6 é fraca a moderada (dose-dependente) [5, 6]."
      },
      revisao: ["A nota só descreve a potência na 2D6; 2C19 e 3A4 ficaram como \"não especificada\"."]
    },
    {
      id: "citalopram", nome: "Citalopram", classe: "antidepressivos", subclasse: "ISRS",
      substrato: [{ enzima: "CYP2C19", via: null }, { enzima: "CYP3A4", via: null }],
      inibe: [{ enzima: "CYP2D6", potencia: "fraca" }],
      induz: [],
      original: {
        metabolizado: "CYP2C19, 3A4",
        acao: "Inibe CYP2D6 (Fraco)",
        notas: "Baixo potencial de interação; inibição fraca da 2D6 [7]."
      }
    },
    {
      id: "escitalopram", nome: "Escitalopram", classe: "antidepressivos", subclasse: "ISRS",
      substrato: [{ enzima: "CYP2C19", via: null }, { enzima: "CYP3A4", via: null }],
      inibe: [],
      induz: [],
      original: {
        metabolizado: "CYP2C19, 3A4",
        acao: "Inibição mínima",
        notas: "Considerado o ISRS com menor interação nas enzimas CYP [8]."
      },
      revisao: ["\"Inibição mínima\" sem enzima indicada: tratado como sem inibição relevante."]
    },
    {
      id: "bupropiona", nome: "Bupropiona", classe: "antidepressivos", subclasse: "IRND",
      substrato: [{ enzima: "CYP2B6", via: null }],
      inibe: [{ enzima: "CYP2D6", potencia: "moderada a forte" }],
      induz: [],
      citacoes: [
        { alvo: "venlafaxina", texto: "Aumenta níveis de venlafaxina, tricíclicos e atomoxetina." },
        { alvo: "triciclicos", texto: "Aumenta níveis de venlafaxina, tricíclicos e atomoxetina." }
      ],
      original: {
        metabolizado: "CYP2B6",
        acao: "Inibe CYP2D6",
        notas: "Forte (segundo Stahl) ou Moderada inibição da 2D6. Aumenta níveis de venlafaxina, tricíclicos e atomoxetina [9, 10]."
      },
      revisao: ["\"Forte (segundo Stahl) ou Moderada\" registrada como \"moderada a forte\"."]
    },
    {
      id: "duloxetina", nome: "Duloxetina", classe: "antidepressivos", subclasse: "IRSN",
      substrato: [{ enzima: "CYP1A2", via: null }, { enzima: "CYP2D6", via: null }],
      inibe: [{ enzima: "CYP2D6", potencia: "moderada a forte" }],
      induz: [],
      original: {
        metabolizado: "CYP1A2, 2D6",
        acao: "Inibe CYP2D6",
        notas: "Moderada a potente inibidora da 2D6 [11]."
      },
      revisao: ["\"Moderada a potente\" registrada como \"moderada a forte\"."]
    },
    {
      id: "venlafaxina", nome: "Venlafaxina", classe: "antidepressivos", subclasse: "IRSN",
      substrato: [{ enzima: "CYP2D6", via: null }],
      inibe: [],
      induz: [],
      original: {
        metabolizado: "CYP2D6",
        acao: "Inibição fraca",
        notas: "Substrato da 2D6 (converte em desvenlafaxina). Baixo potencial de inibição [12, 13]."
      },
      revisao: ["\"Inibição fraca\" sem enzima indicada: tratado como sem inibição relevante."]
    },
    {
      id: "desvenlafaxina", nome: "Desvenlafaxina", classe: "antidepressivos", subclasse: "IRSN",
      substrato: [{ enzima: "CYP3A4", via: "menor" }],
      outrasVias: "Conjugação (não CYP) — via principal",
      inibe: [],
      induz: [],
      original: {
        metabolizado: "CYP3A4 (mínimo)",
        acao: "",
        notas: "Metabolismo primário por conjugação (não CYP), baixo risco de interação [14]."
      },
      revisao: ["\"CYP3A4 (mínimo)\" registrada como via menor."]
    },
    {
      id: "mirtazapina", nome: "Mirtazapina", classe: "antidepressivos", subclasse: "NaSSA",
      substrato: [
        { enzima: "CYP1A2", via: null }, { enzima: "CYP2D6", via: null }, { enzima: "CYP3A4", via: null }
      ],
      inibe: [],
      induz: [],
      original: {
        metabolizado: "CYP1A2, 2D6, 3A4",
        acao: "Inibição mínima",
        notas: "Perfil favorável de interações; não inibe significativamente as isoenzimas [15]."
      },
      revisao: ["\"Inibição mínima\" sem enzima indicada: tratado como sem inibição relevante."]
    },
    {
      id: "agomelatina", nome: "Agomelatina", classe: "antidepressivos", subclasse: "Agonista melatoninérgico",
      substrato: [{ enzima: "CYP1A2", via: "principal" }],
      inibe: [],
      induz: [],
      alertas: [
        { enzimas: ["CYP1A2"], efeito: "inibe", tipo: "contraindicacao",
          texto: "Contraindicada com inibidores potentes da 1A2 (ex: fluvoxamina)." }
      ],
      original: {
        metabolizado: "CYP1A2 (90%)",
        acao: "",
        notas: "Contraindicada com inibidores potentes da 1A2 (ex: fluvoxamina) [5, 16]."
      },
      revisao: ["\"CYP1A2 (90%)\" registrada como via principal."]
    },
    {
      id: "nefazodona", nome: "Nefazodona", classe: "antidepressivos", subclasse: "AIRS",
      substrato: [{ enzima: "CYP3A4", via: null }],
      inibe: [{ enzima: "CYP3A4", potencia: "forte" }],
      induz: [],
      original: {
        metabolizado: "CYP3A4",
        acao: "Inibe CYP3A4",
        notas: "Inibidor potente da 3A4; aumenta níveis de alprazolam e triazolam [17]."
      },
      revisao: ["\"Inibidor potente\" registrado como \"forte\"."]
    },
    {
      id: "vortioxetina", nome: "Vortioxetina", classe: "antidepressivos", subclasse: "Multimodal",
      substrato: [{ enzima: "CYP2D6", via: "principal" }],
      inibe: [],
      induz: [],
      original: {
        metabolizado: "CYP2D6 (principal)",
        acao: "",
        notas: "Baixo potencial de inibição ou indução [18]."
      }
    },
    {
      id: "triciclicos", nome: "Tricíclicos", classe: "antidepressivos", subclasse: "Tricíclico",
      exemplos: "Amitriptilina, Clomipramina, Imipramina",
      aliases: ["amitriptilina", "clomipramina", "imipramina", "tricíclico", "ADT"],
      substrato: [
        { enzima: "CYP2D6", via: null }, { enzima: "CYP1A2", via: null }, { enzima: "CYP2C19", via: null }
      ],
      inibe: [],
      induz: [],
      alertas: [
        { enzimas: ["CYP2D6"], efeito: "inibe", tipo: "atencao",
          texto: "São substratos sensíveis da CYP2D6." }
      ],
      original: {
        metabolizado: "CYP2D6, 1A2, 2C19",
        acao: "",
        notas: "São substratos sensíveis da CYP2D6. A clomipramina e a amitriptilina também dependem da 1A2 e 2C19 [19-22]."
      },
      revisao: ["Mantido como uma entrada única; a busca por amitriptilina, clomipramina ou imipramina encontra este item."]
    },

    /* ───────────── Table 2 — Antipsicóticos ───────────── */
    {
      id: "clozapina", nome: "Clozapina", classe: "antipsicoticos", subclasse: "Atípico",
      substrato: [
        { enzima: "CYP1A2", via: "principal" }, { enzima: "CYP2C19", via: null },
        { enzima: "CYP3A4", via: null }, { enzima: "CYP2D6", via: null }
      ],
      inibe: [],
      induz: [],
      original: {
        metabolizado: "CYP1A2 (principal), 2C19, 3A4, 2D6",
        acao: "",
        notas: "O tabagismo (indutor da 1A2) reduz os níveis de clozapina; parar de fumar pode causar toxicidade [23]."
      }
    },
    {
      id: "olanzapina", nome: "Olanzapina", classe: "antipsicoticos", subclasse: "Atípico",
      substrato: [{ enzima: "CYP1A2", via: null }, { enzima: "CYP2D6", via: null }],
      inibe: [],
      induz: [],
      original: {
        metabolizado: "CYP1A2, 2D6",
        acao: "",
        notas: "Tabagismo induz metabolismo (CYP1A2), reduzindo níveis séricos [24]."
      }
    },
    {
      id: "risperidona", nome: "Risperidona", classe: "antipsicoticos", subclasse: "Atípico",
      substrato: [{ enzima: "CYP2D6", via: null }],
      inibe: [],
      induz: [],
      alertas: [
        { enzimas: ["CYP2D6"], efeito: "inibe", tipo: "atencao",
          texto: "Inibidores da 2D6 aumentam seus níveis." }
      ],
      original: {
        metabolizado: "CYP2D6",
        acao: "",
        notas: "Convertida em paliperidona pela 2D6. Inibidores da 2D6 aumentam seus níveis [25]."
      }
    },
    {
      id: "paliperidona", nome: "Paliperidona", classe: "antipsicoticos", subclasse: "Atípico",
      substrato: [{ enzima: "CYP3A4", via: "menor" }, { enzima: "CYP2D6", via: "menor" }],
      outrasVias: "Renal — via principal",
      inibe: [],
      induz: [],
      original: {
        metabolizado: "Renal (principal), CYP3A4/2D6 (menor)",
        acao: "",
        notas: "Pouca interação hepática; 59% excretada inalterada na urina [26]."
      }
    },
    {
      id: "quetiapina", nome: "Quetiapina", classe: "antipsicoticos", subclasse: "Atípico",
      substrato: [{ enzima: "CYP3A4", via: null }],
      inibe: [],
      induz: [],
      alertas: [
        { enzimas: ["CYP3A4"], efeito: "ambos", tipo: "atencao",
          texto: "Níveis aumentam com inibidores da 3A4 (ex: cetoconazol) e diminuem com indutores (ex: carbamazepina)." }
      ],
      original: {
        metabolizado: "CYP3A4",
        acao: "",
        notas: "Níveis aumentam com inibidores da 3A4 (ex: cetoconazol) e diminuem com indutores (ex: carbamazepina) [27]."
      }
    },
    {
      id: "aripiprazol", nome: "Aripiprazol", classe: "antipsicoticos", subclasse: "Atípico",
      substrato: [{ enzima: "CYP2D6", via: null }, { enzima: "CYP3A4", via: null }],
      inibe: [],
      induz: [],
      alertas: [
        { enzimas: ["CYP2D6", "CYP3A4"], efeito: "inibe", tipo: "ajuste",
          texto: "Dose deve ser reduzida pela metade se usada com inibidores fortes da 2D6 ou 3A4." }
      ],
      original: {
        metabolizado: "CYP2D6, CYP3A4",
        acao: "",
        notas: "Dose deve ser reduzida pela metade se usada com inibidores fortes da 2D6 ou 3A4 [28]."
      }
    },
    {
      id: "lurasidona", nome: "Lurasidona", classe: "antipsicoticos", subclasse: "Atípico",
      substrato: [{ enzima: "CYP3A4", via: null }],
      inibe: [],
      induz: [],
      alertas: [
        { enzimas: ["CYP3A4"], efeito: "ambos", tipo: "contraindicacao",
          texto: "Contraindicada com inibidores ou indutores fortes da CYP3A4." }
      ],
      original: {
        metabolizado: "CYP3A4",
        acao: "",
        notas: "Contraindicada com inibidores ou indutores fortes da CYP3A4 [29]."
      }
    },
    {
      id: "clorpromazina", nome: "Clorpromazina", classe: "antipsicoticos", subclasse: "Típico",
      substrato: [{ enzima: "CYP2D6", via: null }],
      inibe: [{ enzima: "CYP2D6", potencia: "não especificada" }],
      induz: [],
      citacoes: [{ alvo: "triciclicos", texto: "Pode inibir o metabolismo de outros fármacos (incluindo tricíclicos)." }],
      original: {
        metabolizado: "CYP2D6",
        acao: "Inibe CYP2D6",
        notas: "Pode inibir o metabolismo de outros fármacos (incluindo tricíclicos) e seu próprio metabolismo [30, 31]."
      }
    },
    {
      id: "levomepromazina", nome: "Levomepromazina", classe: "antipsicoticos", subclasse: "Típico",
      substrato: [{ enzima: "CYP2D6", via: null }],
      inibe: [{ enzima: "CYP2D6", potencia: "não especificada" }],
      induz: [],
      original: {
        metabolizado: "CYP2D6",
        acao: "",
        notas: "Metabolismo hepático; inibe a CYP2D6 [32]."
      },
      revisao: ["Ação na enzima não informada; inibição da 2D6 tirada da nota (ajuste aprovado)."]
    },
    {
      id: "tioridazina", nome: "Tioridazina", classe: "antipsicoticos", subclasse: "Típico",
      substrato: [{ enzima: "CYP2D6", via: null }],
      inibe: [{ enzima: "CYP2D6", potencia: "forte" }],
      induz: [],
      alertas: [
        { enzimas: ["CYP2D6"], efeito: "inibe", tipo: "risco",
          texto: "Risco elevado de arritmias se combinada com outros inibidores da 2D6." }
      ],
      original: {
        metabolizado: "CYP2D6",
        acao: "Inibe CYP2D6",
        notas: "Potente inibidor; risco elevado de arritmias se combinada com outros inibidores da 2D6 [33]."
      },
      revisao: ["\"Potente inibidor\" registrado como \"forte\"."]
    },
    {
      id: "brexpiprazol", nome: "Brexpiprazol", classe: "antipsicoticos", subclasse: "Atípico",
      substrato: [{ enzima: "CYP2D6", via: null }, { enzima: "CYP3A4", via: null }],
      inibe: [],
      induz: [],
      alertas: [
        { enzimas: ["CYP2D6", "CYP3A4"], efeito: "ambos", tipo: "ajuste",
          texto: "Requer ajuste de dose na presença de inibidores/indutores destas enzimas." }
      ],
      original: {
        metabolizado: "CYP2D6, CYP3A4",
        acao: "",
        notas: "Requer ajuste de dose na presença de inibidores/indutores destas enzimas [34]."
      }
    },
    {
      id: "cariprazina", nome: "Cariprazina", classe: "antipsicoticos", subclasse: "Atípico",
      substrato: [{ enzima: "CYP3A4", via: null }],
      inibe: [],
      induz: [],
      original: {
        metabolizado: "CYP3A4",
        acao: "",
        notas: "Metabolizada em metabólitos ativos de longa duração pela 3A4 [35]."
      }
    },
    {
      id: "asenapina", nome: "Asenapina", classe: "antipsicoticos", subclasse: "Atípico",
      substrato: [
        { enzima: "CYP1A2", via: null }, { enzima: "CYP2D6", via: null }, { enzima: "CYP3A4", via: null }
      ],
      inibe: [{ enzima: "CYP2D6", potencia: "fraca" }],
      induz: [],
      original: {
        metabolizado: "CYP1A2, 2D6, 3A4",
        acao: "Inibe CYP2D6",
        notas: "Inibidor fraco da 2D6 [36]."
      }
    },

    /* ───────────── Table 3 — Anticonvulsivantes e outros ───────────── */
    {
      id: "carbamazepina", nome: "Carbamazepina", classe: "outros", subclasse: "Anticonvulsivante",
      substrato: [{ enzima: "CYP3A4", via: null }],
      inibe: [],
      induz: [
        { enzima: "CYP3A4", potencia: "forte" },
        { enzima: "CYP1A2", potencia: "forte" },
        { enzima: "CYP2C9", potencia: "forte" }
      ],
      citacoes: [
        { alvo: "clozapina", texto: "Reduz níveis de clozapina, aripiprazol, quetiapina, anticoncepcionais." },
        { alvo: "aripiprazol", texto: "Reduz níveis de clozapina, aripiprazol, quetiapina, anticoncepcionais." },
        { alvo: "quetiapina", texto: "Reduz níveis de clozapina, aripiprazol, quetiapina, anticoncepcionais." }
      ],
      original: {
        metabolizado: "CYP3A4",
        acao: "INDUZ CYP3A4, 1A2, 2C9",
        notas: "Forte indutor (autoindução). Reduz níveis de clozapina, aripiprazol, quetiapina, anticoncepcionais [37, 38]."
      },
      revisao: ["\"Forte indutor\" não indica enzima: potência \"forte\" aplicada às três (3A4, 1A2, 2C9)."]
    },
    {
      id: "oxcarbazepina", nome: "Oxcarbazepina", classe: "outros", subclasse: "Anticonvulsivante",
      substrato: [],
      outrasVias: "Redução citosólica (MHD) — não CYP",
      inibe: [{ enzima: "CYP2C19", potencia: "não especificada" }],
      induz: [{ enzima: "CYP3A4", potencia: "menor que a da carbamazepina" }],
      original: {
        metabolizado: "Redução citosólica (MHD)",
        acao: "Induz CYP3A4 / Inibe CYP2C19",
        notas: "Indução da 3A4 menos potente que a carbamazepina; inibe a 2C19 [39]."
      },
      revisao: ["Indução da 3A4 registrada como \"menor que a da carbamazepina\", sem nível."]
    },
    {
      id: "acido-valproico", nome: "Ácido Valproico", classe: "outros", subclasse: "Anticonvulsivante",
      aliases: ["valproato", "divalproato"],
      substrato: [{ enzima: "CYP2C9", via: "menor" }, { enzima: "CYP2C19", via: "menor" }],
      inibe: [{ enzima: "CYP2C9", potencia: "não especificada" }],
      induz: [],
      original: {
        metabolizado: "CYP2C9, 2C19 (menor parte)",
        acao: "Inibe CYP2C9",
        notas: "Inibe metabolismo de lamotrigina e fenobarbital [40]."
      },
      revisao: ["\"(menor parte)\" aplicado às duas enzimas (2C9 e 2C19). Confirme se vale só para a 2C19."]
    },
    {
      id: "buspirona", nome: "Buspirona", classe: "outros", subclasse: "Ansiolítico",
      substrato: [{ enzima: "CYP3A4", via: null }],
      inibe: [],
      induz: [],
      alertas: [
        { enzimas: ["CYP3A4"], efeito: "inibe", tipo: "atencao",
          texto: "Níveis aumentam drasticamente com inibidores da 3A4." }
      ],
      original: {
        metabolizado: "CYP3A4",
        acao: "",
        notas: "Níveis aumentam drasticamente com inibidores da 3A4 [41]."
      }
    },
    {
      id: "modafinila", nome: "Modafinila", classe: "outros", subclasse: "Promotor de vigília",
      substrato: [{ enzima: "CYP3A4", via: null }],
      inibe: [{ enzima: "CYP2C19", potencia: "não especificada" }],
      induz: [{ enzima: "CYP3A4", potencia: "não especificada" }],
      original: {
        metabolizado: "CYP3A4",
        acao: "Induz CYP3A4 / Inibe CYP2C19",
        notas: "Induz 3A4 (reduz eficácia de contraceptivos); inibe reversivelmente a 2C19 [42]."
      }
    },

    /* ───────────── Fatores ───────────── */
    {
      id: "tabagismo", nome: "Tabagismo", classe: "fatores", subclasse: "Hábito",
      aliases: ["fumo", "cigarro", "fumante"],
      substrato: [],
      inibe: [],
      induz: [{ enzima: "CYP1A2", potencia: "não especificada" }],
      citacoes: [
        { alvo: "clozapina", fonte: "clozapina", texto: "O tabagismo (indutor da 1A2) reduz os níveis de clozapina; parar de fumar pode causar toxicidade." },
        { alvo: "olanzapina", fonte: "olanzapina", texto: "Tabagismo induz metabolismo (CYP1A2), reduzindo níveis séricos." }
      ],
      original: {
        metabolizado: "",
        acao: "Induz CYP1A2 (citado nas notas de Clozapina e Olanzapina)",
        notas: "O tabagismo (indutor da 1A2) reduz os níveis de clozapina; parar de fumar pode causar toxicidade [23]. Tabagismo induz metabolismo (CYP1A2), reduzindo níveis séricos [24]."
      },
      revisao: ["Incluído como fator a partir das notas de Clozapina e Olanzapina (ajuste aprovado)."]
    }
  ]
};
