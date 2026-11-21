package com.bugtracker.controller;

import com.bugtracker.dto.Dtos.RoleRequest;
import com.bugtracker.dto.Dtos.UserDto;
import com.bugtracker.model.User;
import com.bugtracker.service.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Users")
public class UserController {

    private final UserService users;

    public UserController(UserService users) {
        this.users = users;
    }

    @GetMapping
    public List<UserDto> list() {
        return users.listAll();
    }

    /** ADMIN only (enforced in SecurityConfig). */
    @PutMapping("/{id}/role")
    public UserDto changeRole(@PathVariable Long id, @Valid @RequestBody RoleRequest req,
                              @AuthenticationPrincipal User current) {
        return users.changeRole(id, req.role(), current);
    }
}
