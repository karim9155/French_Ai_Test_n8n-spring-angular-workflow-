package com.example.french_voice_ai.conroller;

import com.example.french_voice_ai.entitie.AnswerRecording;
import com.example.french_voice_ai.repository.AnswerRecordingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.net.URI;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recordings")
@CrossOrigin(origins = {
        "https://192.168.10.149:4200",
        "https://ebbd-154-107-134-165.ngrok-free.app",
        "https://localhost:4200"
})
@RequiredArgsConstructor
public class RecordingController {

    private final AnswerRecordingRepository repo;

    /**
     * Upload one question’s audio. The form should include:
     *  - chatId (String)
     *  - questionIndex (int 0..9)
     *  - file (MultipartFile containing WebM/Opus from the browser)
     *
     * We convert to MP3 via ffmpeg, then store as AnswerRecording(chatId, questionIndex, timestamp, mp3Bytes).
     */
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadAnswer(
            @RequestParam("chatId") String chatId,
            @RequestParam("questionIndex") int questionIndex,
            @RequestParam("email") String email, // Added email
            @RequestParam("file") MultipartFile file
    ) {
        if (file.isEmpty()) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("error", "No file uploaded"));
        }

        Path tempInputFile = null;
        Path tempOutputFile = null;
        try {
            // 1) Write the incoming WebM blob to a temp file
            String inputName = "input_" + System.currentTimeMillis() + ".webm";
            tempInputFile = Files.createTempFile(null, inputName);
            Files.write(tempInputFile, file.getBytes());

            // 2) Prepare a temp output file path for MP3
            String outputName = "output_" + System.currentTimeMillis() + ".mp3";
            tempOutputFile = Files.createTempFile(null, outputName);

            // 3) Run ffmpeg to convert WebM → MP3
            ProcessBuilder pb = new ProcessBuilder(
                    "ffmpeg",
                    "-i", tempInputFile.toAbsolutePath().toString(),
                    "-vn",                     // strip video track
                    "-ab", "128k",             // 128 kbps bitrate
                    "-ar", "44100",            // 44.1 kHz sample rate
                    "-y",                      // overwrite if exists
                    tempOutputFile.toAbsolutePath().toString()
            );
            pb.redirectErrorStream(true);
            Process ffmpeg = pb.start();

            // (Optional) Log ffmpeg output for debugging
            try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(ffmpeg.getInputStream()))) {
                String line;
                while ((line = br.readLine()) != null) {
                    System.out.println("[ffmpeg] " + line);
                }
            }

            int exitCode = ffmpeg.waitFor();
            if (exitCode != 0) {
                // ffmpeg failed
                return ResponseEntity
                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "ffmpeg conversion failed with exit code " + exitCode));
            }

            // 4) Read the resulting MP3 bytes
            byte[] mp3Bytes = Files.readAllBytes(tempOutputFile);

            // 5) Persist to DB, including the chatId and email
            AnswerRecording rec = new AnswerRecording();
            rec.setChatId(chatId);
            rec.setEmail(email); // Set the email
            rec.setQuestionIndex(questionIndex);
            rec.setRecordedAt(LocalDateTime.now());
            rec.setAudioData(mp3Bytes);
            repo.save(rec);

            return ResponseEntity.ok(Map.of("message", "Saved question " + questionIndex + " for chatId " + chatId + " and email " + email));
        } catch (IOException | InterruptedException ex) {
            ex.printStackTrace();
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server error during MP3 conversion: " + ex.getMessage()));
        } finally {
            // 6) Clean up temp files
            try {
                if (tempInputFile != null) {
                    Files.deleteIfExists(tempInputFile);
                }
                if (tempOutputFile != null) {
                    Files.deleteIfExists(tempOutputFile);
                }
            } catch (IOException ignored) {
            }
        }
    }

    /**
     * Download an MP3 by ID (served as audio/mpeg).
     * URL: GET /api/recordings/{id}/download
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadRecording(@PathVariable("id") Long id) {
        var maybe = repo.findById(id);
        if (maybe.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
        var rec = maybe.get();
        byte[] mp3 = rec.getAudioData();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("audio/mpeg"));
        String filename = String.format("answer_%d_question_%d.mp3", rec.getId(), rec.getQuestionIndex());
        headers.setContentDisposition(
                ContentDisposition.builder("attachment")
                        .filename(filename)
                        .build()
        );
        return new ResponseEntity<>(mp3, headers, HttpStatus.OK);
    }

    /**
     * List all recordings for a given chatId, returning id+questionIndex so n8n can loop:
     * URL: GET /api/recordings/by-chat/{chatId}
     */
    @GetMapping("/by-chat/{chatId}")
    public ResponseEntity<List<Map<String, Object>>> listRecordingsByChat(
            @PathVariable("chatId") String chatId
    ) {
        var list = repo.findAllByChatIdOrderByQuestionIndexAsc(chatId);
        var summaries = new ArrayList<Map<String, Object>>();
        for (AnswerRecording r : list) {
            summaries.add(Map.of(
                    "id", r.getId(),
                    "questionIndex", r.getQuestionIndex()
            ));
        }
        return ResponseEntity.ok(summaries);
    }
    /**
     * List all recordings for a given email, returning full AnswerRecording objects.
     * URL: GET /api/recordings/by-email/{email}
     */
    @GetMapping("/by-email/{email}")
    public ResponseEntity<List<AnswerRecording>> listRecordingsByEmail(
            @PathVariable("email") String email
    ) {
        List<AnswerRecording> recordings = repo.findAllByEmailOrderByRecordedAtDesc(email);
        if (recordings.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ArrayList<>());
        }
        return ResponseEntity.ok(recordings);
    }
}