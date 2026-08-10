function escapeCampoCsv(valor) {
  if (valor == null) return ''
  const texto = String(valor)
  return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

/**
 * Monta um CSV com ";" como separador (padrão do Excel em pt-BR).
 * `colunas` é [{ label, value(row) }]; `linhas` é a lista de objetos a exportar.
 */
export function montarCsv(colunas, linhas) {
  const cabecalho = colunas.map((c) => escapeCampoCsv(c.label)).join(';')
  const corpo = linhas.map((linha) => colunas.map((c) => escapeCampoCsv(c.value(linha))).join(';'))
  return [cabecalho, ...corpo].join('\n')
}

/** Dispara o download de um CSV no navegador (BOM UTF-8 pra acentuação abrir certo no Excel). */
export function baixarCsv(nomeArquivo, conteudoCsv) {
  const BOM = '﻿'
  const blob = new Blob([BOM + conteudoCsv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
