package com.clinicaspring.controller;

import com.clinicaspring.dto.LoginRequest;
import com.clinicaspring.dto.LoginResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    // Login fixo: admin / 1234
    private static final String FIXED_USERNAME = "admin";
    private static final String FIXED_PASSWORD = "1234";

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // Validação simples do login fixo
        if (FIXED_USERNAME.equals(request.getEmail()) && FIXED_PASSWORD.equals(request.getSenha())) {
            LoginResponse response = new LoginResponse(
                    "token-admin-" + System.currentTimeMillis(),
                    "Administrador",
                    "admin",
                    "admin");
            return ResponseEntity.ok(response);
        }

        return ResponseEntity.status(401).body(Map.of("message", "Credenciais inválidas"));
    }
}
