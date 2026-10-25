package com.myproj.ai_interview_question_generator.dto;

import lombok.Data;
import java.util.List;

@Data
public class QuestionDto {
    private Long id; // null when coming from Gemini, populated after save
    private String question;
    private String category;
    private List<String> expectedAnswerPoints;
}
