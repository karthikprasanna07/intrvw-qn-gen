package com.myproj.ai_interview_question_generator.controller;

import com.myproj.ai_interview_question_generator.dto.EvaluateAnswerRequest;
import com.myproj.ai_interview_question_generator.dto.EvaluateAnswerResponse;
import com.myproj.ai_interview_question_generator.dto.GenerateQuestionsRequest;
import com.myproj.ai_interview_question_generator.dto.QuestionSetResponse;
import com.myproj.ai_interview_question_generator.service.AnswerEvaluationService;
import com.myproj.ai_interview_question_generator.service.QuestionGenerationService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    private final QuestionGenerationService questionGenerationService;
    private final AnswerEvaluationService answerEvaluationService;

    public QuestionController(QuestionGenerationService questionGenerationService,
                               AnswerEvaluationService answerEvaluationService) {
        this.questionGenerationService = questionGenerationService;
        this.answerEvaluationService = answerEvaluationService;
    }

    @PostMapping("/generate")
    public QuestionSetResponse generate(@RequestBody GenerateQuestionsRequest request) {
        return questionGenerationService.generateQuestions(request);
    }

    @PostMapping("/{questionId}/evaluate")
    public EvaluateAnswerResponse evaluate(@PathVariable Long questionId,
                                            @RequestBody EvaluateAnswerRequest request) {
        return answerEvaluationService.evaluateAnswer(questionId, request);
    }
}
