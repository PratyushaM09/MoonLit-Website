package com.moonlit.moonlit.mapper;

import com.moonlit.moonlit.dto.GoalItemResponse;
import com.moonlit.moonlit.dto.GoalResponse;
import com.moonlit.moonlit.entity.Goal;
import com.moonlit.moonlit.entity.GoalItem;

import java.util.List;

public class GoalMapper {
    public static GoalResponse toResponse(Goal g, List<GoalItem> items) {
        List<GoalItemResponse> itemResponses = items.stream()
                .map(i -> new GoalItemResponse(i.getId(), i.getText(), i.isCompleted()))
                .toList();
        return new GoalResponse(g.getId(), g.getTitle(), g.getCategory().getId(),
                g.getCategory().getName(), itemResponses);
    }
}
