# Equivalência

Refatoração TypeScript do [comparing-docs](https://github.com/EmersonPalatti/comparing-docs) (Streamlit) para uma interface em etapas no navegador.

A análise roda **no cliente**: os documentos não são enviados a um servidor. O resultado é uma sugestão ranqueada para revisão humana — não substitui decisão institucional.

## O que o app faz

1. Envie um documento anterior (histórico) e um atual (matriz/PPC), ou carregue o exemplo.
2. Revise nomes e cargas horárias.
3. Compare. O padrão mostra **só o melhor par** de cada origem.
4. Abra um par para ver ementas lado a lado, marque conflitos de destino compartilhado, selecione pares únicos e exporte Excel/PDF.

Formatos: PDF com texto selecionável, **DOCX**, XLSX, CSV, TXT/MD. Arquivos `.xls` antigos precisam ser salvos como XLSX ou CSV.

## Domínio portado

- Parser em três estratégias: CSV, tabela de código de histórico, texto livre
- CSV aceita carga como `80` ou `80h`
- Similaridade de nome (SequenceMatcher + tokens), TF-IDF, carga horária e créditos
- Classificação, prioridade, alertas e atribuição **1-para-1** (aviso quando duas origens apontam para o mesmo destino)
- Export Excel (resumido, detalhado, selecionado) e PDF

## Fora deste recorte

- OCR de PDF escaneado
- Parecer por LLM (a ementa não sai do navegador neste recorte)
- Login / persistência em nuvem (a sessão fica no próprio navegador)

## Desenvolvimento

```bash
npm install
npm run dev
npm test
npm run typecheck
```

Há um kit fictício na tela inicial (TXT, CSV e tabela de histórico) para simular o fluxo sem dados reais.
