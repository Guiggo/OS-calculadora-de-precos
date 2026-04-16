# Calculadora de Orçamento — Mudanças

Ferramenta web estática para cálculo de orçamento de empresa de mudanças. Página única, sem build, recalcula em tempo real.

## Como usar localmente

Abra `index.html` em qualquer navegador (duplo-clique resolve — `file://` funciona). Não precisa de servidor nem de `npm install`.

## Fórmula

```
PREÇO_FINAL = (TB + DESLOCAMENTO + CMO + ADICIONAIS + SEGURO) × (1 + MARGEM)
Preço/m³    = PREÇO_FINAL / V            (referência, não entra no cálculo)
```

Onde:

- **TB**: taxa base do caminhão selecionado (sugerido pelo volume; editável)
- **DESLOCAMENTO** = `D × CD` (km × R$/km)
- **CMO** = `dias × (n_motoristas × custo_motorista_dia + n_ajudantes × custo_ajudante_dia)`
  - CLT: `custo_dia = salário / dias_úteis × multiplicador_encargos`
  - Terceirizado: `custo_dia = diária`
- **ADICIONAIS** = içamento + desmontagem + embalagem + adicional_andar + itens_especiais
  - `adicional_andar = andares × perc_andar × (TB + DESLOCAMENTO + CMO)`
- **SEGURO** = `VD × S%`

O volume (**V**, em m³) **não entra no preço**. Ele serve apenas para:

1. Sugerir o **caminhão** (faixas de volume editáveis na seção "Caminhão")
2. Sugerir o **nº de ajudantes** (base 2 + 1 a cada 8 m³, configurável)

Ambos podem ser sobrescritos manualmente.

## Publicação no GitHub Pages

1. Faça merge desta branch na `main`.
2. No repositório, vá em **Settings → Pages**.
3. Em **Source**, selecione **Deploy from a branch**, escolha a branch `main` e pasta `/ (root)`.
4. Salve. A URL pública aparecerá no topo da página após alguns minutos.

## Arquivos

- `index.html` — markup e formulário
- `styles.css` — layout responsivo + estilos de impressão
- `app.js` — cálculo, formatação em R$ e renderização do recibo
