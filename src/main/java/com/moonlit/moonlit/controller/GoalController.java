package com.moonlit.moonlit.controller;

import com.moonlit.moonlit.dto.GoalItemRequest;
import com.moonlit.moonlit.dto.GoalRequest;
import com.moonlit.moonlit.dto.GoalResponse;
import com.moonlit.moonlit.entity.User;
import com.moonlit.moonlit.repository.UserRepository;
import com.moonlit.moonlit.service.GoalService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/goals")
public class GoalController {

    private final GoalService goalService;
    private final UserRepository userRepository;

    public GoalController(GoalService goalService, UserRepository userRepository) {
        this.goalService = goalService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<GoalResponse> list() {
        return goalService.getGoals(currentUser());
    }

    @PostMapping
    public GoalResponse create(@RequestBody GoalRequest request) {
        return goalService.createGoal(currentUser(), request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        goalService.deleteGoal(id, currentUser());
    }

    @PostMapping("/{id}/items")
    public GoalResponse addItem(@PathVariable Long id, @RequestBody GoalItemRequest request) {
        return goalService.addItem(id, currentUser(), request);
    }

    @PatchMapping("/items/{itemId}/toggle")
    public GoalResponse toggleItem(@PathVariable Long itemId) {
        return goalService.toggleItem(itemId, currentUser());
    }

    @DeleteMapping("/items/{itemId}")
    public GoalResponse deleteItem(@PathVariable Long itemId) {
        return goalService.deleteItem(itemId, currentUser());
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }
}
