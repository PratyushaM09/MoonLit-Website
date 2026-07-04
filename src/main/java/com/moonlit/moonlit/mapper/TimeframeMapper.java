package com.moonlit.moonlit.mapper;

import com.moonlit.moonlit.dto.TimeframeResponse;
import com.moonlit.moonlit.entity.Timeframe;

public class TimeframeMapper {
    public static TimeframeResponse toResponse(Timeframe t) {
        return new TimeframeResponse(t.getId(), t.getName());
    }
}
