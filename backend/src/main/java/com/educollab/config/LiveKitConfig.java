package com.educollab.config;

import io.livekit.server.RoomServiceClient;
import io.livekit.server.WebhookReceiver;
import lombok.RequiredArgsConstructor;
// import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
// @EnableConfigurationProperties(LiveKitProperties.class)
@RequiredArgsConstructor
public class LiveKitConfig {

    private final LiveKitProperties props;

    // Server-to-server client used to create/delete rooms, list/kick/mute participants
    @Bean
    public RoomServiceClient roomServiceClient() {
        return RoomServiceClient.createClient(props.getServerUrl(), props.getApiKey(), props.getApiSecret());
    }

    // Validates + decodes signed webhook payloads LiveKit POSTs to /api/livekit/webhook
    @Bean
    public WebhookReceiver webhookReceiver() {
        return new WebhookReceiver(props.getApiKey(), props.getApiSecret());
    }
}
