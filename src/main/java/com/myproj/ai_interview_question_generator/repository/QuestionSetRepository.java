package com.myproj.ai_interview_question_generator.repository;

import com.myproj.ai_interview_question_generator.entity.QuestionSet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionSetRepository extends JpaRepository<QuestionSet, Long> {

    List<QuestionSet> findByUserIdOrderByCreatedAtDesc(Long userId);
}