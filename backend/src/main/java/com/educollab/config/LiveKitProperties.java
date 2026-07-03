package com.educollab.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.livekit")
@Data
public class LiveKitProperties {
    private String apiKey;
    private String apiSecret;
    private String serverUrl;   // http(s):// — used by RoomServiceClient (server-to-server)
    private String wsUrl;       // ws(s):// — handed to the browser client to connect
    private boolean webhookVerify = true;
}
