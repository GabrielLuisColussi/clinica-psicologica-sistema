// src/utils/export.js
(function(){
  // Gera CSV a partir de um array de objetos
  function exportToCSV(filename, rows) {
    if (!rows || !rows.length) return;

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(';'),
      ...rows.map(r => headers.map(h => {
        let v = r[h] ?? '';
        // Escapa ; e quebras de linha
        v = String(v).replace(/;/g, ',').replace(/\r?\n|\r/g, ' ');
        // Aspas se tiver separadores
        if (/[",;]/.test(v)) v = `"${v.replace(/"/g, '""')}"`;
        return v;
      }).join(';'))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Exponha globalmente para os módulos de lista chamarem
  window.ExportUtils = { exportToCSV };
})();
