# Interações CYP450 — Psicofármacos

Aplicativo web (PWA) para celular que cruza interações entre psicofármacos pela **inibição** e **indução** das enzimas do citocromo P450, com base nas referências abaixo. Dr. Gabriel Fontenele · Psiquiatra · CREMEC 16.084 · RQE 17.770.

## Funções

- Seleção de quantos fármacos forem necessários; o app cruza todos os pares.
- **Interações entre pares:** fármaco A inibe/induz uma enzima que metaboliza o fármaco B → níveis de B tendem a aumentar/diminuir, com a potência descrita e a importância da via (principal/menor).
- **Interações múltiplas:** dois ou mais itens atuando sobre o mesmo fármaco — inibição/indução somada na mesma enzima, vias diferentes bloqueadas ao mesmo tempo ou efeitos opostos.
- Alertas e combinações citados nas notas de cada fármaco aparecem no contexto da interação.
- Lista em ordem alfabética ou por classe; busca; filtros por tipo de medicamento, enzima inibida, enzima induzida e enzima que metaboliza.
- Funciona offline e pode ser instalado na tela inicial; tema claro e escuro.

Competição entre substratos (mesma enzima, sem inibição/indução) não é sinalizada, por decisão de projeto.

## Estrutura

| Arquivo | Conteúdo |
| --- | --- |
| `index.html` | App |
| `dados.html` | Base de dados: descrição completa × estrutura usada nos cruzamentos (`dados.html?revisao` mostra os pontos de revisão) |
| `js/data.js` | Base de dados estruturada |
| `js/engine.js` | Motor de interações (sem dependência de interface) |
| `js/app.js` | Interface |
| `css/app.css` | Estilos com os tokens do design system |
| `sw.js`, `manifest.webmanifest` | Funcionamento offline e instalação |
| `tests/engine.test.js` | Testes do motor |

## Atualizar os dados

1. Edite `js/data.js` (cada fármaco guarda a descrição completa em `original` e a estrutura em `substrato`, `inibe`, `induz`, `alertas` e `citacoes`).
2. Rode os testes: `node --test tests/engine.test.js`
3. Altere `VERSAO` em `sw.js` (ex.: `cyp-v2`) para que os celulares baixem a nova versão.
4. Atualize `versao` em `js/data.js`.

## Rodar localmente

```bash
python -m http.server 8765
```

Abra `http://localhost:8765`.

## Referências

1. Cordioli AV, Gallois CB, Passos IC, organizadores. Psicofármacos: consulta rápida. 6. ed. Porto Alegre: Artmed; 2023.
2. Stahl SM. Stahl psicofarmacologia: bases neurocientíficas e aplicações práticas. 5. ed. Rio de Janeiro: Guanabara Koogan; 2022.
3. Meyer JM, Stahl SM. The clozapine handbook. Cambridge: Cambridge University Press; 2020.
4. Stahl SM. Fundamentos de psicofarmacologia de Stahl: guia de prescrição. 6. ed. Porto Alegre: Artmed; 2019.

## Aviso

Ferramenta de apoio à decisão clínica. Considera apenas interações farmacocinéticas pelo CYP450 descritas nas referências. Não substitui o julgamento clínico, a bula nem fontes atualizadas.
