package com.bugtracker.controller;

import com.bugtracker.dto.Dtos.CommentDto;
import com.bugtracker.dto.Dtos.CommentRequest;
import com.bugtracker.model.User;
import com.bugtracker.service.CommentService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@Tag(name = "Comments")
public class CommentController {

    private final CommentService comments;

    public CommentController(CommentService comments) {
        this.comments = comments;
    }

    @GetMapping("/issues/{issueId}/comments")
    public List<CommentDto> list(@PathVariable Long issueId, @AuthenticationPrincipal User user) {
        return comments.list(issueId, user);
    }

    @PostMapping("/issues/{issueId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentDto add(@PathVariable Long issueId, @Valid @RequestBody CommentRequest req,
                          @AuthenticationPrincipal User user) {
        return comments.add(issueId, req, user);
    }

    @DeleteMapping("/comments/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal User user) {
        comments.delete(id, user);
        return ResponseEntity.noContent().build();
    }
}
