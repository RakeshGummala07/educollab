package com.educollab.service;

import com.educollab.config.LiveKitProperties;
import io.livekit.server.AccessToken;
import io.livekit.server.RoomJoin;
import io.livekit.server.RoomName;
import io.livekit.server.RoomServiceClient;
import livekit.LivekitModels;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import retrofit2.Response;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Optional;

/**
 * Thin wrapper around the LiveKit Server SDK (io.livekit:livekit-server).
 *
 * NOTE FOR DEV: method names on RoomServiceClient below (removeParticipant,
 * mutePublishedTrack, listParticipants, deleteRoom) mirror LiveKit's other
 * official SDKs (Node/Go/.NET/Ruby) 1:1. If your installed SDK version
 * differs slightly, this is the ONLY file you need to adjust — every other
 * layer talks to LiveKitService, never to the SDK directly.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LiveKitService {

    private final LiveKitProperties liveKitProperties;
    private final RoomServiceClient roomServiceClient;

    // ── Token generation ─────────────────────────────────────────────────
    public String generateToken(String roomName, Long userId, String displayName, boolean canPublish) {
        AccessToken token = new AccessToken(liveKitProperties.getApiKey(), liveKitProperties.getApiSecret());
        token.setIdentity(String.valueOf(userId));
        token.setName(displayName);
        token.addGrants(new RoomJoin(true), new RoomName(roomName));
        token.setTtl(Duration.ofHours(6).toMillis());
        return token.toJwt();
    }

    public String getWsUrl() {
        return liveKitProperties.getWsUrl();
    }

    // ── Room lifecycle ────────────────────────────────────────────────────
    public void endRoom(String roomName) {
        try {
            roomServiceClient.deleteRoom(roomName).execute();
        } catch (IOException e) {
            log.warn("LiveKit: failed to delete room '{}': {}", roomName, e.getMessage());
        }
    }

    // ── Moderation ───────────────────────────────────────────────────────
    public void kickParticipant(String roomName, Long userId) {
        try {
            roomServiceClient.removeParticipant(roomName, String.valueOf(userId)).execute();
        } catch (IOException e) {
            log.error("LiveKit: failed to kick user {} from '{}': {}", userId, roomName, e.getMessage());
        }
    }

    public List<LivekitModels.ParticipantInfo> listParticipants(String roomName) {
    try {
        Response<List<LivekitModels.ParticipantInfo>> response =
                roomServiceClient.listParticipants(roomName).execute();
        if (response.isSuccessful() && response.body() != null) {
            return response.body();
        }
    } catch (IOException e) {
        log.warn("LiveKit: failed to list participants for '{}': {}", roomName, e.getMessage());
    }
    return List.of();
}

    // Mutes/unmutes every published track of the given kind (audio or video,
    // which also covers screen-share since that publishes as a video track)
    public void setTrackMuted(String roomName, Long userId, boolean isAudio, boolean muted) {
        Optional<LivekitModels.ParticipantInfo> participant = listParticipants(roomName).stream()
                .filter(p -> p.getIdentity().equals(String.valueOf(userId)))
                .findFirst();

        if (participant.isEmpty()) {
            log.debug("LiveKit: user {} not currently connected to '{}' — skipping track mute", userId, roomName);
            return;
        }

        participant.get().getTracksList().stream()
                .filter(t -> isAudio
                        ? t.getType() == LivekitModels.TrackType.AUDIO
                        : t.getType() == LivekitModels.TrackType.VIDEO)
                .forEach(t -> {
                    try {
                        roomServiceClient.mutePublishedTrack(
                                roomName, String.valueOf(userId), t.getSid(), muted).execute();
                    } catch (IOException e) {
                        log.error("LiveKit: failed to {} track {} for user {}: {}",
                                muted ? "mute" : "unmute", t.getSid(), userId, e.getMessage());
                    }
                });
    }

    public void muteAllExcept(String roomName, Long excludeUserId) {
        for (LivekitModels.ParticipantInfo p : listParticipants(roomName)) {
            if (p.getIdentity().equals(String.valueOf(excludeUserId))) continue;
            for (LivekitModels.TrackInfo t : p.getTracksList()) {
                if (t.getType() != LivekitModels.TrackType.AUDIO) continue;
                try {
                    roomServiceClient.mutePublishedTrack(roomName, p.getIdentity(), t.getSid(), true).execute();
                } catch (IOException e) {
                    log.error("LiveKit: mute-all failed for {}: {}", p.getIdentity(), e.getMessage());
                }
            }
        }
    }
}
