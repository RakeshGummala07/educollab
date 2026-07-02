package com.educollab.websocket;

import com.educollab.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtUtils jwtUtils;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                    WebSocketHandler wsHandler, Map<String, Object> attributes) {

        if (request instanceof ServletServerHttpRequest servletRequest) {
            String token = servletRequest.getServletRequest().getParameter("token");

            if (token != null && !token.isBlank()) {
                try {
                    String email = jwtUtils.extractUsername(token);
                    if (email != null) {
                        // Store email in WebSocket session attributes for later use
                        attributes.put("email", email);
                        return true;
                    }
                } catch (Exception e) {
                    log.error("WebSocket handshake JWT validation failed: {}", e.getMessage());
                }
            }
        }

        log.warn("WebSocket handshake rejected: missing or invalid token");
        return false;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                WebSocketHandler wsHandler, Exception exception) {
    }
}
