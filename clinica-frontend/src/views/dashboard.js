// src/views/dashboard.js (dashboard dinâmico)
AppRouter.register('/dashboard', async (root) => {
  const API = window.API || {};
  const Consultas = API.consultas || null;
  const Pacientes = API.pacientes || null;
  const Medicos   = API.medicos   || null;
  const Fin       = API.financeiro|| null;

  // Normaliza respostas de paginação
  const norm = (resp) => {
    if (!resp) return [];
    if (Array.isArray(resp)) return resp;
    if (Array.isArray(resp.rows))    return resp.rows;
    if (Array.isArray(resp.content)) return resp.content;
    return [];
  };

  const today = new Date();
  const fmtISO = (d) => d.toISOString().slice(0,10);

  const todayISO = fmtISO(today);

  const firstDayMonth = fmtISO(new Date(today.getFullYear(), today.getMonth(), 1));
  const lastDayMonth  = fmtISO(new Date(today.getFullYear(), today.getMonth()+1, 0));

  const next7 = (() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 7);
    return fmtISO(d);
  })();

  function sumValores(list) {
    return list.reduce((acc, item) => {
      const v = item && item.valor != null ? Number(item.valor) : 0;
      return acc + (isNaN(v) ? 0 : v);
    }, 0);
  }

  function formatMoney(v) {
    return (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDateLabel(iso) {
    if (!iso) return '';
    try {
      const [y,m,d] = iso.split('-').map(Number);
      return `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}`;
    } catch { return iso; }
  }

  async function fetchData() {
    // Se a API não estiver ativa, devolve tudo zerado
    if (!Consultas || !Pacientes || !Medicos || !Fin) {
      return {
        consultasHoje: [],
        consultasProx: [],
        totalPacientes: 0,
        resumoFinanceiro: { recebidoMes: 0, aberto: 0, percRecebido: 0 },
        statusStats: [],
        topMedicos: []
      };
    }

    // Pacientes e médicos (para enriquecer as consultas)
    const [pacRes, medRes] = await Promise.all([
      Pacientes.list({ page:1, size: 1000 }),
      Medicos.list({ page:1, size: 500 })
    ]);
    const pacList = norm(pacRes);
    const medList = norm(medRes);
    const pMap = new Map(pacList.map(p => [String(p.id), p]));
    const mMap = new Map(medList.map(m => [String(m.id), m]));

    // Consultas e financeiro
    const [
      consHojeRes,
      consProxRes,
      consMesRes,
      finPagoMesRes,
      finAbertoRes
    ] = await Promise.all([
      Consultas.list({ from: todayISO,       to: todayISO,     page:1, size:500 }),
      Consultas.list({ from: todayISO,       to: next7,        page:1, size:500 }),
      Consultas.list({ from: firstDayMonth,  to: lastDayMonth, page:1, size:1000 }),
      Fin.list       ({ from: firstDayMonth, to: lastDayMonth, status: 'pago',     page:1, size:500 }),
      Fin.list       ({                      status: 'nao pago',                page:1, size:500 })
    ]);

    // Enriquecendo consultas com paciente/médico
    const consultasHoje = norm(consHojeRes).map(c => ({
      ...c,
      paciente: pMap.get(String(c.pacienteId)) || null,
      medico:   mMap.get(String(c.medicoId))   || null
    }));

    const consultasProx = norm(consProxRes).map(c => ({
      ...c,
      paciente: pMap.get(String(c.pacienteId)) || null,
      medico:   mMap.get(String(c.medicoId))   || null
    }));

    const consMes = norm(consMesRes);

    const finPagoMes   = norm(finPagoMesRes);
    const finAberto    = norm(finAbertoRes);

    const recebidoMes = sumValores(finPagoMes);
    const aberto      = sumValores(finAberto);
    const baseTotal   = recebidoMes + aberto;
    const percRecebido = baseTotal > 0 ? Math.round((recebidoMes / baseTotal) * 100) : 0;

    // Consultas por status (mês)
    const statusMap = {};
    consMes.forEach(c => {
      const st = (c.status || c.statusConsulta || '').toUpperCase() || 'SEM STATUS';
      statusMap[st] = (statusMap[st] || 0) + 1;
    });
    const statusStats = Object.entries(statusMap)
      .sort((a,b) => b[1]-a[1])
      .map(([status, total]) => ({ status, total }));

    // Médicos com mais atendimentos (mês)
    const medCount = {};
    consMes.forEach(c => {
      const id = c.medicoId != null ? String(c.medicoId) : null;
      if (!id) return;
      medCount[id] = (medCount[id] || 0) + 1;
    });
    const topMedicos = Object.entries(medCount)
      .sort((a,b) => b[1]-a[1])
      .slice(0,5)
      .map(([id, total]) => {
        const m = mMap.get(String(id));
        return {
          id,
          nome: m?.nome || `Médico ${id}`,
          total
        };
      });

    return {
      consultasHoje,
      consultasProx,
      totalPacientes: pacList.length,
      resumoFinanceiro: { recebidoMes, aberto, percRecebido },
      statusStats,
      topMedicos
    };
  }

  // Estado inicial (loading)
  root.innerHTML = `
    <div class="card">
      <p>Carregando dashboard...</p>
    </div>
  `;

  const data = await fetchData();

  const {
    consultasHoje,
    consultasProx,
    totalPacientes,
    resumoFinanceiro,
    statusStats,
    topMedicos
  } = data;

  const totalHoje = consultasHoje.length;
  const totalProx = consultasProx.length;

  function renderAgendaList(items) {
    if (!items || !items.length) {
      return '<p class="text-muted">Nenhuma consulta encontrada.</p>';
    }
    return `
      <ul class="mt-2" style="list-style:none; padding:0; margin:0;">
        ${items.map(c => `
          <li style="padding:8px 0; border-bottom:1px solid #eef2f7;">
            <div style="font-size:14px; font-weight:600;">
              ${c.paciente?.nome || 'Paciente'} —
              <span style="font-weight:400;">${c.medico?.nome || 'Médico'}</span>
            </div>
            <div style="font-size:12px; color:#6b7280;">
              ${formatDateLabel((c.data || '').slice(0,10))} • ${c.hora || '--:--'} • ${c.status || c.statusConsulta || ''}
            </div>
          </li>
        `).join('')}
      </ul>
    `;
  }

  // Layout final
  root.innerHTML = `
    <div class="grid grid--3">
      <div class="card">
        <div class="space-between">
          <h3>Consultas Hoje</h3>
          <span class="badge badge--info">Resumo</span>
        </div>
        <p class="mt-3" style="font-size:32px; font-weight:700;">${totalHoje}</p>
        <p class="text-muted" style="font-size:12px;">
          ${totalHoje === 1 ? 'consulta agendada para hoje' : 'consultas agendadas para hoje'}
        </p>
      </div>

      <div class="card">
        <div class="space-between">
          <h3>Próximos Agendamentos</h3>
          <span class="badge badge--ok">Próximos 7 dias</span>
        </div>
        <p class="mt-3" style="font-size:32px; font-weight:700;">${totalProx}</p>
        <p class="text-muted" style="font-size:12px;">
          Consultas de ${formatDateLabel(todayISO)} até ${formatDateLabel(next7)}
        </p>
      </div>

      <div class="card">
        <div class="space-between">
          <h3>Pacientes</h3>
          <span class="badge badge--muted">Total cadastrado</span>
        </div>
        <p class="mt-3" style="font-size:32px; font-weight:700;">${totalPacientes}</p>
        <p class="text-muted" style="font-size:12px;">Pacientes ativos cadastrados no sistema</p>
      </div>
    </div>

    <div class="grid grid--2 mt-4">
      <div class="card">
        <div class="space-between">
          <h3>Agenda de Hoje</h3>
          <span class="badge badge--muted">${formatDateLabel(todayISO)}</span>
        </div>
        ${renderAgendaList(consultasHoje)}
      </div>

      <div class="card">
        <div class="space-between">
          <h3>Próximos 7 dias</h3>
          <span class="badge badge--muted">${formatDateLabel(todayISO)} → ${formatDateLabel(next7)}</span>
        </div>
        ${renderAgendaList(consultasProx)}
      </div>
    </div>

    <div class="grid grid--2 mt-4">
      <div class="card">
        <div class="space-between">
          <h3>Resumo Financeiro (mês)</h3>
          <span class="badge badge--info">${firstDayMonth.slice(5,7)}/${firstDayMonth.slice(0,4)}</span>
        </div>
        <div class="mt-3">
          <p><strong>Recebido:</strong> R$ ${formatMoney(resumoFinanceiro.recebidoMes)}</p>
          <p><strong>Em aberto:</strong> R$ ${formatMoney(resumoFinanceiro.aberto)}</p>
          <p><strong>% Recebido:</strong> ${resumoFinanceiro.percRecebido}%</p>
        </div>
      </div>

      <div class="card">
        <h3>Consultas por status (mês)</h3>
        <ul class="mt-3" style="list-style:none; padding:0; margin:0;">
          ${
            statusStats.length
              ? statusStats.map(s => `
                  <li style="display:flex; justify-content:space-between; padding:4px 0;">
                    <span>${s.status}</span>
                    <span style="font-weight:600;">${s.total}</span>
                  </li>
                `).join('')
              : '<li class="text-muted">Sem dados no período.</li>'
          }
        </ul>
      </div>
    </div>

    <div class="grid grid--1 mt-4">
      <div class="card">
        <h3>Médicos com mais atendimentos (mês)</h3>
        <ul class="mt-3" style="list-style:none; padding:0; margin:0;">
          ${
            topMedicos.length
              ? topMedicos.map(m => `
                  <li style="display:flex; justify-content:space-between; padding:4px 0;">
                    <span>${m.nome}</span>
                    <span style="font-weight:600;">${m.total} consulta(s)</span>
                  </li>
                `).join('')
              : '<li class="text-muted">Sem dados no período.</li>'
          }
        </ul>
      </div>
    </div>
  `;
}, {
  title: 'Dashboard',
  subtitle: new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
});
