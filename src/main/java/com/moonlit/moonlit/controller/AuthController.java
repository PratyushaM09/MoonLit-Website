package com.moonlit.moonlit.controller;

import java.util.HashMap;
import java.util.Map;

import com.moonlit.moonlit.dto.AuthResponse;
import com.moonlit.moonlit.dto.LoginRequest;
import com.moonlit.moonlit.dto.RegisterRequest;
import com.moonlit.moonlit.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> body) {
        Map<String, String> response = new HashMap<>();
        response.put("message", "If an account exists for this email, a reset link has been sent.");
        return ResponseEntity.ok(response);
    }

}