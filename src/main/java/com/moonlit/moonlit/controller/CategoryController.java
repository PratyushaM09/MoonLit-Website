package com.moonlit.moonlit.controller;

import com.moonlit.moonlit.dto.CategoryRequest;
import com.moonlit.moonlit.dto.CategoryResponse;
import com.moonlit.moonlit.entity.User;
import com.moonlit.moonlit.repository.UserRepository;
import com.moonlit.moonlit.service.CategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;
    private final UserRepository userRepository;

    public CategoryController(CategoryService categoryService, UserRepository userRepository) {
        this.categoryService = categoryService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<CategoryResponse> list(@RequestParam String scope) {
        return categoryService.getCategories(currentUser(), scope);
    }

    @PostMapping
    public CategoryResponse create(@RequestBody CategoryRequest request) {
        return categoryService.create(currentUser(), request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        categoryService.delete(id, currentUser());
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }
}
