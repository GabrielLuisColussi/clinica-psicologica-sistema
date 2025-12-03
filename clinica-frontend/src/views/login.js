// Login agora está no HTML (index.html)
// Esta rota não é mais necessária, mas mantida para compatibilidade
AppRouter.register(
  "/login",
  async (root) => {
    // Se já estiver autenticado, redireciona para dashboard
    if (Auth.isAuthenticated()) {
      location.hash = "#/dashboard";
      return;
    }
    // Login está no HTML, então apenas mostra mensagem se necessário
    root.innerHTML = `<div class="card">Redirecionando para login...</div>`;
  },
  { title: "Login", subtitle: "" }
);
