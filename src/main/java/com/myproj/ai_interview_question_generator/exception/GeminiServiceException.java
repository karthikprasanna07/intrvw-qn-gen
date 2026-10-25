package com.myproj.ai_interview_question_generator.exception;

public class GeminiServiceException extends RuntimeException {
    public GeminiServiceException(String message) {
        super(message);
    }

    public GeminiServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
