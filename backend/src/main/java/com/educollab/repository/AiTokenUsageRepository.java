package com.educollab.repository;

import com.educollab.entity.AiTokenUsage;
import com.educollab.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.Optional;

@Repository
public interface AiTokenUsageRepository extends JpaRepository<AiTokenUsage, Long> {

    Optional<AiTokenUsage> findByUser(User user);

    // Pessimistic lock: token-usage read-check-then-increment must be
    // serialized per user, or two concurrent AI requests from the same user
    // could both read "under limit" before either writes back their usage.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM AiTokenUsage u WHERE u.user = :user")
    Optional<AiTokenUsage> findByUserForUpdate(User user);
}
