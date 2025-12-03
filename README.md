🚀 Clínica – Sistema Integrado (Spring Boot + Frontend + Docker)
API completa + Frontend integrado + Ambiente Docker padronizado

Documentação técnica oficial do projeto

<div align="center">
🛠 Tecnologias Utilizadas
<img src="https://img.shields.io/badge/Java-17-blue?logo=java" /> <img src="https://img.shields.io/badge/Spring_Boot-3.0-brightgreen?logo=springboot" /> <img src="https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JS-orange" /> <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker" /> <img src="https://img.shields.io/badge/MySQL-8.0-blue?logo=mysql" /> </div>
📌 1. Visão Geral

Este repositório reúne todo o sistema da Clínica, dividido em três partes:

✔ 1) Backend – Spring Boot (API REST)

Localizado em /ClinicaSpring

CRUD completo

Camadas: Controller, Service, Repository, DTO

Validações de negócio

CORS configurado

Scripts SQL

Tratamento de exceções

✔ 2) Frontend – HTML, CSS e JS

Localizado em /clinica-frontend

Telas modernas

Páginas de login e dashboard

Consumo da API via fetch()

Estrutura simples e responsiva

✔ 3) Docker – Execução Padronizada

Root do projeto:

docker-compose.yml

Containers: API, MySQL, phpMyAdmin

Volumes com persistência

Configuração pronta para rodar

🗂 2. Estrutura Geral do Repositório
clinica-sistema/
├── ClinicaSpring/               # Backend (Spring Boot)
│   ├── src/main/java/com/clinicaspring/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── dto/
│   │   ├── config/
│   │   └── model/
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── db.sql
│   ├── pom.xml
│   └── Dockerfile
│
├── clinica-frontend/            # Interface do sistema
│   ├── assets/
│   ├── icons/
│   ├── styles.css
│   ├── login.html
│   └── settings.js
│
├── docker-compose.yml           # Docker principal
└── DOCKER-README.md             # Instruções adicionais

🐳 3. Execução com Docker (Modo Recomendado)
📌 Subir a stack completa:
docker-compose up -d

Containers criados:
Serviço	Porta	Descrição
Spring API	8080	Backend
MySQL	3306	Banco de dados
phpMyAdmin	8081	Interface do banco
📌 Para ver logs da API:
docker logs spring-api -f

📌 Para reiniciar:
docker-compose down
docker-compose up -d

🔧 4. Backend – Spring Boot
📍 Local: /ClinicaSpring

O backend segue o padrão:

Controller → recebe requisição

Service → regra de negócio

Repository → comunicação com o banco

DTO → transporte de dados

Models → entidades JPA

🌐 Endpoints Principais:
🧍 Pacientes
Método	Rota	Descrição
GET	/pacientes	Lista
POST	/pacientes	Cria
PUT	/pacientes/{id}	Atualiza
DELETE	/pacientes/{id}	Remove
🧑‍⚕️ Médicos
Método	Rota	Descrição
GET	/medicos	Lista
POST	/medicos	Cria
PUT	/medicos/{id}	Atualiza
DELETE	/medicos/{id}	Remove
📅 Agendamentos
Método	Rota	Descrição
GET	/agendamentos	Lista
POST	/agendamentos	Cria
PUT	/agendamentos/{id}	Atualiza
DELETE	/agendamentos/{id}	Remove
🎨 5. Frontend (HTML + CSS + JavaScript)
📍 Local: /clinica-frontend

Inclui:

Tela de login

Tela de dashboard

Formulários de agendamento

Consumo da API via fetch()

Estrutura visual moderna

Exemplo de chamada à API:
fetch("http://localhost:8080/pacientes")
  .then(r => r.json())
  .then(data => console.log(data));

🧪 6. Banco de Dados
Criado automaticamente pelo Spring ou via Docker:

Nome: clinica

Tabelas:

paciente

medico

agendamento

tabelas auxiliares via relacionamentos

Arquivo SQL disponível em:
ClinicaSpring/src/main/resources/db.sql

📚 7. Documentação P&D (Pesquisa e Desenvolvimento)
🎯 Objetivo

Estudar e aplicar:

Spring Boot com camadas organizadas

Docker para padronizar execução

Arquitetura escalável

Padrões REST

Integração frontend-backend

📌 Principais desafios

Estruturar as camadas Service/Repository

Criar DTOs coerentes

Resolver CORS

Criar ambiente Docker com API + banco

📌 Resultados

API funcional

Interface simples conectada ao backend

Docker executando o sistema inteiro

Organização clara e modular

📌 Próximos passos

Autenticação JWT

Logs estruturados

Testes automatizados

Página de relatórios

Dashboard mais completo

📸 8. Prints (Sugestão – substitua pelos seus)

(Basta substituir quando fizer prints reais)

![Login](https://via.placeholder.com/800x400?text=Login)
![Dashboard](https://via.placeholder.com/800x400?text=Dashboard)

🤝 9. Autores
Nome	Função
Gabriel Luis Colussi	Dev Backend / Docker / Documentação
Samuel	Dev Frontend / Suporte
Equipe	Apoio geral
📄 10. Licença

Projeto acadêmico. Uso livre para fins educacionais.
