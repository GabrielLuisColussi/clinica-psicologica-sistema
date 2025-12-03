// src/views/agenda-popover.js
(() => {
  let openEl = null;

  function fmt(str) { return (str ?? '').toString(); }

  function getPacienteName(id) {
    try { return API.pacientes.findById?.(id)?.nome || API.pacientes.name?.(id) || '—'; }
    catch { return '—'; }
  }
  function getMedicoName(id) {
    try { return API.medicos.findById?.(id)?.nome || API.medicos.name?.(id) || '—'; }
    catch { return '—'; }
  }

  function positionNear(anchor, pop, heightGuess = 190) {
    const r = anchor.getBoundingClientRect();
    const gap = 8;
    let left = r.left;
    let top  = r.bottom + gap;

    const overflowX = (left + 300) - window.innerWidth;
    if (overflowX > 0) left -= overflowX;

    if (top + heightGuess > window.innerHeight) top = r.top - heightGuess - gap;

    pop.style.left = `${Math.max(8, left)}px`;
    pop.style.top  = `${Math.max(8, top)}px`;
  }

  function close() {
    if (openEl && openEl.parentNode) {
      openEl.parentNode.removeChild(openEl);
    }
    openEl = null;
    document.removeEventListener('mousedown', onDocClick, true);
    window.removeEventListener('keydown', onEsc, true);
    window.removeEventListener('scroll', close, true);
    window.removeEventListener('resize', close, true);
  }

  function onDocClick(e) {
    if (!openEl) return;
    if (openEl.contains(e.target)) return;
    close();
  }
  function onEsc(e) {
    if (e.key === 'Escape') close();
  }

  function show(anchor, appt) {
    close();

    const paciente = getPacienteName(appt.pacienteId);
    const medico   = getMedicoName(appt.medicoId);
    const status   = (appt.status ?? 'agendado').toLowerCase();

    const el = document.createElement('div');
    el.className = 'appt-popover';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');

    el.innerHTML = `
      <h4>${fmt(paciente)}</h4>
      <div class="meta">
        <div><strong>Médico:</strong> ${fmt(medico)}</div>
        <div><strong>Data:</strong> ${UI.fmtDate?.(appt.data) ?? fmt(appt.data)} • <strong>Hora:</strong> ${fmt(appt.hora)}</div>
        <div><strong>Tipo:</strong> ${fmt(appt.tipo) || '—'}</div>
      </div>
      <div class="status">
        <span class="dot ${status}"></span>
        <span>Status: <strong>${status.charAt(0).toUpperCase() + status.slice(1)}</strong></span>
      </div>
      <div class="actions">
        <button class="primary" data-action="editar">Editar</button>
        <button data-action="excluir">Excluir</button>
      </div>
    `;

    document.body.appendChild(el);
    positionNear(anchor, el);
    openEl = el;

    el.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;

      if (action === 'editar') {
        close();
        // Preenche a lateral no modo edição se existir essa função
        if (typeof window.fillSideForm === 'function') {
          window.fillSideForm(appt);
        } else {
          UI.toast?.('Abra o formulário lateral para editar.');
        }
      } else if (action === 'excluir') {
        close();
        UI.confirm?.('Excluir este agendamento?', async () => {
          await API.agendamentos.remove?.(appt.id);
          UI.toast?.('Agendamento removido.');
          // dispara um evento para a página recarregar o calendário
          document.dispatchEvent(new CustomEvent('agenda:refresh'));
        });
      }
    });

    setTimeout(() => {
      document.addEventListener('mousedown', onDocClick, true);
      window.addEventListener('keydown', onEsc, true);
      window.addEventListener('scroll', close, true);
      window.addEventListener('resize', close, true);
    }, 0);
  }

  // API pública
  window.AgendaPopover = { show, close };
})();
