package com.myproj.ai_interview_question_generator.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class QuestionSetResponse {
    private Long id;
    private String role;
    private String experienceLevel;
    private String difficulty;
    private LocalDateTime createdAt;
    private List<QuestionDto> questions;
}
