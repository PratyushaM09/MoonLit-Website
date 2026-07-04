package com.moonlit.moonlit.repository;

import com.moonlit.moonlit.entity.Timeframe;
import com.moonlit.moonlit.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TimeframeRepository extends JpaRepository<Timeframe, Long> {
    List<Timeframe> findByUserOrderByCreatedAtAsc(User user);
}
