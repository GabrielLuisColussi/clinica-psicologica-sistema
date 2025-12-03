(function(){
  const BASE = () => String(window.API_BASE_URL || window.location.origin || '').replace(/\/+$/,''); // sem barra final

  function buildURL(path, params){
    const base = BASE();
    // Usa o construtor com base para evitar erros de URL inválida
    const url = path.startsWith('http')
      ? new URL(path)
      : new URL(path, base || window.location.origin);
    if (params && typeof params === 'object'){
      Object.entries(params).forEach(([k,v])=>{
        if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
      });
    }
    return url.toString();
  }

  async function request(path, { method='GET', data=null, params=null, headers={} } = {}){
    const final = buildURL(path, params);
    const h = { 'Content-Type': 'application/json', ...headers };
    if (window.API_TOKEN) h.Authorization = `Bearer ${window.API_TOKEN}`;

    const res = await fetch(final, { method, headers: h, body: data ? JSON.stringify(data) : undefined });
    if (!res.ok){
      let msg=''; 
      let errorData = null;
      try{ 
        const text = await res.text();
        msg = text;
        // Tenta parsear como JSON para extrair a mensagem
        try {
          errorData = JSON.parse(text);
          if (errorData.message) {
            msg = errorData.message;
          }
        } catch {}
      }catch{}
      const error = new Error(`HTTP ${res.status} ${res.statusText}${msg?` - ${msg}`:''}`);
      error.status = res.status;
      error.data = errorData;
      error.rawMessage = msg;
      throw error;
    }
    if (res.status === 204) return null;
    const ct = res.headers.get('content-type') || '';
    return ct.includes('application/json') ? res.json() : res.text();
  }

  window.http = {
    get:(p,o)=>request(p,{...o,method:'GET'}),
    post:(p,d,o)=>request(p,{...o,method:'POST',data:d}),
    put:(p,d,o)=>request(p,{...o,method:'PUT',data:d}),
    del:(p,o)=>request(p,{...o,method:'DELETE'}),
  };
})();
