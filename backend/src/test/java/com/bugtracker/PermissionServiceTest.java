package com.bugtracker;

import com.bugtracker.model.Project;
import com.bugtracker.model.Role;
import com.bugtracker.model.User;
import com.bugtracker.service.PermissionService;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PermissionServiceTest {

    private final PermissionService perms = new PermissionService();

    private User user(long id, Role role) {
        User u = new User();
        u.setId(id);
        u.setRole(role);
        return u;
    }

    @Test
    void rolesControlProjectAccess() {
        User admin = user(1, Role.ADMIN);
        User owner = user(2, Role.MANAGER);
        User member = user(3, Role.DEVELOPER);
        User outsider = user(4, Role.DEVELOPER);

        Project p = new Project();
        p.setOwner(owner);
        p.getMembers().add(owner);
        p.getMembers().add(member);

        assertThat(perms.canView(p, admin)).isTrue();
        assertThat(perms.canManage(p, admin)).isTrue();
        assertThat(perms.canManage(p, owner)).isTrue();
        assertThat(perms.canView(p, member)).isTrue();
        assertThat(perms.canManage(p, member)).isFalse();
        assertThat(perms.canView(p, outsider)).isFalse();
    }
}
