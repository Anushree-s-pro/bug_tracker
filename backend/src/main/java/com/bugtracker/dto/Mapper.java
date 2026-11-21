package com.bugtracker.dto;

import com.bugtracker.dto.Dtos.*;
import com.bugtracker.model.*;

import java.util.Comparator;

/** Entity -> DTO conversion. Must be called inside a transaction (lazy associations). */
public final class Mapper {
    private Mapper() {}

    public static UserDto toDto(User u) {
        return u == null ? null : new UserDto(u.getId(), u.getName(), u.getEmail(), u.getRole());
    }

    public static ProjectDto toDto(Project p, long issueCount) {
        return new ProjectDto(p.getId(), p.getName(), p.getProjectKey(), p.getDescription(),
                toDto(p.getOwner()),
                p.getMembers().stream()
                        .sorted(Comparator.comparing(User::getName, String.CASE_INSENSITIVE_ORDER))
                        .map(Mapper::toDto).toList(),
                issueCount, p.getCreatedAt());
    }

    public static IssueDto toDto(Issue i) {
        Project p = i.getProject();
        return new IssueDto(i.getId(), p.getProjectKey() + "-" + i.getId(), i.getTitle(), i.getDescription(),
                i.getStatus(), i.getPriority(), i.getType(), p.getId(), p.getName(),
                toDto(i.getReporter()), toDto(i.getAssignee()),
                i.getScreenshotPath() == null ? null : "/api/files/" + i.getScreenshotPath(),
                i.getCreatedAt(), i.getUpdatedAt());
    }

    public static CommentDto toDto(Comment c) {
        return new CommentDto(c.getId(), c.getContent(), toDto(c.getAuthor()), c.getCreatedAt());
    }
}
