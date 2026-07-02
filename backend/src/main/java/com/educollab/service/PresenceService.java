package com.educollab.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PresenceService {

    private final StringRedisTemplate redisTemplate;

    private static final String ONLINE_KEY_PREFIX = "online:";
    private static final Duration ONLINE_TTL = Duration.ofSeconds(40);

    // Mark user online (called on WebSocket connect + heartbeat)
    public void markOnline(Long userId) {
        redisTemplate.opsForValue().set(
                ONLINE_KEY_PREFIX + userId, "1", ONLINE_TTL);
    }

    // Mark user offline (called on WebSocket disconnect)
    public void markOffline(Long userId) {
        redisTemplate.delete(ONLINE_KEY_PREFIX + userId);
    }

    // Check if a single user is online
    public boolean isOnline(Long userId) {
        return Boolean.TRUE.equals(
                redisTemplate.hasKey(ONLINE_KEY_PREFIX + userId));
    }

    // Check online status for multiple users at once
    public Set<Long> getOnlineUserIds(Set<Long> userIds) {
        return userIds.stream()
                .filter(this::isOnline)
                .collect(Collectors.toSet());
    }
}

