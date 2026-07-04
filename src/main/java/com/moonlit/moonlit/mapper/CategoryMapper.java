package com.moonlit.moonlit.mapper;

import com.moonlit.moonlit.dto.CategoryResponse;
import com.moonlit.moonlit.entity.Category;

public class CategoryMapper {
    public static CategoryResponse toResponse(Category c) {
        return new CategoryResponse(c.getId(), c.getName(), c.getScope().name());
    }
}
