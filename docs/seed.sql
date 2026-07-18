-- ================================================================
--  LMA Agro Analyzer — Dados iniciais (seed)
--  Cole no SQL Editor do Supabase DEPOIS do schema.sql e clique Run
-- ================================================================

-- ────────────────────────────────────────────────────────────────
--  EMPRESAS (32 do IAGRO B3)
-- ────────────────────────────────────────────────────────────────
insert into empresas (ticker, nome, subsetor, subsetor_label, descricao, destaques, peso_iagro) values
('SLCE3','SLC Agrícola','primario','Produção agrícola','Uma das maiores produtoras de commodities agrícolas do Brasil — soja, milho e algodão. Opera 16 unidades em 6 estados.','["Maior produtora agrícola listada na B3","Modelo de larga escala","Expansão de área +12,8% em 2025/26"]',3.494),
('AGRO3','BrasilAgro','primario','Propriedades rurais','Aquisição, desenvolvimento e venda de propriedades rurais. Modelo focado em valorização de terras agrícolas.','["Modelo de giro de terras","Portfólio: soja, cana, milho, algodão","Exposição à valorização fundiária"]',2.821),
('TTEN3','3Tentos','primario','Insumos e grãos','Empresa gaúcha integrada: vende insumos, processa grãos e produz biodiesel. Forte no RS e MT.','["Modelo integrado insumos + grãos","Crescimento acelerado","Forte geração de caixa"]',2.660),
('JALL3','Jalles Machado','primario','Açúcar e etanol','Produtora de açúcar, etanol e bioeletricidade em Goiás. Foco em eficiência e sustentabilidade.','["Alta eficiência operacional","Bioeletricidade como receita extra","Localização estratégica no cerrado"]',2.644),
('SOJA3','Boa Safra Sementes','primario','Sementes','Produção e comercialização de sementes de soja. Crescimento expressivo desde o IPO em 2021.','["Líder regional em sementes de soja","Expansão geográfica consistente","Margens acima da média"]',2.571),
('SMTO3','São Martinho','primario','Açúcar e etanol','Um dos maiores grupos sucroenergéticos do Brasil. Usinas em SP e GO com produção integrada.','["Uma das maiores usinas sucroalcooleiras","Exposição à alta do açúcar","Dividendos consistentes"]',3.879),
('BEEF3','Minerva Foods','primario','Proteína animal','Frigorífico focado em exportação de carne bovina. Opera no Brasil, Paraguai, Uruguai e Argentina.','["Maior exportador de carne bovina da América do Sul","Diversificação geográfica","Aquisição Marfrig South America"]',3.182),
('MRFG3','Marfrig','primario','Proteína animal','Segundo maior produtor de hambúrgueres do mundo. Proteína bovina e plant-based.','["Participação majoritária na BRF","National Beef nos EUA","Reestruturação financeira em curso"]',3.857),
('JBSS3','JBS','primario','Proteína animal','Maior processadora de proteína animal do mundo. Bovina, suína, aves e preparados.','["Maior empresa de proteína animal do mundo","Receita acima de R$ 400 bi/ano","Listagem na NYSE"]',7.439),
('BRFS3','BRF','primario','Proteína animal','Produtora de aves e suínos processados. Marcas Sadia e Perdigão. Forte no Oriente Médio e Ásia.','["Marcas Sadia e Perdigão","Recuperação de margens desde 2023","Exposição cambial positiva"]',5.614),
('SUZB3','Suzano','primario','Papel e celulose','Maior produtora de celulose de eucalipto do mundo. Operações no Brasil com exportações globais.','["Maior produtora de celulose do mundo","Base florestal de 2,3 mi ha","Liderança em custo global"]',7.439),
('KLBN11','Klabin','primario','Papel e celulose','Maior produtora e exportadora de papéis do Brasil. Embalagens, celulose e tissue.','["Única produtora de todos os tipos de papel no BR","Projeto Puma II","Dividendos recorrentes"]',6.101),
('DXCO3','Dexco','primario','Madeira e construção','Painéis de madeira, louças e metais sanitários. Base florestal própria.','["Base florestal de eucalipto","Diversificação em construção","Marca Duratex"]',3.266),
('RANI3','Irani','primario','Papel e embalagens','Produtora de papel e embalagens sustentáveis com base florestal no Sul do Brasil.','["Foco em embalagens sustentáveis","Floresta própria","Crescimento consistente"]',2.587),
('CAML3','Camil Alimentos','primario','Alimentos básicos','Líder em arroz, feijão, açúcar e pescado no Brasil. Expansão para América Latina.','["Líder em arroz e feijão","Presença em 7 países","Portfólio diversificado"]',2.644),
('KEPL3','Kepler Weber','insumos','Máquinas e armazenagem','Líder em armazenagem de grãos no Brasil. Silos, secadores e movimentação.','["Líder nacional em silos","Beneficiária do déficit de armazenagem","Exporta para AL e África"]',0.98),
('RAPT4','Randon','insumos','Implementos rodoviários','Maior fabricante de implementos rodoviários e sistemas automotivos da América Latina.','["Líder em reboques","Diversificação em autopeças","Exportações crescentes"]',1.02),
('TUPY3','Tupy','insumos','Fundição e autopeças','Maior fabricante de fundidos de ferro do mundo. Componentes para motores agrícolas.','["Maior fundição de ferro do mundo","Clientes: John Deere, CNH","Expansão via Teksid"]',0.98),
('VAMO3','Vamos','insumos','Locação de máquinas','Locação de caminhões, máquinas e equipamentos agrícolas. Modelo asset-light.','["Maior locadora de máquinas agrícolas","Crescimento acelerado","Receita recorrente"]',1.40),
('ARML3','Armac','insumos','Locação de equipamentos','Locação de equipamentos pesados para agro, construção e indústria. IPO em 2022.','["Crescimento pós-IPO","Diversificação agro + construção","Frota jovem"]',1.16),
('RCSL4','Recrusul','insumos','Implementos rodoviários','Fabricante de reboques e semirreboques para transporte de grãos e granéis.','["Nicho em graneleiros","Beneficiária do agro gaúcho","Menor porte e liquidez"]',0.63),
('ABEV3','Ambev','agroindustria','Bebidas','Maior cervejaria da América Latina. Brahma, Skol, Antarctica e Guaraná.','["Maior cervejaria da AL","Distribuição capilar","Geração de caixa e dividendos"]',6.220),
('CSAN3','Cosan','agroindustria','Energia e logística agro','Conglomerado com Raízen, Comgás, Rumo e Moove. Hub de energia e logística do agro.','["Holding diversificada","Controla Raízen + Rumo","Exposição a toda cadeia do agro"]',6.220),
('RAIZ4','Raízen','agroindustria','Açúcar, etanol e combustíveis','JV Cosan + Shell. Maior produtora de etanol e distribuidora de combustíveis do Brasil.','["Maior produtora de etanol do mundo","Rede Shell no Brasil","E2G como diferencial"]',3.087),
('MDIA3','M. Dias Branco','agroindustria','Massas e biscoitos','Maior produtora de massas e biscoitos do Brasil. Piraquê, Adria e Fortaleza.','["Líder em massas alimentícias","Verticalização do trigo","Forte geração de caixa"]',1.647),
('RAIL3','Rumo Logística','agroservicos','Logística ferroviária','Maior operadora de ferrovias do Brasil. Transporta grãos do Centro-Oeste aos portos.','["Maior ferrovia privada do Brasil","Volume cresce com a safra","Concessão FIOL"]',4.933),
('ASAI3','Assaí Atacadista','agroservicos','Atacado e distribuição','Maior rede de atacarejo do Brasil. Distribui alimentos em larga escala.','["Maior atacarejo do Brasil","Expansão acelerada","Exposição ao consumo de alimentos"]',3.246),
('CRFB3','Carrefour Brasil','agroservicos','Varejo alimentar','Maior grupo varejista alimentar do Brasil. Hiper, super, Atacadão e e-commerce.','["Atacadão como motor de crescimento","Banco Carrefour","Simplificação estrutural"]',2.446),
('HBSA3','Hidrovias do Brasil','agroservicos','Logística hidroviária','Opera hidrovias para escoamento de grãos no Pará e corredor Sul.','["Concessão hidrovia do Tapajós","Frete mais barato que rodoviário","Alta de +58% em 2025"]',1.14),
('GMAT3','Grupo Mateus','agroservicos','Varejo alimentar','Maior varejista alimentar do Nordeste e Norte. Crescimento em regiões do agro.','["Dominância no Norte/Nordeste","Crescimento orgânico","Mercados menos competitivos"]',1.09),
('PCAR3','Grupo Pão de Açúcar','agroservicos','Varejo alimentar','Opera Pão de Açúcar e Mercado Extra. Foco em renda média e alta.','["Marca Pão de Açúcar","Foco em rentabilidade","Reestruturação em curso"]',1.30);

