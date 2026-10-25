package com.myproj.ai_interview_question_generator.repository;

import com.myproj.ai_interview_question_generator.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionRepository extends JpaRepository<Question, Long> {
}
