// src/app.js
// Inicialização principal do sistema - Login no HTML

// Elementos do DOM (serão inicializados quando o DOM estiver pronto)
let loginContainer, sidebar, mainContent;

// Inicializa elementos do DOM
function initDOMElements() {
  loginContainer = document.getElementById('login-container');
  const appSystem = document.getElementById('app-system');
  sidebar = document.getElementById('sidebar');
  mainContent = document.getElementById('main-content');
  return { loginContainer, appSystem, sidebar, mainContent };
}

// Mostra/esconde login e sistema
function toggleViews(isAuthenticated) {
  const elements = initDOMElements(); // Garante que os elementos estão disponíveis
  
  if (isAuthenticated) {
    // Mostra sistema, esconde login
    if (elements.loginContainer) elements.loginContainer.style.display = 'none';
    if (elements.appSystem) elements.appSystem.style.display = 'block';
    document.body.style.background = '';
    document.body.classList.remove('auth-login');
  } else {
    // Mostra login, esconde sistema
    if (elements.loginContainer) elements.loginContainer.style.display = 'flex';
    if (elements.appSystem) elements.appSystem.style.display = 'none';
    document.body.style.background =
      "url('./assets/icons/login.jpg') center/cover no-repeat, " +
      "linear-gradient(180deg, rgba(245,249,252,.85) 0%, rgba(237,243,248,.85) 100%)";
    document.body.classList.add('auth-login');
  }
}

// Mostra botão de sair no topo (se logado)
function paintUser(){
  const btn = document.getElementById('user-btn');
  if (!btn) return;
  btn.textContent = 'Sair';
}

// Configura botão de login
function setupLoginButton() {
  const btnEntrar = document.getElementById('login-entrar');
  if (!btnEntrar) {
    console.error('[app.js] Botão de login não encontrado!');
    return;
  }

  // Remove event listeners anteriores para evitar duplicação
  const newBtn = btnEntrar.cloneNode(true);
  btnEntrar.parentNode.replaceChild(newBtn, btnEntrar);

  // Área de erro visual no card de login
  const loginCard = document.querySelector('.login-card');
  let errorBox = document.getElementById('login-error');
  if (!errorBox && loginCard) {
    errorBox = document.createElement('p');
    errorBox.id = 'login-error';
    errorBox.style.color = '#b91c1c';
    errorBox.style.marginTop = '8px';
    errorBox.style.fontSize = '14px';
    errorBox.style.display = 'none';
    loginCard.appendChild(errorBox);
  }

  const showError = (msg) => {
    if (errorBox) {
      errorBox.textContent = msg || 'Erro ao realizar login.';
      errorBox.style.display = 'block';
    } else {
      alert(msg || 'Erro ao realizar login.');
    }
  };

  const clearError = () => {
    if (errorBox) {
      errorBox.textContent = '';
      errorBox.style.display = 'none';
    }
  };

  newBtn.onclick = async () => {
    const email = document.getElementById('login-email')?.value.trim();
    const senha = document.getElementById('login-senha')?.value.trim();
    clearError();
    
    if (!email || !senha) {
      showError('Preencha usuário e senha');
      if (window.UI && window.UI.toast) {
        window.UI.toast('Preencha usuário e senha', 'error');
      }
      return;
    }

    // Desabilita o botão durante o login
    newBtn.disabled = true;
    newBtn.textContent = 'Entrando...';

    try {
      console.log('[app.js] Tentando fazer login com:', { email, senha: '***' });
      
      await Auth.login({ email, senha });
      
      console.log('[app.js] Login bem-sucedido!');
      clearError();
      
      if (window.UI && window.UI.toast) {
        window.UI.toast('Bem-vindo!');
      } else {
        alert('Bem-vindo!');
      }
      
      // Atualiza a interface
      toggleViews(true);
      paintUser();
      
      // Navega para o dashboard
      location.hash = '#/dashboard';
      
      // Força navegação do router
      if (window.AppRouter && window.AppRouter.navigate) {
        setTimeout(() => {
          window.AppRouter.navigate();
        }, 100);
      }
    } catch (e) {
      console.error('[app.js] Erro no login:', e);
      const errorMsg = e.message || 'Falha no login';
      showError(errorMsg);
      if (window.UI && window.UI.toast) {
        window.UI.toast(errorMsg, 'error');
      } else {
        alert(errorMsg);
      }
    } finally {
      // Reabilita o botão
      newBtn.disabled = false;
      newBtn.textContent = 'Entrar';
    }
  };

  // Permite login com Enter
  const emailInput = document.getElementById('login-email');
  const senhaInput = document.getElementById('login-senha');
  
  [emailInput, senhaInput].forEach(input => {
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          btnEntrar.click();
        }
      });
    }
  });
}

// Logout ao clicar no usuário
function setupLogoutButton() {
  document.getElementById('user-btn')?.addEventListener('click', () => {
    if (!Auth.isAuthenticated()) {
      toggleViews(false);
      return;
    }
    Auth.logout();
    if (window.UI && window.UI.toast) {
      window.UI.toast('Sessão encerrada');
    }
    toggleViews(false);
  });
}

// Guard de rotas: se não logado, mostra login
function protect(){
  const isAuth = Auth.isAuthenticated();
  
  if (!isAuth) {
    toggleViews(false);
    return;
  }

  toggleViews(true);
  paintUser();
}

// Inicialização - executa quando tudo estiver pronto
function initializeApp() {
  // Aguarda o DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
    return;
  }

  // Aguarda Auth estar disponível
  if (!window.Auth) {
    setTimeout(initializeApp, 50);
    return;
  }

  initDOMElements();
  
  // Por padrão, mostra login até verificar autenticação
  toggleViews(false);
  
  const isAuth = Auth.isAuthenticated();
  const hash = location.hash || '';

  // Configura botões
  setupLoginButton();
  setupLogoutButton();

  if (!isAuth) {
    // Não autenticado: garante que login está visível
    toggleViews(false);
    location.hash = ''; // Remove qualquer hash para evitar navegação
    
    // Intercepta navegação do router
    if (window.AppRouter && window.AppRouter.navigate) {
      const originalNavigate = window.AppRouter.navigate.bind(window.AppRouter);
      window.AppRouter.navigate = function() {
        if (!Auth.isAuthenticated()) {
          toggleViews(false);
          return; // Não navega se não estiver autenticado
        }
        return originalNavigate();
      };
    }
  } else {
    // Autenticado: mostra sistema
    toggleViews(true);
    paintUser();
    
    // Se não tiver hash ou estiver em "#/", manda pro dashboard
    if (!hash || hash === '#/' || hash === '#/login') {
      location.hash = '#/dashboard';
    }
    
    // Força navegação do router após um pequeno delay
    setTimeout(() => {
      if (window.AppRouter && window.AppRouter.navigate) {
        window.AppRouter.navigate();
      }
    }, 100);
  }
}

// Executa a inicialização
initializeApp();

// Executa o guard em mudanças de hash
window.addEventListener('hashchange', () => {
  if (!Auth.isAuthenticated()) {
    toggleViews(false);
    location.hash = '';
    return;
  }
  protect();
  
  // Navega após mudança de hash (se autenticado)
  if (window.AppRouter && window.AppRouter.navigate) {
    setTimeout(() => {
      window.AppRouter.navigate();
    }, 50);
  }
});


