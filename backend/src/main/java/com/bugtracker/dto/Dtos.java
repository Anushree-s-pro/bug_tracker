package com.bugtracker.dto;

import com.bugtracker.model.*;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.List;

/** All request / response payloads of the API. */
public final class Dtos {
    private Dtos() {}

    // ---------- auth / users ----------
    public record RegisterRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6, max = 100) String password,
            String role) {}

    public record LoginRequest(@NotBlank String email, @NotBlank String password) {}

    public record UserDto(Long id, String name, String email, Role role) {}

    public record AuthResponse(String token, UserDto user) {}

    public record RoleRequest(@NotNull Role role) {}

    // ---------- projects ----------
    public record ProjectRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Size(min = 2, max = 10) @Pattern(regexp = "[A-Za-z]+", message = "must contain letters only") String projectKey,
            @Size(max = 1000) String description) {}

    public record ProjectDto(Long id, String name, String projectKey, String description,
                             UserDto owner, List<UserDto> members, long issueCount,
                             LocalDateTime createdAt) {}

    // ---------- issues ----------
    public record IssueRequest(
            @NotBlank @Size(max = 200) String title,
            @Size(max = 4000) String description,
            IssueStatus status,
            Priority priority,
            IssueType type,
            Long assigneeId) {}

    public record StatusRequest(@NotNull IssueStatus status) {}

    public record AssignRequest(Long assigneeId) {}

    public record IssueDto(Long id, String issueKey, String title, String description,
                           IssueStatus status, Priority priority, IssueType type,
                           Long projectId, String projectName,
                           UserDto reporter, UserDto assignee, String screenshotUrl,
                           LocalDateTime createdAt, LocalDateTime updatedAt) {}

    // ---------- comments ----------
    public record CommentRequest(@NotBlank @Size(max = 2000) String content) {}

    public record CommentDto(Long id, String content, UserDto author, LocalDateTime createdAt) {}

    // ---------- dashboard ----------
    public record DashboardDto(long projects, long totalIssues, long todo, long inProgress,
                               long done, long assignedToMe, List<IssueDto> recentIssues) {}
}
