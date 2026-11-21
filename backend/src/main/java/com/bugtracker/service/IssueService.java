package com.bugtracker.service;

import com.bugtracker.dto.Dtos.*;
import com.bugtracker.dto.Mapper;
import com.bugtracker.exception.BadRequestException;
import com.bugtracker.exception.ForbiddenException;
import com.bugtracker.exception.ResourceNotFoundException;
import com.bugtracker.model.*;
import com.bugtracker.repository.*;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Objects;

@Service
@Transactional
public class IssueService {

    private final IssueRepository issues;
    private final ProjectRepository projects;
    private final UserRepository users;
    private final CommentRepository comments;
    private final PermissionService perms;
    private final FileStorageService storage;

    public IssueService(IssueRepository issues, ProjectRepository projects, UserRepository users,
                        CommentRepository comments, PermissionService perms, FileStorageService storage) {
        this.issues = issues;
        this.projects = projects;
        this.users = users;
        this.comments = comments;
        this.perms = perms;
        this.storage = storage;
    }

    // ---------------- queries (filters & search) ----------------
    @Transactional(readOnly = true)
    public List<IssueDto> search(Long projectId, IssueStatus status, Priority priority, IssueType type,
                                 Long assigneeId, boolean unassigned, String q, User principal) {
        Project p = project(projectId);
        perms.requireView(p, principal);
        return issues.findAll(IssueSpecs.filter(projectId, status, priority, type, assigneeId, unassigned, q),
                        Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream().map(Mapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public IssueDto get(Long id, User principal) {
        Issue i = issue(id);
        perms.requireView(i.getProject(), principal);
        return Mapper.toDto(i);
    }

    // ---------------- create ----------------
    public IssueDto create(Long projectId, IssueRequest req, User principal) {
        Project p = project(projectId);
        perms.requireView(p, principal);

        Issue i = new Issue();
        i.setProject(p);
        i.setReporter(users.findById(principal.getId()).orElseThrow());
        i.setTitle(req.title().trim());
        i.setDescription(req.description());
        i.setStatus(req.status() != null ? req.status() : IssueStatus.TODO);
        i.setPriority(req.priority() != null ? req.priority() : Priority.MEDIUM);
        i.setType(req.type() != null ? req.type() : IssueType.TASK);
        if (req.assigneeId() != null) i.setAssignee(assignee(p, req.assigneeId()));
        return Mapper.toDto(issues.save(i));
    }

    // ---------------- update ----------------
    public IssueDto update(Long id, IssueRequest req, User principal) {
        Issue i = issue(id);
        Project p = i.getProject();
        perms.requireView(p, principal);
        if (!perms.canEditIssue(i, principal)) {
            throw new ForbiddenException("You can only edit issues you reported or are assigned to");
        }
        i.setTitle(req.title().trim());
        i.setDescription(req.description());
        if (req.status() != null) i.setStatus(req.status());
        if (req.priority() != null) i.setPriority(req.priority());
        if (req.type() != null) i.setType(req.type());
        applyAssignee(i, p, req.assigneeId(), principal);
        return Mapper.toDto(i);
    }

    /** Kanban drag & drop: any project member may move a card. */
    public IssueDto changeStatus(Long id, IssueStatus status, User principal) {
        Issue i = issue(id);
        perms.requireView(i.getProject(), principal);
        i.setStatus(status);
        return Mapper.toDto(i);
    }

    public IssueDto assign(Long id, Long assigneeId, User principal) {
        Issue i = issue(id);
        perms.requireView(i.getProject(), principal);
        applyAssignee(i, i.getProject(), assigneeId, principal);
        return Mapper.toDto(i);
    }

    private void applyAssignee(Issue i, Project p, Long newAssigneeId, User principal) {
        Long current = i.getAssignee() == null ? null : i.getAssignee().getId();
        if (Objects.equals(current, newAssigneeId)) return;

        boolean allowed = perms.canEditIssue(i, principal) || Objects.equals(newAssigneeId, principal.getId());
        if (!allowed) throw new ForbiddenException("You are not allowed to change the assignee of this issue");
        i.setAssignee(newAssigneeId == null ? null : assignee(p, newAssigneeId));
    }

    // ---------------- delete ----------------
    public void delete(Long id, User principal) {
        Issue i = issue(id);
        perms.requireView(i.getProject(), principal);
        if (!perms.canDeleteIssue(i, principal)) {
            throw new ForbiddenException("Only the reporter, project manager or an admin can delete this issue");
        }
        String file = i.getScreenshotPath();
        comments.deleteByIssueId(id);
        issues.delete(i);
        storage.delete(file);
    }

    // ---------------- screenshot ----------------
    public IssueDto uploadScreenshot(Long id, MultipartFile file, User principal) {
        Issue i = issue(id);
        perms.requireView(i.getProject(), principal);
        if (!perms.canEditIssue(i, principal)) throw new ForbiddenException("You cannot edit this issue");
        String old = i.getScreenshotPath();
        i.setScreenshotPath(storage.store(file));
        storage.delete(old);
        return Mapper.toDto(i);
    }

    public IssueDto removeScreenshot(Long id, User principal) {
        Issue i = issue(id);
        perms.requireView(i.getProject(), principal);
        if (!perms.canEditIssue(i, principal)) throw new ForbiddenException("You cannot edit this issue");
        storage.delete(i.getScreenshotPath());
        i.setScreenshotPath(null);
        return Mapper.toDto(i);
    }

    // ---------------- helpers ----------------
    private User assignee(Project p, Long userId) {
        User u = users.findById(userId).orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
        if (!perms.isMember(p, u)) throw new BadRequestException("Assignee must be a member of the project");
        return u;
    }

    private Project project(Long id) {
        return projects.findById(id).orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }

    private Issue issue(Long id) {
        return issues.findById(id).orElseThrow(() -> new ResourceNotFoundException("Issue not found"));
    }
}
