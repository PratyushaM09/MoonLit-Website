package com.moonlit.moonlit.service;

import com.moonlit.moonlit.dto.GoalItemRequest;
import com.moonlit.moonlit.dto.GoalRequest;
import com.moonlit.moonlit.dto.GoalResponse;
import com.moonlit.moonlit.entity.*;
import com.moonlit.moonlit.mapper.GoalMapper;
import com.moonlit.moonlit.repository.CategoryRepository;
import com.moonlit.moonlit.repository.GoalItemRepository;
import com.moonlit.moonlit.repository.GoalRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class GoalService {

    private final GoalRepository goalRepository;
    private final GoalItemRepository goalItemRepository;
    private final CategoryRepository categoryRepository;

    public GoalService(GoalRepository goalRepository, GoalItemRepository goalItemRepository,
                        CategoryRepository categoryRepository) {
        this.goalRepository = goalRepository;
        this.goalItemRepository = goalItemRepository;
        this.categoryRepository = categoryRepository;
    }

    public List<GoalResponse> getGoals(User user) {
        List<Goal> goals = goalRepository.findByUserOrderByCreatedAtAsc(user);
        return goals.stream()
                .map(g -> GoalMapper.toResponse(g, goalItemRepository.findByGoal(g)))
                .toList();
    }

    public GoalResponse createGoal(User user, GoalRequest req) {
        Category category = CategoryService.getOwnedCategoryOrThrow(categoryRepository, req.categoryId(), user, CategoryScope.GOAL);
        Goal goal = new Goal();
        goal.setTitle(req.title());
        goal.setCategory(category);
        goal.setUser(user);
        goal = goalRepository.save(goal);
        return GoalMapper.toResponse(goal, List.of());
    }

    public void deleteGoal(Long id, User user) {
        goalRepository.delete(getOwnedGoal(id, user));
    }

    public GoalResponse addItem(Long goalId, User user, GoalItemRequest req) {
        Goal goal = getOwnedGoal(goalId, user);
        GoalItem item = new GoalItem();
        item.setText(req.text());
        item.setGoal(goal);
        goalItemRepository.save(item);
        return GoalMapper.toResponse(goal, goalItemRepository.findByGoal(goal));
    }

    public GoalResponse toggleItem(Long itemId, User user) {
        GoalItem item = goalItemRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));
        Goal goal = item.getGoal();
        assertOwned(goal, user);
        item.setCompleted(!item.isCompleted());
        goalItemRepository.save(item);
        return GoalMapper.toResponse(goal, goalItemRepository.findByGoal(goal));
    }

    public GoalResponse deleteItem(Long itemId, User user) {
        GoalItem item = goalItemRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));
        Goal goal = item.getGoal();
        assertOwned(goal, user);
        goalItemRepository.delete(item);
        return GoalMapper.toResponse(goal, goalItemRepository.findByGoal(goal));
    }

    private Goal getOwnedGoal(Long id, User user) {
        Goal goal = goalRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Goal not found"));
        assertOwned(goal, user);
        return goal;
    }

    private void assertOwned(Goal goal, User user) {
        if (!goal.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your goal");
        }
    }
}
