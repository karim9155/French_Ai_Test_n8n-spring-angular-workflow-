package com.example.french_voice_ai.conroller;

import com.example.french_voice_ai.repository.AnswerRecordingRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/session")
@CrossOrigin(origins = {
        "https://192.168.10.149:4200",
        "https://ebbd-154-107-134-165.ngrok-free.app",
        "https://localhost:4200"
})@RequiredArgsConstructor
public class SessionController {

    private final AnswerRecordingRepository recordingRepository;
    private static final int TOTAL_QUESTIONS = 10;
    private static final String CHAT_ID_SESSION_ATTRIBUTE = "currentChatId"; // Key to store chatId in session

    // The n8n webhook URL you configured in application.properties
    @Value("${n8n.webhook.url}")
    private String n8nWebhookUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 1) Create a new chatId for a fresh questioning session.
     *    Returns: { "chatId": "random‐uuid" }
     */
    @PostMapping("/create")
    public ResponseEntity<Map<String, String>> createSession(HttpSession session) { // <-- FIX: Add HttpSession session here
        // Generate a UUID as chatId

        String chatId = UUID.randomUUID().toString();
        session.setAttribute(CHAT_ID_SESSION_ATTRIBUTE, chatId); // Store chatId in the current user's session
        System.out.printf("🔔 New session created with chatId=%s, stored in session.%n", chatId);
        return ResponseEntity.ok(Map.of("chatId", chatId));
    }

    /**
     * 2) Once the frontend has uploaded all 10 questions for this chatId,
     *    it calls: POST /api/session/{chatId}/complete
     *
     *    We verify that countByChatId(chatId) == 10, then trigger n8n to score.
     */
    @PostMapping("/{chatId}/complete")
    public ResponseEntity<Map<String,Object>> completeSession(
            @PathVariable("chatId") String chatId
    ) {
        long count = recordingRepository.countByChatId(chatId);
        System.out.printf("🔔 completeSession called for chatId=%s, found=%d%n", chatId, count);

        boolean triggered = false;
        if (count == TOTAL_QUESTIONS) {
            try {
                restTemplate.postForLocation(URI.create(n8nWebhookUrl), Map.of("chatId", chatId));
                System.out.println("🚀 n8n webhook triggered");
                triggered = true;
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        } else {
            System.out.println("⏸ Not triggering; need exactly " + TOTAL_QUESTIONS + ", have " + count);
        }

        // Always return 200 with count & triggered flag
        return ResponseEntity.ok(Map.of(
                "count", count,
                "triggered", triggered
        ));
    }


    @GetMapping("/lastGeneratedId")
    public ResponseEntity<Map<String, String>> getLastGeneratedId(HttpSession session) { // Inject HttpSession
        String lastGeneratedChatId = (String) session.getAttribute(CHAT_ID_SESSION_ATTRIBUTE);

        if (lastGeneratedChatId != null) {
            System.out.printf("✅ Returning last generated chatId for session: %s%n", lastGeneratedChatId);
            return ResponseEntity.ok(Map.of("chatId", lastGeneratedChatId));
        } else {
            System.out.println("❌ No last generated chatId found in session.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "No active session ID found. Please create a session first via /api/session/create."));
        }
    }

}
