package com.moonlit.moonlit.repository;

import com.moonlit.moonlit.entity.Goal;
import com.moonlit.moonlit.entity.GoalItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GoalItemRepository extends JpaRepository<GoalItem, Long> {
    List<GoalItem> findByGoal(Goal goal);
    List<GoalItem> findByGoalIn(List<Goal> goals);
}
