// src/views/medicos-form.js
(function () {
  // ---------- Helpers ----------
  function getHashParams() {
    try {
      const qs = (location.hash.split('?')[1] || '');
      return Object.fromEntries(new URLSearchParams(qs).entries());
    } catch { return {}; }
  }

  function toast(msg, type = 'ok') {
    // Usa UI.toast se existir, senão cai no console/alert
    if (window.UI && typeof window.UI.toast === 'function') {
      window.UI.toast(msg, type === 'error' ? 'error' : type);
    } else {
      console[type === 'error' ? 'error' : 'log'](`[${type}] ${msg}`);
      if (type === 'error') alert(msg);
    }
  }

  function requireFields(form, fields) {
    const data = Object.fromEntries(new FormData(form).entries());
    const missing = fields.filter(f => !String(data[f] || '').trim());
    return { ok: missing.length === 0, missing, data };
  }

  const API  = (window.API && window.API.medicos) ? window.API.medicos : null;
  const http = window.http;

  // ---------- Carregar especialidades ----------
  async function loadEspecialidades() {
    if (!http) return [];
    try {
      const data = await http.get('/especialidades');
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error(e);
      toast('Não foi possível carregar especialidades.', 'error');
      return [];
    }
  }

  // ---------- Handler principal ----------
  async function handler(root) {
    const params = getHashParams();
    const isEdit = !!params.id;

    let model = null;
    let especialidades = [];

    try {
      especialidades = await loadEspecialidades();
    } catch (e) {
      console.error(e);
    }

    if (isEdit && API && API.getById) {
      try {
        model = await API.getById(params.id);
      } catch (e) {
        console.error(e);
        toast('Erro ao carregar médico.', 'error');
      }
    }

    const m = model || {};
    const especs = Array.isArray(especialidades) ? especialidades : [];

    const selectedEspId =
      (m.especialidade && (m.especialidade.idEspecialidade || m.especialidade.id)) ||
      m.idEspecialidade || '';

    // 👉 Aqui usamos o MESMO layout do formulário de pacientes (pf-*)
    root.innerHTML = `
      <div class="pf-full">
        <div class="pf-card">
          <div class="pf-head">
            <div class="pf-title">${isEdit ? 'Editar Médico' : 'Novo Médico'}</div>
            <div class="pf-sub">
              ${isEdit ? `<span class="badge-id">#${params.id}</span>` : ''}
            </div>
          </div>

          <div class="panel-divider"></div>

          <form id="medicoForm" class="form-grid" novalidate style="gap:16px;">
            <div class="fg col-2">
              <label for="nome">Nome *</label>
              <input id="nome" name="nome" value="${m.nome || ''}" placeholder="Ex.: Dra. Ana Souza" required>
            </div>

            <div class="fg col-1">
              <label for="cpf">CPF *</label>
              <input id="cpf" name="cpf" value="${m.cpf || ''}" placeholder="000.000.000-00" required>
            </div>

            <div class="fg col-1">
              <label for="crm">CRM *</label>
              <input id="crm" name="crm" value="${m.crm || ''}" placeholder="Ex.: 123456" required>
            </div>

            <div class="fg col-2">
              <label for="especialidade">Especialidade *</label>
              <select id="especialidade" name="idEspecialidade" required>
                <option value="">Selecione</option>
                ${especs.map(e => `
                  <option value="${e.idEspecialidade || e.id}"
                    ${String(selectedEspId) === String(e.idEspecialidade || e.id) ? 'selected' : ''}>
                    ${e.nome}
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="fg col-1">
              <label for="telefone">Telefone *</label>
              <input id="telefone" name="telefone" value="${m.telefone || ''}" placeholder="(99) 99999-9999" required>
            </div>

            <div class="fg col-1">
              <label for="email">E-mail *</label>
              <input id="email" name="email" type="email" value="${m.email || ''}" placeholder="email@dominio.com" required>
            </div>

            <div class="panel-divider col-2"></div>

            <div class="panel-actions col-2" style="gap:12px;">
              <button type="submit" class="btn btn--primary">
                ${isEdit ? 'Salvar alterações' : 'Salvar'}
              </button>
              <button type="button" class="btn btn--ghost" id="btnVoltar">Voltar</button>
              ${
                isEdit
                  ? `<button type="button" class="btn btn--danger" id="btnExcluir">Excluir</button>`
                  : ''
              }
            </div>
          </form>
        </div>
      </div>
    `;

    const $ = (sel) => root.querySelector(sel);
    const form = $('#medicoForm');

    // Área de erro visual no topo do formulário
    let errorBox = root.querySelector('#medico-error');
    if (!errorBox) {
      errorBox = document.createElement('p');
      errorBox.id = 'medico-error';
      errorBox.style.color = '#b91c1c';
      errorBox.style.marginBottom = '8px';
      errorBox.style.fontSize = '14px';
      errorBox.style.display = 'none';
      const card = root.querySelector('.pf-card') || root.firstElementChild;
      if (card) {
        card.insertBefore(errorBox, card.querySelector('form'));
      }
    }

    const showError = (msg) => {
      if (errorBox) {
        errorBox.textContent = msg || 'Erro ao salvar médico.';
        errorBox.style.display = 'block';
      }
      toast(msg || 'Erro ao salvar médico.', 'error');
    };

    const clearError = () => {
      if (errorBox) {
        errorBox.textContent = '';
        errorBox.style.display = 'none';
      }
    };

    // ---------- Submit ----------
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      clearError();

      const { ok, missing, data } = requireFields(form, [
        'nome', 'cpf', 'crm', 'telefone', 'email', 'idEspecialidade'
      ]);

      if (!ok) {
        showError('Preencha: ' + missing.join(', '));
        return;
      }

      const payload = {
        nome: (data.nome || '').trim(),
        cpf:  (data.cpf  || '').replace(/[^\d]/g, ''), // deixamos só números
        crm:  (data.crm  || '').trim(),
        email: (data.email || '').trim(),
        telefone: (data.telefone || '').trim(),
        idEspecialidade: data.idEspecialidade ? Number(data.idEspecialidade) : null,
        tipoPessoa: 'MEDICO',
      };

      if (!payload.idEspecialidade || Number.isNaN(payload.idEspecialidade)) {
        showError('Selecione uma especialidade.');
        return;
      }

      try {
        if (isEdit && API && API.update) {
          await API.update(params.id, payload);
          toast('Médico atualizado.', 'ok');
        } else if (API && API.create) {
          await API.create(payload);
          toast('Médico cadastrado.', 'ok');
        } else {
          showError('API de médicos não configurada.');
          return;
        }
        clearError();
        location.hash = '#/medicos';
      } catch (err) {
        console.error(err);
        
        // Extrai mensagem do erro
        let errorMsg = '';
        if (err.rawMessage) {
          errorMsg = err.rawMessage;
        } else if (err.data && err.data.message) {
          errorMsg = err.data.message;
        } else if (err.message) {
          errorMsg = err.message;
        }
        
        // Verifica se é erro de CPF duplicado
        const msgLower = errorMsg.toLowerCase();
        if (msgLower.includes('cpf') && (msgLower.includes('cadastrado') || msgLower.includes('já') || msgLower.includes('ja'))) {
          showError('CPF já cadastrado.');
        } else {
          showError('Erro ao salvar médico. Tente novamente.');
        }
      }
    });

    // ---------- Voltar / Excluir ----------
    $('#btnVoltar')?.addEventListener('click', () => {
      location.hash = '#/medicos';
    });

    $('#btnExcluir')?.addEventListener('click', async () => {
      if (!isEdit || !API || !API.remove) return;
      if (!confirm('Confirmar exclusão do médico?')) return;
      try {
        await API.remove(params.id);
        toast('Médico excluído.', 'ok');
        location.hash = '#/medicos';
      } catch (err) {
        console.error(err);
        toast('Erro ao excluir médico.', 'error');
      }
    });

    const first = $('#nome');
    if (first && !first.value) first.focus();
  }

  AppRouter.register('/medicos/form', handler, { title: 'Médico' });
  AppRouter.register('/medicos-form', handler,   { title: 'Médico' });
})();
