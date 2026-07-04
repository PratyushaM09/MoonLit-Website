package com.moonlit.moonlit.repository;

import com.moonlit.moonlit.entity.Category;
import com.moonlit.moonlit.entity.CategoryScope;
import com.moonlit.moonlit.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByUserAndScopeOrderByCreatedAtAsc(User user, CategoryScope scope);
}
