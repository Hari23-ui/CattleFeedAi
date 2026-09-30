# CattleFeedAI API — Database & Environment Configuration

This document outlines the environment configuration and database connectivity guidelines for CattleFeedAI's Spring Boot backend (`cattle-feed-api`).

---

## 1. Single Database Engine: Supabase Managed PostgreSQL

CattleFeedAI uses **Supabase Managed PostgreSQL** exclusively across all environments:
- Local development
- Maven test execution (`mvn test` / `mvn verify`)
- Integration tests
- Production deployment (e.g., Render Cloud)

> **Important**: H2 in-memory databases and local MySQL instances are completely removed and prohibited.

---

## 2. Required Environment Variables

To run the Spring Boot backend or execute Maven tests against Supabase PostgreSQL, set the following environment variables:

```bash
# Supabase PostgreSQL JDBC Connection URL
DATABASE_URL=jdbc:postgresql://aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require

# Supabase Database Credentials
DATABASE_USERNAME=postgres.your_project_ref
DATABASE_PASSWORD=your_secure_supabase_password
```

### Format Specifications:
- **JDBC URL Format**: `jdbc:postgresql://<HOST>:<PORT>/<DATABASE>?sslmode=require`
- **Supabase Direct Connection**: Port `5432` (`db.<PROJECT-REF>.supabase.co:5432`)
- **Supabase Connection Pooler (Recommended)**: Port `6543` (Transaction mode) or `5432` (Session mode)
- **SSL Mode**: `sslmode=require` is enforced for secure encrypted transit to Supabase.

> **Security Notice**: NEVER commit real database credentials or `.env` files containing live secrets to version control.

---

## 3. Running Locally

### Option A: Export Environment Variables in PowerShell
```powershell
$env:DATABASE_URL="jdbc:postgresql://aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
$env:DATABASE_USERNAME="postgres.your_project_ref"
$env:DATABASE_PASSWORD="your_supabase_password"

mvn spring-boot:run
```

### Option B: Export Environment Variables in Bash / Linux / macOS
```bash
export DATABASE_URL="jdbc:postgresql://aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
export DATABASE_USERNAME="postgres.your_project_ref"
export DATABASE_PASSWORD="your_supabase_password"

mvn spring-boot:run
```

---

## 4. Running Maven Tests

Maven tests connect directly to Supabase PostgreSQL and validate against the existing 16-table schema.

```bash
mvn clean test
```

### Safety Guarantees During Test Execution:
1. **Schema Protection**: `spring.jpa.hibernate.ddl-auto=none` is enforced. Hibernate will never issue `CREATE TABLE`, `ALTER TABLE`, or `DROP TABLE`.
2. **Fail-Fast Safety Check**: `TestDatabaseSafetyValidator` ensures tests terminate immediately with a clear error message if `DATABASE_URL`, `DATABASE_USERNAME`, or `DATABASE_PASSWORD` are missing.
3. **No Silent Fallback**: Tests will never fall back to H2, MySQL, or localhost.
4. **Isolated Test Data Cleanup**: Integration tests run within `@Transactional` boundaries (automatically rolled back) and execute `@AfterEach` targeted entity cleanups for test-specific accounts, preserving all production/shared data.
