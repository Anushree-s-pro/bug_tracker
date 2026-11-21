package com.bugtracker.repository;

import com.bugtracker.model.Issue;
import com.bugtracker.model.IssueStatus;
import com.bugtracker.model.IssueType;
import com.bugtracker.model.Priority;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/** Dynamic filter / search used by the issue list & Kanban board. */
public final class IssueSpecs {
    private IssueSpecs() {}

    public static Specification<Issue> filter(Long projectId, IssueStatus status, Priority priority,
                                              IssueType type, Long assigneeId, boolean unassigned, String q) {
        return (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            ps.add(cb.equal(root.get("project").get("id"), projectId));
            if (status != null) ps.add(cb.equal(root.get("status"), status));
            if (priority != null) ps.add(cb.equal(root.get("priority"), priority));
            if (type != null) ps.add(cb.equal(root.get("type"), type));
            if (assigneeId != null) ps.add(cb.equal(root.get("assignee").get("id"), assigneeId));
            if (unassigned) ps.add(cb.isNull(root.get("assignee")));
            if (q != null && !q.isBlank()) {
                String like = "%" + q.trim().toLowerCase() + "%";
                ps.add(cb.or(
                        cb.like(cb.lower(root.get("title")), like),
                        cb.like(cb.lower(root.get("description")), like)));
            }
            return cb.and(ps.toArray(new Predicate[0]));
        };
    }
}
