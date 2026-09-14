/** Fictional academic pair for simulated usage — no real institution. */

export const SAMPLE_PREVIOUS = `Disciplina: Estatistica Descritiva - 80h
Ementa: medidas de tendencia central, dispersao, graficos, distribuicao de frequencia e interpretacao de tabelas.

Disciplina: Banco de Dados - 40h
Ementa: modelo relacional, SQL basico, chaves primarias e normalizacao inicial.

Disciplina: Bioquimica Metabolica - 80h
Ementa: enzimas, vias metabolicas, metabolismo energetico e bioenergetica celular.

Disciplina: Anatomia Humana - 80h
Ementa: sistemas organicos, ossos, musculos e introducao a disseccao.

Disciplina: Comunicacao Empresarial - 40h
Ementa: redacao corporativa, apresentacoes orais e comunicacao institucional.

Disciplina: Farmacologia Geral - 80h
Ementa: relacao dose-resposta, receptores, farmacocinetica e efeitos adversos.

Disciplina: Metodologia Cientifica - 40h
Ementa: projeto de pesquisa, bases de dados academicas, citacao e etica em pesquisa.

Disciplina: Ingles Instrumental - 40h
Ementa: leitura de artigos tecnicos, vocabulario academico e interpretacao de abstracts.

Disciplina: Microbiologia - 80h
Ementa: bacterias, virus, fungos, controle de crescimento microbiano e biosseguranca.

Disciplina: Introducao a Saude Coletiva
Ementa: vigilancia em saude, determinantes sociais e atencao primaria.
`;

export const SAMPLE_CURRENT = `Disciplina: Estatistica I - 80h
Ementa: estatistica descritiva, media, mediana, variancia, desvio padrao, graficos e tabelas de frequencia.

Disciplina: Banco de Dados Avancado - 80h
Ementa: modelagem relacional, SQL avancado, otimizacao de consultas, transacoes e indices.

Disciplina: Bioquimica Geral - 80h
Ementa: enzimas, vias metabolicas, bioenergetica e integracao do metabolismo.

Disciplina: Anatomia Humana - 80h
Ementa: anatomia sistemica, sistemas organicos, ossos, musculos e introducao a disseccao.

Disciplina: Calculo Diferencial e Integral - 80h
Ementa: limites, derivadas, integrais e aplicacoes em fenomenos continuos.

Disciplina: Hematologia Basica - 80h
Ementa: series sanguineas, coagulacao, interpretacao de hemograma e anemias.

Disciplina: Farmacologia Aplicada - 80h
Ementa: farmacocinetica, receptores, interacoes medicamentosas e efeitos adversos.

Disciplina: Metodos de Pesquisa - 40h
Ementa: delineamento de pesquisa, revisao de literatura, normas de citacao e etica.

Disciplina: Ingles Tecnico - 40h
Ementa: leitura de papers, vocabulario cientifico e producao de resumos academicos.

Disciplina: Microbiologia Medica - 80h
Ementa: bacteriologia, virologia, micologia, antimicrobianos e biosseguranca laboratorial.

Disciplina: Politicas de Saude - 60h
Ementa: sistema de saude, regulacao, financiamento e redes de atencao.
`;

export const SAMPLE_PREVIOUS_CSV = `disciplina,carga horaria,ementa
Estatistica Descritiva,80h,"medidas de tendencia central, dispersao, graficos, distribuicao de frequencia e interpretacao de tabelas"
Banco de Dados,40h,"modelo relacional, SQL basico, chaves primarias e normalizacao inicial"
Bioquimica Metabolica,80h,"enzimas, vias metabolicas, metabolismo energetico e bioenergetica celular"
Anatomia Humana,80h,"sistemas organicos, ossos, musculos e introducao a disseccao"
Comunicacao Empresarial,40h,"redacao corporativa, apresentacoes orais e comunicacao institucional"
Farmacologia Geral,80h,"relacao dose-resposta, receptores, farmacocinetica e efeitos adversos"
Metodologia Cientifica,40h,"projeto de pesquisa, bases de dados academicas, citacao e etica em pesquisa"
Ingles Instrumental,40h,"leitura de artigos tecnicos, vocabulario academico e interpretacao de abstracts"
Microbiologia,80h,"bacterias, virus, fungos, controle de crescimento microbiano e biosseguranca"
Introducao a Saude Coletiva,,"vigilancia em saude, determinantes sociais e atencao primaria"
`;

export const SAMPLE_CURRENT_CSV = `disciplina,carga horaria,ementa
Estatistica I,80h,"estatistica descritiva, media, mediana, variancia, desvio padrao, graficos e tabelas de frequencia"
Banco de Dados Avancado,80h,"modelagem relacional, SQL avancado, otimizacao de consultas, transacoes e indices"
Bioquimica Geral,80h,"enzimas, vias metabolicas, bioenergetica e integracao do metabolismo"
Anatomia Humana,80h,"anatomia sistemica, sistemas organicos, ossos, musculos e introducao a disseccao"
Calculo Diferencial e Integral,80h,"limites, derivadas, integrais e aplicacoes em fenomenos continuos"
Hematologia Basica,80h,"series sanguineas, coagulacao, interpretacao de hemograma e anemias"
Farmacologia Aplicada,80h,"farmacocinetica, receptores, interacoes medicamentosas e efeitos adversos"
Metodos de Pesquisa,40h,"delineamento de pesquisa, revisao de literatura, normas de citacao e etica"
Ingles Tecnico,40h,"leitura de papers, vocabulario cientifico e producao de resumos academicos"
Microbiologia Medica,80h,"bacteriologia, virologia, micologia, antimicrobianos e biosseguranca laboratorial"
Politicas de Saude,60h,"sistema de saude, regulacao, financiamento e redes de atencao"
`;

export const SAMPLE_PREVIOUS_TABLE = `Histórico de disciplinas cursadas
Instituto Norte de Saude e Tecnologia — documento ficticio para simulacao
Código Disciplina CH Período Nota Situação
EST110 Estatistica Descritiva 80h 1º 8,5 Aprovado medidas de tendencia, graficos
BD201 Banco de Dados 40h 2º 7,0 Aprovado modelo relacional, SQL basico
BIO220 Bioquimica Metabolica 80h 3º 8,0 Aprovado enzimas e metabolismo energetico
ANA101 Anatomia Humana 80h 1º 7,5 Aprovado sistemas organicos, ossos, musculos
COM130 Comunicacao Empresarial 40h 2º 9,0 Aprovado redacao corporativa
FAR401 Farmacologia Geral 80h 4º 8,0 Aprovado dose-resposta, receptores
MET150 Metodologia Cientifica 40h 1º 8,0 Aprovado projeto de pesquisa e citacao
ING120 Ingles Instrumental 40h 1º 7,0 Aprovado leitura de artigos tecnicos
MIC310 Microbiologia 80h 3º 8,5 Aprovado bacterias, virus, fungos
Conteúdo programático simplificado
`;

export const SAMPLE_FILES = [
  { name: "historico-origem.txt", content: SAMPLE_PREVIOUS, mime: "text/plain;charset=utf-8" },
  { name: "matriz-destino.txt", content: SAMPLE_CURRENT, mime: "text/plain;charset=utf-8" },
  { name: "historico-origem.csv", content: SAMPLE_PREVIOUS_CSV, mime: "text/csv;charset=utf-8" },
  { name: "matriz-destino.csv", content: SAMPLE_CURRENT_CSV, mime: "text/csv;charset=utf-8" },
  { name: "historico-tabela.txt", content: SAMPLE_PREVIOUS_TABLE, mime: "text/plain;charset=utf-8" },
] as const;
