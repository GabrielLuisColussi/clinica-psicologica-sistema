// src/views/financeiro-list.js
AppRouter.register('/financeiro', { title: 'Financeiro' }, async (root) => {
  const API = window.API;
  const Fin = API?.financeiro;
  const Cons = API?.consultas;

  if (!Fin) {
    root.innerHTML = '<p>API Financeiro não disponível.</p>';
    return;
  }

  // CSS local
  (function injectFinanceCSS(){
    const id = 'finance-ui-v1';
    if (document.getElementById(id)) return;
    const st = document.createElement('style');
    st.id = id;
    st.textContent = `
      .fin-wrap { display:flex; flex-direction:column; gap:24px; }
      .fin-head { display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; }
      .fin-title { font-size:22px; font-weight:800; }
      .fin-filters { display:flex; gap:16px; flex-wrap:wrap; align-items:flex-end; }
      .fin-filters .fg { display:flex; flex-direction:column; gap:8px; }
      .fin-filters input, .fin-filters select { height:36px; padding:6px 10px; border-radius:8px; border:1px solid #e5e7eb; }
      .fin-table th, .fin-table td { padding:12px 14px; border-bottom:1px solid #e5e7eb; font-size:14px; }
      .fin-table th { text-align:left; font-size:13px; text-transform:uppercase; letter-spacing:.03em; color:#6b7280; }
      .fin-status { padding:4px 10px; border-radius:999px; font-size:12px; text-transform:uppercase; }
      .fin-status--pago { background:#dcfce7; color:#166534; }
      .fin-status--nao-pago { background:#fee2e2; color:#b91c1c; }
    `;
    document.head.appendChild(st);
  })();

  const state = {
    from: '',
    to: '',
    status: '',
    page: 1,
    size: 50,
    rows: [],
    total: 0,
    consultasMap: {} // idConsulta -> consulta (com paciente)
  };

  function notify(msg, type='log') {
    try {
      if (typeof window.toast === 'function') {
        window.toast(msg, type);
      } else {
        console[type === 'error' ? 'error' : 'log'](msg);
      }
    } catch {
      console.log(msg);
    }
  }

  function hojeISO() {
    return new Date().toISOString().slice(0,10);
  }

  // tenta descobrir o nome do paciente em vários formatos possíveis
  function getPacienteNome(consulta) {
    if (!consulta) return '';

    return (
      consulta.pacienteNome ||               // DTO mais comum
      consulta.nomePaciente ||              // outra variação comum
      consulta.paciente ||                  // às vezes vem string direta
      consulta.nome_paciente ||             // snake_case
      (consulta.paciente && (               // objeto paciente aninhado
        consulta.paciente.nome ||
        consulta.paciente.nomeCompleto ||
        consulta.paciente.nome_paciente
      )) ||
      ''
    );
  }

  function exportCSV() {
    const headers = ['id','idConsulta','pacienteNome','formaPagamento','statusFinanceiro','dataPagamento','valor'];
    const lines = [headers.join(';')];

    state.rows.forEach(r => {
      const consulta = state.consultasMap[r.idConsulta];
      const pacienteNome = getPacienteNome(consulta);
      const row = [
        r.id,
        r.idConsulta,
        pacienteNome,
        r.formaPagamento,
        r.statusFinanceiro,
        r.dataPagamento,
        r.valor
      ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`);
      lines.push(row.join(';'));
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financeiro_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function carregarConsultasRelacionadas() {
    if (!Cons || typeof Cons.list !== 'function') {
      state.consultasMap = {};
      return;
    }
    try {
      const res = await Cons.list({ page: 1, size: 500 });
      const consultas = res.rows || res.content || [];
      const map = {};
      consultas.forEach(c => {
        if (c && c.id != null) {
          map[c.id] = c;
        }
      });
      state.consultasMap = map;
    } catch (e) {
      console.warn('Falha ao carregar consultas para o financeiro:', e);
      state.consultasMap = {};
    }
  }

  async function carregar() {
    try {
      const res = await Fin.list({
        from: state.from || undefined,
        to: state.to || undefined,
        status: state.status || undefined,
        page: state.page,
        size: state.size
      });
      state.rows  = res.rows || res.content || [];
      state.total = res.total ?? state.rows.length;

      await carregarConsultasRelacionadas();
      render();
    } catch (e) {
      console.error(e);
      notify('[erro] Falha ao carregar lançamentos financeiros.', 'error');
      root.innerHTML = '<p>Erro ao carregar financeiro.</p>';
    }
  }

  function render() {
    root.innerHTML = `
      <div class="fin-wrap">
        <div class="fin-head">
          <div>
            <div class="fin-title">Financeiro</div>
            <div class="text-muted">Controle de recebimentos por consulta.</div>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn--ghost" id="btnExport">Exportar CSV</button>
            <a href="#/financeiro/form" class="btn btn--primary">Novo lançamento</a>
          </div>
        </div>

        <div class="card">
          <form id="fin-filtros" class="fin-filters">
            <div class="fg">
              <label for="fin-from">De</label>
              <input id="fin-from" type="date" value="${state.from}">
            </div>
            <div class="fg">
              <label for="fin-to">Até</label>
              <input id="fin-to" type="date" value="${state.to}">
            </div>
            <div class="fg">
              <label for="fin-status">Status</label>
              <select id="fin-status">
                <option value="">Todos</option>
                <option value="pago" ${state.status==='pago'?'selected':''}>Pago</option>
                <option value="nao pago" ${state.status==='nao pago'?'selected':''}>Não pago</option>
              </select>
            </div>
            <div class="fg">
              <button class="btn btn--ghost" type="submit">Filtrar</button>
            </div>
          </form>
        </div>

        <div class="card">
          <table class="fin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Consulta / Paciente</th>
                <th>Forma</th>
                <th>Status</th>
                <th>Data Pagamento</th>
                <th style="text-align:right;">Valor (R$)</th>
                <th style="text-align:right;">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${
                state.rows.length === 0
                  ? `<tr><td colspan="7" style="text-align:center; color:#6b7280;">Nenhum lançamento encontrado.</td></tr>`
                  : state.rows.map(r => {
                      const consulta = state.consultasMap[r.idConsulta];
                      const pacienteNome = getPacienteNome(consulta);
                      return `
                        <tr>
                          <td>${r.id}</td>
                          <td>
                            ${r.idConsulta ?? '-'}
                            ${pacienteNome ? ' — ' + pacienteNome : ''}
                          </td>
                          <td>${r.formaPagamento ?? '-'}</td>
                          <td>
                            <span class="fin-status ${
                              (r.statusFinanceiro || '').toLowerCase() === 'pago'
                                ? 'fin-status--pago'
                                : 'fin-status--nao-pago'
                            }">
                              ${r.statusFinanceiro}
                            </span>
                          </td>
                          <td>${r.dataPagamento ?? '-'}</td>
                          <td style="text-align:right;">
                            ${
                              r.valor != null
                                ? Number(r.valor).toFixed(2).replace('.', ',')
                                : '-'
                            }
                          </td>
                          <td style="text-align:right;">
                            ${
                              (r.statusFinanceiro || '').toLowerCase() === 'pago'
                                ? ''
                                : `<button class="btn btn--sm btn--primary act-pay" data-id="${r.id}">Marcar pago</button>`
                            }
                            <button class="btn btn--sm btn--ghost act-edit" data-id="${r.id}">Editar</button>
                            <button class="btn btn--sm btn--danger act-del" data-id="${r.id}">Excluir</button>
                          </td>
                        </tr>
                      `;
                    }).join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    `;

    const $ = (sel) => root.querySelector(sel);

    $('#fin-filtros')?.addEventListener('submit', (e) => {
      e.preventDefault();
      state.from   = $('#fin-from')?.value || '';
      state.to     = $('#fin-to')?.value || '';
      state.status = $('#fin-status')?.value || '';
      state.page   = 1;
      carregar();
    });

    $('#btnExport')?.addEventListener('click', (e) => {
      e.preventDefault();
      exportCSV();
    });

    root.querySelectorAll('.act-pay')?.forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!id) return;
        if (!confirm('Confirmar pagamento deste lançamento?')) return;
        try {
          await Fin.pagar(id, hojeISO());
          notify('[ok] Pagamento registrado.', 'log');
          carregar();
        } catch (e) {
          console.error(e);
          notify('[erro] Não foi possível marcar como pago.', 'error');
        }
      });
    });

    root.querySelectorAll('.act-edit')?.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (!id) return;
        location.hash = `#/financeiro/form?id=${id}`;
      });
    });

    root.querySelectorAll('.act-del')?.forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!id) return;
        if (!confirm('Excluir este lançamento?')) return;
        try {
          await Fin.remove(id);
          notify('[ok] Lançamento excluído.', 'log');
          carregar();
        } catch (e) {
          console.error(e);
          notify('[erro] Não foi possível excluir.', 'error');
        }
      });
    });
  }

  // período padrão = mês atual
  (function initPeriodoPadrao(){
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
    const last  = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().slice(0,10);
    state.from = first;
    state.to   = last;
  })();

  await carregar();
});
