package com.educollab.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AnalyticsResponse {

    private long totalStudents;
    private long pendingEnrollmentRequests;
    private long postsThisWeek;
    private long meetingsHeldThisMonth;
    private double averageAttendanceRate;   // 0.0–100.0
    private long pendingReports;
    private long restrictedStudentsCount;

    // Simple 7-day post activity series for a small chart
    private List<DailyCount> postsLast7Days;

    @Data
    @Builder
    public static class DailyCount {
        private String date;   // "2026-06-27"
        private long count;
    }
}
