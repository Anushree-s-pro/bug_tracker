package com.bugtracker.repository;

import com.bugtracker.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByIssueIdOrderByCreatedAtAsc(Long issueId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from Comment c where c.issue.id = :iid")
    void deleteByIssueId(@Param("iid") Long issueId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from Comment c where c.issue.id in (select i.id from Issue i where i.project.id = :pid)")
    void deleteByProjectId(@Param("pid") Long projectId);
}
