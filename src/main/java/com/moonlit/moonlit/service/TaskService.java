package com.moonlit.moonlit.service;

import com.moonlit.moonlit.dto.TaskRequest;
import com.moonlit.moonlit.dto.TaskResponse;
import com.moonlit.moonlit.entity.*;
import com.moonlit.moonlit.mapper.TaskMapper;
import com.moonlit.moonlit.repository.CategoryRepository;
import com.moonlit.moonlit.repository.TaskRepository;
import com.moonlit.moonlit.repository.TimeframeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final CategoryRepository categoryRepository;
    private final TimeframeRepository timeframeRepository;

    public TaskService(TaskRepository taskRepository, CategoryRepository categoryRepository,
                        TimeframeRepository timeframeRepository) {
        this.taskRepository = taskRepository;
        this.categoryRepository = categoryRepository;
        this.timeframeRepository = timeframeRepository;
    }

    public List<TaskResponse> getTasks(User user) {
        return taskRepository.findByUserOrderByCreatedAtAsc(user)
                .stream().map(TaskMapper::toResponse).toList();
    }

    public TaskResponse createTask(User user, TaskRequest req) {
        Category category = CategoryService.getOwnedCategoryOrThrow(categoryRepository, req.categoryId(), user, CategoryScope.TASK);
        Timeframe timeframe = TimeframeService.getOwnedOrThrow(timeframeRepository, req.timeframeId(), user);

        Task task = new Task();
        task.setTitle(req.title());
        task.setCategory(category);
        task.setTimeframe(timeframe);
        task.setCompleted(req.completed());
        task.setUser(user);
        return TaskMapper.toResponse(taskRepository.save(task));
    }

    public TaskResponse updateTask(Long id, User user, TaskRequest req) {
        Task task = getOwnedTask(id, user);
        if (req.title() != null) task.setTitle(req.title());
        if (req.categoryId() != null) {
            task.setCategory(CategoryService.getOwnedCategoryOrThrow(categoryRepository, req.categoryId(), user, CategoryScope.TASK));
        }
        if (req.timeframeId() != null) {
            task.setTimeframe(TimeframeService.getOwnedOrThrow(timeframeRepository, req.timeframeId(), user));
        }
        task.setCompleted(req.completed());
        return TaskMapper.toResponse(taskRepository.save(task));
    }

    public TaskResponse toggleComplete(Long id, User user) {
        Task task = getOwnedTask(id, user);
        task.setCompleted(!task.isCompleted());
        return TaskMapper.toResponse(taskRepository.save(task));
    }

    public void deleteTask(Long id, User user) {
        taskRepository.delete(getOwnedTask(id, user));
    }

    private Task getOwnedTask(Long id, User user) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
        if (!task.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your task");
        }
        return task;
    }
}
