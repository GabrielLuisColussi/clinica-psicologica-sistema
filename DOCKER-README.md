# Instruções para Deploy com Docker

Este projeto contém os arquivos Docker necessários para executar a aplicação completa (Frontend + Backend + MySQL) usando Docker Desktop.

## Estrutura dos Arquivos Docker

- `docker-compose.yml` - Arquivo principal que orquestra todos os serviços
- `ClinicaSpring/Dockerfile` - Dockerfile para o backend Spring Boot
- `clinica-frontend/Dockerfile` - Dockerfile para o frontend JavaScript

## Como Usar

### 1. Certifique-se de que o Docker Desktop está rodando

Abra o Docker Desktop no Windows e aguarde até que esteja completamente iniciado.

### 2. Na raiz do projeto, execute:

```bash
docker-compose up --build
```

Este comando irá:
- Construir as imagens do frontend e backend
- Criar e iniciar os containers (MySQL, Backend e Frontend)
- Configurar a rede entre os containers

### 3. Acesse a aplicação

- **Aplicação completa (Frontend + Backend)**: http://localhost:8080
- **Backend API**: http://localhost:8080 (mesma porta)
- **MySQL**: localhost:3306

**Nota**: Tanto o frontend quanto o backend estão disponíveis na porta 8080. O Spring Boot serve os arquivos estáticos do frontend e as rotas da API na mesma porta.

### 4. Para parar os containers

```bash
docker-compose down
```

### 5. Para parar e remover volumes (dados do banco)

```bash
docker-compose down -v
```

## Configurações

### Variáveis de Ambiente

As configurações padrão estão no `docker-compose.yml`. Para alterar:

**MySQL:**
- Senha root: `rootpassword`
- Database: `clinica_quartanew`
- Usuário: `clinicauser`
- Senha: `clinicapassword`

**Backend:**
- Porta: `8080`
- Conecta automaticamente ao MySQL na mesma rede Docker

**Frontend:**
- Servido pelo Spring Boot na porta `8080` (mesma do backend)
- Arquivos estáticos copiados para o diretório `static` durante o build

## Logs

Para ver os logs de todos os serviços:
```bash
docker-compose logs -f
```

Para ver logs de um serviço específico:
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

## Rebuild após mudanças

Se você fez alterações no código:
```bash
docker-compose up --build
```

Ou para rebuild apenas um serviço:
```bash
docker-compose up --build backend
docker-compose up --build frontend
```

## Volumes

O MySQL usa um volume persistente `mysql_data` para manter os dados do banco mesmo após parar os containers.

## Troubleshooting

**Problema: Porta já em uso**
- Se a porta 80 ou 8080 estiver em uso, altere no `docker-compose.yml`:
  ```yaml
  ports:
    - "8081:8080"  # Para backend (mude 8081 para outra porta)
    - "8000:80"    # Para frontend (mude 8000 para outra porta)
  ```

**Problema: Backend não conecta ao MySQL**
- Verifique se o MySQL está saudável: `docker-compose ps`
- Verifique os logs: `docker-compose logs mysql backend`

**Problema: Frontend não encontra o backend**
- O frontend faz proxy automático via nginx. Certifique-se de que o backend está rodando e acessível na rede Docker.

