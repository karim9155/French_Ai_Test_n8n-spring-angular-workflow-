// src/main/java/com/example/demo/model/AnswerRecording.java
package com.example.french_voice_ai.entitie;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "answer_recordings")
public class AnswerRecording {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // NEW: Chat ID to tie all 10 questions in this session together
    @Column(name = "chat_id", nullable = false)
    private String chatId;

    @Column(name = "email")
    private String email;

    // which question (0 through 9)
    private int questionIndex;

    private LocalDateTime recordedAt;

    @Lob
    @Column(name = "audio_data", columnDefinition = "LONGBLOB")
    private byte[] audioData;

    // Constructors, getters, setters

    public AnswerRecording(String chatId, String email, int questionIndex, LocalDateTime recordedAt, byte[] audioData) {
        this.chatId = chatId;
        this.email = email;
        this.questionIndex = questionIndex;
        this.recordedAt = recordedAt;
        this.audioData = audioData;
    }

    // Lombok will handle getters and setters if @Getter and @Setter are on the class.
    // If @AllArgsConstructor and @NoArgsConstructor are present, ensure they are updated or handle constructors manually.
    // The existing AllArgsConstructor needs to be updated or removed if we rely on a new one with email.
    // For now, I've updated the existing constructor and assumed Lombok handles the rest.
}
