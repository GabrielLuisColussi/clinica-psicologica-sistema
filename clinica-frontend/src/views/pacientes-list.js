// src/views/pacientes-list.js
function formatCPF(value) {
  if (!value) return '';
  const digits = String(value).replace(/\D/g, '');
  if (digits.length !== 11) return value;   // se não tiver 11 dígitos, mostra como veio
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}
AppRouter.register('/pacientes', async (root) => {
  const state = { page: 1, size: 10, search: '' };

  async function fetchPage() {
    const api = (window.API && window.API.pacientes) ? window.API.pacientes : null;

    if (!api) {
      // fallback mínimo se não houver API real
      const base = Array.from({length: 5}).map((_,i)=>({
        id: i+1,
        nome: `Paciente ${String(i+1).padStart(2,'0')}`,
        cpf: '000.000.000-00',
        telefone: '(54) 99999-0000',
        email: `pac${i+1}@mail.com`,
        cidade: 'Bento Gonçalves',
        uf: 'RS'
      }));
      const term = (state.search||'').toLowerCase();
      const data = term ? base.filter(p => (p.nome||'').toLowerCase().includes(term)) : base;
      const total = data.length;
      const from = (state.page-1)*state.size;
      const rows = data.slice(from, from+state.size);
      return { rows, total, page: state.page, size: state.size };
    }

    // --- API real: lista + enrich com getById para trazer CPF/endereço ---
    const resp = await api.list({ page: state.page, size: state.size, q: (state.search||'').trim() });

    // normaliza estrutura de paginação
    let rows, total;
    if (Array.isArray(resp)) {
      rows = resp; total = resp.length;
    } else if (resp && Array.isArray(resp.rows)) {
      rows = resp.rows; total = resp.total ?? resp.rows.length;
    } else if (resp && Array.isArray(resp.content)) {
      rows = resp.content; total = resp.total ?? resp.content.length;
    } else {
      rows = []; total = 0;
    }

    // para cada linha, tenta buscar dados completos em /pessoas/{id}
    if (api.getById) {
      const enriched = await Promise.all(rows.map(async (p) => {
        try {
          const full = await api.getById(p.id);
          return { ...p, ...full, endereco: full.endereco || p.endereco };
        } catch {
          return p;
        }
      }));
      rows = enriched;
    }

    return { rows, total, page: state.page, size: state.size };
  }

  function renderTable(rows = [], total = 0) {
    const from = (state.page-1)*state.size + 1;
    const to = Math.min(state.page*state.size, total);

    const thead = `
      <thead>
        <tr>
          <th>ID</th>
          <th>CPF</th>
          <th>Nome</th>
          <th>Telefone</th>
          <th>Cidade/UF</th>
          <th style="width:180px">Ações</th>
        </tr>
      </thead>
    `;

    const tbody = `
      <tbody>
        ${(rows || []).map(p => {
          const endereco = p.endereco || {};
          const cidade = p.cidade || p.municipio || endereco.cidade || endereco.municipio || '';
          const uf = p.uf || endereco.uf || '';
          const cidadeUf = cidade ? `${cidade}${uf ? `/${uf}` : ''}` : '';
          return `
            <tr data-id="${p.id}" data-nome="${p.nome||''}" data-telefone="${p.telefone||''}">
              <td>${p.id ?? ''}</td>
              <td>${formatCPF(p.cpf)}</td>
              <td>${p.nome ?? ''}</td>
              <td>${p.telefone ?? ''}</td>
              <td>${cidadeUf}</td>
              <td>
                <div class="row" style="gap:8px">
                  <button type="button" class="btn btn--ghost" data-action="editar">Editar</button>
                  <button type="button" class="btn btn--primary" data-action="agendar">Agendar</button>
                </div>
              </td>
            </tr>
          `;
        }).join('')}
        ${(!rows || rows.length===0) ? `
          <tr><td colspan="6" style="color:var(--muted); padding:12px 8px">0 resultados</td></tr>
        ` : ''}
      </tbody>
    `;

    const pager = `
      <div class="space-between mt-2">
        <div style="color:var(--muted)">${total ? `${from}–${to} de ${total}` : '0 resultados'}</div>
        <div class="row" style="gap:8px">
          <button class="btn btn--ghost" ${state.page<=1?'disabled':''} id="btnPrev">← Anterior</button>
          <button class="btn btn--ghost" ${to>=total?'disabled':''} id="btnNext">Próximo →</button>
        </div>
      </div>
    `;

    return `
      <div class="card">
        <div class="space-between">
          <h3>Pacientes</h3>
          <div class="row" style="gap:8px">
            <input id="search" placeholder="Buscar por nome..." value="${state.search||''}">
            <button id="btnSearch" class="btn btn--ghost">Buscar</button>
            <button id="btnNovo" class="btn btn--primary" type="button">Novo</button>
          </div>
        </div>

        <div class="mt-2 table-responsive">
          <table class="table">
            ${thead}
            ${tbody}
          </table>
        </div>

        ${pager}
      </div>
    `;
  }

  async function redraw() {
    const page = await fetchPage();
    const rows = page.rows || [];
    const total = page.total ?? rows.length;

    root.innerHTML = renderTable(rows, total);

    const $ = (sel) => root.querySelector(sel);
    $('#btnSearch')?.addEventListener('click', () => {
      state.page = 1;
      state.search = $('#search')?.value || '';
      redraw();
    });
    $('#search')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); $('#btnSearch')?.click(); }
    });
    $('#btnPrev')?.addEventListener('click', () => {
      if (state.page > 1) { state.page--; redraw(); }
    });
    $('#btnNext')?.addEventListener('click', () => {
      state.page++; redraw();
    });
    $('#btnNovo')?.addEventListener('click', () => {
      location.hash = '#/pacientes/form';
    });

    // Delegação: ações da tabela
    root.querySelector('.table')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');

      if (action === 'editar') {
        const row = btn.closest('[data-id]');
        const id = row?.getAttribute('data-id');
        if (id) location.hash = `#/pacientes/form?id=${id}`;
        return;
      }
      if (action === 'agendar') {
        const row = btn.closest('[data-id]');
        const id = row?.getAttribute('data-id');
        const nome = row?.getAttribute('data-nome') || '';
        const tel = row?.getAttribute('data-telefone') || '';
        location.hash = `#/agendamentos?pacienteId=${id}&nome=${encodeURIComponent(nome)}&telefone=${encodeURIComponent(tel)}`;
        return;
      }
    });
  }

  await redraw();
}, { title: 'Pacientes' });
