package com.moonlit.moonlit.dto;

import java.util.List;

public record GoalResponse(Long id, String title, Long categoryId, String categoryName, List<GoalItemResponse> items) {}
