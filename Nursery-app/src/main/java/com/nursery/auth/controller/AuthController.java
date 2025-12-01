package com.nursery.auth.controller;

import com.nursery.common.dto.ApiResponse;
import com.nursery.common.util.SecurityUtil;
import com.nursery.auth.dto.request.GenerateTokenRequestDTO;
import com.nursery.auth.dto.request.LoginRequestDTO;
import com.nursery.auth.dto.request.SignupRequestDTO;
import com.nursery.auth.dto.response.AuthResponseDTO;
import com.nursery.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication and authorization endpoints")
public class AuthController {
    
    private final AuthService authService;
    
    @PostMapping("/login")
    @Operation(summary = "User login", description = "Authenticates a user and returns a JWT token")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "Login successful",
            content = @Content(schema = @Schema(implementation = ApiResponse.class))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400", 
            description = "Invalid credentials or validation error"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "429", 
            description = "Rate limit exceeded")
    })
    public ResponseEntity<ApiResponse<AuthResponseDTO>> login(@Valid @RequestBody LoginRequestDTO request) {
        log.debug("REST request to login user with phone={}", request.getPhone());
        AuthResponseDTO response = authService.login(request);
        log.info("User login successful for phone={}", request.getPhone());
        return ResponseEntity.status(HttpStatus.OK)
            .body(ApiResponse.success("Login successful", response));
    }
    
    @PostMapping("/signup")
    @Operation(summary = "User signup", description = "Creates a new user account and assigns an existing nursery. Designed for backend/Postman usage.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "201", 
            description = "Signup successful",
            content = @Content(schema = @Schema(implementation = ApiResponse.class))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400", 
            description = "Validation error or user already exists"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "429", 
            description = "Rate limit exceeded")
    })
    public ResponseEntity<ApiResponse<AuthResponseDTO>> signup(@Valid @RequestBody SignupRequestDTO request) {
        log.debug("REST request to signup user with phone={}", request.getPhone());
        AuthResponseDTO response = authService.signup(request);
        log.info("User signup successful for phone={}", request.getPhone());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Signup successful. Nursery configured automatically.", response));
    }
    
    @PostMapping("/generate-token")
    @Operation(summary = "Generate bearer token", description = "Generates a JWT token for an existing user. Designed for backend/Postman usage.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "Token generated successfully",
            content = @Content(schema = @Schema(implementation = ApiResponse.class))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400", 
            description = "User does not exist or validation error"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "429", 
            description = "Rate limit exceeded")
    })
    public ResponseEntity<ApiResponse<AuthResponseDTO>> generateToken(@Valid @RequestBody GenerateTokenRequestDTO request) {
        log.debug("REST request to generate token for phone={}", request.getPhone());
        AuthResponseDTO response = authService.generateToken(request);
        return ResponseEntity.status(HttpStatus.OK)
            .body(ApiResponse.success("Token generated successfully", response));
    }
    
    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Returns the currently authenticated user's information")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "User information retrieved successfully",
            content = @Content(schema = @Schema(implementation = ApiResponse.class))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "401", 
            description = "Unauthorized - Invalid or missing token")
    })
    public ResponseEntity<ApiResponse<AuthResponseDTO>> getCurrentUser() {
        String phone = SecurityUtil.getCurrentUserPhone();
        log.debug("REST request to get current user for phone={}", phone);
        AuthResponseDTO response = authService.getCurrentUser(phone);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}





