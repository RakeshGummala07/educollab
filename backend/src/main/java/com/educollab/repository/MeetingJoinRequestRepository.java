package com.educollab.repository;

import com.educollab.entity.Meeting;
import com.educollab.entity.MeetingJoinRequest;
import com.educollab.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MeetingJoinRequestRepository extends JpaRepository<MeetingJoinRequest, Long> {

    Optional<MeetingJoinRequest> findByMeetingAndUser(Meeting meeting, User user);

    @Query("""
        SELECT r FROM MeetingJoinRequest r
        JOIN FETCH r.user
        WHERE r.meeting = :meeting AND r.status = 'PENDING'
        ORDER BY r.createdAt ASC
    """)
    List<MeetingJoinRequest> findPendingByMeeting(Meeting meeting);

    void deleteByMeeting(Meeting meeting);
}
