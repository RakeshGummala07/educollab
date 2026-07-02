package com.educollab.service;

import com.educollab.entity.RefreshToken;
import com.educollab.entity.User;
import com.educollab.exception.TokenRefreshException;
import com.educollab.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    @Value("${app.jwt.refresh-expiration}")
    private Long refreshTokenDurationMs;

    private final RefreshTokenRepository refreshTokenRepository;

    @Transactional
    public RefreshToken createRefreshToken(User user) {
        // Revoke all existing tokens for this user (single-session security)
        refreshTokenRepository.revokeAllByUser(user);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiryDate(Instant.now().plusMillis(refreshTokenDurationMs))
                .revoked(false)
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional(readOnly = true)
    public RefreshToken verifyExpiration(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new TokenRefreshException(token, "Refresh token not found"));

        if (refreshToken.getRevoked()) {
            throw new TokenRefreshException(token, "Refresh token was revoked");
        }

        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new TokenRefreshException(token, "Refresh token has expired. Please log in again.");
        }

        return refreshToken;
    }

    @Transactional
    public void revokeTokensByUser(User user) {
        refreshTokenRepository.revokeAllByUser(user);
    }
}
