(function(){
  if (!window.USE_API) return;

  function mapPage(res){
    if (res && Array.isArray(res.rows)) return res;
    if (res && Array.isArray(res.content)) {
      return {
        rows: res.content,
        total: res.totalElements ?? res.content.length,
        page: (res.number ?? 0) + 1,
        size: res.size ?? res.content.length
      };
    }
    if (Array.isArray(res)) return { rows: res, total: res.length, page:1, size:res.length };
    if (res && (Array.isArray(res.items) || Array.isArray(res.data))) {
      const rows = res.items || res.data || [];
      const total = res.total ?? rows.length;
      return { rows, total, page:(res.page ?? 0)+1, size:res.size ?? rows.length };
    }
    return { rows: [], total: 0, page:1, size:20 };
  }

  const cache = { pathMap:{} };
  const zero = p => (Number(p||1) > 0 ? Number(p)-1 : 0);

  async function tryGet(paths, params){
    for (const p of paths){
      try {
        const res = await http.get(p, { params });
        return { path:p, res };
      } catch {}
    }
    throw new Error('Nenhuma rota respondeu: ' + paths.join(', '));
  }

  async function resolve(kind, candidates, params){
    if (cache.pathMap[kind]) return cache.pathMap[kind];

    const list = Array.isArray(candidates) ? candidates
               : (candidates != null ? [candidates] : []);

    const probe = [];
    list.forEach(c => {
      const clean = (c || '').toString();
      if (!clean) return;
      probe.push(clean.startsWith('/') ? clean : '/' + clean);
      probe.push('/api/' + clean.replace(/^\/+/, ''));
    });

    if (!probe.length) throw new Error(`resolve("${kind}"): candidatos vazios`);

    const { path } = await tryGet(probe, params);
    cache.pathMap[kind] = path;
    console.log(`[restApi:auto] ${kind} → ${path}`);
    return path;
  }

  // -------- Pacientes --------
  const pacientes = {
    async list({ page=1, size=20, q } = {}) {
      const base = await resolve('pacientes','/pacientes', { page:zero(page), size, q });
      const res  = await http.get(base,{ params:{ page:zero(page), size, q }});
      return mapPage(res);
    },
    async getById(id) {
      const base = await resolve('pessoas','/pessoas');
      return http.get(`${base}/${id}`);
    },
    async create(data) {
      const base = await resolve('pessoas','/pessoas');
      return http.post(base, { ...data, tipoPessoa: 'PACIENTE' });
    },
    async update(id, d) {
      const base = await resolve('pessoas','/pessoas');
      return http.put(`${base}/${id}`, { ...d, tipoPessoa: 'PACIENTE' });
    },
    async remove(id) {
      const base = await resolve('pessoas','/pessoas');
      return http.del(`${base}/${id}`);
    }
  };

  // -------- Médicos --------
  const medicos = {
    async list({ page=1, size=50, q } = {}) {
      const base = await resolve('medicos','/medicos', { page:zero(page), size, q });
      const res  = await http.get(base,{ params:{ page:zero(page), size, q }});
      return mapPage(res);
    },
    async getById(id) {
      const base = await resolve('pessoas','/pessoas');
      return http.get(`${base}/${id}`);
    },
    async create(data) {
      const base = await resolve('pessoas','/pessoas');
      return http.post(base, { ...data, tipoPessoa: 'MEDICO' });
    },
    async update(id, d) {
      const base = await resolve('pessoas','/pessoas');
      return http.put(`${base}/${id}`, { ...d, tipoPessoa: 'MEDICO' });
    },
    async remove(id) {
      const base = await resolve('pessoas','/pessoas');
      return http.del(`${base}/${id}`);
    }
  };

  // -------- Endereços --------
  const enderecos = {
    async getById(id) {
      const base = await resolve('enderecos','/enderecos');
      return http.get(`${base}/${id}`);
    },
    async create(data) {
      const base = await resolve('enderecos','/enderecos');
      return http.post(base, data);
    },
    async update(id, data) {
      const base = await resolve('enderecos','/enderecos');
      return http.put(`${base}/${id}`, data);
    },
    async remove(id) {
      const base = await resolve('enderecos','/enderecos');
      return http.del(`${base}/${id}`);
    }
  };

  // -------- Consultas / Agendamentos --------
  const consultas = {
    async list({ from, to, page=1, size=500 } = {}){
      const base = await resolve('consultas',['/consultas','/agendamentos','/agenda'], { from, to, page:zero(page), size });
      const res = await http.get(base,{ params:{ from, to, page:zero(page), size }});
      return mapPage(res);
    },
    async getById(id){
      const base = await resolve('consultas',['/consultas','/agendamentos','/agenda']);
      return http.get(`${base}/${id}`);
    },
    async create(data){
      const base = await resolve('consultas',['/consultas','/agendamentos','/agenda']);
      return http.post(base, data);
    },
    async update(id,d){
      const base = await resolve('consultas',['/consultas','/agendamentos','/agenda']);
      return http.put(`${base}/${id}`, d);
    },
    async remove(id){
      const base = await resolve('consultas',['/consultas','/agendamentos','/agenda']);
      return http.del(`${base}/${id}`);
    },
    // 🔁 atualização de status, garantindo id no body
    async updateStatus(id, status){
      const base = await resolve('consultas',['/consultas','/agendamentos','/agenda']);
      const body = {
        id: Number(id),
        idConsulta: Number(id),
        status,
        statusConsulta: status
      };
      try {
        // se existir /{id}/status, usa
        return await http.put(`${base}/${id}/status`, body);
      } catch {
        // fallback: PUT /{id}
        return await http.put(`${base}/${id}`, body);
      }
    },
    async conflicts({ medicoId, data, hora, duracao, idAtual }){
      const base = await resolve('consultas',['/consultas','/agendamentos','/agenda']);
      try {
        const res = await http.get(`${base}/conflicts`, {
          params:{ medicoId, data, hora, duracao, idAtual }
        });

        if (typeof res === 'boolean') return res;
        if (res && typeof res.conflict === 'boolean') return res.conflict;
        if (res && typeof res.hasConflict === 'boolean') return res.hasConflict;
        if (res && typeof res.data === 'boolean') return res.data;

        return false;
      } catch {
        return false;
      }
    },
    async consultasPendentes(){
      const base = await resolve('consultas',['/consultas','/agendamentos','/agenda']);
      try {
        const res = await http.get(`${base}/notificacoes/pendentes`);
        return mapPage(res);
      } catch {
        return { rows: [], total: 0, page: 1, size: 0 };
      }
    }
  };

  // -------- Financeiro --------
  const financeiro = {
    async list({ from, to, status, tipo, page=1, size=20 } = {}){
      const base = await resolve('financeiro',['/financeiro','/lancamentos','/movimentos'], { from, to, status, tipo, page:zero(page), size });
      const res = await http.get(base,{ params:{ from, to, status, tipo, page:zero(page), size }});
      return mapPage(res);
    },
    async getById(id){
      const base = await resolve('financeiro',['/financeiro','/lancamentos','/movimentos']);
      return http.get(`${base}/${id}`);
    },
    async create(data){
      const base = await resolve('financeiro',['/financeiro','/lancamentos','/movimentos']);
      return http.post(base, data);
    },
    async update(id,d){
      const base = await resolve('financeiro',['/financeiro','/lancamentos','/movimentos']);
      return http.put(`${base}/${id}`, d);
    },
    async remove(id){
      const base = await resolve('financeiro',['/financeiro','/lancamentos','/movimentos']);
      return http.del(`${base}/${id}`);
    },
    async pagar(id, dataPagamento){
      const base = await resolve('financeiro',['/financeiro','/lancamentos','/movimentos']);
      try {
        return await http.put(`${base}/${id}/pagar`, { dataPagamento });
      } catch {
        return await http.put(`${base}/${id}`, { status:'PAGO', dataPagamento });
      }
    }
  };

  window.API = { pacientes, medicos, consultas, financeiro, enderecos };
  console.log('[restApi] ON', window.API_BASE_URL);
})();
