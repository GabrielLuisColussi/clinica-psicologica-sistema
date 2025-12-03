// src/services/auth.js
window.Auth = (function(){
    const KEY = 'clinica_auth';

    function getUser(){
        try { return JSON.parse(localStorage.getItem(KEY)) || null; }
        catch { return null; }
    }
    
    function isAuthenticated(){ 
        return !!getUser(); 
    }

    async function login({ email, senha }){
        try {
            // Verifica se http está disponível
            if (!window.http || !window.http.post) {
                throw new Error('Serviço HTTP não disponível. Verifique se http.js foi carregado.');
            }

            // Chama o backend para autenticação
            const response = await window.http.post('/auth/login', { email, senha });
            
            // Salva o usuário no localStorage
            const user = {
                nome: response.nome || 'Administrador',
                email: response.email || email,
                perfil: response.perfil || 'admin',
                token: response.token || 'token-admin'
            };
            localStorage.setItem(KEY, JSON.stringify(user));
            return user;
        } catch (error) {
            // Se houver erro na requisição, lança uma mensagem amigável
            const errorMessage = error.message || 'Credenciais inválidas';
            
            // Trata diferentes tipos de erro
            if (errorMessage.includes('401') || errorMessage.includes('Credenciais')) {
                throw new Error('Usuário ou senha incorretos');
            } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
                throw new Error('Erro de conexão. Verifique se o backend está rodando em http://localhost:8080');
            } else {
                throw new Error(errorMessage);
            }
        }
    }

    function logout(){
        localStorage.removeItem(KEY);
    }

    return { getUser, isAuthenticated, login, logout };
})();
