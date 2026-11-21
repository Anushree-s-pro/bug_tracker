package com.bugtracker.service;

import com.bugtracker.dto.Dtos.CommentDto;
import com.bugtracker.dto.Dtos.CommentRequest;
import com.bugtracker.dto.Mapper;
import com.bugtracker.exception.ForbiddenException;
import com.bugtracker.exception.ResourceNotFoundException;
import com.bugtracker.model.Comment;
import com.bugtracker.model.Issue;
import com.bugtracker.model.User;
import com.bugtracker.repository.CommentRepository;
import com.bugtracker.repository.IssueRepository;
import com.bugtracker.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CommentService {

    private final CommentRepository comments;
    private final IssueRepository issues;
    private final UserRepository users;
    private final PermissionService perms;

    public CommentService(CommentRepository comments, IssueRepository issues, UserRepository users, PermissionService perms) {
        this.comments = comments;
        this.issues = issues;
        this.users = users;
        this.perms = perms;
    }

    @Transactional(readOnly = true)
    public List<CommentDto> list(Long issueId, User principal) {
        Issue i = issue(issueId);
        perms.requireView(i.getProject(), principal);
        return comments.findByIssueIdOrderByCreatedAtAsc(issueId).stream().map(Mapper::toDto).toList();
    }

    public CommentDto add(Long issueId, CommentRequest req, User principal) {
        Issue i = issue(issueId);
        perms.requireView(i.getProject(), principal);
        Comment c = new Comment();
        c.setIssue(i);
        c.setAuthor(users.findById(principal.getId()).orElseThrow());
        c.setContent(req.content().trim());
        return Mapper.toDto(comments.save(c));
    }

    public void delete(Long commentId, User principal) {
        Comment c = comments.findById(commentId).orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        boolean own = c.getAuthor().getId().equals(principal.getId());
        if (!own && !perms.canManage(c.getIssue().getProject(), principal)) {
            throw new ForbiddenException("You can only delete your own comments");
        }
        comments.delete(c);
    }

    private Issue issue(Long id) {
        return issues.findById(id).orElseThrow(() -> new ResourceNotFoundException("Issue not found"));
    }
}
