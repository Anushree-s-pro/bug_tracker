package com.bugtracker.service;

import com.bugtracker.dto.Dtos.*;
import com.bugtracker.dto.Mapper;
import com.bugtracker.exception.BadRequestException;
import com.bugtracker.exception.ForbiddenException;
import com.bugtracker.exception.ResourceNotFoundException;
import com.bugtracker.model.Project;
import com.bugtracker.model.Role;
import com.bugtracker.model.User;
import com.bugtracker.repository.CommentRepository;
import com.bugtracker.repository.IssueRepository;
import com.bugtracker.repository.ProjectRepository;
import com.bugtracker.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ProjectService {

    private final ProjectRepository projects;
    private final UserRepository users;
    private final IssueRepository issues;
    private final CommentRepository comments;
    private final PermissionService perms;
    private final FileStorageService storage;

    public ProjectService(ProjectRepository projects, UserRepository users, IssueRepository issues,
                          CommentRepository comments, PermissionService perms, FileStorageService storage) {
        this.projects = projects;
        this.users = users;
        this.issues = issues;
        this.comments = comments;
        this.perms = perms;
        this.storage = storage;
    }

    @Transactional(readOnly = true)
    public List<ProjectDto> list(User principal) {
        List<Project> list = perms.isAdmin(principal)
                ? projects.findAll()
                : projects.findAllForUser(principal.getId());
        return list.stream().sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt())).map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public ProjectDto get(Long id, User principal) {
        Project p = find(id);
        perms.requireView(p, principal);
        return toDto(p);
    }

    public ProjectDto create(ProjectRequest req, User principal) {
        if (principal.getRole() == Role.DEVELOPER) {
            throw new ForbiddenException("Only managers and admins can create projects");
        }
        String key = req.projectKey().trim().toUpperCase();
        if (projects.existsByProjectKeyIgnoreCase(key)) throw new BadRequestException("Project key already in use");

        User owner = users.findById(principal.getId()).orElseThrow();
        Project p = new Project();
        p.setName(req.name().trim());
        p.setProjectKey(key);
        p.setDescription(req.description());
        p.setOwner(owner);
        p.getMembers().add(owner);
        return toDto(projects.save(p));
    }

    public ProjectDto update(Long id, ProjectRequest req, User principal) {
        Project p = find(id);
        perms.requireManage(p, principal);
        String key = req.projectKey().trim().toUpperCase();
        if (!key.equalsIgnoreCase(p.getProjectKey()) && projects.existsByProjectKeyIgnoreCase(key)) {
            throw new BadRequestException("Project key already in use");
        }
        p.setName(req.name().trim());
        p.setProjectKey(key);
        p.setDescription(req.description());
        return toDto(p);
    }

    public void delete(Long id, User principal) {
        Project p = find(id);
        perms.requireManage(p, principal);
        List<String> files = issues.findScreenshotsByProject(id);
        comments.deleteByProjectId(id);
        issues.deleteByProjectId(id);
        projects.delete(projects.getReferenceById(id));
        files.forEach(storage::delete);
    }

    public ProjectDto addMember(Long projectId, Long userId, User principal) {
        Project p = find(projectId);
        perms.requireManage(p, principal);
        User u = users.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (perms.isMember(p, u)) throw new BadRequestException("User is already a member");
        p.getMembers().add(u);
        return toDto(p);
    }

    public ProjectDto removeMember(Long projectId, Long userId, User principal) {
        Project p = find(projectId);
        perms.requireManage(p, principal);
        if (p.getOwner().getId().equals(userId)) throw new BadRequestException("The project owner cannot be removed");
        boolean removed = p.getMembers().removeIf(m -> m.getId().equals(userId));
        if (!removed) throw new ResourceNotFoundException("User is not a member of this project");
        issues.unassignUserInProject(projectId, userId);
        return toDto(projects.findById(projectId).orElseThrow());
    }

    // ---- helpers ----
    Project find(Long id) {
        return projects.findById(id).orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }

    private ProjectDto toDto(Project p) {
        return Mapper.toDto(p, issues.countByProjectId(p.getId()));
    }
}
