package com.myproj.ai_interview_question_generator.dto;

import lombok.Data;

@Data
public class GenerateQuestionsRequest {
    private String role;
    private String experienceLevel;
    private String difficulty;
    private int questionCount;
}
