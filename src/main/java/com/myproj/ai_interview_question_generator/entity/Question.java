package com.myproj.ai_interview_question_generator.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "questions")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String questionText;

    private String category;

    // Stored as a JSON string, e.g. ["point1","point2"]
    @Column(columnDefinition = "TEXT")
    private String expectedAnswerPoints;

    @ManyToOne
    @JoinColumn(name = "question_set_id")
    private QuestionSet questionSet;
}
