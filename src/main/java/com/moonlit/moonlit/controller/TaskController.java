package com.moonlit.moonlit.controller;

import com.moonlit.moonlit.dto.TaskRequest;
import com.moonlit.moonlit.dto.TaskResponse;
import com.moonlit.moonlit.entity.User;
import com.moonlit.moonlit.repository.UserRepository;
import com.moonlit.moonlit.service.TaskService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;
    private final UserRepository userRepository;

    public TaskController(TaskService taskService, UserRepository userRepository) {
        this.taskService = taskService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<TaskResponse> getTasks() {
        return taskService.getTasks(currentUser());
    }

    @PostMapping
    public TaskResponse createTask(@RequestBody TaskRequest request) {
        return taskService.createTask(currentUser(), request);
    }

    @PutMapping("/{id}")
    public TaskResponse updateTask(@PathVariable Long id, @RequestBody TaskRequest request) {
        return taskService.updateTask(id, currentUser(), request);
    }

    @PatchMapping("/{id}/toggle")
    public TaskResponse toggleTask(@PathVariable Long id) {
        return taskService.toggleComplete(id, currentUser());
    }

    @DeleteMapping("/{id}")
    public void deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id, currentUser());
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }
}
