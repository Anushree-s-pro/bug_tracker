package com.bugtracker.controller;

import com.bugtracker.dto.Dtos.DashboardDto;
import com.bugtracker.model.User;
import com.bugtracker.service.DashboardService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Dashboard")
public class DashboardController {

    private final DashboardService dashboard;

    public DashboardController(DashboardService dashboard) {
        this.dashboard = dashboard;
    }

    @GetMapping
    public DashboardDto get(@AuthenticationPrincipal User user) {
        return dashboard.build(user);
    }
}
