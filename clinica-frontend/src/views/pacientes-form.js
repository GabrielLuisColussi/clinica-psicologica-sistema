// src/views/pacientes-form.js
(function () {
  // ---------- Helpers ----------
  function getHashParams() {
    try {
      const qs = (location.hash.split('?')[1] || '');
      return Object.fromEntries(new URLSearchParams(qs).entries());
    } catch { return {}; }
  }
  function toast(msg, type = 'ok') {
  // cria o container se ainda não existir
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  // cria o aviso
  const el = document.createElement('div');
  const kind = (type === 'error' ? 'error' : type === 'info' ? 'info' : 'ok');
  el.className = 'toast toast--' + kind;
  el.textContent = msg;

  container.appendChild(el);

  // some depois de 3s com animação
  setTimeout(() => {
    el.classList.add('toast--hide');
    setTimeout(() => el.remove(), 200);
  }, 3000);
}

  function requireFields(form, fields) {
    const data = Object.fromEntries(new FormData(form).entries());
    const missing = fields.filter(f => !String(data[f] || '').trim());
    return { ok: missing.length === 0, missing, data };
  }

  const onlyDigits = (s) => (s || '').replace(/\D+/g, '');

  function isCPFValid(cpfRaw) {
    const cpf = onlyDigits(cpfRaw);
    if (!cpf || cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
    let d1 = 11 - (soma % 11); d1 = d1 > 9 ? 0 : d1;
    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i);
    let d2 = 11 - (soma % 11); d2 = d2 > 9 ? 0 : d2;
    return parseInt(cpf[9]) === d1 && parseInt(cpf[10]) === d2;
  }

  const maskCPF = (v) => {
    const d = onlyDigits(v).slice(0, 11);
    return d
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})?$/, '$1.$2.$3-$4');
  };
  const maskCEP = (v) => {
    const d = onlyDigits(v).slice(0, 8);
    return d.replace(/^(\d{5})(\d{0,3})$/, (_, a, b) => (b ? `${a}-${b}` : a));
  };
  const maskPhone = (v) => {
    const d = onlyDigits(v).slice(0, 11);
    if (d.length <= 10) {
      return d
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return d
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  function toInputDate(raw) {
  if (!raw) return '';
  let iso = String(raw);

  try {
    // 1) Se vier com hora: 2002-09-06T00:00:00
    if (iso.includes('T')) {
      iso = iso.split('T')[0];
    }

    // 2) Se vier como dd/MM/yyyy
    if (iso.includes('/')) {
      const [d, m, y] = iso.split('/');
      return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
    }

    // 3) Se vier como yyyy,M,d (ex.: 2002,9,6)
    if (iso.includes(',')) {
      const [y, m, d] = iso.split(',');
      return `${y.padStart(4,'0')}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    }

    // 4) Se vier como yyyy-M-d ou yyyy-MM-dd
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(iso)) {
      const [y, m, d] = iso.split('-');
      return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
    }

    // Se não bater nenhum formato conhecido, não preenche
    return '';
  } catch {
    return '';
  }
}

  // ---------- CSS ----------
  (function injectLocalCSS() {
    const id = 'paciente-form-fullpage-styles';
    if (document.getElementById(id)) return;
    const st = document.createElement('style');
    st.id = id;
    st.textContent = `
      .pf-full { max-width: 960px; margin: 0 auto; }
      .pf-card {
        background:#fff; border-radius:16px; padding:20px;
        box-shadow: 0 10px 30px rgba(2,6,23,.06), 0 2px 6px rgba(2,6,23,.06);
        border: 1px solid #eef2f7;
      }
      .pf-head { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:8px; }
      .pf-title { font-size:20px; font-weight:700; }
      .pf-sub   { font-size:12px; color:var(--muted); }

      .form-grid { display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
      .form-grid .col-1 { grid-column: span 1; }
      .form-grid .col-2 { grid-column: span 2; }
      @media (max-width: 720px){ .form-grid { grid-template-columns: 1fr; } .form-grid .col-2 { grid-column: span 1; } }

      .fg { display:flex; flex-direction:column; gap:6px; }
      .fg label { font-size:12px; color:#4b5563; font-weight:600; }
      .fg input, .fg select {
        height: 36px; padding: 6px 10px; border-radius:10px; border:1px solid #e5e7eb; background:#fff;
        outline: none; transition: border-color .15s ease, box-shadow .15s ease;
      }
      .fg input:focus, .fg select:focus { border-color: var(--brand,#2563eb); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
      .fg small.hint { font-size:11px; color:var(--muted); }

      .panel-divider { height:1px; background:#eef2f7; margin:10px 0; }
      .panel-actions { display:flex; gap:8px; margin-top:8px; }
      .panel-actions .btn { height:36px; }
      .badge-id { font-size:12px; padding:4px 8px; border-radius:999px; background:#f1f5f9; color:#334155; }
      .error { color:#dc2626; font-size:12px; }
    `;
    document.head.appendChild(st);
  })();

  // ---------- API ----------
  const realPac = (window.API && window.API.pacientes) ? window.API.pacientes : null;
  const RealAPI = realPac ? { ...realPac, get: realPac.get || realPac.getById } : null;
  const MockAPI = {
    __mem: [],
    async list() { return { rows: this.__mem.slice(), total: this.__mem.length }; },
    async get(id) { return this.__mem.find(p => +p.id === +id); },
    async create(data) { const id = (this.__mem.at(-1)?.id || 0) + 1; this.__mem.push({ id, ...data }); return { id }; },
    async update(id, data) { const i = this.__mem.findIndex(p => +p.id === +id); if (i >= 0) this.__mem[i] = { ...this.__mem[i], ...data }; return { updated: true }; },
    async remove(id) { this.__mem = this.__mem.filter(p => +p.id !== +id); return { removed: true }; }
  };
  const API = RealAPI || MockAPI;
  const EndAPI = (window.API && window.API.enderecos) ? window.API.enderecos : null;

  // ---------- UF lista estática ----------
  const UF_LIST = [
    "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
    "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"
  ];

  // ---------- ViaCEP ----------
  async function fetchViaCEP(cep) {
  const limpo = (cep || '').replace(/\D/g, '');

  // validação básica só para não chamar a API à toa
  if (limpo.length !== 8) {
    console.warn('CEP inválido para ViaCEP:', cep);
    return null;
  }

  try {
    const resp = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);

    if (!resp.ok) {
      console.warn('ViaCEP retornou status', resp.status);
      return null;
    }

    const data = await resp.json();

    if (data.erro) {
      console.warn('ViaCEP: CEP não encontrado', limpo);
      return null;
    }

    return data;
  } catch (e) {
    console.error('Erro ao chamar ViaCEP:', e);
    return null;
  }
}

  // ---------- Handler ----------
  async function handler(root) {
    const params = getHashParams();
    const isEdit = !!params.id;
    let model = null;
    let currentEnderecoId = null;

    if (isEdit) {
      try {
        model = await API.get(params.id);
        if (model && model.endereco) {
          currentEnderecoId = model.endereco.idEndereco || null;
        }
      } catch (e) {
        console.error(e);
        toast('Erro ao carregar paciente.', 'error');
      }
    }

    const end = model && model.endereco ? model.endereco : null;

    root.innerHTML = `
      <div class="pf-full">
        <div class="pf-card">
          <div class="pf-head">
            <div class="pf-title">${isEdit ? 'Editar Paciente' : 'Novo Paciente'}</div>
            <div class="pf-sub">
              ${isEdit ? `<span class="badge-id">#${params.id}</span>` : ''}
            </div>
          </div>

          <div class="panel-divider"></div>

          <form id="frmPac" class="form-grid" novalidate>
            <div class="fg col-2">
              <label for="nome">Nome *</label>
              <input id="nome" name="nome" value="${model?.nome || ''}" required placeholder="Ex.: Ana Souza">
            </div>

            <div class="fg col-1">
              <label for="cpf">CPF *</label>
              <input id="cpf" name="cpf" value="${model?.cpf || ''}" placeholder="000.000.000-00" required>
              <div id="cpfErr" class="error" style="display:none;">CPF inválido.</div>
            </div>
            <div class="fg col-1">
              <label for="nascimento">Data de Nascimento</label>
              <input id="nascimento" name="nascimento" type="date" value="${toInputDate(model?.dataNascimento)}">
            </div>

            <div class="fg col-1">
              <label for="telefone">Telefone *</label>
              <input id="telefone" name="telefone" value="${model?.telefone || ''}" placeholder="(99) 99999-9999" required>
            </div>
            <div class="fg col-1">
              <label for="email">E-mail *</label>
              <input id="email" type="email" name="email" value="${model?.email || ''}" placeholder="email@dominio.com" required>
            </div>

            <div class="fg col-1">
              <label for="cep">CEP</label>
              <input id="cep" name="cep" value="${end?.cep || ''}" placeholder="00000-000">
              <small class="hint">Ao sair do campo, buscaremos no ViaCEP.</small>
            </div>
            <div class="fg col-1">
              <label for="bairro">Bairro</label>
              <input id="bairro" name="bairro" value="${end?.bairro || ''}">
            </div>

            <div class="fg col-2">
              <label for="logradouro">Logradouro</label>
              <input id="logradouro" name="logradouro" value="${end?.logradouro || ''}" placeholder="Rua, Av., etc.">
            </div>

            <div class="fg col-1">
              <label for="numero">Número</label>
              <input id="numero" name="numero" value="${end?.numero || ''}">
            </div>
            <div class="fg col-1">
              <label for="complemento">Complemento</label>
              <input id="complemento" name="complemento" value="${end?.complemento || ''}">
            </div>

            <div class="fg col-1">
              <label for="uf">UF</label>
              <select id="uf" name="uf">
                <option value="">Selecione</option>
                ${UF_LIST.map(sigla => `<option value="${sigla}">${sigla}</option>`).join('')}
              </select>
            </div>
            <div class="fg col-1">
              <label for="cidade">Cidade</label>
              <input id="cidade" name="cidade" value="${end?.municipio || ''}" placeholder="Cidade">
            </div>

            <div class="panel-divider col-2"></div>

            <div class="panel-actions col-2">
              <button class="btn btn--primary" type="submit">${isEdit ? 'Salvar alterações' : 'Cadastrar'}</button>
              <button class="btn btn--ghost" type="button" id="btnBack">Voltar</button>
              ${isEdit ? `<button class="btn btn--ghost" type="button" id="btnDel">Excluir</button>` : ''}
            </div>
          </form>
        </div>
      </div>
    `;

    const $ = (sel) => root.querySelector(sel);

    $('#btnBack')?.addEventListener('click', () => { location.hash = '#/pacientes'; });

    // Máscaras
    const cpfEl = $('#cpf'), telEl = $('#telefone'), cepEl = $('#cep');
    cpfEl?.addEventListener('input', e => e.target.value = maskCPF(e.target.value));
    telEl?.addEventListener('input', e => e.target.value = maskPhone(e.target.value));
    cepEl?.addEventListener('input', e => e.target.value = maskCEP(e.target.value));

    cpfEl?.addEventListener('blur', e => {
      const ok = isCPFValid(e.target.value);
      $('#cpfErr').style.display = ok ? 'none' : 'block';
    });

    // ViaCEP
    async function tryViaCEP() {
    const form = document.getElementById('frmPac');
    if (!form) return;

    const cep = form.cep.value;
    if (!cep) return;

    const data = await fetchViaCEP(cep);

    if (!data) {
      toast('Não foi possível localizar o CEP. Preencha o endereço manualmente.');
      return;
    }

    if (data.logradouro) form.logradouro.value = data.logradouro;
    if (data.bairro)     form.bairro.value     = data.bairro;
    if (data.localidade) form.cidade.value     = data.localidade;
    if (data.uf)         form.uf.value         = data.uf;
  }
    cepEl?.addEventListener('blur', tryViaCEP);
    cepEl?.addEventListener('keyup', e => {
      if (onlyDigits(e.target.value).length === 8) tryViaCEP();
    });

    // Pré-seleciona UF
    if (end?.uf) $('#uf').value = end.uf;

    $('#frmPac')?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const rq = requireFields(e.currentTarget, ['nome','cpf','telefone','email']);
      if (!rq.ok) {
        toast('Preencha: ' + rq.missing.join(', '), 'error');
        return;
      }
      if (!isCPFValid(rq.data.cpf)) {
        toast('CPF inválido.', 'error');
        $('#cpfErr').style.display = 'block';
        return;
      }

      const formData = rq.data;

      // 1) Salva/atualiza endereço, se informado
      let idEndereco = currentEnderecoId;
      const hasEndereco =
        (formData.logradouro && formData.logradouro.trim()) ||
        (formData.bairro && formData.bairro.trim()) ||
        (formData.cidade && formData.cidade.trim()) ||
        (formData.uf && formData.uf.trim()) ||
        (formData.cep && formData.cep.trim());

      if (EndAPI && hasEndereco) {
        const enderecoPayload = {
          logradouro: formData.logradouro || '',
          numero: formData.numero || '',
          complemento: formData.complemento || '',
          bairro: formData.bairro || '',
          municipio: formData.cidade || '',
          uf: formData.uf || '',
          cep: formData.cep || ''
        };

        try {
          if (idEndereco) {
            const updated = await EndAPI.update(idEndereco, enderecoPayload);
            idEndereco = (updated && (updated.idEndereco || updated.id)) || idEndereco;
          } else {
            const created = await EndAPI.create(enderecoPayload);
            idEndereco = created && (created.idEndereco || created.id);
          }
        } catch (err) {
          console.error(err);
          toast('Erro ao salvar endereço.', 'error');
          // segue para salvar pessoa mesmo assim
        }
      }

          // 2) Monta payload da pessoa (Paciente)
    // --- normaliza os dados antes de enviar ---
    const cpfLimpo = (formData.cpf || '').replace(/\D/g, '');
    const telefoneLimpo = (formData.telefone || '').trim();

    // input type="date" já manda no formato yyyy-MM-dd
    const dataNascimento = formData.nascimento || null;

    const pessoaPayload = {
      nome: (formData.nome || '').trim(),
      cpf: cpfLimpo,
      email: (formData.email || '').trim(),
      telefone: telefoneLimpo,
      dataNascimento,
      // não precisa mandar tipoPessoa aqui, o restApi já força 'PACIENTE'
      idEndereco: idEndereco || null  // 👈 usa o idEndereco calculado acima
    };


      try {
        if (isEdit) await API.update(params.id, pessoaPayload);
        else        await API.create(pessoaPayload);
        toast(isEdit ? 'Paciente atualizado.' : 'Paciente cadastrado.', 'ok');
        location.hash = '#/pacientes';
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
        const msgLower = String(errorMsg).toLowerCase();
        if (msgLower.includes('cpf') && (msgLower.includes('cadastrado') || msgLower.includes('já') || msgLower.includes('ja'))) {
          toast('CPF já cadastrado.', 'error');
          return;
        }
        
        // Outros erros genéricos
        toast('Erro ao salvar paciente. Tente novamente.', 'error');
      }
    });

    $('#btnDel')?.addEventListener('click', async () => {
      if (!confirm('Confirmar exclusão do paciente?')) return;
      try {
        await API.remove(params.id);
        toast('Paciente excluído.', 'ok');
        location.hash = '#/pacientes';
      } catch (err) {
        console.error(err);
        const msg = String(err.message || '').toLowerCase();
        if (msg.includes('constraint') || msg.includes('foreign key')) {
          toast('Não é possível excluir um paciente que possui consultas vinculadas.', 'error');
        } else {
          toast('Erro ao excluir paciente.', 'error');
        }
      }
    });

    const first = $('#nome');
    if (first && !first.value) first.focus();
  }

  AppRouter.register('/pacientes/form', handler, { title: 'Paciente' });
  AppRouter.register('/pacientes-form', handler,   { title: 'Paciente' });
})();
