package com.bugtracker.repository;

import com.bugtracker.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    boolean existsByProjectKeyIgnoreCase(String projectKey);

    @Query("select distinct p from Project p left join p.members m " +
           "where p.owner.id = :uid or m.id = :uid order by p.createdAt desc")
    List<Project> findAllForUser(@Param("uid") Long userId);
}
