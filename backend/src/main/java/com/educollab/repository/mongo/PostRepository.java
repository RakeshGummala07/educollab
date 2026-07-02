package com.educollab.repository.mongo;

import com.educollab.document.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostRepository extends MongoRepository<Post, String> {

    // Feed: all published, non-deleted posts — newest first
    Page<Post> findByPublishedTrueAndDeletedFalseOrderByCreatedAtDesc(Pageable pageable);

    // Posts by a specific author
    Page<Post> findByAuthorIdAndPublishedTrueAndDeletedFalseOrderByCreatedAtDesc(
            Long authorId, Pageable pageable);

    // Find single published post
    Optional<Post> findByIdAndDeletedFalse(String id);

    // Count posts by author
    long countByAuthorIdAndDeletedFalse(Long authorId);

    // Teacher's posts only
    Page<Post> findByAuthorRoleAndPublishedTrueAndDeletedFalseOrderByCreatedAtDesc(
            String authorRole, Pageable pageable);

    // Search posts by content
    @Query("{ 'content': { $regex: ?0, $options: 'i' }, 'deleted': false, 'published': true }")
    List<Post> searchByContent(String keyword);
}
