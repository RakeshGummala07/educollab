package com.educollab.gateway.filter;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuthenticationFilter implements GlobalFilter, Ordered {

    private final RouteValidator routeValidator;
    private final JwtValidationUtil jwtValidationUtil;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        if (!routeValidator.isSecured.test(request)) {
            // Public endpoint (login/register/health) — no token required
            return chain.filter(exchange);
        }

        if (!request.getHeaders().containsKey("Authorization")) {
            return reject(exchange, "Missing Authorization header");
        }

        String authHeader = request.getHeaders().getFirst("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return reject(exchange, "Malformed Authorization header");
        }

        String token = authHeader.substring(7);

        try {
            jwtValidationUtil.validateToken(token);

            // Forward the resolved identity downstream as a trusted header —
            // services behind the gateway can read X-User-Email instead of
            // re-parsing the JWT themselves, though they still validate the
            // token independently too (defense in depth, not a replacement).
            String username = jwtValidationUtil.extractUsername(token);
            ServerHttpRequest mutatedRequest = request.mutate()
                    .header("X-User-Email", username)
                    .build();

            return chain.filter(exchange.mutate().request(mutatedRequest).build());
        } catch (Exception e) {
            log.warn("Gateway JWT validation failed: {}", e.getMessage());
            return reject(exchange, "Invalid or expired token");
        }
    }

    private Mono<Void> reject(ServerWebExchange exchange, String reason) {
        log.warn("Rejected request to {}: {}", exchange.getRequest().getURI().getPath(), reason);
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }

    @Override
    public int getOrder() {
        return -1; // run before routing
    }
}