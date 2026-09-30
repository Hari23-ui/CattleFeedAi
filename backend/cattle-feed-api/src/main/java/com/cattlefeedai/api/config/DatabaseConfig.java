package com.cattlefeedai.api.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Configuration;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

/**
 * Database configuration helper for PostgreSQL and Supabase deployments.
 * 1. Automatically ensures that Supabase and PaaS URLs (which may start with postgres:// or postgresql://)
 *    are properly normalized with the jdbc: prefix required by the PostgreSQL JDBC driver.
 * 2. Parses user credentials if embedded in the URL URI authority.
 * 3. Prohibits any silent fallback to localhost:5432, H2, or MySQL.
 * 4. Automatically loads credentials from local .env if present.
 */
@Configuration
public class DatabaseConfig implements BeanPostProcessor {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);
    private final DataSourceProperties properties;

    public DatabaseConfig(DataSourceProperties properties) {
        this.properties = properties;
    }

    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
        if (bean instanceof DataSourceProperties props) {
            normalizeProperties(props);
        }
        return bean;
    }

    @PostConstruct
    public void normalizeJdbcUrl() {
        normalizeProperties(this.properties);
    }

    private void normalizeProperties(DataSourceProperties props) {
        String url = props.getUrl();
        if (url == null || url.isBlank() || url.startsWith("${")
                || props.getPassword() == null || props.getPassword().isBlank() || props.getPassword().startsWith("${")
                || props.getUsername() == null || props.getUsername().isBlank() || props.getUsername().startsWith("${")) {
            loadFromDotenvIfPresent(props);
            url = props.getUrl();
        }

        if (url == null || url.isBlank() || url.startsWith("${")) {
            String errorMsg = "\n" +
                    "================================================================================\n" +
                    "DATABASE CONFIGURATION ERROR: MISSING DATABASE_URL\n" +
                    "================================================================================\n" +
                    "CattleFeedAI requires Supabase PostgreSQL.\n" +
                    "Please provide Supabase credentials via environment variables or a .env file:\n" +
                    "  DATABASE_URL=jdbc:postgresql://<SUPABASE_HOST>:5432/postgres?sslmode=require\n" +
                    "  DATABASE_USERNAME=postgres.<PROJECT_REF>\n" +
                    "  DATABASE_PASSWORD=<YOUR_PASSWORD>\n" +
                    "================================================================================\n";
            log.error(errorMsg);
            throw new IllegalStateException(errorMsg);
        }

        String trimmed = url.trim();

        // 1. Check and forbid localhost:5432 fallback
        if (trimmed.contains("localhost:5432") || trimmed.contains("127.0.0.1:5432")) {
            String errorMsg = "\n" +
                    "================================================================================\n" +
                    "DATABASE CONFIGURATION ERROR\n" +
                    "================================================================================\n" +
                    "CattleFeedAI is configured for Supabase PostgreSQL.\n" +
                    "Connecting to localhost:5432 is strictly prohibited!\n\n" +
                    "Please set the following environment variables to your Supabase credentials:\n" +
                    "  DATABASE_URL=jdbc:postgresql://<SUPABASE_HOST>:5432/postgres?sslmode=require\n" +
                    "  DATABASE_USERNAME=postgres.<PROJECT_REF>\n" +
                    "  DATABASE_PASSWORD=<YOUR_PASSWORD>\n" +
                    "================================================================================\n";
            log.error(errorMsg);
            throw new IllegalStateException(errorMsg);
        }

        // 2. Handle standard URI format: postgresql://[user:pass@]host[:port]/dbname[?params]
        // or postgres://[user:pass@]host[:port]/dbname[?params]
        if (trimmed.startsWith("postgres://") || trimmed.startsWith("postgresql://")) {
            try {
                URI uri = URI.create(trimmed);
                String userInfo = uri.getUserInfo();
                if (userInfo != null && (props.getUsername() == null || props.getUsername().isBlank())) {
                    String[] creds = userInfo.split(":", 2);
                    props.setUsername(creds[0]);
                    if (creds.length > 1 && (props.getPassword() == null || props.getPassword().isBlank())) {
                        props.setPassword(creds[1]);
                    }
                }

                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String path = uri.getPath() != null && !uri.getPath().isBlank() ? uri.getPath() : "/postgres";
                String query = uri.getQuery();

                StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://")
                        .append(host)
                        .append(":")
                        .append(port)
                        .append(path);

                if (query != null && !query.isBlank()) {
                    jdbcUrl.append("?").append(query);
                }
                props.setUrl(jdbcUrl.toString());
                log.info("Normalized DATABASE_URL to JDBC format: jdbc:postgresql://{}:{}{}", host, port, path);
                return;
            } catch (Exception e) {
                log.warn("Failed to parse DATABASE_URL as URI, using prefix replacement fallback: {}", e.getMessage());
                if (trimmed.startsWith("postgres://")) {
                    props.setUrl("jdbc:postgresql://" + trimmed.substring("postgres://".length()));
                } else {
                    props.setUrl("jdbc:postgresql://" + trimmed.substring("postgresql://".length()));
                }
                log.info("Normalized DATABASE_URL using prefix replacement.");
                return;
            }
        }

        // 3. If already jdbc:postgresql://, check if credentials need extraction from authority if accidentally included
        if (trimmed.startsWith("jdbc:postgresql://")) {
            String sub = trimmed.substring("jdbc:postgresql://".length());
            if (sub.contains("@")) {
                int atIdx = sub.indexOf("@");
                String userInfo = sub.substring(0, atIdx);
                String remaining = sub.substring(atIdx + 1);
                if (props.getUsername() == null || props.getUsername().isBlank()) {
                    String[] creds = userInfo.split(":", 2);
                    props.setUsername(creds[0]);
                    if (creds.length > 1 && (props.getPassword() == null || props.getPassword().isBlank())) {
                        props.setPassword(creds[1]);
                    }
                }
                props.setUrl("jdbc:postgresql://" + remaining);
                log.info("Cleaned credentials from jdbc:postgresql URL authority.");
            }
            log.info("CattleFeedAI configured with Supabase PostgreSQL datasource: {}", props.getUrl());
        }
    }

    private void loadFromDotenvIfPresent(DataSourceProperties props) {
        Path[] candidatePaths = new Path[]{
                Paths.get(".env"),
                Paths.get("../.env"),
                Paths.get("../../.env")
        };

        for (Path path : candidatePaths) {
            if (Files.isRegularFile(path)) {
                try {
                    List<String> lines = Files.readAllLines(path, StandardCharsets.UTF_8);
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
                            if ("DATABASE_URL".equals(key) && (props.getUrl() == null || props.getUrl().isBlank())) {
                                props.setUrl(val);
                                System.setProperty("DATABASE_URL", val);
                                System.setProperty("spring.datasource.url", val);
                            } else if ("DATABASE_USERNAME".equals(key) && (props.getUsername() == null || props.getUsername().isBlank())) {
                                props.setUsername(val);
                                System.setProperty("DATABASE_USERNAME", val);
                                System.setProperty("spring.datasource.username", val);
                            } else if ("DATABASE_PASSWORD".equals(key) && (props.getPassword() == null || props.getPassword().isBlank())) {
                                props.setPassword(val);
                                System.setProperty("DATABASE_PASSWORD", val);
                                System.setProperty("spring.datasource.password", val);
                            }
                        }
                    }
                    log.info("Loaded database configuration from: {}", path.toAbsolutePath());
                    break;
                } catch (Exception e) {
                    log.warn("Could not read .env at {}: {}", path, e.getMessage());
                }
            }
        }
    }
}
