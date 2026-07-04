package com.moonlit.moonlit.service;

import com.moonlit.moonlit.dto.TimeframeRequest;
import com.moonlit.moonlit.dto.TimeframeResponse;
import com.moonlit.moonlit.entity.Timeframe;
import com.moonlit.moonlit.entity.User;
import com.moonlit.moonlit.mapper.TimeframeMapper;
import com.moonlit.moonlit.repository.TimeframeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class TimeframeService {

    private final TimeframeRepository timeframeRepository;

    public TimeframeService(TimeframeRepository timeframeRepository) {
        this.timeframeRepository = timeframeRepository;
    }

    public List<TimeframeResponse> getTimeframes(User user) {
        return timeframeRepository.findByUserOrderByCreatedAtAsc(user)
                .stream().map(TimeframeMapper::toResponse).toList();
    }

    public TimeframeResponse create(User user, TimeframeRequest req) {
        Timeframe t = new Timeframe();
        t.setName(req.name());
        t.setUser(user);
        return TimeframeMapper.toResponse(timeframeRepository.save(t));
    }

    public void delete(Long id, User user) {
        Timeframe t = timeframeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Timeframe not found"));
        if (!t.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your timeframe");
        }
        timeframeRepository.delete(t);
    }

    public static Timeframe getOwnedOrThrow(TimeframeRepository repo, Long id, User user) {
        Timeframe t = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid timeframe"));
        if (!t.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid timeframe for this user");
        }
        return t;
    }
}
