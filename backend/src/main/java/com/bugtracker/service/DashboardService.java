package com.bugtracker.service;

import com.bugtracker.dto.Dtos.DashboardDto;
import com.bugtracker.dto.Mapper;
import com.bugtracker.model.IssueStatus;
import com.bugtracker.model.Project;
import com.bugtracker.model.User;
import com.bugtracker.repository.IssueRepository;
import com.bugtracker.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DashboardService {

    private final ProjectRepository projects;
    private final IssueRepository issues;
    private final PermissionService perms;

    public DashboardService(ProjectRepository projects, IssueRepository issues, PermissionService perms) {
        this.projects = projects;
        this.issues = issues;
        this.perms = perms;
    }

    @Transactional(readOnly = true)
    public DashboardDto build(User principal) {
        List<Project> mine = perms.isAdmin(principal) ? projects.findAll() : projects.findAllForUser(principal.getId());
        List<Long> ids = mine.stream().map(Project::getId).toList();
        long assignedToMe = issues.countByAssigneeIdAndStatusNot(principal.getId(), IssueStatus.DONE);
        if (ids.isEmpty()) return new DashboardDto(0, 0, 0, 0, 0, assignedToMe, List.of());

        return new DashboardDto(
                ids.size(),
                issues.countByProjectIdIn(ids),
                issues.countByProjectIdInAndStatus(ids, IssueStatus.TODO),
                issues.countByProjectIdInAndStatus(ids, IssueStatus.IN_PROGRESS),
                issues.countByProjectIdInAndStatus(ids, IssueStatus.DONE),
                assignedToMe,
                issues.findTop6ByProjectIdInOrderByUpdatedAtDesc(ids).stream().map(Mapper::toDto).toList());
    }
}
