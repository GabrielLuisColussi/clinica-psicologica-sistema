# Dockerfile para o Backend Spring Boot (com Frontend integrado)
# O docker-compose usa a raiz (.) como contexto de build,
# por isso todos os caminhos aqui são relativos à raiz do projeto.

# ===== STAGE 1: BUILD =====
FROM maven:3.9-eclipse-temurin-17 AS build

# Diretório de trabalho dentro da imagem
WORKDIR /app

# Copia arquivos de configuração do Maven do módulo Spring
COPY ClinicaSpring/pom.xml ./pom.xml
COPY ClinicaSpring/mvnw ./mvnw
COPY ClinicaSpring/.mvn ./.mvn

# Baixa dependências (camada de cache)
RUN ./mvnw -q dependency:go-offline -B || mvn -q dependency:go-offline -B

# Copia o código fonte do backend
COPY ClinicaSpring/src ./src

# Copia o frontend para o diretório static do Spring Boot
COPY clinica-frontend/index.html ./src/main/resources/static/
COPY clinica-frontend/assets ./src/main/resources/static/assets/
COPY clinica-frontend/src ./src/main/resources/static/src/

# Compila o projeto e gera o JAR (sem testes para ficar mais rápido)
RUN ./mvnw -q clean package -DskipTests || mvn -q clean package -DskipTests

# ===== STAGE 2: RUNTIME =====
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copia o JAR gerado no estágio de build
COPY --from=build /app/target/*.jar app.jar

# Porta da aplicação
EXPOSE 8080

# Variáveis de ambiente padrão (podem ser sobrescritas pelo docker-compose)
# Aqui deixamos coerente com o MySQL do XAMPP na máquina host.
ENV SPRING_DATASOURCE_URL=jdbc:mysql://host.docker.internal:3306/clinica_quartanew?useTimezone=true&serverTimezone=UTC&createDatabaseIfNotExist=true
ENV SPRING_DATASOURCE_USERNAME=root
ENV SPRING_DATASOURCE_PASSWORD=""
ENV SPRING_JPA_HIBERNATE_DDL_AUTO=none

# Comando de inicialização
ENTRYPOINT ["java", "-jar", "app.jar"]