import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Typography, Tabs, Tab, CircularProgress, Alert, Badge } from '@mui/material'
import MainLayout from '../../components/layout/MainLayout'
import {
  fetchAdminStudents, fetchAnalytics, fetchAuditLogs, fetchReports,
} from '../../store/slices/adminSlice'
import AnalyticsOverview from '../../components/admin/AnalyticsOverview'
import StudentManagementPanel from '../../components/admin/StudentManagementPanel'
import ReportsQueuePanel from '../../components/admin/ReportsQueuePanel'
import AuditLogPanel from '../../components/admin/AuditLogPanel'

const AdminDashboardPage = () => {
  const dispatch = useDispatch()
  const [tab, setTab] = useState('overview')

  const { students, studentsLoading, studentsError, analytics, analyticsLoading,
    auditLogs, reports, reportsLoading } = useSelector((s) => s.admin)

  useEffect(() => {
    dispatch(fetchAnalytics())
    dispatch(fetchAdminStudents())
    dispatch(fetchReports('all'))
    dispatch(fetchAuditLogs(0))
  }, [dispatch])

  const pendingReportCount = reports.filter((r) => r.status === 'PENDING').length

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, md: 3 } }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>Admin Dashboard</Typography>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab value="overview" label="Overview" />
          <Tab value="students" label="Students" />
          <Tab value="reports" label={
            <Badge badgeContent={pendingReportCount} color="error" sx={{ pr: pendingReportCount ? 1.5 : 0 }}>
              Reports
            </Badge>
          } />
          <Tab value="audit" label="Audit Log" />
        </Tabs>

        {tab === 'overview' && (
          analyticsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
          ) : (
            <AnalyticsOverview analytics={analytics} />
          )
        )}

        {tab === 'students' && (
          <>
            {studentsError && <Alert severity="error" sx={{ mb: 2 }}>{studentsError}</Alert>}
            {studentsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
            ) : (
              <StudentManagementPanel students={students} />
            )}
          </>
        )}

        {tab === 'reports' && (
          reportsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
          ) : (
            <ReportsQueuePanel reports={reports} />
          )
        )}

        {tab === 'audit' && (
          <AuditLogPanel auditLogs={auditLogs} onPageChange={(page) => dispatch(fetchAuditLogs(page))} />
        )}
      </Box>
    </MainLayout>
  )
}

export default AdminDashboardPage
