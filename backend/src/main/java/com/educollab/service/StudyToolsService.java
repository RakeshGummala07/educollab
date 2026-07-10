package com.educollab.service;

import com.educollab.document.StudyDocument;
import com.educollab.dto.request.GenerateAssignmentRequest;
import com.educollab.dto.request.GenerateQuizRequest;
import com.educollab.dto.request.SummarizeRequest;
import com.educollab.dto.response.AssignmentResponse;
import com.educollab.dto.response.QuizResponse;
import com.educollab.dto.response.SummaryResponse;
import com.educollab.entity.User;
import com.educollab.exception.BadRequestException;
import com.educollab.exception.ResourceNotFoundException;
import com.educollab.repository.UserRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * NOTE FOR DEV: ChatClient/BeanOutputConverter/SearchRequest APIs mirror
 * the current stable Spring AI (1.0.x) reference docs. If your installed
 * version differs slightly, this is a file to check first — same caveat
 * as AiChatService.
 */
@Service
public class StudyToolsService {

    private final ChatClient chatClient;
    private final VectorStore vectorStore;
    private final TokenQuotaService tokenQuotaService;
    private final DocumentIngestionService documentIngestionService;
    private final UserRepository userRepository;

    // Explicit constructor (not @RequiredArgsConstructor) so @Lazy on
    // vectorStore is guaranteed honored — see AiChatService for why.
    public StudyToolsService(ChatClient chatClient,
                              @Lazy VectorStore vectorStore,
                              TokenQuotaService tokenQuotaService,
                              DocumentIngestionService documentIngestionService,
                              UserRepository userRepository) {
        this.chatClient = chatClient;
        this.vectorStore = vectorStore;
        this.tokenQuotaService = tokenQuotaService;
        this.documentIngestionService = documentIngestionService;
        this.userRepository = userRepository;
    }

    public QuizResponse generateQuiz(String userEmail, GenerateQuizRequest req) {
        User user = findUser(userEmail);
        tokenQuotaService.checkQuotaOrThrow(user);

        String docContext = req.getDocumentId() != null
                ? retrieveFullDocumentContext(user, req.getDocumentId(), req.getTopic())
                : "";

        BeanOutputConverter<QuizResponse> converter = new BeanOutputConverter<>(QuizResponse.class);

        String prompt = """
                Create a %d-question multiple-choice quiz at %s difficulty about: %s

                %s

                Each question must have exactly 4 options, one correct answer
                (correctOptionIndex, 0-based), and a short explanation of why
                that answer is correct.

                %s
                """.formatted(
                req.getNumQuestions(), req.getDifficulty(), req.getTopic(),
                docContext.isBlank() ? "" : "Base the quiz on this source material:\n" + docContext,
                converter.getFormat());

        ChatResponse response = chatClient.prompt(prompt).call().chatResponse();
        recordUsage(user, response);

        QuizResponse quiz = converter.convert(response.getResult().getOutput().getText());
        if (quiz != null) quiz.setTopic(req.getTopic());
        return quiz;
    }

    public AssignmentResponse generateAssignment(String userEmail, GenerateAssignmentRequest req) {
        User user = findUser(userEmail);
        tokenQuotaService.checkQuotaOrThrow(user);

        String docContext = req.getDocumentId() != null
                ? retrieveFullDocumentContext(user, req.getDocumentId(), req.getTopic())
                : "";

        BeanOutputConverter<AssignmentResponse> converter = new BeanOutputConverter<>(AssignmentResponse.class);

        String prompt = """
                Create a student assignment with %d tasks about: %s

                %s

                Include a short overview, a clear list of tasks (each with
                brief details on what's expected), and a realistic estimated
                duration to complete the whole assignment.

                %s
                """.formatted(
                req.getNumTasks(), req.getTopic(),
                docContext.isBlank() ? "" : "Base the assignment on this source material:\n" + docContext,
                converter.getFormat());

        ChatResponse response = chatClient.prompt(prompt).call().chatResponse();
        recordUsage(user, response);

        return converter.convert(response.getResult().getOutput().getText());
    }

    public SummaryResponse summarize(String userEmail, SummarizeRequest req) {
        User user = findUser(userEmail);
        tokenQuotaService.checkQuotaOrThrow(user);

        String sourceText;
        if (req.getDocumentId() != null) {
            sourceText = retrieveFullDocumentContext(user, req.getDocumentId(), null);
        } else if (req.getRawText() != null && !req.getRawText().isBlank()) {
            sourceText = req.getRawText();
        } else {
            throw new BadRequestException("Either rawText or documentId is required");
        }

        BeanOutputConverter<SummaryResponse> converter = new BeanOutputConverter<>(SummaryResponse.class);

        String prompt = """
                Summarize the following study material for a student.
                Provide a concise paragraph summary plus a list of the most
                important key points.

                %s

                %s
                """.formatted(sourceText, converter.getFormat());

        ChatResponse response = chatClient.prompt(prompt).call().chatResponse();
        recordUsage(user, response);

        return converter.convert(response.getResult().getOutput().getText());
    }

    // ── Helpers ─────────────────────────────────────────────────────────

    // Pulls a broader slice of a specific document's chunks (not the tight
    // top-K used for conversational RAG) since quiz/assignment/summary
    // generation benefits from wider source coverage.
    private String retrieveFullDocumentContext(User user, String documentId, String topicHint) {
        StudyDocument doc = documentIngestionService.requireOwnDocument(user, documentId);
        if (doc.getStatus() != StudyDocument.IngestionStatus.READY)
            throw new BadRequestException("This document is still processing — try again shortly");

        String query = topicHint != null && !topicHint.isBlank() ? topicHint : doc.getFileName();
        List<Document> results = vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query(query)
                        .topK(12)
                        .filterExpression("studyDocumentId == '" + documentId + "'")
                        .build());

        return results.stream().map(Document::getText).collect(Collectors.joining("\n---\n"));
    }

    private void recordUsage(User user, ChatResponse response) {
        int tokensUsed = response.getMetadata().getUsage() != null
                ? response.getMetadata().getUsage().getTotalTokens()
                : 0;
        tokenQuotaService.recordUsage(user, tokensUsed);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}