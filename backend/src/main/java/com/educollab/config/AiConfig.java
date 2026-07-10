package com.educollab.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;


@Configuration
public class AiConfig {

    // ChatClient.Builder is auto-configured by spring-ai-starter-model-openai
    // (backed by OpenAiChatModel, itself built from the spring.ai.openai.*
    // properties in application.yml). We just wrap it once here so every
    // service injects a ready-to-use ChatClient instead of re-building it.
    @Lazy
    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        return builder.build();
    }
}
