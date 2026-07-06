import { Table, TableHead, TableRow, TableCell, TableBody, Chip, Typography, Pagination, Stack } from '@mui/material'
import { format } from 'date-fns'

const ACTION_LABELS = {
  STUDENT_REMOVED: 'Student removed',
  CHAT_RESTRICTED: 'Chat restricted',
  CHAT_UNRESTRICTED: 'Chat unrestricted',
  ACCOUNT_LOCKED: 'Account suspended',
  ACCOUNT_UNLOCKED: 'Account unsuspended',
  REPORT_RESOLVED: 'Report resolved',
  REPORT_DISMISSED: 'Report dismissed',
}

const AuditLogPanel = ({ auditLogs, onPageChange }) => {
  const { content = [], totalPages = 0, page: currentPage = 0 } = auditLogs

  return (
    <>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>When</TableCell>
            <TableCell>Actor</TableCell>
            <TableCell>Action</TableCell>
            <TableCell>Details</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {content.map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(log.createdAt), 'MMM d, h:mm a')}
                </Typography>
              </TableCell>
              <TableCell>{log.actorName}</TableCell>
              <TableCell><Chip size="small" label={ACTION_LABELS[log.actionType] || log.actionType} /></TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">{log.details}</Typography>
              </TableCell>
            </TableRow>
          ))}
          {content.length === 0 && (
            <TableRow><TableCell colSpan={4} align="center">No admin actions recorded yet</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <Stack alignItems="center" sx={{ mt: 2 }}>
          <Pagination
            count={totalPages}
            page={currentPage + 1}
            onChange={(_, page) => onPageChange(page - 1)}
          />
        </Stack>
      )}
    </>
  )
}

export default AuditLogPanel
