# Equivalência

Refatoração TypeScript do [comparing-docs](https://github.com/EmersonPalatti/comparing-docs) (Streamlit) para uma interface em etapas no navegador.

A análise roda **no cliente**: os documentos não são enviados a um servidor. O resultado é uma sugestão ranqueada para revisão humana — não substitui decisão institucional.

## O que o app faz

1. Envie o **histórico de origem** (aluno) e a **matriz de destino** (universidade), ou carregue o exemplo.
2. Revise nomes, cargas, códigos e ementas extraídos.
3. Compare. O padrão mostra **só o melhor par** de cada origem.
4. Abra um par para ver ementas lado a lado, marque conflitos de destino compartilhado, selecione pares únicos e exporte Excel/PDF.

Fluxo típico: a universidade envia a matriz em **XLSX**; o aluno envia o histórico em **PDF** ou **DOCX** com texto selecionável. Também aceita CSV e TXT. Arquivos `.xls` antigos precisam ser salvos como XLSX ou CSV.

## Como a leitura funciona

Nada disso usa modelo de linguagem no caminho padrão.

- **XLSX (matriz / PPC):** todas as abas visíveis, células mescladas, cabeçalhos com aliases (`disciplina`, `componente curricular`, `CH`, `carga horária`, `ementa`, `código`). Cabeçalho em duas linhas (CH teórica / prática / EAD / extensão). Blocos por período, linhas de total ignoradas. Abas de matriz e ementário são combinadas por código ou nome.
- **CSV:** vírgula, ponto-e-vírgula (exportação brasileira do Excel) ou tab. Ementa entre aspas não quebra colunas.
- **PDF (histórico):** reconstrução de tabela pela posição X/Y dos glifos do PDF.js. Se a geometria falhar, cai para tabela de código (`BIO101 … 60h`) ou texto livre. PDF escaneado (só imagem) não tem OCR neste recorte.
- **DOCX:** tabelas via HTML do Mammoth, com texto corrido como reserva.

Na revisão, cada disciplina mostra código, período e trecho da ementa para conferir se o arquivo foi lido certo.

## Domínio portado

- Parser em três estratégias: tabela/CSV, tabela de código de histórico, texto livre
- CSV aceita carga como `80` ou `80h`
- Similaridade de nome (SequenceMatcher + token-set + Jaro-Winkler), TF-IDF, carga horária e créditos
- Código coincidente sobe o par; I/II e introdução vs avançado não passam de similaridade parcial
- Situação “a cursar” / reprovado não entra na atribuição 1-para-1
- CH de origem abaixo de 75% da destino não pode ser “forte”; abaixo de 60% não passa de parcial
- Atribuição **1-para-1 pelo algoritmo húngaro** (não gulosa), com aviso de destino compartilhado

- Export Excel (resumido, detalhado, selecionado) e PDF

## Fora deste recorte

- OCR de PDF escaneado
- Matriz em “grade” de períodos lado a lado (cada coluna é um semestre)
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
