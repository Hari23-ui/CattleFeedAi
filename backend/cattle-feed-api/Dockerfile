# Multi-stage build for Spring Boot application (Java 17)
# Stage 1: Build the executable JAR using Maven and Java 17
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app

# Copy pom.xml and source code
COPY pom.xml .
COPY src ./src

# Build production artifact without running unit tests during image assembly
RUN mvn clean package -DskipTests -B

# Stage 2: Minimal, secure runtime image using Eclipse Temurin JRE 17
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Create dedicated non-root application user
RUN groupadd -r cattlefeed && useradd -r -g cattlefeed cattlefeed

# Copy compiled JAR from builder stage
COPY --from=builder /app/target/cattle-feed-api-0.0.1-SNAPSHOT.jar app.jar

# Create upload directory and grant permissions to cattlefeed user
RUN mkdir -p uploads/sample-images && chown -R cattlefeed:cattlefeed /app

USER cattlefeed

# Expose ports for local development (8080) and cloud containers (10000)
EXPOSE 8080 10000

# Default port to 8080 if PORT is not provided by the cloud platform
ENV PORT=8080

# Run Spring Boot application binding strictly to 0.0.0.0:${PORT}
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -Dserver.address=0.0.0.0 -jar app.jar"]
