package com.myproj.ai_interview_question_generator.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.myproj.ai_interview_question_generator.dto.EvaluateAnswerRequest;
import com.myproj.ai_interview_question_generator.dto.EvaluateAnswerResponse;
import com.myproj.ai_interview_question_generator.entity.AnswerFeedback;
import com.myproj.ai_interview_question_generator.entity.Question;
import com.myproj.ai_interview_question_generator.exception.GeminiServiceException;
import com.myproj.ai_interview_question_generator.repository.AnswerFeedbackRepository;
import com.myproj.ai_interview_question_generator.repository.QuestionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class AnswerEvaluationService {

    private final GeminiClientService geminiClientService;
    private final QuestionRepository questionRepository;
    private final AnswerFeedbackRepository answerFeedbackRepository;
    private final ObjectMapper objectMapper;

    public AnswerEvaluationService(GeminiClientService geminiClientService,
                                    QuestionRepository questionRepository,
                                    AnswerFeedbackRepository answerFeedbackRepository,
                                    ObjectMapper objectMapper) {
        this.geminiClientService = geminiClientService;
        this.questionRepository = questionRepository;
        this.answerFeedbackRepository = answerFeedbackRepository;
        this.objectMapper = objectMapper;
    }

    public EvaluateAnswerResponse evaluateAnswer(Long questionId, EvaluateAnswerRequest request) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new GeminiServiceException("Question not found: " + questionId));

        String prompt = buildPrompt(question, request.getUserAnswer());

        String rawResponse = geminiClientService.callGemini(prompt);
        String cleanJson = geminiClientService.cleanJsonResponse(rawResponse);

        Map<String, Object> parsed;
        try {
            parsed = objectMapper.readValue(cleanJson, Map.class);
        } catch (Exception e) {
            log.error("Failed to parse Gemini JSON response: {}", cleanJson, e);
            throw new GeminiServiceException("Gemini returned malformed JSON for answer evaluation", e);
        }

        Integer score = (Integer) parsed.get("score");
        String feedback = (String) parsed.get("feedback");
        List<String> missedPoints = (List<String>) parsed.getOrDefault("missedPoints", List.of());

        AnswerFeedback answerFeedback = new AnswerFeedback();
        answerFeedback.setQuestionId(questionId);
        answerFeedback.setUserAnswer(request.getUserAnswer());
        answerFeedback.setScore(score);
        answerFeedback.setFeedback(feedback);
        try {
            answerFeedback.setMissedPoints(objectMapper.writeValueAsString(missedPoints));
        } catch (Exception e) {
            answerFeedback.setMissedPoints("[]");
        }

        answerFeedbackRepository.save(answerFeedback);

        EvaluateAnswerResponse response = new EvaluateAnswerResponse();
        response.setQuestionId(questionId);
        response.setScore(score);
        response.setFeedback(feedback);
        response.setMissedPoints(missedPoints);
        return response;
    }

    private String buildPrompt(Question question, String userAnswer) {
        return String.format("""
                You are evaluating an interview answer.

                Question: "%s"
                Category: "%s"
                Expected key points: %s

                Candidate's answer: "%s"

                Score the answer from 0 to 10, give brief constructive feedback, \
                and list any expected key points the candidate missed.

                Return ONLY raw JSON, no markdown, in exactly this shape:
                {
                  "score": 7,
                  "feedback": "short constructive feedback text",
                  "missedPoints": ["point the candidate missed"]
                }
                """,
                question.getQuestionText(),
                question.getCategory(),
                question.getExpectedAnswerPoints(),
                userAnswer
        );
    }
}
