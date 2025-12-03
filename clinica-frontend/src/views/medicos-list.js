// src/views/medicos-list.js
AppRouter.register('/medicos', async (root) => {
  const state = { page: 1, size: 10, search: '' };

  async function fetchPage() {
    const API = (window.API && window.API.medicos) ? window.API.medicos : null;

    // Fallback se a API não estiver disponível (modo “demo”)
    if (!API) {
      const base = [
        {
          id: 1,
          nome: 'Dra. Ana Souza',
          crm: 'CRM123',
          crmUf: 'RS',
          especialidade: 'Clínica Geral',
          prioritario: true,
          telefone: '(54) 99999-0001'
        },
        {
          id: 2,
          nome: 'Dr. João Lima',
          crm: 'CRM456',
          crmUf: 'RS',
          especialidade: 'Cardiologia',
          prioritario: false,
          telefone: '(54) 99999-0002'
        }
      ];

      const term = (state.search || '').toLowerCase();
      const data = term
        ? base.filter(m => (m.nome || '').toLowerCase().includes(term))
        : base;

      const total = data.length;
      const from = (state.page - 1) * state.size;
      const rows = data.slice(from, from + state.size);

      return { rows, total, page: state.page, size: state.size };
    }

    // Quando estiver usando a tua API real:
    return API.list({
      page: state.page,
      size: state.size,
      q: (state.search || '').trim()
    });
  }

  function normalize(resp) {
    if (Array.isArray(resp)) return { rows: resp, total: resp.length };
    if (resp && Array.isArray(resp.rows)) {
      return { rows: resp.rows, total: resp.total ?? resp.rows.length };
    }
    if (resp && Array.isArray(resp.content)) {
      return { rows: resp.content, total: resp.total ?? resp.content.length };
    }
    return { rows: [], total: 0 };
  }

  function renderTable(rows = [], total = 0) {
    const from = (state.page - 1) * state.size + 1;
    const to = Math.min(state.page * state.size, total);

    return `
      <div class="card">
        <div class="space-between">
          <h3>Médicos</h3>
          <div class="row" style="gap:8px">
            <input id="search" class="input" placeholder="Buscar por nome..." value="${state.search || ''}">
            <button id="btnSearch" class="btn btn--ghost" type="button">Buscar</button>
            <button id="btnNovo" class="btn" type="button">Novo</button>
          </div>
        </div>

        <div class="mt-2 table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>CRM</th>
                <th>Nome</th>
                <th>Especialidade</th>
                <th>Telefone</th>
                <th style="width:180px">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${
                (rows || []).map(m => `
                  <tr data-id="${m.id}" data-nome="${m.nome || ''}">
                    <td>${m.id ?? ''}</td>
                    <td>${m.crm ? `${m.crm}${m.crmUf ? '/' + m.crmUf : ''}` : ''}</td>
                    <td>${m.nome ?? ''}</td>
                    <td>${m.especialidade?.nome ?? ''}</td>
                    <td>${m.telefone ?? ''}</td>
                    <td>
                      <div class="row" style="gap:8px">
                        <button type="button" class="btn btn--ghost" data-action="editar">Editar</button>
                        <button type="button" class="btn btn--primary" data-action="agendar">Agendar</button>
                      </div>
                    </td>
                  </tr>
                `).join('') ||
                `<tr><td colspan="7" style="text-align:center; color:var(--muted); padding:12px 8px">0 resultados</td></tr>`
              }
            </tbody>
          </table>
        </div>

        <div class="space-between mt-2">
          <div style="color:var(--muted)">
            ${total ? `${from}–${to} de ${total}` : '0 resultados'}
          </div>
          <div class="row" style="gap:8px">
            <button class="btn btn--ghost" ${state.page <= 1 ? 'disabled' : ''} id="btnPrev">← Anterior</button>
            <button class="btn btn--ghost" ${to >= total ? 'disabled' : ''} id="btnNext">Próximo →</button>
          </div>
        </div>
      </div>
    `;
  }

  async function redraw() {
    const resp = await fetchPage();
    const { rows, total } = normalize(resp);

    root.innerHTML = renderTable(rows, total);

    const $ = (sel) => root.querySelector(sel);

    $('#btnSearch')?.addEventListener('click', () => {
      state.page = 1;
      state.search = $('#search')?.value || '';
      redraw();
    });

    $('#search')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        $('#btnSearch')?.click();
      }
    });

    $('#btnPrev')?.addEventListener('click', () => {
      if (state.page > 1) {
        state.page--;
        redraw();
      }
    });

    $('#btnNext')?.addEventListener('click', () => {
      state.page++;
      redraw();
    });

    $('#btnNovo')?.addEventListener('click', () => {
      location.hash = '#/medicos/form';
    });

    root.querySelector('.table')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;

      const action = btn.getAttribute('data-action');
      const row = btn.closest('tr[data-id]');
      const id = row?.getAttribute('data-id');
      const nome = row?.getAttribute('data-nome') || '';

      if (action === 'editar' && id) {
        location.hash = `#/medicos/form?id=${id}`;
      }

      if (action === 'agendar' && id) {
        location.hash = `#/agendamentos?medicoId=${id}&medicoNome=${encodeURIComponent(nome)}`;
      }
    });
  }

  await redraw();
}, { title: 'Médicos' });
