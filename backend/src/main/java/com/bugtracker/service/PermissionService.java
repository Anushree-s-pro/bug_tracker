package com.bugtracker.service;

import com.bugtracker.exception.ForbiddenException;
import com.bugtracker.model.Issue;
import com.bugtracker.model.Project;
import com.bugtracker.model.Role;
import com.bugtracker.model.User;
import org.springframework.stereotype.Component;

/**
 * Central place for role-based rules.
 *  ADMIN     - everything, everywhere
 *  MANAGER   - create projects; manage (edit/delete/members) projects they own
 *  DEVELOPER - work on projects they are a member of
 */
@Component
public class PermissionService {

    public boolean isAdmin(User u) {
        return u.getRole() == Role.ADMIN;
    }

    public boolean isOwner(Project p, User u) {
        return p.getOwner().getId().equals(u.getId());
    }

    public boolean isMember(Project p, User u) {
        return isOwner(p, u) || p.getMembers().stream().anyMatch(m -> m.getId().equals(u.getId()));
    }

    public boolean canView(Project p, User u) {
        return isAdmin(u) || isMember(p, u);
    }

    public boolean canManage(Project p, User u) {
        return isAdmin(u) || isOwner(p, u);
    }

    public boolean canEditIssue(Issue i, User u) {
        return canManage(i.getProject(), u)
                || i.getReporter().getId().equals(u.getId())
                || (i.getAssignee() != null && i.getAssignee().getId().equals(u.getId()));
    }

    public boolean canDeleteIssue(Issue i, User u) {
        return canManage(i.getProject(), u) || i.getReporter().getId().equals(u.getId());
    }

    public void requireView(Project p, User u) {
        if (!canView(p, u)) throw new ForbiddenException("You are not a member of this project");
    }

    public void requireManage(Project p, User u) {
        if (!canManage(p, u)) throw new ForbiddenException("Only the project manager or an admin can do this");
    }
}
