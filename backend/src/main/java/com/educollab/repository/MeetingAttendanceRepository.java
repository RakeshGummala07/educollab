package com.educollab.repository;

import com.educollab.entity.Meeting;
import com.educollab.entity.MeetingAttendance;
import com.educollab.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MeetingAttendanceRepository extends JpaRepository<MeetingAttendance, Long> {

    @Query("""
        SELECT a FROM MeetingAttendance a
        JOIN FETCH a.user
        WHERE a.meeting = :meeting AND a.user = :user
    """)
    Optional<MeetingAttendance> findByMeetingAndUser(Meeting meeting, User user);

    @Query("""
        SELECT a FROM MeetingAttendance a
        JOIN FETCH a.user
        WHERE a.meeting = :meeting
        ORDER BY a.role ASC, a.user.firstName ASC
    """)
    List<MeetingAttendance> findByMeeting(Meeting meeting);

    List<MeetingAttendance> findByMeetingAndCurrentlyPresentTrue(Meeting meeting);

    long countByMeetingAndStatus(Meeting meeting, MeetingAttendance.AttendanceStatus status);

    void deleteByMeeting(Meeting meeting);
}
