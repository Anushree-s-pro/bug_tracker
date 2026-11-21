package com.bugtracker;

import com.bugtracker.model.Role;
import com.bugtracker.model.User;
import com.bugtracker.security.JwtService;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private static final String SECRET = "unit-test-secret-unit-test-secret-unit-test-secret-1234";

    private User user() {
        User u = new User();
        u.setId(1L);
        u.setEmail("a@b.com");
        u.setRole(Role.MANAGER);
        return u;
    }

    @Test
    void generatesAndValidatesToken() {
        JwtService jwt = new JwtService(SECRET, 60_000);
        String token = jwt.generateToken(user());
        assertThat(jwt.isValid(token)).isTrue();
        assertThat(jwt.extractEmail(token)).isEqualTo("a@b.com");
    }

    @Test
    void rejectsTamperedAndExpiredTokens() {
        JwtService jwt = new JwtService(SECRET, 60_000);
        String token = jwt.generateToken(user());
        assertThat(jwt.isValid(token + "x")).isFalse();
        assertThat(jwt.isValid("not-a-jwt")).isFalse();

        JwtService expired = new JwtService(SECRET, -1000);
        assertThat(expired.isValid(expired.generateToken(user()))).isFalse();
    }
}
