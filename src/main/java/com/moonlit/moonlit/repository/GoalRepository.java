package com.moonlit.moonlit.repository;

import com.moonlit.moonlit.entity.Goal;
import com.moonlit.moonlit.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GoalRepository extends JpaRepository<Goal, Long> {
    List<Goal> findByUserOrderByCreatedAtAsc(User user);
}
