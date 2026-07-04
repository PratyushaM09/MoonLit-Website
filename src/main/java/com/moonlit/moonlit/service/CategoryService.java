package com.moonlit.moonlit.service;

import com.moonlit.moonlit.dto.CategoryRequest;
import com.moonlit.moonlit.dto.CategoryResponse;
import com.moonlit.moonlit.entity.Category;
import com.moonlit.moonlit.entity.CategoryScope;
import com.moonlit.moonlit.entity.User;
import com.moonlit.moonlit.mapper.CategoryMapper;
import com.moonlit.moonlit.repository.CategoryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<CategoryResponse> getCategories(User user, String scopeRaw) {
        CategoryScope scope = parseScope(scopeRaw);
        return categoryRepository.findByUserAndScopeOrderByCreatedAtAsc(user, scope)
                .stream().map(CategoryMapper::toResponse).toList();
    }

    public CategoryResponse create(User user, CategoryRequest req) {
        Category c = new Category();
        c.setName(req.name());
        c.setScope(parseScope(req.scope()));
        c.setUser(user);
        return CategoryMapper.toResponse(categoryRepository.save(c));
    }

    public void delete(Long id, User user) {
        Category c = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
        if (!c.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your category");
        }
        categoryRepository.delete(c);
    }

    public static Category getOwnedCategoryOrThrow(CategoryRepository repo, Long id, User user, CategoryScope expectedScope) {
        Category c = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid category"));
        if (!c.getUser().getId().equals(user.getId()) || c.getScope() != expectedScope) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid category for this user/feature");
        }
        return c;
    }

    private CategoryScope parseScope(String value) {
        try {
            return CategoryScope.valueOf(value.toUpperCase());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid scope: " + value);
        }
    }
}
