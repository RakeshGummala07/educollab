package com.educollab.repository.mongo;

import com.educollab.document.MeetingChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MeetingChatRepository extends MongoRepository<MeetingChatMessage, String> {

    // Public thread only — used for the default group chat view
    List<MeetingChatMessage> findByMeetingIdAndRecipientIdIsNullOrderByCreatedAtAsc(Long meetingId);

    // Everything a given user is allowed to see: all public messages, plus
    // any private DM where they were either the sender or the recipient
    @Query("{ 'meetingId': ?0, $or: [ { 'recipientId': null }, { 'senderId': ?1 }, { 'recipientId': ?1 } ] }")
    List<MeetingChatMessage> findVisibleToUser(Long meetingId, Long userId);

    void deleteByMeetingId(Long meetingId);
}
