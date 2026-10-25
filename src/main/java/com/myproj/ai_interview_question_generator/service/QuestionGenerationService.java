package com.myproj.ai_interview_question_generator.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.myproj.ai_interview_question_generator.dto.GenerateQuestionsRequest;
import com.myproj.ai_interview_question_generator.dto.QuestionDto;
import com.myproj.ai_interview_question_generator.dto.QuestionSetResponse;
import com.myproj.ai_interview_question_generator.entity.Question;
import com.myproj.ai_interview_question_generator.entity.QuestionSet;
import com.myproj.ai_interview_question_generator.exception.GeminiServiceException;
import com.myproj.ai_interview_question_generator.repository.QuestionSetRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import com.myproj.ai_interview_question_generator.entity.User;
import com.myproj.ai_interview_question_generator.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

@Slf4j
@Service
public class QuestionGenerationService {

    private final GeminiClientService geminiClientService;
    private final QuestionSetRepository questionSetRepository;
    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;

    public QuestionGenerationService(
            GeminiClientService geminiClientService,
            QuestionSetRepository questionSetRepository,
            ObjectMapper objectMapper,
            UserRepository userRepository) {

        this.geminiClientService = geminiClientService;
        this.questionSetRepository = questionSetRepository;
        this.objectMapper = objectMapper;
        this.userRepository = userRepository;
    }

    public QuestionSetResponse generateQuestions(GenerateQuestionsRequest request) {
        String prompt = buildPrompt(request);

        String rawResponse = geminiClientService.callGemini(prompt);
        String cleanJson = geminiClientService.cleanJsonResponse(rawResponse);

        List<QuestionDto> generatedQuestions;
        try {
            generatedQuestions = objectMapper.readValue(
                    cleanJson,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, QuestionDto.class)
            );
        } catch (Exception e) {
            log.error("Failed to parse Gemini JSON response: {}", cleanJson, e);
            throw new GeminiServiceException("Gemini returned malformed JSON for question generation", e);
        }

        String username = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        QuestionSet questionSet = new QuestionSet();
        questionSet.setUser(user);


        questionSet.setRole(request.getRole());
        questionSet.setExperienceLevel(request.getExperienceLevel());
        questionSet.setDifficulty(request.getDifficulty());

        for (QuestionDto dto : generatedQuestions) {
            Question question = new Question();
            question.setQuestionText(dto.getQuestion());
            question.setCategory(dto.getCategory());
            try {
                question.setExpectedAnswerPoints(objectMapper.writeValueAsString(dto.getExpectedAnswerPoints()));
            } catch (Exception e) {
                question.setExpectedAnswerPoints("[]");
            }
            question.setQuestionSet(questionSet);
            questionSet.getQuestions().add(question);
        }

        QuestionSet saved = questionSetRepository.save(questionSet);

        return toResponse(saved);
    }

    private String buildPrompt(GenerateQuestionsRequest request) {
        return String.format("""
                Generate %d interview questions for a "%s" role with "%s" experience level, \
                at "%s" difficulty.

                Return ONLY a raw JSON array, no markdown, no explanation, in exactly this shape:
                [
                  {
                    "question": "the interview question text",
                    "category": "e.g. Technical, HR, System Design, Behavioral",
                    "expectedAnswerPoints": ["key point 1", "key point 2", "key point 3"]
                  }
                ]
                """,
                request.getQuestionCount(),
                request.getRole(),
                request.getExperienceLevel(),
                request.getDifficulty()
        );
    }

    private QuestionSetResponse toResponse(QuestionSet saved) {
        QuestionSetResponse response = new QuestionSetResponse();
        response.setId(saved.getId());
        response.setRole(saved.getRole());
        response.setExperienceLevel(saved.getExperienceLevel());
        response.setDifficulty(saved.getDifficulty());
        response.setCreatedAt(saved.getCreatedAt());

        List<QuestionDto> questionDtos = saved.getQuestions().stream().map(q -> {
            QuestionDto dto = new QuestionDto();
            dto.setId(q.getId());
            dto.setQuestion(q.getQuestionText());
            dto.setCategory(q.getCategory());
            try {
                dto.setExpectedAnswerPoints(
                        objectMapper.readValue(q.getExpectedAnswerPoints(), List.class)
                );
            } catch (Exception e) {
                dto.setExpectedAnswerPoints(List.of());
            }
            return dto;
        }).toList();

        response.setQuestions(questionDtos);
        return response;
    }
    public List<QuestionSetResponse> getInterviewHistory() {

        String username = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<QuestionSet> questionSets =
                questionSetRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        return questionSets.stream()
                .map(this::toResponse)
                .toList();
    }
}
