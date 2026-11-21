package com.bugtracker.service;

import com.bugtracker.dto.Dtos.UserDto;
import com.bugtracker.dto.Mapper;
import com.bugtracker.exception.BadRequestException;
import com.bugtracker.exception.ResourceNotFoundException;
import com.bugtracker.model.Role;
import com.bugtracker.model.User;
import com.bugtracker.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class UserService {

    private final UserRepository users;

    public UserService(UserRepository users) {
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<UserDto> listAll() {
        return users.findAll().stream()
                .sorted(Comparator.comparing(User::getName, String.CASE_INSENSITIVE_ORDER))
                .map(Mapper::toDto).toList();
    }

    @Transactional
    public UserDto changeRole(Long id, Role role, User current) {
        if (current.getId().equals(id)) throw new BadRequestException("You cannot change your own role");
        User u = users.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        u.setRole(role);
        return Mapper.toDto(u);
    }
}
