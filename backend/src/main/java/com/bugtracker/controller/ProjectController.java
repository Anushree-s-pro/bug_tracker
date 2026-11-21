package com.bugtracker.controller;

import com.bugtracker.dto.Dtos.ProjectDto;
import com.bugtracker.dto.Dtos.ProjectRequest;
import com.bugtracker.model.User;
import com.bugtracker.service.ProjectService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@Tag(name = "Projects & Team")
public class ProjectController {

    private final ProjectService projects;

    public ProjectController(ProjectService projects) {
        this.projects = projects;
    }

    @GetMapping
    public List<ProjectDto> list(@AuthenticationPrincipal User user) {
        return projects.list(user);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectDto create(@Valid @RequestBody ProjectRequest req, @AuthenticationPrincipal User user) {
        return projects.create(req, user);
    }

    @GetMapping("/{id}")
    public ProjectDto get(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return projects.get(id, user);
    }

    @PutMapping("/{id}")
    public ProjectDto update(@PathVariable Long id, @Valid @RequestBody ProjectRequest req,
                             @AuthenticationPrincipal User user) {
        return projects.update(id, req, user);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal User user) {
        projects.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/members/{userId}")
    public ProjectDto addMember(@PathVariable Long id, @PathVariable Long userId, @AuthenticationPrincipal User user) {
        return projects.addMember(id, userId, user);
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ProjectDto removeMember(@PathVariable Long id, @PathVariable Long userId, @AuthenticationPrincipal User user) {
        return projects.removeMember(id, userId, user);
    }
}
