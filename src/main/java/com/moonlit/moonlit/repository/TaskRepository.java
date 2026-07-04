package com.moonlit.moonlit.repository;

import com.moonlit.moonlit.entity.Task;
import com.moonlit.moonlit.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByUserOrderByCreatedAtAsc(User user);
}
