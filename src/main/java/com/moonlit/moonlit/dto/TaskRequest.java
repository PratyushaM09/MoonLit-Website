package com.moonlit.moonlit.dto;

public record TaskRequest(String title, Long categoryId, Long timeframeId, boolean completed) {}
