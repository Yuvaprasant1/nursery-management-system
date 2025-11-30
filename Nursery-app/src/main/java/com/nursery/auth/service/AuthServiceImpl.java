package com.nursery.auth.service;

import com.nursery.auth.dto.request.LoginRequestDTO;
import com.nursery.auth.dto.response.AuthResponseDTO;
import com.nursery.auth.firestore.UserDocument;
import com.nursery.auth.firestore.UserFirestoreRepository;
import com.nursery.auth.exception.AuthException;
import com.nursery.auth.security.JwtTokenProvider;
import com.nursery.auth.validation.PasswordPolicyValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    
    private final UserFirestoreRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordPolicyValidator passwordPolicyValidator;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    
    @Override
    public AuthResponseDTO login(LoginRequestDTO request) {
        String phone = request.getPhone();
        String rawPassword = request.getPassword();
        
        UserDocument user = userRepository.findByPhone(phone)
            .orElseGet(() -> {
                // Create new user if doesn't exist (signup)
                // Validate password policy for new users
                passwordPolicyValidator.validate(rawPassword);
                
                UserDocument newUser = new UserDocument();
                newUser.setPhone(phone);
                newUser.setPasswordHash(passwordEncoder.encode(rawPassword));
                String id = userRepository.save(newUser);
                newUser.setId(id);
                log.info("New user created: {}", phone);
                return newUser;
            });

        // If existing user without password yet (legacy), set password on first login
        if (user.getPasswordHash() == null) {
            // Validate password policy when setting password for first time
            passwordPolicyValidator.validate(rawPassword);
            user.setPasswordHash(passwordEncoder.encode(rawPassword));
            userRepository.save(user);
            log.info("Password set for existing user: {}", phone);
        } else {
            // Validate password
            if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
                throw new AuthException("Invalid phone or password");
            }
        }

        // Generate JWT using userId as subject and phone as claim
        String token = jwtTokenProvider.generateToken(user.getId(), user.getPhone());
        
        log.info("User logged in: {}", phone);
        
        AuthResponseDTO response = new AuthResponseDTO();
        response.setToken(token);
        response.setPhone(user.getPhone());
        response.setUserId(user.getId());
        response.setNurseryId(user.getNurseryId());
        response.setTag(user.getTag());
        
        return response;
    }
    
    @Override
    public AuthResponseDTO getCurrentUser(String phone) {
        UserDocument user = userRepository.findByPhoneAndNotDeleted(phone)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        AuthResponseDTO response = new AuthResponseDTO();
        response.setToken(null);
        response.setPhone(user.getPhone());
        response.setUserId(user.getId());
        response.setNurseryId(user.getNurseryId());
        
        return response;
    }
}
