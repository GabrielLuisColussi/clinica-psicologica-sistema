# Dockerfile para o Frontend JavaScript
FROM nginx:alpine

# Remove a página padrão do nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia os arquivos do frontend para o diretório do nginx
COPY . /usr/share/nginx/html

# Cria script para substituir a URL da API no config.js em tempo de execução
# No Docker, usamos URL relativa para que o nginx faça o proxy
RUN echo '#!/bin/sh \
set -e \
if [ -n "$API_BASE_URL" ]; then \
    sed -i "s|window.API_BASE_URL = .*|window.API_BASE_URL = \"$API_BASE_URL\";|g" /usr/share/nginx/html/src/config.js \
else \
    # No Docker, usa window.location.origin para fazer requisições relativas via proxy \
    sed -i "s|window.API_BASE_URL = .*|window.API_BASE_URL = window.location.origin;|g" /usr/share/nginx/html/src/config.js \
fi \
exec nginx -g "daemon off;"' > /docker-entrypoint.sh && \
chmod +x /docker-entrypoint.sh

# Configuração customizada do nginx
# Para permitir SPA routing e API proxy
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Configuração para SPA (Single Page Application) \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Proxy para todas as rotas da API do backend \
    location ~ ^/(pacientes|medicos|consultas|agendamentos|agenda|financeiro|pessoas|enderecos|auth|login|especialidades) { \
        proxy_pass http://backend:8080; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
        proxy_set_header X-Forwarded-Host $host; \
        proxy_set_header X-Forwarded-Port $server_port; \
    } \
    \
    # Cache para assets estáticos \
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expõe a porta 80
EXPOSE 80

# Usa o script de entrada customizado
ENTRYPOINT ["/docker-entrypoint.sh"]

