package com.educollab.service;

import com.educollab.document.AiChatMessage;
import com.educollab.document.AiConversation;
import com.educollab.dto.request.SendAiChatRequest;
import com.educollab.dto.response.AiChatMessageResponse;
import com.educollab.dto.response.AiConversationResponse;
import com.educollab.entity.User;
import com.educollab.exception.BadRequestException;
import com.educollab.exception.ResourceNotFoundException;
import com.educollab.repository.UserRepository;
import com.educollab.repository.mongo.AiChatMessageRepository;
import com.educollab.repository.mongo.AiConversationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * NOTE FOR DEV: ChatClient/ChatResponse/SearchRequest APIs mirror the
 * current stable Spring AI (1.0.x) reference docs. If your installed
 * version differs slightly, this is the file to adjust — MeetingService-
 * style, every controller talks through this service, never the SDK
 * directly.
 */
@Slf4j
@Service
public class AiChatService {

    private static final String SYSTEM_PROMPT = """
            You are EduCollab's AI Study Assistant, helping students and
            teachers on an education platform. Be clear, encouraging, and
            concise. When context from the user's uploaded documents is
            provided below, ground your answer in it and say so; if the
            context doesn't cover the question, say that plainly rather
            than guessing.
            """;

    private final ChatClient chatClient;
    private final VectorStore vectorStore;
    private final AiConversationRepository conversationRepository;
    private final AiChatMessageRepository messageRepository;
    private final TokenQuotaService tokenQuotaService;
    private final UserRepository userRepository;

    // Explicit constructor (not @RequiredArgsConstructor) so @Lazy on
    // vectorStore is guaranteed honored — Qdrant's VectorStore bean pings
    // the embeddings API at construction to detect vector dimensions, so
    // without @Lazy here, a bad AI key or unreachable Qdrant would crash
    // the ENTIRE application at startup instead of only failing when an
    // AI feature is actually used.
    public AiChatService(ChatClient chatClient,
                          @Lazy VectorStore vectorStore,
                          AiConversationRepository conversationRepository,
                          AiChatMessageRepository messageRepository,
                          TokenQuotaService tokenQuotaService,
                          UserRepository userRepository) {
        this.chatClient = chatClient;
        this.vectorStore = vectorStore;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.tokenQuotaService = tokenQuotaService;
        this.userRepository = userRepository;
    }

    @Transactional
    public AiChatMessageResponse sendMessage(String userEmail, SendAiChatRequest req) {
        User user = findUser(userEmail);
        // Throws TokenQuotaExceededException (-> 429) before we spend anything
        tokenQuotaService.checkQuotaOrThrow(user);

        AiConversation conversation = resolveConversation(user, req.getConversationId(), req.getMessage());

        messageRepository.save(AiChatMessage.builder()
                .conversationId(conversation.getId())
                .userId(user.getId())
                .role(AiChatMessage.Role.USER)
                .content(req.getMessage())
                .createdAt(LocalDateTime.now())
                .build());

        RetrievedContext context = req.isUseDocumentContext()
                ? retrieveContext(user.getId(), req.getMessage())
                : RetrievedContext.EMPTY;

        String systemPrompt = context.text().isBlank()
                ? SYSTEM_PROMPT
                : SYSTEM_PROMPT + "\n\nRelevant context from the user's uploaded documents:\n" + context.text();

        ChatResponse response = chatClient.prompt()
                .system(systemPrompt)
                .user(req.getMessage())
                .call()
                .chatResponse();

        String answer = response.getResult().getOutput().getText();
        int tokensUsed = response.getMetadata().getUsage() != null
                ? response.getMetadata().getUsage().getTotalTokens()
                : 0;

        tokenQuotaService.recordUsage(user, tokensUsed);

        AiChatMessage assistantMessage = messageRepository.save(AiChatMessage.builder()
                .conversationId(conversation.getId())
                .userId(user.getId())
                .role(AiChatMessage.Role.ASSISTANT)
                .content(answer)
                .sourceDocumentIds(context.documentIds())
                .tokensUsed(tokensUsed)
                .createdAt(LocalDateTime.now())
                .build());

        conversation.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        return AiChatMessageResponse.from(assistantMessage);
    }

    private AiConversation resolveConversation(User user, String conversationId, String firstMessage) {
        if (conversationId != null && !conversationId.isBlank()) {
            AiConversation conversation = conversationRepository.findById(conversationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
            if (!conversation.getUserId().equals(user.getId()))
                throw new BadRequestException("You don't have access to this conversation");
            return conversation;
        }

        String title = firstMessage.length() > 60 ? firstMessage.substring(0, 60) + "..." : firstMessage;
        AiConversation conversation = AiConversation.builder()
                .userId(user.getId())
                .title(title)
                .createdAt(LocalDateTime.now())
                .lastMessageAt(LocalDateTime.now())
                .build();
        return conversationRepository.save(conversation);
    }

    private RetrievedContext retrieveContext(Long userId, String query) {
        try {
            List<Document> results = vectorStore.similaritySearch(
                    SearchRequest.builder()
                            .query(query)
                            .topK(4)
                            .filterExpression("userId == '" + userId + "'")
                            .build());

            if (results.isEmpty()) return RetrievedContext.EMPTY;

            String text = results.stream()
                    .map(Document::getText)
                    .collect(Collectors.joining("\n---\n"));

            List<String> documentIds = results.stream()
                    .map(d -> String.valueOf(d.getMetadata().get("studyDocumentId")))
                    .distinct()
                    .collect(Collectors.toList());

            return new RetrievedContext(text, documentIds);
        } catch (Exception e) {
            // RAG is an enhancement, not a hard dependency — a Qdrant hiccup
            // shouldn't break plain chat.
            log.warn("Vector search failed, continuing without document context: {}", e.getMessage());
            return RetrievedContext.EMPTY;
        }
    }

    public List<AiConversationResponse> listConversations(String userEmail) {
        User user = findUser(userEmail);
        return conversationRepository.findByUserIdOrderByLastMessageAtDesc(user.getId()).stream()
                .map(AiConversationResponse::from)
                .collect(Collectors.toList());
    }

    public com.educollab.dto.response.AiUsageResponse getUsage(String userEmail) {
        return tokenQuotaService.getUsage(findUser(userEmail));
    }

    public List<AiChatMessageResponse> getMessages(String userEmail, String conversationId) {
        User user = findUser(userEmail);
        AiConversation conversation = requireOwnConversation(user, conversationId);
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId()).stream()
                .map(AiChatMessageResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteConversation(String userEmail, String conversationId) {
        User user = findUser(userEmail);
        AiConversation conversation = requireOwnConversation(user, conversationId);
        messageRepository.deleteByConversationId(conversation.getId());
        conversationRepository.delete(conversation);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private AiConversation requireOwnConversation(User user, String conversationId) {
        AiConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        if (!conversation.getUserId().equals(user.getId()))
            throw new BadRequestException("You don't have access to this conversation");
        return conversation;
    }

    private record RetrievedContext(String text, List<String> documentIds) {
        static final RetrievedContext EMPTY = new RetrievedContext("", List.of());
    }
}