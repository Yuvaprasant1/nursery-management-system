package com.nursery.common.util;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class DateUtils {

    private DateUtils() {
        // utility class
    }

    public static LocalDate today() {
        return LocalDate.now();
    }

    public static LocalDateTime now() {
        return LocalDateTime.now();
    }
}


