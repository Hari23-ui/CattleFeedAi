package com.cattlefeedai.api.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI 3 / Swagger configuration for CattleFeedAI REST API.
 * Configures API documentation, metadata, and JWT Bearer security scheme.
 */
@Configuration
public class OpenApiConfig {

    public static final String SECURITY_SCHEME_NAME = "BearerAuth";

    @Bean
    public OpenAPI cattleFeedOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("CattleFeedAI — REST API")
                        .description("Digital Cattle Feed & Silage Quality Assessment and Advisory System API.\n\n"
                                + "### Core Capabilities:\n"
                                + "- **Authentication**: JWT authentication with BCrypt hashing and role-based access.\n"
                                + "- **Farm & Animal Management**: Livestock profiles, lactation stages, and herd tracking.\n"
                                + "- **Feed & Silage Testing**: Physical, chemical, and sensory test records & historical tracking.\n"
                                + "- **Quality Assessment**: Parameter evaluation (moisture, protein, fiber, aflatoxin, pH, mould, spoilage).\n"
                                + "- **Risk Assessment**: Non-diagnostic risk indicator categorization (contamination, nutrition, storage).\n"
                                + "- **Advisory Engine**: Actionable mitigation guidance and read/unread status management.\n"
                                + "- **Animal Health Risk Screening**: Multi-factor correlation between feed quality, milk yield, and health observations.\n"
                                + "- **Visual Screening**: External webcam / Computer Vision payload ingestion.\n\n"
                                + "### Authorization:\n"
                                + "1. Call `POST /api/auth/login` or `POST /api/auth/register` to obtain a JWT token.\n"
                                + "2. Click **Authorize** (top right) and enter your JWT token.\n"
                                + "3. Subsequent requests will include the `Authorization: Bearer <token>` header automatically.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("CattleFeedAI Engineering Team")
                                .email("support@cattlefeedai.com")
                                .url("https://github.com/CattleFeedAI"))
                        .license(new License()
                                .name("Proprietary / Smart India Hackathon")
                                .url("https://cattlefeedai.com")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local Development Server")
                ))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                                .name(SECURITY_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Enter JWT Bearer token obtained from POST /api/auth/login")));
    }
}
