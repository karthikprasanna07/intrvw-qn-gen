package com.myproj.ai_interview_question_generator.dto;

import lombok.Data;
import java.util.List;

@Data
public class EvaluateAnswerResponse {
    private Long questionId;
    private Integer score;
    private String feedback;
    private List<String> missedPoints;
}
