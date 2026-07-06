package com.educollab.repository.mongo;

import com.educollab.document.Report;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends MongoRepository<Report, String> {

    List<Report> findByReportedUserIdInAndStatusOrderByCreatedAtDesc(List<Long> reportedUserIds, Report.ReportStatus status);

    List<Report> findByReportedUserIdInOrderByCreatedAtDesc(List<Long> reportedUserIds);

    long countByReportedUserIdInAndStatus(List<Long> reportedUserIds, Report.ReportStatus status);
}
