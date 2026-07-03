package com.educollab.repository;

import com.educollab.entity.Meeting;
import com.educollab.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MeetingRepository extends JpaRepository<Meeting, Long> {

    Optional<Meeting> findByRoomName(String roomName);

    @Query("""
        SELECT m FROM Meeting m
        JOIN FETCH m.teacher
        WHERE m.teacher = :teacher
        ORDER BY m.scheduledStart DESC
    """)
    List<Meeting> findByTeacher(User teacher);

    // Meetings visible to a student = meetings hosted by any teacher the
    // student is actively enrolled with
    @Query("""
        SELECT m FROM Meeting m
        JOIN FETCH m.teacher
        WHERE m.teacher.id IN (
            SELECT e.teacher.id FROM Enrollment e
            WHERE e.student = :student AND e.status = 'ACTIVE'
        )
        ORDER BY m.scheduledStart DESC
    """)
    List<Meeting> findVisibleToStudent(User student);

    List<Meeting> findByStatus(Meeting.MeetingStatus status);

    // Used by the auto-end scheduler: LIVE meetings well past their
    // scheduled end time (grace period applied in the service layer)
    @Query("SELECT m FROM Meeting m WHERE m.status = 'LIVE' AND m.scheduledEnd < :cutoff")
    List<Meeting> findStaleLiveMeetings(LocalDateTime cutoff);
}
