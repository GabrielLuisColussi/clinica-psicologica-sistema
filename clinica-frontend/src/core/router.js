// src/core/router.js
;(function () {
  const routes = Object.create(null);

  // Onde as views serão renderizadas
  function getMain() {
    let m = document.getElementById('app-root');
    if (!m) {
      // Fallback: busca main ou cria
      m = document.querySelector('main') || document.querySelector('#app-root');
      if (!m) {
        m = document.createElement('section');
        m.id = 'app-root';
        m.className = 'content';
        const mainEl = document.querySelector('main');
        if (mainEl) {
          mainEl.appendChild(m);
        } else {
          document.body.appendChild(m);
        }
      }
    }
    return m;
  }

  // Atualiza o título e subtítulo da página
  function setHeaderSafe(title = '', subtitle = '') {
    try {
      const h1 = document.getElementById('page-title');
      const h2 = document.getElementById('page-subtitle');
      if (h1) h1.textContent = title || '';
      if (h2) h2.textContent = subtitle || '';
    } catch (e) {
      console.warn('[router] setHeaderSafe ignorado:', e);
    }
  }

  // Lê o hash atual e devolve o path base (ex: "#/dashboard?x=1" -> "/dashboard")
  function basePath() {
    const raw = location.hash || '#/dashboard';
    const h = raw.startsWith('#') ? raw.slice(1) : raw;
    const path = h.split('?')[0] || '/dashboard';
    return path;
  }

  // Função interna de registro de rota
  function internalRegister(path, a, b) {
    let handler = a;
    let meta    = b;

    // permite (path, handler) ou (path, meta, handler)
    if (typeof a !== 'function' && typeof b === 'function') {
      handler = b;
      meta    = a;
    }

    if (typeof handler !== 'function') {
      console.warn('[router] register sem handler válido para', path, { a, b });
      handler = async (root) => {
        root.innerHTML = `<div class="card">Rota em construção</div>`;
      };
    }

    if (!meta || typeof meta !== 'object') meta = {};
    routes[path] = { handler, meta };
  }

  const AppRouter = {};

  // uso básico: AppRouter.register('/dashboard', handler)
  // ou:        AppRouter.register('/dashboard', { title: 'Dashboard' }, handler)
  AppRouter.register = function (path, a, b) {
    internalRegister(path, a, b);
  };

  // açúcar de compatibilidade: AppRouter.register.title('/rota', 'Título', 'Sub', handler)
  AppRouter.register.title = function (path, title, subtitle, handler) {
    if (typeof subtitle === 'function') {
      handler  = subtitle;
      subtitle = '';
    }
    internalRegister(path, { title, subtitle }, handler);
  };

  // Navegação: decide a rota atual e renderiza
  AppRouter.navigate = async function () {
    try {
      // Verifica autenticação antes de navegar (exceto para rota de login)
      const path = basePath();
      if (path !== '/login' && window.Auth && window.Auth.isAuthenticated) {
        const isAuth = window.Auth.isAuthenticated();
        if (!isAuth) {
          // Não autenticado: não navega, deixa o app.js lidar com isso
          return;
        }
      }

      const route = routes[path] || routes['/dashboard'];

      if (!route) {
        console.warn('[router] rota não encontrada para', path);
        const main = getMain();
        if (main) {
          main.innerHTML = `<div class="card">Rota não encontrada.</div>`;
        }
        return;
      }

      setHeaderSafe(route.meta?.title || '', route.meta?.subtitle || '');
      const main = getMain();
      if (main) {
        await route.handler(main);
      }
    } catch (e) {
      console.error('[router] erro na navegação:', e);
      const main = getMain();
      if (main) {
        main.innerHTML = `<div class="card">Erro ao carregar a rota.</div>`;
      }
    }
  };

  // expõe no window
  window.AppRouter = AppRouter;

  // Guarda a função original de navegação
  const originalNavigate = AppRouter.navigate.bind(AppRouter);
  
  // Sobrescreve navigate para verificar autenticação
  AppRouter.navigate = async function() {
    // Se não tiver Auth ainda, não navega
    if (!window.Auth || !window.Auth.isAuthenticated) {
      return;
    }
    
    // Verifica autenticação (exceto para login)
    const path = basePath();
    if (path !== '/login') {
      const isAuth = window.Auth.isAuthenticated();
      if (!isAuth) {
        // Não autenticado: não navega
        return;
      }
    }
    
    // Se chegou aqui, pode navegar
    return originalNavigate();
  };

  // Não dispara navegação automática - deixa o app.js controlar
  // O app.js chamará navigate() quando necessário

})();
