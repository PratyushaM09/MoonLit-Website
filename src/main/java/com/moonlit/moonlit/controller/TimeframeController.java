package com.moonlit.moonlit.controller;

import com.moonlit.moonlit.dto.TimeframeRequest;
import com.moonlit.moonlit.dto.TimeframeResponse;
import com.moonlit.moonlit.entity.User;
import com.moonlit.moonlit.repository.UserRepository;
import com.moonlit.moonlit.service.TimeframeService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/timeframes")
public class TimeframeController {

    private final TimeframeService timeframeService;
    private final UserRepository userRepository;

    public TimeframeController(TimeframeService timeframeService, UserRepository userRepository) {
        this.timeframeService = timeframeService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<TimeframeResponse> list() {
        return timeframeService.getTimeframes(currentUser());
    }

    @PostMapping
    public TimeframeResponse create(@RequestBody TimeframeRequest request) {
        return timeframeService.create(currentUser(), request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        timeframeService.delete(id, currentUser());
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }
}
