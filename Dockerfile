# Build stage
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN ./mvnw dependency:resolve
COPY src ./src
RUN ./mvnw package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/fleet-analytics-tracking-backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
