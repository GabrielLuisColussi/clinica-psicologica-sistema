// src/views/agendamentos.js (v12)
AppRouter.register('/agendamentos', async (root) => {
  // ---------- Helpers ----------
  const today = new Date();
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth();
  let selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // controla se estou editando uma consulta (null = criando)
  let current = null;

  const fmtISO       = (d) => d.toISOString().slice(0,10);
  const daysInMonth  = (y,m) => new Date(y, m+1, 0).getDate();
  const firstWeekday = (y,m) => new Date(y, m, 1).getDay();
  const monthLabel   = (y,m) => new Date(y,m,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});

  function notify(msg, type = 'log') {
    try {
      const t = window.toast;
      if (typeof t === 'function') {
        const kind = type === 'error' ? 'error' : (type === 'info' ? 'info' : 'log');
        t(msg, kind);
        return;
      }
      if (t && typeof t[type] === 'function') {
        t[type](msg);
        return;
      }
    } catch {}
    (type === 'error' ? console.error : console.log)(msg);
  }

  function getHashParamsLocal() {
    try {
      const hash = String(location.hash||'');
      const q = hash.includes('?') ? hash.split('?')[1] : '';
      return Object.fromEntries(new URLSearchParams(q));
    } catch { return {}; }
  }

  const norm = (resp) => {
    if (!resp) return [];
    if (Array.isArray(resp)) return resp;
    if (Array.isArray(resp.rows))    return resp.rows;
    if (Array.isArray(resp.content)) return resp.content;
    return [];
  };

  // 🔧 Normalização de datas vindas do back
  function normalizeDateStr(raw){
    if (!raw) return '';
    if (raw instanceof Date) return fmtISO(raw);
    let s = String(raw);

    // remove parte de hora caso venha "2026-01-19T00:00:00"
    if (s.includes('T')) s = s.split('T')[0];

    // formato "2026,1,19"
    if (/^\d{4},\d{1,2},\d{1,2}$/.test(s)) {
      const [y,m,d] = s.split(',').map(Number);
      return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    }

    // formato "19/01/2026"
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
      const [d,m,y] = s.split('/').map(Number);
      return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    }

    // formato "2026-1-9"
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
      const [y,m,d] = s.split('-').map(Number);
      return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    }

    return s.slice(0,10);
  }

  // ---------- CSS ----------
  (function injectLocalCSS(){
    const id = 'agenda-local-styles-v5';
    if (document.getElementById(id)) return;
    const st = document.createElement('style');
    st.id = id;
    st.textContent = `
      .status-pill { cursor:pointer; user-select:none; }
      .status-pill:hover { filter: brightness(0.95); }
      .cal-wrapper {
  display:grid;
  /* calendário um pouco maior, painel também */
  grid-template-columns: minmax(440px, 1.1fr) minmax(520px, 1.2fr);
  gap:32px;
  align-items:flex-start;
}
    @media (max-width: 1200px){
      .cal-wrapper {
        grid-template-columns: 1fr;
      }
    }
      .cal-box { background:#fff; border-radius:12px; box-shadow:var(--shadow, 0 1px 2px rgba(0,0,0,.08)); padding:16px; }
      .cal-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
      .cal-head .label { font-weight:700; text-transform:capitalize; }
      .cal-grid { display:grid; grid-template-columns: repeat(7, 1fr); gap:8px; }
      .cal-wd  { font-size:12px; color:var(--muted,#6b7280); text-transform:uppercase; text-align:center; }
      .cal-cell { background:#fff; border:1px solid #eef2f7; border-radius:10px; min-height:100px; padding:8px; display:flex; flex-direction:column; gap:4px; cursor:pointer; transition:box-shadow .15s ease, transform .05s ease; }
      .cal-cell:hover { box-shadow:0 2px 10px rgba(0,0,0,.05); transform:translateY(-1px); }
      .cal-day { font-size:12px; color:#6b7280; font-weight:600; }
      .cal-cell--muted { background:#f8fafc; }
      .cal-cell--selected { outline:2px solid var(--brand,#2563eb); }
      .cal-pill { display:inline-block; font-size:11px; padding:4px 6px; border-radius:8px; background:#eef2ff; color:#3730a3; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .cal-empty { color:#9ca3af; font-size:12px; text-align:center; margin-top:6px; }
      .agenda-list .item { border:1px solid #eef2f7; border-radius:10px; padding:10px; margin-bottom:8px; background:#fff; cursor:pointer; }
      .agenda-list .item:hover { box-shadow:0 2px 10px rgba(0,0,0,.05); }
      .agenda-list .item h4 { margin:0 0 4px 0; font-size:14px; }
      .agenda-list .item .meta { font-size:12px; color:var(--muted,#6b7280); }
      .agenda-list .item.status-cancelado { border-left:4px solid #dc2626; background:#fef2f2; }
      .agenda-list .item.status-cancelado h4 { color:#991b1b; }
      .agenda-list .item.status-concluido { border-left:4px solid #16a34a; background:#f0fdf4; }
      .agenda-list .item.status-concluido h4 { color:#166534; }
      .agenda-list .item.status-concluida { border-left:4px solid #16a34a; background:#f0fdf4; }
      .agenda-list .item.status-concluida h4 { color:#166534; }
      .side-panel {
      position: sticky;
      top: 16px;
      background:#fff;
      border-radius:16px;
      padding:24px;
      box-shadow: 0 10px 30px rgba(2,6,23,.06), 0 2px 6px rgba(2,6,23,.06);
      border: 1px solid #eef2f7;
      min-width: 420px;
    }
      .side-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
      .side-title { font-size:18px; font-weight:700; }
      .side-sub { font-size:12px; color:var(--muted); }
      .form-grid { display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
      .form-grid .col-1 { grid-column: span 1; }
      .form-grid .col-2 { grid-column: span 2; }
      @media (max-width: 480px){ .form-grid { grid-template-columns: 1fr; } .form-grid .col-2 { grid-column: span 1; } }
      .fg { display:flex; flex-direction:column; gap:6px; }
      .fg label { font-size:12px; color:#4b5563; font-weight:600; }
      .fg input, .fg select { height: 34px; padding: 6px 10px; border-radius:10px; border:1px solid #e5e7eb; background:#fff; outline: none; transition: border-color .15s ease, box-shadow .15s ease; }
      .fg input:focus, .fg select:focus { border-color: var(--brand,#2563eb); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
      .fg .hint { font-size:11px; color:var(--muted); }
      .fg input.invalid, .fg select.invalid { border-color:#dc2626; box-shadow:0 0 0 1px rgba(220,38,38,.5); }
      .panel-actions { display:flex; gap:8px; margin-top:10px; }
      .panel-actions .btn { height:36px; }
      .panel-divider { height:1px; background:#eef2f7; margin:10px 0; }
      .badge-date { font-size:12px; padding:4px 8px; border-radius:999px; background:#f1f5f9; color:#334155; }
      .modal-backdrop { position:fixed; inset:0; background:rgba(15,23,42,.35); display:none; align-items:center; justify-content:center; z-index:9999; }
      .modal-backdrop.show { display:flex; }
      .modal-card { width:520px; max-width:92vw; background:#fff; border-radius:16px; box-shadow: 0 24px 60px rgba(2,6,23,.2); border:1px solid #e5e7eb; }
      .modal-head { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-bottom:1px solid #eef2f7; }
      .modal-body { padding:16px; }
      .modal-actions { display:flex; justify-content:flex-end; gap:8px; padding:14px 16px; border-top:1px solid #eef2f7; }
      .status-pill { font-size:12px; padding:4px 8px; border-radius:999px; background:#f1f5f9; color:#334155; }
      .status-pill.status-cancelado { background:#fee2e2; color:#991b1b; }
      .status-pill.status-concluido { background:#d1fae5; color:#065f46; }
      .status-pill.status-concluida { background:#d1fae5; color:#065f46; }
    `;
    document.head.appendChild(st);
  })();

  // API dinâmica
  const API = {
    get consultas(){ return (window.API && window.API.consultas) || null; },
    get pacientes(){ return (window.API && window.API.pacientes) || null; },
    get medicos(){   return (window.API && window.API.medicos)   || null; }
  };

  // Fallback interno para consultas (localStorage)
  const FallbackConsultas = (() => {
    const KEY='clinica.consultas.v1';
    const get = () => { try{ return JSON.parse(localStorage.getItem(KEY))||[]; } catch{ return []; } };
    const set = (v) => { try{ localStorage.setItem(KEY, JSON.stringify(v)); } catch{} };
    const onlyDate = (d) => normalizeDateStr(d);

    const nextId = (list) => (list.length ? Math.max(...list.map(x=>+x.id||0)) : 0) + 1;

    const toMinutes = (hhmm) => {
      const [h,m] = String(hhmm||'00:00').split(':').map(n=>+n||0);
      return h*60+m;
    };
    const overlap = (aStart, aDur, bStart, bDur) => {
      const a1 = toMinutes(aStart), a2 = a1 + (+aDur||0);
      const b1 = toMinutes(bStart), b2 = b1 + (+bDur||0);
      return Math.max(a1,b1) < Math.min(a2,b2);
    };

    return {
      async list({from,to}={}) {
        const all = get();
        if (!from && !to) return { rows: all, total: all.length };
        const f = from ? onlyDate(from) : null;
        const t = to   ? onlyDate(to)   : null;
        const rows = all.filter(c => {
          const d = onlyDate(c.data);
          if (f && d < f) return false;
          if (t && d > t) return false;
          return true;
        });
        return { rows, total: rows.length };
      },
      async create(data){
        const list = get();
        const id = nextId(list);
        list.push({
          id,
          pacienteId: String(data.pacienteId||''),
          medicoId:   String(data.medicoId||''),
          data:       onlyDate(data.data),
          hora:       String(data.hora||''),
          duracao:    Number(data.duracao||30),
          status:     String(data.status||'AGENDADA'),
          observacoes:String(data.observacoes||'')
        });
        set(list);
        return { id };
      },
      async getById(id){
        const list = get();
        return list.find(x => String(x.id) === String(id)) || null;
      },
      async update(id, patch){
        const list = get();
        const i = list.findIndex(x => String(x.id) === String(id));
        if (i >= 0) {
          list[i] = { ...list[i], ...patch, id: list[i].id };
          set(list);
          return { updated: true };
        }
        return { updated: false };
      },
      async remove(id){
        const list = get().filter(x => String(x.id) !== String(id));
        set(list);
        return { deleted: true };
      },
      async updateStatus(id, status){
        return this.update(id, { status: String(status||'').toUpperCase() || 'AGENDADA' });
      },
      async conflicts({ medicoId, data, hora, duracao, idAtual }){
        const list = get();
        const dISO = onlyDate(data);
        const mId = String(medicoId||'');
        return list.some(c => (
          String(c.medicoId) === mId &&
          onlyDate(c.data) === dISO &&
          String(c.id) !== String(idAtual||'') &&
          overlap(c.hora, c.duracao || 30, hora, duracao || 30)
        ));
      }
    };
  })();

  // 🔄 Normalizador de consultas vindas da API ou do fallback
  function normalizeConsulta(raw){
    if (!raw) return null;

    const id = raw.id ?? raw.idConsulta ?? raw.id_consulta;
    const pacienteId =
      raw.pacienteId ??
      raw.idPaciente ??
      raw.id_paciente ??
      raw.paciente?.id ??
      raw.paciente?.idPessoa;
    const medicoId =
      raw.medicoId ??
      raw.idMedico ??
      raw.id_medico ??
      raw.medico?.id ??
      raw.medico?.idPessoa;

    const dataRaw =
      raw.data ??
      raw.dataConsulta ??
      raw.data_consulta;

    const hora =
      raw.hora ??
      raw.horario;

    const duracao =
      raw.duracao ??
      raw.duracaoMinutos ??
      30;

    const status =
      raw.status ??
      raw.statusConsulta ??
      raw.status_consulta ??
      'AGENDADA';

    const observacoes =
      raw.observacoes ??
      raw.descricao ??
      '';

    return {
      ...raw,
      id,
      pacienteId,
      medicoId,
      data: normalizeDateStr(dataRaw),
      hora,
      duracao,
      status,
      observacoes
    };
  }

  // Cache de contagem por dia
  let monthCountCache = {};

  async function getMonthCounts(y,m){
    try {
      const from = fmtISO(new Date(y,m,1));
      const to   = fmtISO(new Date(y,m,daysInMonth(y,m)));
      const resp = await (API.consultas || FallbackConsultas).list({ from, to });
      const rowsNorm = norm(resp).map(normalizeConsulta).filter(Boolean);
      const map = {};
      rowsNorm.forEach(c => {
        const d = normalizeDateStr(c.data);
        if (!d) return;
        map[d] = (map[d] || 0) + 1;
      });
      return map;
    } catch { return {}; }
  }

  async function listDay(dateISO){
    try {
      const resp = await (API.consultas || FallbackConsultas).list({ from: dateISO, to: dateISO });
      const consNorm = norm(resp).map(normalizeConsulta).filter(Boolean);

      const [pList, mList] = await Promise.all([
        API.pacientes ? API.pacientes.list({ page:1, size:999 }) : null,
        API.medicos   ? API.medicos.list({ page:1, size:999 })   : null
      ]);
      const pacientes = norm(pList?.rows ? pList : pList);
      const medicos   = norm(mList?.rows ? mList : mList);
      const pMap = new Map(pacientes.map(p => [String(p.id), p]));
      const mMap = new Map(medicos.map(m => [String(m.id), m]));

      return consNorm.map(c => ({
        ...c,
        paciente: pMap.get(String(c.pacienteId)) || { id:c.pacienteId, nome:'(Paciente)' },
        medico:   mMap.get(String(c.medicoId))   || { id:c.medicoId, nome:'(Médico)' }
      }));
    } catch { return []; }
  }

  // Prefill via querystring (seguro)
  const params = getHashParamsLocal();
  const pre = {
    pacienteId : params.pacienteId || '',
    medicoId   : params.medicoId   || '',
    nome       : params.nome ? decodeURIComponent(params.nome) : (params.nomePaciente ? decodeURIComponent(params.nomePaciente) : ''),
    telefone   : params.telefone ? decodeURIComponent(params.telefone) : ''
  };

  async function render(){
    const dateISO = fmtISO(selectedDate);

    const [dayItems, medicos, pacientes] = await Promise.all([
      listDay(dateISO),
      API.medicos   ? API.medicos.list({ page:1, size:200 })   : { rows:[] },
      API.pacientes ? API.pacientes.list({ page:1, size:500 }) : { rows:[] },
    ]);
    const medList = norm(medicos);
    const pacList = norm(pacientes);

    monthCountCache = await getMonthCounts(viewYear, viewMonth);

    root.innerHTML = `
      <div class="cal-wrapper">
        <div class="cal-box">
          <div class="cal-head">
            <div class="row" style="gap:8px; align-items:center">
              <button id="prevMonth" class="btn btn--ghost" type="button">←</button>
              <div class="label">${monthLabel(viewYear, viewMonth)}</div>
              <button id="nextMonth" class="btn btn--ghost" type="button">→</button>
            </div>
            <div class="row" style="gap:8px">
              <button id="goToday" class="btn btn--ghost" type="button">Hoje</button>
            </div>
          </div>

          <div class="cal-grid">
            ${['dom','seg','ter','qua','qui','sex','sáb'].map(w => `<div class="cal-wd">${w}</div>`).join('')}
            ${(() => {
              const totalDays = daysInMonth(viewYear, viewMonth);
              const start = firstWeekday(viewYear, viewMonth);
              let html = '';
              for (let i=0;i<start;i++){ html += `<div class="cal-cell cal-cell--muted"></div>`; }
              const hojeISO = fmtISO(today);
              for (let d=1; d<=totalDays; d++){
                const iso = fmtISO(new Date(viewYear, viewMonth, d));
                const isSelected = iso === fmtISO(selectedDate);
                const isPast = iso < hojeISO;
                const count = monthCountCache[iso] || 0;
                html += `
                  <div class="cal-cell ${isSelected?'cal-cell--selected':''} ${isPast?'cal-cell--past':''}" 
                       data-date="${iso}" 
                       ${isPast ? 'style="opacity:0.5; cursor:not-allowed; pointer-events:none;"' : ''}>
                    <div class="cal-day">${d}</div>
                    ${count ? `<span class="cal-pill">${count} ag.</span>` : `<span class="cal-empty">—</span>`}
                  </div>
                `;
              }
              return html;
            })()}
          </div>

          <div class="mt-3">
            <h3 style="margin:0 0 8px 0">Agenda de ${selectedDate.toLocaleDateString('pt-BR')}</h3>
            <div class="agenda-list">
              ${dayItems.length ? dayItems.map(it => {
                const status = String(it.status || 'AGENDADA').toUpperCase().trim();
                // Verifica se é cancelado (CANCELADO, CANCELADA)
                const isCancelado = status.includes('CANCEL');
                // Verifica se é concluído (CONCLUIDO, CONCLUÍDA, CONCLUIDA, FINALIZADO, FINALIZADA)
                const isConcluido = status.includes('CONCLU') || status.includes('FINALIZ');
                
                const statusClass = isCancelado ? 'status-cancelado' 
                                  : isConcluido ? 'status-concluido' 
                                  : '';
                return `
                <div class="item ${statusClass}" data-consulta='${JSON.stringify(it).replace(/'/g,"&#39;")}'>
                  <h4>${it.paciente?.nome || 'Paciente'}</h4>
                  <div class="meta">
                    <span>${it.hora || '--:--'} • ${it.medico?.nome || 'Médico'}</span>
                    <span style="margin-left:8px;">
                      Status:
                      <button class="status-pill ${statusClass}" data-change-status data-id="${it.id}" data-status="${it.status || 'AGENDADA'}">
                        ${it.status || '-'}
                      </button>
                    </span>
                  </div>
                  ${it.observacoes ? `<div class="meta">Obs: ${it.observacoes}</div>` : ''}
                </div>
              `;
              }).join('') : `<div class="cal-empty">Sem agendamentos para este dia.</div>`}
            </div>
          </div>
        </div>

        <aside class="side-panel">
          <div class="side-head">
            <div class="side-title">Novo Agendamento</div>
            <div class="side-sub"><span class="badge-date">${selectedDate.toLocaleDateString('pt-BR')}</span></div>
          </div>
          <div class="panel-divider"></div>

          <form id="frmAgendar" class="form-grid">
            <input type="hidden" id="consultaId" name="id">
            <div class="fg col-2">
              <label for="pacienteId">Paciente</label>
              <select id="pacienteId" name="pacienteId" required>
                <option value="">Selecione um paciente</option>
                ${pacList.map(p => `<option value="${p.id}">${p.id} — ${p.nome}</option>`).join('')}
              </select>
            </div>

            <div class="fg col-2">
              <label for="medicoId">Médico</label>
              <select id="medicoId" name="medicoId" required>
                <option value="">Selecione</option>
                ${medList.map(m => `<option value="${m.id}">${m.nome}</option>`).join('')}
              </select>
            </div>

            <div class="fg col-1">
              <label for="data">Data</label>
              <input id="data" name="data" type="date" value="${fmtISO(selectedDate)}" min="${fmtISO(today)}" required>
            </div>
            <div class="fg col-1">
              <label for="hora">Hora</label>
              <input id="hora" name="hora" type="time" min="07:00" max="17:00" required>
            </div>

            <div class="fg col-1">
              <label for="duracao">Duração (min)</label>
              <input id="duracao" name="duracao" type="number" min="10" step="5" value="30">
            </div>
            <div class="fg col-1">
              <label for="status">Status</label>
              <select id="status" name="status">
                <option value="AGENDADA">Agendada</option>
                <option value="CONFIRMADA">Confirmada</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>

            <div class="fg col-2">
              <label for="observacoes">Observações</label>
              <input id="observacoes" name="observacoes" placeholder="(opcional)">
            </div>

            <div class="panel-divider col-2"></div>
            <div class="panel-actions col-2">
              <button class="btn btn--primary" type="submit">Salvar</button>
              <button class="btn btn--ghost" type="button" id="btnVoltar">Voltar</button>
            </div>
          </form>
        </aside>
      </div>

      <div class="modal-backdrop" id="consultaModal">
        <div class="modal-card">
          <div class="modal-head">
            <strong>Detalhe da Consulta</strong>
            <button class="btn btn--ghost" id="modalClose">✕</button>
          </div>
          <div class="modal-body" id="modalBody"></div>
          <div class="modal-actions">
            <button class="btn btn--danger" id="modalDelete">Excluir</button>
            <button class="btn btn--primary" id="modalEdit">Editar</button>
            <button class="btn btn--ghost" id="modalCancel">Fechar</button>
          </div>
        </div>
      </div>
    `;

    // ---------- Eventos ----------
    const $ = (sel) => root.querySelector(sel);

    $('#prevMonth')?.addEventListener('click', async () => {
      viewMonth--; if (viewMonth<0){ viewMonth=11; viewYear--; }
      current = null;
      await render();
    });
    $('#nextMonth')?.addEventListener('click', async () => {
      viewMonth++; if (viewMonth>11){ viewMonth=0; viewYear++; }
      current = null;
      await render();
    });
    $('#goToday')?.addEventListener('click', async () => {
      viewYear=today.getFullYear(); viewMonth=today.getMonth();
      selectedDate=new Date(today.getFullYear(),today.getMonth(),today.getDate());
      current = null;
      await render();
    });

    root.querySelectorAll('.cal-cell[data-date]')?.forEach(cell => {
      cell.addEventListener('click', async () => {
        // Não permite selecionar datas passadas
        if (cell.classList.contains('cal-cell--past')) {
          notify('[erro] Não é possível selecionar datas passadas.', 'error');
          return;
        }
        const iso = cell.getAttribute('data-date');
        const [y,m,d] = (iso||'').split('-').map(Number);
        if (y && m && d) {
          const dataSelecionada = new Date(y, m-1, d);
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          if (dataSelecionada < hoje) {
            notify('[erro] Não é possível selecionar datas passadas.', 'error');
            return;
          }
          selectedDate = dataSelecionada;
        }
        current = null;
        await render();
      });
    });

    root.querySelectorAll('.agenda-list .item')?.forEach(el => {
      el.addEventListener('click', () => {
        const raw = el.getAttribute('data-consulta') || '';
        if (!raw) return;
        let c = null;
        try { c = JSON.parse(raw.replace(/&#39;/g, "'")); }
        catch { c = null; }
        if (c) openConsultaModal(c);
      });
    });

    // troca de status ao clicar na pill
    root.querySelectorAll('[data-change-status]')?.forEach(el => {
      el.addEventListener('click', async () => {
        const id  = el.getAttribute('data-id');
        const cur = String(el.getAttribute('data-status') || 'AGENDADA').toUpperCase();
        const next = cur === 'AGENDADA' ? 'CONFIRMADA'
                    : cur === 'CONFIRMADA' ? 'CANCELADA'
                    : 'AGENDADA';
        try {
          const Cons = API.consultas || FallbackConsultas;
          if (Cons.updateStatus) {
            await Cons.updateStatus(id, next);
          } else if (Cons.update) {
            await Cons.update(id, { status: next, statusConsulta: next });
          }
          notify(`[ok] Status atualizado para ${next}.`, 'log');
          
          // Dispara evento para atualizar notificações
          window.dispatchEvent(new CustomEvent('consulta-status-updated', { 
            detail: { consultaId: id, novoStatus: next } 
          }));
          
          await render();
        } catch (e) {
          console.error(e);
          notify('[erro] Não foi possível atualizar o status.', 'error');
        }
      });
    });

    $('#btnVoltar')?.addEventListener('click', () => history.back());

    // Listener para atualizar agenda quando status for atualizado nas notificações
    window.addEventListener('consulta-status-updated', async (e) => {
      const { consultaId, novoStatus } = e.detail;
      console.log('[agendamentos] Status atualizado, recarregando agenda...', { consultaId, novoStatus });
      // Limpa o cache do mês para forçar recarregamento
      monthCountCache = {};
      // Recarrega a agenda para refletir a mudança de status
      await render();
    });

    // Prefill seguro
    {
      const pSel = $('#pacienteId');
      if (pSel && pre.pacienteId) pSel.value = pre.pacienteId;
      const mSel = $('#medicoId');
      if (mSel && pre.medicoId)   mSel.value = pre.medicoId;
      
      // Atualiza o atributo min do input de data para impedir datas passadas
      const dataInput = $('#data');
      if (dataInput) {
        dataInput.setAttribute('min', fmtISO(today));
      }
      
      // Atualiza os atributos min e max do input de hora para restringir horário
      const horaInput = $('#hora');
      if (horaInput) {
        horaInput.setAttribute('min', '07:00');
        horaInput.setAttribute('max', '17:00');
      }
    }

    // SUBMIT
    $('#frmAgendar')?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const form = e.currentTarget;
      const v = (sel) => { const el = form.querySelector(sel); return el && typeof el.value === 'string' ? el.value.trim() : ''; };

      // coleta dos campos
      const id          = v('#consultaId');      // se vier preenchido => edição
      const pacienteId  = v('#pacienteId');
      const medicoId    = v('#medicoId');
      const dataISO     = v('#data');
      const hora        = v('#hora');
      const duracao     = Number(v('#duracao') || 30);
      const status      = v('#status') || 'AGENDADA';
      const observacoes = v('#observacoes');

      // validação visual
      ['#pacienteId','#medicoId','#data','#hora'].forEach(sel => form.querySelector(sel)?.classList.remove('invalid'));
      const faltando = [];
      if (!pacienteId) faltando.push('#pacienteId');
      if (!medicoId)   faltando.push('#medicoId');
      if (!dataISO)    faltando.push('#data');
      if (!hora)       faltando.push('#hora');

      if (faltando.length) {
        faltando.forEach(sel => form.querySelector(sel)?.classList.add('invalid'));
        form.querySelector(faltando[0])?.focus();
        notify('[erro] Preencha paciente, médico, data e hora.', 'error');
        return;
      }

      // Validação: não permite datas passadas
      if (dataISO) {
        const dataSelecionada = new Date(dataISO + 'T00:00:00');
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        if (dataSelecionada < hoje) {
          form.querySelector('#data')?.classList.add('invalid');
          form.querySelector('#data')?.focus();
          notify('[erro] Não é possível agendar consultas com data passada.', 'error');
          return;
        }
      }

      // Validação: horário deve estar entre 7h e 17h
      if (hora) {
        const [horas, minutos] = hora.split(':').map(Number);
        const horaConsulta = horas * 60 + minutos; // converte para minutos desde meia-noite
        const horaMinima = 7 * 60; // 07:00 = 420 minutos
        const horaMaxima = 17 * 60; // 17:00 = 1020 minutos
        
        if (horaConsulta < horaMinima || horaConsulta > horaMaxima) {
          form.querySelector('#hora')?.classList.add('invalid');
          form.querySelector('#hora')?.focus();
          notify('[erro] Horário de agendamento deve estar entre 07:00 e 17:00.', 'error');
          return;
        }
      }

      // 🔁 payload compatível com o back (mantém campos "novos" e adiciona os nomes que o Spring usa)
      const payload = {
        // versão nova (usada pelo front/fallback)
        pacienteId : Number(pacienteId),
        medicoId   : Number(medicoId),
        data       : dataISO,      // "YYYY-MM-DD"
        hora       : hora,         // "HH:mm"
        duracao    : duracao,
        status     : status,
        observacoes: observacoes,

        // versão compatível com a API Java / banco
        idPaciente    : Number(pacienteId),
        idMedico      : Number(medicoId),
        dataConsulta  : dataISO,
        horario       : hora,
        statusConsulta: status,
        descricao     : observacoes
      };

      const Cons = API.consultas || FallbackConsultas;

      // checa conflito antes de salvar (se o back/fallback tiver suporte)
      // checagem de conflito desativada por enquanto (backend ainda sem endpoint /consultas/conflicts)
      const temConflito = false;
      /*
      if (Cons.conflicts) {
        const c = await Cons.conflicts({
          medicoId: payload.medicoId,
          data: payload.data,
          hora: payload.hora,
          duracao: payload.duracao,
          idAtual: id
        });
        if (c) {
          notify('[erro] Conflito de horário: este médico já possui consulta neste intervalo.', 'error');
          return;
        }
      }
      */

      try {
        if (id) {
          await (Cons.update ? Cons.update(id, { ...payload, id, idConsulta:id }) : Promise.reject(new Error('Update não disponível')));
          notify('[ok] Agendamento atualizado.', 'log');
        } else {
          await Cons.create(payload);
          notify('[ok] Agendamento salvo.', 'log');
        }

        const hid = form.querySelector('#consultaId'); if (hid) hid.value = '';
        if (!id) {
          const horaInput = form.querySelector('#hora'); if (horaInput) horaInput.value = '';
          const obsInput  = form.querySelector('#observacoes'); if (obsInput) obsInput.value = '';
        }

        await render();
      } catch (err) {
        console.error(err);
        notify('[erro] Falha ao salvar agendamento.', 'error');
      }
    });

    function openConsultaModal(cRaw){
      const consulta = normalizeConsulta(cRaw) || cRaw;
      const modal = $('#consultaModal'); const body = $('#modalBody');
      if (!modal || !body) return;
      body.innerHTML = `
        <div class="row" style="justify-content:space-between; margin-bottom:8px;">
          <div><strong>${consulta.paciente?.nome || 'Paciente'}</strong></div>
          <span class="status-pill">${consulta.status || '-'}</span>
        </div>
        <div style="font-size:14px; color:#334155; line-height:1.6">
          <div><strong>Médico:</strong> ${consulta.medico?.nome || '-'}</div>
          <div><strong>Data/Hora:</strong> ${normalizeDateStr(consulta.data)} ${consulta.hora || '--:--'}</div>
          ${consulta.observacoes ? `<div><strong>Obs:</strong> ${consulta.observacoes}</div>` : ''}
        </div>
      `;
      modal.classList.add('show');
      const close = () => modal.classList.remove('show');
      $('#modalClose')?.addEventListener('click', close, { once:true });
      $('#modalCancel')?.addEventListener('click', close, { once:true });
      modal.addEventListener('click', (e)=>{ if (e.target === modal) close(); }, { once:true });

      $('#modalEdit')?.addEventListener('click', () => {
        const f = $('#frmAgendar');
        if (!f) return;

        current = consulta;

        const set = (sel, val) => { const el = f.querySelector(sel); if (el) el.value = val ?? ''; };
        set('#consultaId',  consulta.id || '');
        set('#pacienteId',  consulta.pacienteId || consulta.paciente?.id || '');
        set('#medicoId',    consulta.medicoId   || consulta.medico?.id   || '');
        set('#data',        normalizeDateStr(consulta.data));
        set('#hora',        consulta.hora || '');
        set('#duracao',     consulta.duracao || 30);
        set('#status',      consulta.status || 'AGENDADA');
        set('#observacoes', consulta.observacoes || '');

        $('#modalDelete')?.addEventListener('click', async () => {
          try {
            if (!confirm('Deseja realmente excluir esta consulta?')) return;
            const Cons = API.consultas || FallbackConsultas;
            await (Cons.remove ? Cons.remove(consulta.id) : Promise.reject(new Error('Sem remove')));
            notify('[ok] Consulta excluída.', 'log');
            $('#consultaModal')?.classList.remove('show');
            await render();
          } catch (e) {
            console.error(e); notify('[erro] Falha ao excluir.', 'error');
          }
        }, { once:true });

        notify('Consulta carregada para edição.', 'info');
        document.querySelector('.side-panel')?.scrollIntoView({ behavior:'smooth', block:'start' });

        $('#consultaModal')?.classList.remove('show');
      }, { once:true });
    }
  }

  await render();
}, { title: 'Agendamentos' });