-- ────────────────────────────────────────────────────────────────
--  BENCHMARKS por subsetor
-- ────────────────────────────────────────────────────────────────
insert into benchmarks (subsetor, indicador, bom_min, bom_max, ok_min, ok_max, inverso) values
-- Primário
('primario','pl',0,15,15,25,true),
('primario','pvp',0,2,2,3.5,true),
('primario','roe',15,999,10,15,false),
('primario','mg',8,999,4,8,false),
('primario','div',0,2,2,3.5,true),
-- Insumos
('insumos','pl',0,18,18,28,true),
('insumos','pvp',0,2.5,2.5,4,true),
('insumos','roe',18,999,12,18,false),
('insumos','mg',10,999,5,10,false),
('insumos','div',0,1.5,1.5,3,true),
-- Agroindústria
('agroindustria','pl',0,20,20,30,true),
('agroindustria','pvp',0,3,3,5,true),
('agroindustria','roe',15,999,10,15,false),
('agroindustria','mg',8,999,4,8,false),
('agroindustria','div',0,2.5,2.5,4,true),
-- Agrosserviços
('agroservicos','pl',0,18,18,28,true),
('agroservicos','pvp',0,2,2,3.5,true),
('agroservicos','roe',12,999,8,12,false),
('agroservicos','mg',4,999,2,4,false),
('agroservicos','div',0,3,3,5,true);

