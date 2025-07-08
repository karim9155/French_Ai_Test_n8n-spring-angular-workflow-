// src/main/java/com/example/demo/config/WebConfig.java
package com.example.french_voice_ai;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // This will allow CORS for all controllers and all paths (/**),
        // but only from http://localhost:4200
        registry
                .addMapping("/**")
                .allowedOrigins("http://localhost:4200","https://172.23.112.1:4200")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}

