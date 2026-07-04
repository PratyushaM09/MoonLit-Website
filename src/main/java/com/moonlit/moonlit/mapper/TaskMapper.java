package com.moonlit.moonlit.mapper;

import com.moonlit.moonlit.dto.TaskResponse;
import com.moonlit.moonlit.entity.Task;

public class TaskMapper {
    public static TaskResponse toResponse(Task t) {
        return new TaskResponse(
                t.getId(), t.getTitle(),
                t.getCategory().getId(), t.getCategory().getName(),
                t.getTimeframe().getId(), t.getTimeframe().getName(),
                t.isCompleted(), t.getCreatedAt()
        );
    }
}
