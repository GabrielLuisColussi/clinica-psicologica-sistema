window.USE_API = true;
// Base da API:
// - Quando servido pelo mesmo servidor (Docker), usamos window.location.origin
// - Em desenvolvimento local separado, você pode forçar 'http://localhost:8080'
window.API_BASE_URL = window.location.origin || 'http://localhost:8080';
