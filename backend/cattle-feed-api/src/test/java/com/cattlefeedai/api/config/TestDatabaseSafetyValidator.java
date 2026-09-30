package com.cattlefeedai.api.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Ensures strict safety for CattleFeedAI test execution against Supabase PostgreSQL:
 * 1. Fails immediately and cleanly if DATABASE_URL, DATABASE_USERNAME, or DATABASE_PASSWORD are missing.
 * 2. Prevents any silent fallback to in-memory H2, local MySQL, or unconfigured localhost.
 * 3. Prevents dangerous DDL operations (create-drop or create) against the live Supabase PostgreSQL schema.
 */
public class TestDatabaseSafetyValidator implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    private static final Logger log = LoggerFactory.getLogger(TestDatabaseSafetyValidator.class);

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        ConfigurableEnvironment env = applicationContext.getEnvironment();

        loadDotenvIfPresent(env);

        String dbUrl = env.getProperty("DATABASE_URL");
        String dbUser = env.getProperty("DATABASE_USERNAME");
        String dbPass = env.getProperty("DATABASE_PASSWORD");

        // 1. Validate required environment variables
        StringBuilder missing = new StringBuilder();
        if (dbUrl == null || dbUrl.isBlank()) missing.append(" DATABASE_URL");
        if (dbUser == null || dbUser.isBlank()) missing.append(" DATABASE_USERNAME");
        if (dbPass == null || dbPass.isBlank()) missing.append(" DATABASE_PASSWORD");

        if (missing.length() > 0) {
            String errorMsg = "\n" +
                    "================================================================================\n" +
                    "CRITICAL TEST DATABASE SAFETY FAILURE\n" +
                    "================================================================================\n" +
                    "Missing required Supabase PostgreSQL environment variables:" + missing + "\n\n" +
                    "CattleFeedAI requires a live Supabase PostgreSQL database for all integration tests.\n" +
                    "In-memory databases (H2), local MySQL, and unauthenticated fallbacks are STRICTLY PROHIBITED.\n\n" +
                    "Please configure the following environment variables before executing Maven tests:\n" +
                    "  DATABASE_URL=jdbc:postgresql://HOST:PORT/postgres?sslmode=require\n" +
                    "  DATABASE_USERNAME=postgres\n" +
                    "  DATABASE_PASSWORD=your_supabase_password\n" +
                    "================================================================================\n";
            log.error(errorMsg);
            throw new IllegalStateException(errorMsg);
        }

        // 2. Prohibit H2 and MySQL URLs
        String lowerUrl = dbUrl.toLowerCase();
        if (lowerUrl.contains(":h2:") || lowerUrl.contains("h2:mem") || lowerUrl.contains(":mysql:")) {
            String errorMsg = "\n" +
                    "================================================================================\n" +
                    "CRITICAL TEST DATABASE SAFETY FAILURE\n" +
                    "================================================================================\n" +
                    "Prohibited database URL detected: " + dbUrl + "\n" +
                    "H2 and MySQL are completely prohibited. CattleFeedAI must use Supabase PostgreSQL.\n" +
                    "================================================================================\n";
            log.error(errorMsg);
            throw new IllegalStateException(errorMsg);
        }

        // 3. Ensure hibernate ddl-auto is never create-drop or create
        String ddlAuto = env.getProperty("spring.jpa.hibernate.ddl-auto", "none");
        if ("create-drop".equalsIgnoreCase(ddlAuto) || "create".equalsIgnoreCase(ddlAuto)) {
            String errorMsg = "\n" +
                    "================================================================================\n" +
                    "CRITICAL TEST DATABASE SAFETY FAILURE\n" +
                    "================================================================================\n" +
                    "Unsafe hibernate ddl-auto configuration detected: '" + ddlAuto + "'\n" +
                    "Tests must preserve the existing Supabase schema and must never use create-drop or create!\n" +
                    "Use spring.jpa.hibernate.ddl-auto=none instead.\n" +
                    "================================================================================\n";
            log.error(errorMsg);
            throw new IllegalStateException(errorMsg);
        }

        log.info("Test Database Safety Audit Passed: Supabase PostgreSQL datasource configured safely.");
    }

    private void loadDotenvIfPresent(ConfigurableEnvironment env) {
        Path[] candidatePaths = new Path[]{
                Paths.get(".env"),
                Paths.get("../.env"),
                Paths.get("../../.env")
        };

        for (Path path : candidatePaths) {
            if (Files.isRegularFile(path)) {
                try {
                    List<String> lines = Files.readAllLines(path, StandardCharsets.UTF_8);
                    Map<String, Object> props = new HashMap<>();
                    for (String line : lines) {
                        String trimmed = line.trim();
                        if (trimmed.isEmpty() || trimmed.startsWith("#")) continue;
                        int eqIdx = trimmed.indexOf('=');
                        if (eqIdx > 0) {
                            String key = trimmed.substring(0, eqIdx).trim();
                            String val = trimmed.substring(eqIdx + 1).trim();
                            if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
                                val = val.substring(1, val.length() - 1);
                            }
                            props.put(key, val);
                            if (System.getProperty(key) == null) {
                                System.setProperty(key, val);
                            }
                        }
                    }
                    if (!props.isEmpty()) {
                        env.getPropertySources().addFirst(new MapPropertySource("dotenvProperties", props));
                        log.info("Test runner loaded environment properties from: {}", path.toAbsolutePath());
                    }
                    break;
                } catch (Exception e) {
                    log.warn("Could not read test .env from {}: {}", path, e.getMessage());
                }
            }
        }
    }
}
