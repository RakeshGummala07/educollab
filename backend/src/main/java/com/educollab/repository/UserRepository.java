package com.educollab.repository;

import com.educollab.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    Boolean existsByEmail(String email);

    Boolean existsByUsername(String username);

    List<User> findByRole(User.Role role);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role")
    Long countByRole(User.Role role);

    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.lastName)  LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.email)     LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.username)  LIKE LOWER(CONCAT('%', :query, '%'))")
    List<User> searchUsers(String query);
}
