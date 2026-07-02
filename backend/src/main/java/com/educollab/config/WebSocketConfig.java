package com.educollab.config;

import com.educollab.websocket.JwtHandshakeInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtHandshakeInterceptor jwtHandshakeInterceptor;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Messages to these prefixes are routed to the broker (broadcast to subscribers)
        registry.enableSimpleBroker("/topic", "/queue");

        // Messages from client with this prefix are routed to @MessageMapping methods
        registry.setApplicationDestinationPrefixes("/app");

        // Prefix for user-specific destinations (private messages)
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint clients connect to: ws://localhost:8080/api/ws
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns(allowedOrigins)
            .addInterceptors(jwtHandshakeInterceptor)
            .withSockJS();
    }
}