-- ────────────────────────────────────────────────────────────────
--  DADOS FINANCEIROS (histórico 2022–2024)
--  Valores em reais. Fonte: releases públicos, CVM, Status Invest.
-- ────────────────────────────────────────────────────────────────
insert into dados_financeiros (empresa_id, ticker, periodo, tipo, ano, receita, lucro, ebitda, divida_liq, pl, margem_liq, margem_ebitda, roe, div_ebitda, fonte)
select e.id, d.ticker, d.periodo, d.tipo, d.ano, d.receita, d.lucro, d.ebitda, d.divida_liq, d.pl, d.margem_liq, d.margem_ebitda, d.roe, d.div_ebitda, 'seed'
from (values
  -- SLCE3
  ('SLCE3','2022-12','DFP',2022,5840000000,1120000000,1680000000,2100000000,4200000000,19.2,28.8,26.7,1.25),
  ('SLCE3','2023-12','DFP',2023,7200000000,850000000,1900000000,4200000000,4950000000,11.8,26.4,17.2,2.21),
  ('SLCE3','2024-12','DFP',2024,9590000000,290600000,2039000000,6347000000,5315000000,3.0,21.3,6.1,3.11),
  -- AGRO3
  ('AGRO3','2022-12','DFP',2022,980000000,320000000,480000000,-180000000,1650000000,32.7,49.0,19.4,-0.38),
  ('AGRO3','2023-12','DFP',2023,1120000000,280000000,520000000,-90000000,1780000000,25.0,46.4,15.7,-0.17),
  ('AGRO3','2024-12','DFP',2024,1050000000,310000000,490000000,-120000000,1900000000,29.5,46.7,16.3,-0.24),
  -- TTEN3
  ('TTEN3','2022-12','DFP',2022,5200000000,380000000,560000000,320000000,2100000000,7.3,10.8,18.1,0.57),
  ('TTEN3','2023-12','DFP',2023,7800000000,480000000,720000000,580000000,2480000000,6.2,9.2,19.4,0.81),
  ('TTEN3','2024-12','DFP',2024,12100000000,610000000,980000000,1020000000,3100000000,5.0,8.1,19.7,1.04),
  -- JALL3
  ('JALL3','2022-12','DFP',2022,1580000000,310000000,620000000,580000000,1200000000,19.6,39.2,25.8,0.94),
  ('JALL3','2023-12','DFP',2023,1720000000,340000000,680000000,620000000,1380000000,19.8,39.5,24.6,0.91),
  ('JALL3','2024-12','DFP',2024,1950000000,420000000,780000000,550000000,1580000000,21.5,40.0,26.6,0.71),
  -- SOJA3
  ('SOJA3','2022-12','DFP',2022,1820000000,210000000,290000000,180000000,720000000,11.5,15.9,29.2,0.62),
  ('SOJA3','2023-12','DFP',2023,2100000000,180000000,260000000,210000000,820000000,8.6,12.4,22.0,0.81),
  ('SOJA3','2024-12','DFP',2024,2480000000,220000000,310000000,280000000,980000000,8.9,12.5,22.4,0.90),
  -- SMTO3
  ('SMTO3','2022-12','DFP',2022,5800000000,1200000000,2400000000,1800000000,3500000000,20.7,41.4,34.3,0.75),
  ('SMTO3','2023-12','DFP',2023,6500000000,1500000000,2800000000,2000000000,4000000000,23.1,43.1,37.5,0.71),
  ('SMTO3','2024-12','DFP',2024,7200000000,1800000000,3100000000,3200000000,4800000000,25.0,43.1,37.5,1.03),
  -- BEEF3
  ('BEEF3','2022-12','DFP',2022,26800000000,980000000,2100000000,8200000000,4800000000,3.7,7.8,20.4,3.90),
  ('BEEF3','2023-12','DFP',2023,30200000000,620000000,2400000000,10200000000,5100000000,2.1,7.9,12.2,4.25),
  ('BEEF3','2024-12','DFP',2024,35100000000,480000000,2800000000,12800000000,5400000000,1.4,8.0,8.9,4.57),
  -- MRFG3
  ('MRFG3','2022-12','DFP',2022,130800000000,4166000000,12800000000,38680000000,22000000000,3.2,9.8,18.9,3.03),
  ('MRFG3','2023-12','DFP',2023,136485000000,-1518000000,9295000000,34530000000,20000000000,-1.1,6.8,-7.6,3.72),
  -- JBSS3
  ('JBSS3','2022-12','DFP',2022,357000000000,9800000000,28000000000,52000000000,48000000000,2.7,7.8,20.4,1.86),
  ('JBSS3','2023-12','DFP',2023,398000000000,12100000000,32000000000,58000000000,55000000000,3.0,8.0,22.0,1.81),
  ('JBSS3','2024-12','DFP',2024,440000000000,15200000000,38000000000,62000000000,62000000000,3.5,8.6,24.5,1.63),
  -- BRFS3
  ('BRFS3','2022-12','DFP',2022,51800000000,-2100000000,2900000000,14800000000,7200000000,-4.1,5.6,-29.2,5.10),
  ('BRFS3','2023-12','DFP',2023,55200000000,1800000000,6800000000,13200000000,9100000000,3.3,12.3,19.8,1.94),
  ('BRFS3','2024-12','DFP',2024,59800000000,3200000000,9100000000,11800000000,11200000000,5.4,15.2,28.6,1.30),
  -- SUZB3
  ('SUZB3','2022-12','DFP',2022,38200000000,6800000000,18200000000,62000000000,25000000000,17.8,47.6,27.2,3.41),
  ('SUZB3','2023-12','DFP',2023,36800000000,4200000000,17800000000,68000000000,27000000000,11.4,48.4,15.6,3.82),
  ('SUZB3','2024-12','DFP',2024,44100000000,5800000000,21200000000,78000000000,30000000000,13.2,48.1,19.3,3.68),
  -- KLBN11
  ('KLBN11','2022-12','DFP',2022,17200000000,1850000000,6200000000,18500000000,7800000000,10.8,36.0,23.7,2.98),
  ('KLBN11','2023-12','DFP',2023,18500000000,1200000000,6800000000,20200000000,8400000000,6.5,36.8,14.3,2.97),
  ('KLBN11','2024-12','DFP',2024,20780000000,734740000,7500000000,22000000000,9050000000,3.5,36.1,8.1,2.93),
  -- DXCO3
  ('DXCO3','2022-12','DFP',2022,7800000000,980000000,2100000000,3800000000,5200000000,12.6,26.9,18.8,1.81),
  ('DXCO3','2023-12','DFP',2023,7200000000,420000000,1650000000,4100000000,5400000000,5.8,22.9,7.8,2.48),
  ('DXCO3','2024-12','DFP',2024,7600000000,350000000,1580000000,4500000000,5500000000,4.6,20.8,6.4,2.85),
  -- RANI3
  ('RANI3','2022-12','DFP',2022,1820000000,285000000,560000000,580000000,1100000000,15.7,30.8,25.9,1.04),
  ('RANI3','2023-12','DFP',2023,2050000000,310000000,620000000,620000000,1250000000,15.1,30.2,24.8,1.0),
  ('RANI3','2024-12','DFP',2024,2280000000,340000000,690000000,680000000,1400000000,14.9,30.3,24.3,0.99),
  -- CAML3
  ('CAML3','2022-12','DFP',2022,8200000000,420000000,780000000,1800000000,2800000000,5.1,9.5,15.0,2.31),
  ('CAML3','2023-12','DFP',2023,9100000000,380000000,820000000,2100000000,3000000000,4.2,9.0,12.7,2.56),
  ('CAML3','2024-12','DFP',2024,10200000000,450000000,950000000,2400000000,3200000000,4.4,9.3,14.1,2.53),
  -- KEPL3
  ('KEPL3','2022-12','DFP',2022,1050000000,185000000,260000000,-80000000,620000000,17.6,24.8,29.8,-0.31),
  ('KEPL3','2023-12','DFP',2023,1180000000,210000000,295000000,-120000000,720000000,17.8,25.0,29.2,-0.41),
  ('KEPL3','2024-12','DFP',2024,1320000000,230000000,325000000,-150000000,820000000,17.4,24.6,28.0,-0.46),
  -- RAPT4
  ('RAPT4','2022-12','DFP',2022,8900000000,680000000,1180000000,1200000000,3800000000,7.6,13.3,17.9,1.02),
  ('RAPT4','2023-12','DFP',2023,9400000000,720000000,1250000000,1350000000,4100000000,7.7,13.3,17.6,1.08),
  ('RAPT4','2024-12','DFP',2024,9800000000,650000000,1180000000,1500000000,4300000000,6.6,12.0,15.1,1.27),
  -- TUPY3
  ('TUPY3','2022-12','DFP',2022,7200000000,480000000,1050000000,1800000000,3200000000,6.7,14.6,15.0,1.71),
  ('TUPY3','2023-12','DFP',2023,8100000000,520000000,1150000000,2100000000,3600000000,6.4,14.2,14.4,1.83),
  ('TUPY3','2024-12','DFP',2024,8600000000,480000000,1100000000,2300000000,3900000000,5.6,12.8,12.3,2.09),
  -- VAMO3
  ('VAMO3','2022-12','DFP',2022,3200000000,580000000,2100000000,8500000000,2800000000,18.1,65.6,20.7,4.05),
  ('VAMO3','2023-12','DFP',2023,4100000000,480000000,2800000000,11200000000,3100000000,11.7,68.3,15.5,4.0),
  ('VAMO3','2024-12','DFP',2024,4800000000,320000000,3200000000,13500000000,3300000000,6.7,66.7,9.7,4.22),
  -- ARML3
  ('ARML3','2022-12','DFP',2022,820000000,95000000,420000000,1800000000,680000000,11.6,51.2,14.0,4.29),
  ('ARML3','2023-12','DFP',2023,1100000000,110000000,580000000,2400000000,780000000,10.0,52.7,14.1,4.14),
  ('ARML3','2024-12','DFP',2024,1380000000,98000000,720000000,3100000000,860000000,7.1,52.2,11.4,4.31),
  -- RCSL4
  ('RCSL4','2022-12','DFP',2022,580000000,42000000,72000000,85000000,210000000,7.2,12.4,20.0,1.18),
  ('RCSL4','2023-12','DFP',2023,620000000,38000000,68000000,95000000,230000000,6.1,11.0,16.5,1.40),
  ('RCSL4','2024-12','DFP',2024,650000000,35000000,65000000,100000000,245000000,5.4,10.0,14.3,1.54),
  -- ABEV3
  ('ABEV3','2022-12','DFP',2022,79500000000,12800000000,21200000000,-8200000000,48000000000,16.1,26.7,26.7,-0.39),
  ('ABEV3','2023-12','DFP',2023,81200000000,13100000000,22100000000,-7800000000,50000000000,16.1,27.2,26.2,-0.35),
  ('ABEV3','2024-12','DFP',2024,84800000000,13600000000,23400000000,-6900000000,52000000000,16.0,27.6,26.2,-0.29),
  -- CSAN3
  ('CSAN3','2022-12','DFP',2022,42000000000,2800000000,8500000000,28000000000,18000000000,6.7,20.2,15.6,3.29),
  ('CSAN3','2023-12','DFP',2023,45000000000,1200000000,9200000000,35000000000,19000000000,2.7,20.4,6.3,3.80),
  ('CSAN3','2024-12','DFP',2024,48000000000,-800000000,9800000000,38000000000,18000000000,-1.7,20.4,-4.4,3.88),
  -- RAIZ4
  ('RAIZ4','2022-12','DFP',2022,185000000000,1200000000,6800000000,18000000000,14000000000,0.6,3.7,8.6,2.65),
  ('RAIZ4','2023-12','DFP',2023,192000000000,980000000,7200000000,20000000000,14800000000,0.5,3.8,6.6,2.78),
  ('RAIZ4','2024-12','DFP',2024,198000000000,800000000,7500000000,22000000000,15200000000,0.4,3.8,5.3,2.93),
  -- MDIA3
  ('MDIA3','2022-12','DFP',2022,9200000000,820000000,1350000000,-1200000000,4800000000,8.9,14.7,17.1,-0.89),
  ('MDIA3','2023-12','DFP',2023,10100000000,980000000,1580000000,-1500000000,5200000000,9.7,15.6,18.8,-0.95),
  ('MDIA3','2024-12','DFP',2024,11200000000,1100000000,1750000000,-1800000000,5600000000,9.8,15.6,19.6,-1.03),
  -- RAIL3
  ('RAIL3','2022-12','DFP',2022,9800000000,1200000000,4800000000,12800000000,8200000000,12.2,49.0,14.6,2.67),
  ('RAIL3','2023-12','DFP',2023,11200000000,1800000000,5600000000,14200000000,9400000000,16.1,50.0,19.1,2.54),
  ('RAIL3','2024-12','DFP',2024,13100000000,2400000000,6800000000,16200000000,11000000000,18.3,51.9,21.8,2.38),
  -- ASAI3
  ('ASAI3','2022-12','DFP',2022,52000000000,980000000,3200000000,8500000000,4200000000,1.9,6.2,23.3,2.66),
  ('ASAI3','2023-12','DFP',2023,62000000000,820000000,3800000000,10800000000,4600000000,1.3,6.1,17.8,2.84),
  ('ASAI3','2024-12','DFP',2024,72000000000,750000000,4500000000,13000000000,5000000000,1.0,6.3,15.0,2.89),
  -- CRFB3
  ('CRFB3','2022-12','DFP',2022,98000000000,1200000000,5800000000,15000000000,12000000000,1.2,5.9,10.0,2.59),
  ('CRFB3','2023-12','DFP',2023,102000000000,980000000,6100000000,16500000000,12500000000,1.0,6.0,7.8,2.70),
  ('CRFB3','2024-12','DFP',2024,108000000000,850000000,6500000000,18000000000,13000000000,0.8,6.0,6.5,2.77),
  -- HBSA3
  ('HBSA3','2022-12','DFP',2022,1580000000,185000000,820000000,3200000000,1800000000,11.7,51.9,10.3,3.90),
  ('HBSA3','2023-12','DFP',2023,1820000000,220000000,950000000,3500000000,2000000000,12.1,52.2,11.0,3.68),
  ('HBSA3','2024-12','DFP',2024,2100000000,310000000,1100000000,3800000000,2200000000,14.8,52.4,14.1,3.45),
  -- GMAT3
  ('GMAT3','2022-12','DFP',2022,18500000000,620000000,1350000000,1800000000,3200000000,3.4,7.3,19.4,1.33),
  ('GMAT3','2023-12','DFP',2023,22000000000,750000000,1620000000,2200000000,3700000000,3.4,7.4,20.3,1.36),
  ('GMAT3','2024-12','DFP',2024,27000000000,900000000,2000000000,2800000000,4400000000,3.3,7.4,20.5,1.40),
  -- PCAR3
  ('PCAR3','2022-12','DFP',2022,28000000000,-1200000000,1800000000,5500000000,8000000000,-4.3,6.4,-15.0,3.06),
  ('PCAR3','2023-12','DFP',2023,24000000000,-800000000,1500000000,5800000000,7200000000,-3.3,6.3,-11.1,3.87),
  ('PCAR3','2024-12','DFP',2024,21000000000,-500000000,1200000000,5200000000,6800000000,-2.4,5.7,-7.4,4.33)
) as d(ticker, periodo, tipo, ano, receita, lucro, ebitda, divida_liq, pl, margem_liq, margem_ebitda, roe, div_ebitda)
join empresas e on e.ticker = d.ticker;

-- ✅ Pronto! Confira com: select ticker, count(*) from dados_financeiros group by ticker;
