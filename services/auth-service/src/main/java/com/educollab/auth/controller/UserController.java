package com.educollab.auth.controller;

import com.educollab.auth.dto.response.ApiResponse;
import com.educollab.auth.dto.response.UserResponse;
import com.educollab.auth.service.UserQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Internal-facing lookups for OTHER microservices (Feed, Chat, Meetings,
 * Admin, AI) to resolve a userId into display info. In front of the API
 * Gateway, /users/** should be routed so only authenticated
 * service-to-service calls (or the current user's own token) can reach
 * this — see api-gateway routing config once that service is built.
 */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserQueryService userQueryService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("User loaded", userQueryService.getById(id)));
    }

    // Bulk lookup: GET /users/batch?ids=1,2,3
    @GetMapping("/batch")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getByIds(@RequestParam List<Long> ids) {
        return ResponseEntity.ok(ApiResponse.success("Users loaded", userQueryService.getByIds(ids)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<UserResponse>>> search(@RequestParam String query) {
        return ResponseEntity.ok(ApiResponse.success("Search results", userQueryService.search(query)));
    }
}
