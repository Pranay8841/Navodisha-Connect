# Navodisha Connect — Project Roadmap

## Stage 0: Foundation
- [x] 0.1 Environment & Tooling Verification (JDK vs JRE vs JVM)
- [ ] 0.2 Project Initialization & Maven Anatomy (`pom.xml` vs `package.json`)
- [ ] 0.3 Anatomy of a Spring Boot Entry Point (`@SpringBootApplication`, IoC Container)
- [ ] 0.4 First REST Endpoint & Web MVC Pipeline (`@RestController`, `DispatcherServlet`)
- [ ] 0.5 Application Configuration & Environment Profiles (`application.yml`)
- [ ] 0.6 Interactive API Documentation (`springdoc-openapi` / Swagger UI)
- [ ] 0.7 Local Database Setup (Docker Compose & PostgreSQL)
- [ ] 0.8 Database Migrations with Flyway
- [ ] 0.9 DataSource & Connection Pool Smoke Test (HikariCP)

## Stage 1: Auth and Users
- OTP login, JWT, roles, security filter chain, global error handling

## Stage 2: Profiles and Reference Data
- JNVs, fields of study/work, JPA entity relations, N+1 problem mitigation

## Stage 3: Alumni Verification
- File upload with presigned URLs, verification state machine, audit trails

## Stage 4: Alumni Directory and Search
- Dynamic filtering, database indexing, cursor-based pagination

## Stage 5: Help Requests and Matching
- Scoring logic, async processing, optimistic locking

## Stage 6: Sessions
- Scheduling, time zone management, conflict detection, reminders

## Stage 7: Notifications
- FCM push notifications, transactional outbox pattern

## Stage 8: Chat
- WebSocket & STOMP, JWT handshake auth, persistent chat history

## Stage 9: JNV Requests
- Row-level authorization, architecture testing with ArchUnit

## Stage 10: Moderation and Admin
- Reports, blocking, rate limiting

## Stage 11: Production Hardening
- Containerization, CI/CD to Render, observability and health checks
