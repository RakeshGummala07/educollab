import { useState } from 'react'
import { useDispatch } from 'react-redux'
import {
  Table, TableHead, TableRow, TableCell, TableBody, Avatar, Stack, Typography,
  Chip, IconButton, Menu, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Button, Tooltip,
} from '@mui/material'
import {
  MoreVert as MoreVertIcon, VolumeOff as MuteIcon, VolumeUp as UnmuteIcon,
  Lock as LockIcon, LockOpen as LockOpenIcon, PersonRemove as RemoveIcon,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import {
  removeStudentAdmin, restrictChatAdmin, unrestrictChatAdmin,
  lockAccountAdmin, unlockAccountAdmin,
} from '../../store/slices/adminSlice'

const StudentManagementPanel = ({ students }) => {
  const dispatch = useDispatch()
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [menuTarget, setMenuTarget] = useState(null)
  const [restrictDialogOpen, setRestrictDialogOpen] = useState(false)
  const [restrictReason, setRestrictReason] = useState('')

  const openMenu = (e, student) => { setMenuAnchor(e.currentTarget); setMenuTarget(student) }
  const closeMenu = () => { setMenuAnchor(null); setMenuTarget(null) }

  const run = async (action, successMsg) => {
    const result = await dispatch(action)
    if (result.meta.requestStatus === 'fulfilled') toast.success(successMsg)
    else toast.error(result.payload || 'Action failed')
    closeMenu()
  }

  const handleRemove = () => {
    if (!window.confirm(`Remove ${menuTarget.fullName} from your classroom?`)) { closeMenu(); return }
    run(removeStudentAdmin(menuTarget.id), 'Student removed')
  }

  const handleRestrictSubmit = async () => {
    if (!restrictReason.trim()) return
    await run(restrictChatAdmin({ studentId: menuTarget.id, reason: restrictReason }), 'Chat restricted')
    setRestrictDialogOpen(false)
    setRestrictReason('')
  }

  return (
    <>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Student</TableCell>
            <TableCell>Account</TableCell>
            <TableCell>Chat</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {students.map((s) => (
            <TableRow key={s.id}>
              <TableCell>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar src={s.avatarUrl} sx={{ width: 32, height: 32 }}>{s.fullName?.[0]}</Avatar>
                  <div>
                    <Typography variant="body2" fontWeight={600}>{s.fullName}</Typography>
                    <Typography variant="caption" color="text.secondary">{s.email}</Typography>
                  </div>
                </Stack>
              </TableCell>
              <TableCell>
                <Chip size="small" label={s.accountNonLocked ? 'Active' : 'Suspended'}
                  color={s.accountNonLocked ? 'success' : 'error'} />
              </TableCell>
              <TableCell>
                {s.chatRestricted ? (
                  <Tooltip title={s.chatRestrictedReason || ''}>
                    <Chip size="small" label="Restricted" color="warning" />
                  </Tooltip>
                ) : (
                  <Chip size="small" label="Normal" variant="outlined" />
                )}
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" onClick={(e) => openMenu(e, s)}>
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {students.length === 0 && (
            <TableRow><TableCell colSpan={4} align="center">No students enrolled yet</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeMenu}>
        {menuTarget?.chatRestricted ? (
          <MenuItem onClick={() => run(unrestrictChatAdmin(menuTarget.id), 'Chat restriction lifted')}>
            <UnmuteIcon fontSize="small" sx={{ mr: 1 }} /> Lift chat restriction
          </MenuItem>
        ) : (
          <MenuItem onClick={() => { setRestrictDialogOpen(true); setMenuAnchor(null) }}>
            <MuteIcon fontSize="small" sx={{ mr: 1 }} /> Restrict chat
          </MenuItem>
        )}
        {menuTarget?.accountNonLocked ? (
          <MenuItem onClick={() => run(lockAccountAdmin(menuTarget.id), 'Account suspended')}>
            <LockIcon fontSize="small" sx={{ mr: 1 }} /> Suspend account
          </MenuItem>
        ) : (
          <MenuItem onClick={() => run(unlockAccountAdmin(menuTarget.id), 'Account unsuspended')}>
            <LockOpenIcon fontSize="small" sx={{ mr: 1 }} /> Unsuspend account
          </MenuItem>
        )}
        <MenuItem onClick={handleRemove} sx={{ color: 'error.main' }}>
          <RemoveIcon fontSize="small" sx={{ mr: 1 }} /> Remove from classroom
        </MenuItem>
      </Menu>

      <Dialog open={restrictDialogOpen} onClose={() => setRestrictDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Restrict chat for {menuTarget?.fullName}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth multiline rows={3} sx={{ mt: 1 }}
            label="Reason" value={restrictReason} onChange={(e) => setRestrictReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRestrictDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button onClick={handleRestrictSubmit} variant="contained" color="warning" disabled={!restrictReason.trim()}>
            Restrict
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default StudentManagementPanel
