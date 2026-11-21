package com.bugtracker.service;

import com.bugtracker.dto.Dtos.*;
import com.bugtracker.dto.Mapper;
import com.bugtracker.exception.BadRequestException;
import com.bugtracker.model.Role;
import com.bugtracker.model.User;
import com.bugtracker.repository.UserRepository;
import com.bugtracker.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final AuthenticationManager authManager;
    private final JwtService jwt;

    public AuthService(UserRepository users, PasswordEncoder encoder,
                       AuthenticationManager authManager, JwtService jwt) {
        this.users = users;
        this.encoder = encoder;
        this.authManager = authManager;
        this.jwt = jwt;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) throw new BadRequestException("Email is already registered");

        User u = new User();
        u.setName(req.name().trim());
        u.setEmail(email);
        u.setPassword(encoder.encode(req.password()));
        u.setRole(resolveRole(req.role()));
        u = users.save(u);
        return new AuthResponse(jwt.generateToken(u), Mapper.toDto(u));
    }

    /** First user of a fresh system becomes ADMIN; later users can only self-select MANAGER or DEVELOPER. */
    private Role resolveRole(String requested) {
        if (users.count() == 0) return Role.ADMIN;
        if (requested != null && requested.equalsIgnoreCase("MANAGER")) return Role.MANAGER;
        return Role.DEVELOPER;
    }

    public AuthResponse login(LoginRequest req) {
        authManager.authenticate(new UsernamePasswordAuthenticationToken(req.email().trim().toLowerCase(), req.password()));
        User u = users.findByEmailIgnoreCase(req.email().trim()).orElseThrow();
        return new AuthResponse(jwt.generateToken(u), Mapper.toDto(u));
    }
}
