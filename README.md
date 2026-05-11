# Fleet Analytics & Tracking Backend

This Spring Boot application provides a platform for tracking vehicles in real time. It supports managing vehicle information, monitoring locations, and analyzing historical data. The system is designed to be scalable, efficient, and easy to integrate with fleet management solutions.

## Features

- **Vehicle management**: Add, update, and delete vehicle information such as make, model, registration details, and ownership information.
- **Real-time tracking**: Monitor vehicle locations with WebSocket and Socket.IO style real-time updates.
- **REST API**: HTTP APIs for integration with other systems and applications.

## Technologies

- **Spring Boot** — application framework
- **Netty Socket.IO** — real-time client communication
- **JUnit / Mockito** — tests
- **MongoDB** — persistence for vehicles and tracking data
- **Spring AOP** — cross-cutting concerns such as validation around service calls

## Prerequisites

- Java 17+
- Maven (or use the included `mvnw` wrapper)
- A MongoDB instance (local or hosted)

## Getting started

1. **Clone this repository** (after you create it on GitHub under your account):

   ```bash
   git clone https://github.com/theparamvrsingh/fleet-analytics-tracking-backend.git
   cd fleet-analytics-tracking-backend
   ```

2. **Configure MongoDB** — set `MONGODB_URI` in your environment, for example:

   ```bash
   export MONGODB_URI=mongodb://localhost:27017
   ```

   You can also define `MONGODB_URI` in `src/main/resources/application.properties` for local development (avoid committing secrets).

3. **Build**:

   ```bash
   ./mvnw clean install
   ```

4. **Run**:

   ```bash
   ./mvnw spring-boot:run
   ```

5. **Open** [http://localhost:8080](http://localhost:8080) in a browser (and ensure Socket.IO is configured for port `8082` if you use that client).

## Publishing to GitHub

This project is intended to live in a **new** repository under [theparamvrsingh](https://github.com/theparamvrsingh), not as a fork of any upstream template.

1. On GitHub, create a new empty repository (for example `fleet-analytics-tracking-backend`).
2. From this project directory:

   ```bash
   git init
   git add .
   git commit -m "Initial commit: Fleet Analytics & Tracking Backend"
   git branch -M main
   git remote add origin https://github.com/theparamvrsingh/fleet-analytics-tracking-backend.git
   git push -u origin main
   ```

## License

This project is licensed under the [MIT License](LICENSE).
