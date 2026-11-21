package com.bugtracker.config;

import com.bugtracker.model.*;
import com.bugtracker.repository.IssueRepository;
import com.bugtracker.repository.ProjectRepository;
import com.bugtracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Creates demo users / project / issues on first start (disable with SEED_DEMO_DATA=false). */
@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository users;
    private final ProjectRepository projects;
    private final IssueRepository issues;
    private final PasswordEncoder encoder;

    @Value("${app.seed-demo-data:true}")
    private boolean seed;

    public DataSeeder(UserRepository users, ProjectRepository projects, IssueRepository issues, PasswordEncoder encoder) {
        this.users = users;
        this.projects = projects;
        this.issues = issues;
        this.encoder = encoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!seed || users.count() > 0) return;

        User admin = user("Admin User", "admin@bugtracker.com", "Admin@123", Role.ADMIN);
        User manager = user("Maya Manager", "manager@bugtracker.com", "Manager@123", Role.MANAGER);
        User dev1 = user("Dev Developer", "dev@bugtracker.com", "Dev@1234", Role.DEVELOPER);
        User dev2 = user("Dana Developer", "dana@bugtracker.com", "Dev@1234", Role.DEVELOPER);

        Project p = new Project();
        p.setName("Demo Project");
        p.setProjectKey("DEMO");
        p.setDescription("Sample project with a few issues to try the Kanban board.");
        p.setOwner(manager);
        p.getMembers().add(manager);
        p.getMembers().add(dev1);
        p.getMembers().add(dev2);
        p = projects.save(p);

        issue(p, "Login page throws 500 on empty password", "Steps: open /login, submit with empty password.",
                IssueType.BUG, Priority.HIGH, IssueStatus.TODO, manager, dev1);
        issue(p, "Add dark mode toggle", "Users want a dark theme option in the navbar.",
                IssueType.STORY, Priority.LOW, IssueStatus.TODO, manager, null);
        issue(p, "Optimise dashboard query", "Dashboard takes >2s with 10k issues.",
                IssueType.TASK, Priority.MEDIUM, IssueStatus.IN_PROGRESS, manager, dev2);
        issue(p, "Crash when uploading 10MB screenshot", "Expected a friendly validation error.",
                IssueType.BUG, Priority.CRITICAL, IssueStatus.IN_PROGRESS, dev1, dev1);
        issue(p, "Set up CI pipeline", "GitHub Actions: build + test on every push.",
                IssueType.TASK, Priority.MEDIUM, IssueStatus.DONE, manager, dev2);
    }

    private User user(String name, String email, String pw, Role role) {
        User u = new User();
        u.setName(name);
        u.setEmail(email);
        u.setPassword(encoder.encode(pw));
        u.setRole(role);
        return users.save(u);
    }

    private void issue(Project p, String title, String desc, IssueType type, Priority prio,
                       IssueStatus status, User reporter, User assignee) {
        Issue i = new Issue();
        i.setProject(p);
        i.setTitle(title);
        i.setDescription(desc);
        i.setType(type);
        i.setPriority(prio);
        i.setStatus(status);
        i.setReporter(reporter);
        i.setAssignee(assignee);
        issues.save(i);
    }
}
