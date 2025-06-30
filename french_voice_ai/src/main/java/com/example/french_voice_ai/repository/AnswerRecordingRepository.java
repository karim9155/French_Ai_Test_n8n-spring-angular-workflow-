// src/main/java/com/example/demo/repository/AnswerRecordingRepository.java
package com.example.french_voice_ai.repository;

import com.example.french_voice_ai.entitie.AnswerRecording;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnswerRecordingRepository extends JpaRepository<AnswerRecording, Long> {

    List<AnswerRecording> findAllByChatIdOrderByQuestionIndexAsc(String chatId);

    long countByChatId(String chatId);
}
