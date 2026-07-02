package com.educollab.repository;

import com.educollab.entity.Enrollment;
import com.educollab.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    @Query("""
        SELECT COUNT(e) > 0
        FROM Enrollment e
        WHERE e.teacher = :teacher
          AND e.student = :student
          AND e.status = 'ACTIVE'
    """)
    boolean isStudentEnrolledUnderTeacher(User teacher, User student);

    @Query("""
        SELECT e
        FROM Enrollment e
        JOIN FETCH e.teacher
        JOIN FETCH e.student
        WHERE e.teacher = :teacher
          AND e.student = :student
    """)
    Optional<Enrollment> findByTeacherAndStudent(User teacher, User student);

    @Query("""
        SELECT e.student
        FROM Enrollment e
        WHERE e.teacher = :teacher
          AND e.status = 'ACTIVE'
    """)
    List<User> findStudentsByTeacher(User teacher);

    @Query("""
        SELECT e.teacher
        FROM Enrollment e
        WHERE e.student = :student
          AND e.status = 'ACTIVE'
    """)
    List<User> findTeachersByStudent(User student);

    @Query("""
        SELECT e
        FROM Enrollment e
        JOIN FETCH e.teacher
        JOIN FETCH e.student
        WHERE e.teacher = :teacher
          AND e.status = 'PENDING'
    """)
    List<Enrollment> findPendingRequestsByTeacher(User teacher);

    @Query("""
        SELECT e
        FROM Enrollment e
        JOIN FETCH e.teacher
        JOIN FETCH e.student
        WHERE e.student = :student
    """)
    List<Enrollment> findAllByStudent(User student);

    @Query("""
        SELECT COUNT(e)
        FROM Enrollment e
        WHERE e.teacher = :teacher
          AND e.status = 'ACTIVE'
    """)
    long countStudentsByTeacher(User teacher);
}