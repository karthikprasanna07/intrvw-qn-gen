package com.karthik.repository;

import com.karthik.entity.AnswerFeedback;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnswerFeedbackRepository extends JpaRepository<AnswerFeedback, Long> {
}
