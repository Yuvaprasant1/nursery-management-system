package com.nursery.auth.validation;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * Password policy validator for production-grade security
 * Validates password strength according to security best practices
 */
@Slf4j
@Component
public class PasswordPolicyValidator {

    @Value("${password.policy.min-length:8}")
    private int minLength;

    @Value("${password.policy.require-uppercase:true}")
    private boolean requireUppercase;

    @Value("${password.policy.require-lowercase:true}")
    private boolean requireLowercase;

    @Value("${password.policy.require-digit:true}")
    private boolean requireDigit;

    @Value("${password.policy.require-special-char:false}")
    private boolean requireSpecialChar;

    private static final Pattern UPPERCASE_PATTERN = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile("[a-z]");
    private static final Pattern DIGIT_PATTERN = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL_CHAR_PATTERN = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]");

    /**
     * Validates password against security policy
     * @param password the password to validate
     * @throws IllegalArgumentException if password doesn't meet policy requirements
     */
    public void validate(String password) {
        if (password == null || password.isEmpty()) {
            throw new IllegalArgumentException("Password cannot be empty");
        }

        if (password.length() < minLength) {
            throw new IllegalArgumentException(
                String.format("Password must be at least %d characters long", minLength));
        }

        if (requireUppercase && !UPPERCASE_PATTERN.matcher(password).find()) {
            throw new IllegalArgumentException("Password must contain at least one uppercase letter");
        }

        if (requireLowercase && !LOWERCASE_PATTERN.matcher(password).find()) {
            throw new IllegalArgumentException("Password must contain at least one lowercase letter");
        }

        if (requireDigit && !DIGIT_PATTERN.matcher(password).find()) {
            throw new IllegalArgumentException("Password must contain at least one digit");
        }

        if (requireSpecialChar && !SPECIAL_CHAR_PATTERN.matcher(password).find()) {
            throw new IllegalArgumentException("Password must contain at least one special character");
        }

        // Check for common weak passwords
        if (isCommonWeakPassword(password)) {
            throw new IllegalArgumentException("Password is too common or weak. Please choose a stronger password");
        }
    }

    private boolean isCommonWeakPassword(String password) {
        String[] commonPasswords = {
            "password", "123456", "12345678", "123456789", "1234567890",
            "qwerty", "abc123", "password1", "admin", "letmein"
        };
        
        String lowerPassword = password.toLowerCase();
        for (String common : commonPasswords) {
            if (lowerPassword.contains(common)) {
                return true;
            }
        }
        return false;
    }
}

