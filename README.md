# Calculadora de Orçamento — Mudanças

Ferramenta web estática para cálculo de orçamento de empresa de mudanças, baseada no manual tarifário "16_Osmar Mudanças" (Fev/2026). Página única, sem build, recalcula em tempo real.

## Como usar localmente

Abra `index.html` em qualquer navegador (duplo-clique resolve — `file://` funciona). Não precisa de servidor nem de `npm install`.

## Modelo de cálculo

```
Custo total =
    Diária parada × dias                    (veículo + motorista do caminhão selecionado)
  + Custo/km × D                            (combustível + manutenção)
  + Ajudantes × dias × R$ 160               (equipe de entrega)
  + Embalagem antecipada (opcional)         (Chefe + Embaladores × dias + material)
  + Adicionais                              (içamento, desmontagem, itens especiais, andares)
  + GRIS                                    (0,3% × valor da mercadoria)
  + Seguro                                  (2% × valor da mercadoria)

Preço final = Custo total / (1 − Σ%)
Preço/m³    = Preço final / V               (apenas referência)
```

Onde **Σ%** (componentes do markup, editáveis na UI) é:

| Componente | Padrão | Observação |
|---|---|---|
| Taxa administrativa | 20% | |
| Comissões | 3% | |
| Impostos federais + INSS | 8,23% | Lucro Presumido |
| Lucro | 10% | lucro líquido real |
| ISS (local) **ou** ICMS (intermunicipal) | 5% / 7,6% | escolha no dropdown "Modo" |

**Divisores resultantes** (defaults): Local = **1,8598** (≈ custo × 1,86) · Intermunicipal = **1,9543** (≈ custo × 1,95).

### Por que divisor e não multiplicador?

Porque ISS e ICMS incidem sobre o **preço de venda**, não sobre o custo. Se você multiplicar o custo por 1,25 esperando 10% de lucro, o lucro real será menor — o imposto foi retirado depois. Usando o divisor, o lucro declarado é garantido.

## Papel do volume (m³)

O volume **não compõe o preço diretamente**. Ele:

1. **Sugere o caminhão** (VUC ≤15, TOCO 3/4 ≤30, TOCO ≤45/60, TRUCK ≤75, CARRETA ≤90) — cada um com sua diária parada e custo/km.
2. **Sugere o nº de ajudantes** (base 2 + 1 a cada 15 m³).
3. **Sugere a equipe e material de embalagem** quando o serviço está ativo.

Todos os valores podem ser sobrescritos manualmente.

## Comparativo tarifário

O painel exibe o valor de referência do **manual tarifário** (TABELA DIRETA, Fev/2026) para a faixa de km × volume do caminhão sugerido. É só para comparação — não entra no cálculo.

## Publicação no GitHub Pages

Settings → Pages → Source = "Deploy from a branch" → Branch `main` · pasta `/ (root)` · Save. URL pública sai em ~2 minutos.

## Arquivos

- `index.html` — formulário e painel de resultado
- `styles.css` — layout responsivo + estilos de impressão
- `app.js` — cálculo, formatação em R$ e tabela tarifária embutida
