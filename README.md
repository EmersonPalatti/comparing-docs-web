# Equivalência

Refatoração do [comparing-docs](https://github.com/EmersonPalatti/comparing-docs) para TypeScript + React.

O MVP original em Streamlit comparava disciplinas entre dois documentos acadêmicos e sugeria equivalências para revisão humana. Esta versão preserva o domínio (parser, matching, alertas, relatórios) e troca a casca Streamlit por uma interface em etapas.

## O que foi portado

- Extração de PDF (texto selecionável), XLSX/XLS, CSV, TXT/MD
- Parser em três estratégias: CSV, tabela de código de histórico, texto livre
- Similaridade de nome (SequenceMatcher + tokens), TF-IDF, carga horária e créditos
- Classificação, prioridade e alertas com os mesmos limiares do Python
- Export Excel (resumido, detalhado, selecionado) e PDF
- 27 testes de paridade com o pytest original

## Fora deste recorte

- Login compartilhado do Streamlit Cloud
- OCR de PDF escaneado
- Embeddings / LLM (o `config.py` original já tinha as chaves, mas não estavam ligadas)

## Como usar

1. Envie dois documentos, ou carregue o exemplo.
2. Revise nomes e cargas horárias.
3. Compare, filtre, selecione pares e baixe o relatório.

A análise é automatizada e **não substitui decisão institucional**.
