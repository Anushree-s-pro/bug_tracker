package com.bugtracker.controller;

import com.bugtracker.dto.Dtos.*;
import com.bugtracker.model.IssueStatus;
import com.bugtracker.model.IssueType;
import com.bugtracker.model.Priority;
import com.bugtracker.model.User;
import com.bugtracker.service.IssueService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
@Tag(name = "Issues")
public class IssueController {

    private final IssueService issues;

    public IssueController(IssueService issues) {
        this.issues = issues;
    }

    /** Filters & search: ?status=&priority=&type=&assigneeId=&unassigned=true&q=text */
    @GetMapping("/projects/{projectId}/issues")
    public List<IssueDto> search(@PathVariable Long projectId,
                                 @RequestParam(required = false) IssueStatus status,
                                 @RequestParam(required = false) Priority priority,
                                 @RequestParam(required = false) IssueType type,
                                 @RequestParam(required = false) Long assigneeId,
                                 @RequestParam(defaultValue = "false") boolean unassigned,
                                 @RequestParam(required = false) String q,
                                 @AuthenticationPrincipal User user) {
        return issues.search(projectId, status, priority, type, assigneeId, unassigned, q, user);
    }

    @PostMapping("/projects/{projectId}/issues")
    @ResponseStatus(HttpStatus.CREATED)
    public IssueDto create(@PathVariable Long projectId, @Valid @RequestBody IssueRequest req,
                           @AuthenticationPrincipal User user) {
        return issues.create(projectId, req, user);
    }

    @GetMapping("/issues/{id}")
    public IssueDto get(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return issues.get(id, user);
    }

    @PutMapping("/issues/{id}")
    public IssueDto update(@PathVariable Long id, @Valid @RequestBody IssueRequest req,
                           @AuthenticationPrincipal User user) {
        return issues.update(id, req, user);
    }

    @PatchMapping("/issues/{id}/status")
    public IssueDto changeStatus(@PathVariable Long id, @Valid @RequestBody StatusRequest req,
                                 @AuthenticationPrincipal User user) {
        return issues.changeStatus(id, req.status(), user);
    }

    @PatchMapping("/issues/{id}/assign")
    public IssueDto assign(@PathVariable Long id, @RequestBody AssignRequest req,
                           @AuthenticationPrincipal User user) {
        return issues.assign(id, req.assigneeId(), user);
    }

    @DeleteMapping("/issues/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal User user) {
        issues.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/issues/{id}/screenshot", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public IssueDto uploadScreenshot(@PathVariable Long id, @RequestParam("file") MultipartFile file,
                                     @AuthenticationPrincipal User user) {
        return issues.uploadScreenshot(id, file, user);
    }

    @DeleteMapping("/issues/{id}/screenshot")
    public IssueDto removeScreenshot(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return issues.removeScreenshot(id, user);
    }
}
