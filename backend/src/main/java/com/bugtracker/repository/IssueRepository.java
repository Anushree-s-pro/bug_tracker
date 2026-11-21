package com.bugtracker.repository;

import com.bugtracker.model.Issue;
import com.bugtracker.model.IssueStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface IssueRepository extends JpaRepository<Issue, Long>, JpaSpecificationExecutor<Issue> {

    long countByProjectId(Long projectId);

    long countByProjectIdInAndStatus(Collection<Long> projectIds, IssueStatus status);

    long countByProjectIdIn(Collection<Long> projectIds);

    long countByAssigneeIdAndStatusNot(Long assigneeId, IssueStatus status);

    List<Issue> findTop6ByProjectIdInOrderByUpdatedAtDesc(Collection<Long> projectIds);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from Issue i where i.project.id = :pid")
    void deleteByProjectId(@Param("pid") Long projectId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Issue i set i.assignee = null where i.project.id = :pid and i.assignee.id = :uid")
    void unassignUserInProject(@Param("pid") Long projectId, @Param("uid") Long userId);

    @Query("select i.screenshotPath from Issue i where i.project.id = :pid and i.screenshotPath is not null")
    List<String> findScreenshotsByProject(@Param("pid") Long projectId);
}
