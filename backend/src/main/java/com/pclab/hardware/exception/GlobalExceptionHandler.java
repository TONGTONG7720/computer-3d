package com.pclab.hardware.exception;

import com.pclab.hardware.vo.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(DomainException.class)
    ResponseEntity<ApiResponse<Void>> handleDomainException(DomainException exception) {
        ErrorCode errorCode = exception.errorCode();
        return ResponseEntity
                .status(errorCode.status())
                .body(ApiResponse.error(errorCode.name(), exception.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse<Void>> handleMethodValidation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getAllErrors().stream()
                .findFirst()
                .map(error -> Objects.requireNonNullElse(error.getDefaultMessage(), "请求参数不合法"))
                .orElse(ErrorCode.VALIDATION_FAILED.defaultMessage());
        return validationResponse(message);
    }

    @ExceptionHandler(BindException.class)
    ResponseEntity<ApiResponse<Void>> handleBinding(BindException exception) {
        String message = exception.getAllErrors().stream()
                .findFirst()
                .map(error -> Objects.requireNonNullElse(error.getDefaultMessage(), "请求参数不合法"))
                .orElse(ErrorCode.VALIDATION_FAILED.defaultMessage());
        return validationResponse(message);
    }

    @ExceptionHandler({
        ConstraintViolationException.class,
        MethodArgumentTypeMismatchException.class,
        HttpMessageNotReadableException.class,
        MaxUploadSizeExceededException.class
    })
    ResponseEntity<ApiResponse<Void>> handleMalformedInput(Exception exception) {
        return validationResponse(ErrorCode.VALIDATION_FAILED.defaultMessage());
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiResponse<Void>> handleUnexpected(Exception exception) {
        LOGGER.error("Unhandled hardware platform error", exception);
        return ResponseEntity
                .status(ErrorCode.INTERNAL_ERROR.status())
                .body(ApiResponse.error(
                        ErrorCode.INTERNAL_ERROR.name(),
                        ErrorCode.INTERNAL_ERROR.defaultMessage()
                ));
    }

    private static ResponseEntity<ApiResponse<Void>> validationResponse(String message) {
        return ResponseEntity
                .status(ErrorCode.VALIDATION_FAILED.status())
                .body(ApiResponse.error(ErrorCode.VALIDATION_FAILED.name(), message));
    }
}
