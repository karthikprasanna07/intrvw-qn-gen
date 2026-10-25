package com.myproj.ai_interview_question_generator.repository;

import com.myproj.ai_interview_question_generator.entity.QuestionSet;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionSetRepository extends JpaRepository<QuestionSet, Long> {
}
