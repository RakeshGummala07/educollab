package com.educollab.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.messaging.simp.config.ChannelRegistration;

import java.security.Principal;
import java.util.Map;

@Slf4j
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class StompChannelInterceptor implements WebSocketMessageBrokerConfigurer {

    private final UserDetailsService userDetailsService;

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor =
                        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    // Pull email from handshake attributes (set by JwtHandshakeInterceptor)
                    Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
                    if (sessionAttributes != null) {
                        String email = (String) sessionAttributes.get("email");
                        if (email != null) {
                            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                            Principal principal = new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities());
                            accessor.setUser(principal);
                            log.debug("WebSocket CONNECT authenticated: {}", email);
                        }
                    }
                }
                return message;
            }
        });
    }
}
