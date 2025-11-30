package com.nursery.auth.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Slf4j
@Component
public class JwtTokenProvider {
    
    @Value("${jwt.secret}")
    private String jwtSecret;
    
    @Value("${jwt.expiration}")
    private long jwtExpiration;
    
    private static final int MIN_SECRET_LENGTH = 32; // Minimum 256 bits
    
    @PostConstruct
    public void validateSecret() {
        if (jwtSecret == null || jwtSecret.length() < MIN_SECRET_LENGTH) {
            log.error("JWT secret is too short (minimum {} characters). This is a security risk!", MIN_SECRET_LENGTH);
            throw new IllegalStateException(
                String.format("JWT secret must be at least %d characters long for production use", MIN_SECRET_LENGTH));
        }
        
        // Warn if using default/weak secret
        if (jwtSecret.contains("dev-secret") || jwtSecret.contains("CHANGE_THIS")) {
            log.warn("JWT secret appears to be a default/development secret. Please change it for production!");
        }
        
        log.info("JWT secret validated successfully");
    }

    public String generateToken(String userId, String phone) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);

        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));

        return Jwts.builder()
            .subject(userId)
            .claim("phone", phone)
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(key)
            .compact();
    }

    public String getUserIdFromToken(String token) {
        Claims claims = parseClaims(token);
        return claims.getSubject();
    }

    public String getPhoneFromToken(String token) {
        Claims claims = parseClaims(token);
        return claims.get("phone", String.class);
    }
    
    public boolean validateToken(String token) {
        try {
            if (token == null || token.isEmpty()) {
                log.debug("Token is null or empty");
                return false;
            }
            
            Claims claims = parseClaims(token);
            
            // Additional validation: check expiration
            if (claims.getExpiration() != null && claims.getExpiration().before(new Date())) {
                log.debug("Token has expired");
                return false;
            }
            
            return true;
        } catch (Exception e) {
            log.debug("Token validation failed: {}", e.getMessage());
            return false;
        }
    }

    private Claims parseClaims(String token) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));

        return Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}




