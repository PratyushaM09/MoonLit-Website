package com.moonlit.moonlit.dto;

import java.time.LocalDateTime;

public record TaskResponse(Long id, String title, Long categoryId, String categoryName,
                            Long timeframeId, String timeframeName, boolean completed,
                            LocalDateTime createdAt) {}
