// src/core/ui.js
;(function(){
  // Utilidade leve para criar elementos (mantida para eventualmente usar)
  function h(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k,v])=>{
      if (k === 'class') el.className = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (v !== undefined && v !== null) el.setAttribute(k, v);
    });
    (Array.isArray(children) ? children : [children]).forEach(c=>{
      if (c == null) return;
      if (typeof c === 'string') el.appendChild(document.createTextNode(c));
      else el.appendChild(c);
    });
    return el;
  }
  window.$ui = window.$ui || { h };

  // ---------- HELPERS GLOBAIS ----------

  // Lê os parâmetros do hash (#/rota?param=valor)
  window.getHashParams = function(){
    try {
      const qs = (location.hash.split('?')[1] || '');
      return Object.fromEntries(new URLSearchParams(qs).entries());
    } catch(e) {
      console.error('[getHashParams] erro:', e);
      return {};
    }
  };

  // Validação simples: checa campos obrigatórios
  window.requireFields = function(form, fields){
    const data = Object.fromEntries(new FormData(form).entries());
    const missing = fields.filter(f => !String(data[f]||'').trim());
    return { ok: missing.length === 0, missing, data };
  };

  // Toast básico (console por enquanto; pode evoluir para UI visual)
  window.toast = function(msg, type='ok'){
    const prefix = (type === 'error' ? '[erro]' : `[${type}]`);
    console[type === 'error' ? 'error' : 'log'](`${prefix} ${msg}`);
  };

  // Objeto UI para compatibilidade
  window.UI = {
    toast: window.toast
  };

  // Pega dados de paciente tanto de <tr> quanto de qualquer container de item
  window.extractPacienteData = function(el){
    const row = el?.closest('[data-id]');
    if (!row) return { id:'', nome:'', telefone:'' };
    const id  = row.getAttribute('data-id') || '';
    const nome = row.getAttribute('data-nome') || '';
    const telefone = row.getAttribute('data-telefone') || '';
    return { id, nome, telefone };
  };

  // Navega para Agendar com dados seguros
  window.goAgendarFromRow = function(el){
    const { id, nome, telefone } = window.extractPacienteData(el);
    const nom = encodeURIComponent(nome || '');
    const tel = encodeURIComponent(telefone || '');
    location.hash = `#/agendamentos?pacienteId=${id||''}&nome=${nom}&telefone=${tel}`;
  };
})();
