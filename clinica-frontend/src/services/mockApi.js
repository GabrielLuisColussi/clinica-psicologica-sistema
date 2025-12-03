// src/services/mockApi.js
;(() => {
  // 1) Se a API real já está ativa, não registra o mock
  if (window.API) {
    console.log('[mockApi] REST ativo — mock ignorado');
    return;
  }

  // 2) Base do mock
  window.API = {};
  const API = window.API;
  const delay = (ms = 80) => new Promise(r => setTimeout(r, ms));

  // ------------------ Dados base (em memória) ------------------
  let pacientes = [
    { id:1, nome:'Paciente 01', cpf:'000.000.000-01', telefone:'(54) 98000-1000', email:'pac1@mail.com', cidade:'Bento Gonçalves', uf:'RS' },
    { id:2, nome:'Paciente 02', cpf:'000.000.000-02', telefone:'(54) 98001-1001', email:'pac2@mail.com', cidade:'Garibaldi',       uf:'RS' },
    { id:3, nome:'Paciente 03', cpf:'000.000.000-03', telefone:'(54) 98002-1002', email:'pac3@mail.com', cidade:'Caxias do Sul',  uf:'RS' },
  ];

  let medicos = [
    { id:1, nome:'Dra. Ana Souza', crm:'12345', crmUf:'RS', especialidade:'Clínica Geral',       prioritario:true,  telefone:'(54) 99999-0001' },
    { id:2, nome:'Dr. João Lima',  crm:'67890', crmUf:'RS', especialidade:'Cardiologia Clínica', prioritario:false, telefone:'(54) 99999-0002' }
  ];

  API.enums = API.enums || {};
  API.enums.statusConsulta = ['AGENDADA','CONFIRMADA','CANCELADA','FINALIZADA'];

  const paginate = (arr, { page = 1, size = 10 } = {}) => {
    const start = (page - 1) * size;
    return { rows: arr.slice(start, start + size), total: arr.length, page, size };
  };

  // ------------------ PACIENTES (mock) ------------------
  API.pacientes = {
    async list({ page = 1, size = 10, search = '', q = '' } = {}) {
      await delay();
      const term = (search || q || '').toLowerCase();
      let data = pacientes;
      if (term) {
        data = data.filter(p =>
          (p.nome || '').toLowerCase().includes(term) ||
          (p.cpf || '').includes(term) ||
          (p.email || '').toLowerCase().includes(term)
        );
      }
      return paginate(data, { page, size });
    },
    async getById(id) { await delay(); return pacientes.find(p => +p.id === +id) || null; },
    async get(id)     { return this.getById(id); }, // alias
    async create(payload) { await delay(); const id = (pacientes.at(-1)?.id || 0) + 1; pacientes.push({ id, ...payload }); return { id }; },
    async update(id, payload) {
      await delay();
      const i = pacientes.findIndex(p => +p.id === +id);
      if (i < 0) throw new Error('Paciente não encontrado');
      pacientes[i] = { ...pacientes[i], ...payload, id: pacientes[i].id };
      return { updated: true };
    },
    async remove(id) {
      await delay();
      const i = pacientes.findIndex(p => +p.id === +id);
      if (i >= 0) pacientes.splice(i, 1);
      return { deleted: true };
    },
  };

  // ------------------ MÉDICOS (mock) ------------------
  API.medicos = {
    async list({ page = 1, size = 10, search = '', q = '' } = {}) {
      await delay();
      const term = (search || q || '').toLowerCase();
      let data = medicos;
      if (term) {
        data = data.filter(m =>
          (m.nome || '').toLowerCase().includes(term) ||
          (m.crm || '').toLowerCase().includes(term) ||
          (m.especialidade || '').toLowerCase().includes(term)
        );
      }
      return paginate(data, { page, size });
    },
    async getById(id) { await delay(); return medicos.find(m => +m.id === +id) || null; },
    async get(id)     { return this.getById(id); }, // alias
    async create(payload) {
  await delay();
  const id = (medicos.at(-1)?.id || 0) + 1;
  medicos.push({ id, ...payload });
  return { id };
},

async update(id, payload) {
  await delay();
  const i = medicos.findIndex(m => +m.id === +id);
  if (i < 0) throw new Error('Médico não encontrado');

  medicos[i] = { ...medicos[i], ...payload, id: medicos[i].id };
  return { updated: true };
},
    async remove(id) {
      await delay();
      const i = medicos.findIndex(m => +m.id === +id);
      if (i >= 0) medicos.splice(i, 1);
      return { deleted: true };
    },
  };

  // ------------------ CONSULTAS (mock + localStorage) ------------------
  ;(() => {
    const LSKEY = 'clinica.consultas.v1';

    const lsGet = (k, fb) => { try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : fb; } catch { return fb; } };
    const lsSet = (k, v)    => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
    const load  = () => lsGet(LSKEY, []);
    const save  = (v) => lsSet(LSKEY, v);
    const nextId = (list) => (list?.length ? Math.max(...list.map(x => +x.id || 0)) : 0) + 1;
    const onlyDateStr = (d) => String(d || '').slice(0, 10);
    const toMin = (hhmm) => { const [h, m] = String(hhmm || '00:00').split(':').map(n => +n || 0); return h * 60 + m; };
    const overlap = (h1, d1, h2, d2) => { const a1 = toMin(h1), a2 = a1 + (+d1 || 30), b1 = toMin(h2), b2 = b1 + (+d2 || 30); return Math.max(a1, b1) < Math.min(a2, b2); };

    API.consultas = {
      async list({ from, to } = {}) {
        await delay();
        const all = load();
        if (!from && !to) return { rows: all, total: all.length };
        const f = from ? onlyDateStr(from) : null;
        const t = to   ? onlyDateStr(to)   : null;
        const rows = all.filter(c => {
          const d = onlyDateStr(c.data);
          if (f && d < f) return false;
          if (t && d > t) return false;
          return true;
        });
        return { rows, total: rows.length };
      },

      async getById(id) { await delay(); return load().find(c => +c.id === +id) || null; },
      async get(id)     { return this.getById(id); }, // alias

      // data: { pacienteId, medicoId, data, hora, duracao, status, observacoes }
      async create(data) {
        await delay();
        const list = load();
        const id = nextId(list);
        const payload = {
          id,
          pacienteId : String(data.pacienteId || '').trim(),
          medicoId   : String(data.medicoId   || '').trim(),
          data       : onlyDateStr(data.data),
          hora       : String(data.hora || ''),
          duracao    : Number(data.duracao || 30),
          status     : String(data.status || 'AGENDADA').toUpperCase(),
          observacoes: String(data.observacoes || '')
        };
        list.push(payload);
        save(list);
        return { id };
      },

      async update(id, patch) {
        await delay();
        const list = load();
        const i = list.findIndex(c => +c.id === +id);
        if (i >= 0) {
          list[i] = { ...list[i], ...patch, id: list[i].id };
          save(list);
          return { updated: true };
        }
        return { updated: false };
      },

      async remove(id) {
        await delay();
        const list = load().filter(c => +c.id !== +id);
        save(list);
        return { deleted: true };
      },

      async updateStatus(id, status) {
        return this.update(id, { status: String(status || 'AGENDADA').toUpperCase() });
      },

      // conflito: mesmo médico, mesma data e intervalo sobreposto
      async conflicts({ medicoId, data, hora, duracao, idAtual }) {
        await delay();
        const list = load();
        const dISO = onlyDateStr(data);
        const mId  = String(medicoId || '');
        return list.some(c =>
          String(c.medicoId) === mId &&
          onlyDateStr(c.data) === dISO &&
          String(c.id) !== String(idAtual || '') &&
          overlap(c.hora, c.duracao || 30, hora, duracao || 30)
        );
      }
    };
  })();

  // ------------------ FINANCEIRO (mock + localStorage) ------------------
  ;(() => {
    const KEY = 'clinica.financeiro.v1';
    const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
    const save = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} };
    const nextId = (list) => (list.length ? Math.max(...list.map(x => +x.id || 0)) : 0) + 1;

    API.financeiro = {
      async list({ from, to, status, tipo, page = 1, size = 20 } = {}) {
        await delay();
        const all = load();

        const inRange = (d) => {
          const x = (d || '').slice(0, 10);
          if (from && x < String(from).slice(0, 10)) return false;
          if (to   && x > String(to).slice(0, 10))   return false;
          return true;
        };

        const rows = all.filter(r =>
          inRange(r.dataVencimento || r.dataCompetencia) &&
          (!status || r.status === status) &&
          (!tipo   || r.tipo   === tipo)
        );

        const total = rows.length;
        const start = (page - 1) * size;
        return { rows: rows.slice(start, start + size), total, page, size };
      },

      async getById(id){ await delay(); return load().find(x => String(x.id) === String(id)) || null; },

      async create(payload) {
        await delay();
        const list = load();
        const id = nextId(list);
        list.push({ id, ...payload });
        save(list);
        return { id };
      },

      async update(id, patch) {
        await delay();
        const list = load();
        const i = list.findIndex(x => String(x.id) === String(id));
        if (i >= 0) {
          list[i] = { ...list[i], ...patch, id: list[i].id };
          save(list);
        }
        return { updated: i >= 0 };
      },

      async remove(id) {
        await delay();
        const list = load().filter(x => String(x.id) !== String(id));
        save(list);
        return { deleted: true };
      },

      async pagar(id, dataPagamento){
        // marca como PAGO e registra dataPagamento
        return this.update(id, { status: 'PAGO', dataPagamento: String(dataPagamento || new Date().toISOString().slice(0,10)) });
      }
    };

    // Seed opcional para começar com dados
    (async () => {
      try {
        const res = await API.financeiro.list({ page: 1, size: 1 });
        const hasAny = res?.total || 0;
        if (!hasAny) {
          const hoje = new Date().toISOString().slice(0, 10);
          await API.financeiro.create({
            tipo: 'RECEITA',
            descricao: 'Consulta — Pedro',
            valor: 250.00,
            dataCompetencia: hoje,
            dataVencimento: hoje,
            status: 'ABERTO'
          });
          await API.financeiro.create({
            tipo: 'DESPESA',
            descricao: 'Material clínico',
            valor: 120.00,
            dataCompetencia: hoje,
            dataVencimento: hoje,
            status: 'ABERTO'
          });
        }
      } catch {}
    })();
  })();

  console.log('[mockApi] ativo (fallback)');
})();
