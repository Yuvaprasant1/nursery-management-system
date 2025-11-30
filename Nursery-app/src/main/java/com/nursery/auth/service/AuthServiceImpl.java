package com.nursery.auth.service;

import com.nursery.auth.dto.request.GenerateTokenRequestDTO;
import com.nursery.auth.dto.request.LoginRequestDTO;
import com.nursery.auth.dto.request.SignupRequestDTO;
import com.nursery.auth.dto.response.AuthResponseDTO;
import com.nursery.auth.firestore.UserDocument;
import com.nursery.auth.firestore.UserFirestoreRepository;
import com.nursery.auth.exception.AuthException;
import com.nursery.auth.security.JwtTokenProvider;
import com.nursery.auth.validation.PasswordPolicyValidator;
import com.nursery.nursery.service.NurseryService;
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
    private final NurseryService nurseryService;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    
    @Override
    public AuthResponseDTO login(LoginRequestDTO request) {
        String phone = request.getPhone();
        String rawPassword = request.getPassword();
        
        // Find existing user - throw exception if not found
        UserDocument user = userRepository.findByPhone(phone)
            .orElseThrow(() -> new AuthException("Invalid phone or password"));

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
    public AuthResponseDTO signup(SignupRequestDTO request) {
        String phone = request.getPhone();
        String rawPassword = request.getPassword();
        String nurseryId = request.getNurseryId();
        
        // Check if user already exists
        if (userRepository.existsByPhone(phone)) {
            throw new AuthException("User with this phone number already exists");
        }
        
        // Validate password policy
        passwordPolicyValidator.validate(rawPassword);
        
        // Validate that nursery exists
        try {
            nurseryService.validateExists(nurseryId);
        } catch (com.nursery.common.exception.EntityNotFoundException e) {
            throw new AuthException("Nursery with ID " + nurseryId + " does not exist");
        }
        
        // Create new user
        UserDocument newUser = new UserDocument();
        newUser.setPhone(phone);
        newUser.setPasswordHash(passwordEncoder.encode(rawPassword));
        newUser.setNurseryId(nurseryId);
        String userId = userRepository.save(newUser);
        newUser.setId(userId);
        
        // Generate JWT token
        String token = jwtTokenProvider.generateToken(newUser.getId(), newUser.getPhone());
        
        log.info("New user signed up: {} with nursery: {}", phone, nurseryId);
        
        AuthResponseDTO response = new AuthResponseDTO();
        response.setToken(token);
        response.setPhone(newUser.getPhone());
        response.setUserId(newUser.getId());
        response.setNurseryId(newUser.getNurseryId());
        response.setTag(newUser.getTag());
        
        return response;
    }
    
    @Override
    public AuthResponseDTO generateToken(GenerateTokenRequestDTO request) {
        String phone = request.getPhone();
        String rawPassword = request.getPassword();
        
        // Find existing user - throw exception if not found
        UserDocument user = userRepository.findByPhone(phone)
            .orElseThrow(() -> new AuthException("User with phone number " + phone + " does not exist"));
        
        // Validate password before generating token
        if (user.getPasswordHash() == null) {
            throw new AuthException("User does not have a password set");
        }
        
        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new AuthException("Invalid password");
        }
        
        // Generate JWT token for authenticated user
        String token = jwtTokenProvider.generateToken(user.getId(), user.getPhone());
        
        log.info("Token generated for authenticated user: {}", phone);
        
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
