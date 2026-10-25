package com.myproj.ai_interview_question_generator.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.myproj.ai_interview_question_generator.dto.gemini.GeminiResponse;
import com.myproj.ai_interview_question_generator.exception.GeminiServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Single responsibility: send a prompt string to Gemini, return the raw generated text.
 * Everything above this (prompt construction, JSON parsing of the RESPONSE CONTENT itself)
 * happens in the calling service — this class only knows how to talk to Gemini's HTTP API.
 */
@Slf4j
@Service
public class    GeminiClientService {

    private final WebClient geminiWebClient;
    private final ObjectMapper objectMapper;

    @Value("${gemini.model}")
    private String model;

    @Value("${gemini.api.key}")
    private String apiKey;

    public GeminiClientService(WebClient geminiWebClient, ObjectMapper objectMapper) {
        this.geminiWebClient = geminiWebClient;
        this.objectMapper = objectMapper;
    }

    /**
     * Sends the given prompt to Gemini and returns the plain generated text.
     * Retries once on 429/5xx errors (confirmed necessary — Gemini free tier
     * intermittently returns 503 under load).
     */
    public String callGemini(String prompt) {
        String path = "/" + model + ":generateContent?key=" + apiKey;

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", prompt)
                        ))
                )
        );

        try {
            GeminiResponse response = geminiWebClient.post()
                    .uri(path)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(GeminiResponse.class)
                    .timeout(Duration.ofSeconds(60))
                    .retryWhen(
                            Retry.backoff(1, Duration.ofSeconds(3))
                                    .filter(this::isRetryable)
                    )
                    .block();

            if (response == null
                    || response.getCandidates() == null
                    || response.getCandidates().isEmpty()) {
                throw new GeminiServiceException("Gemini returned an empty response");
            }

            String text = response.getCandidates().get(0)
                    .getContent()
                    .getParts()
                    .get(0)
                    .getText();

            if (text == null || text.isBlank()) {
                throw new GeminiServiceException("Gemini returned no text content");
            }

            return text;

        } catch (GeminiServiceException e) {
            throw e;
        } catch (Exception e) {
            log.error("Gemini API call failed", e);
            throw new GeminiServiceException("Failed to get a response from Gemini", e);
        }
    }

    private boolean isRetryable(Throwable throwable) {
        String message = throwable.getMessage();
        return message != null && (message.contains("503") || message.contains("429"));
    }

    /**
     * Strips markdown code fences (```json ... ```) that Gemini sometimes wraps
     * around JSON responses despite being asked for raw JSON only.
     */
    public String cleanJsonResponse(String raw) {
        return raw.replaceAll("```json", "")
                .replaceAll("```", "")
                .trim();
    }
}
