package com.educollab.repository;

import com.educollab.entity.AuditLog;
import com.educollab.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("SELECT a FROM AuditLog a JOIN FETCH a.actor WHERE a.actor = :actor ORDER BY a.createdAt DESC")
    Page<AuditLog> findByActor(User actor, Pageable pageable);
}
