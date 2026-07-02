import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  loginUser,
  registerUser,
  logoutUser,
  clearError,
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
} from '../store/slices/authSlice'

export const useAuth = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const user = useSelector(selectCurrentUser)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isLoading = useSelector(selectAuthLoading)
  const error = useSelector(selectAuthError)

  const login = async (credentials) => {
    const result = await dispatch(loginUser(credentials))
    if (loginUser.fulfilled.match(result)) {
      navigate('/dashboard')
      return { success: true }
    }
    return { success: false, error: result.payload }
  }

  const register = async (userData) => {
    const result = await dispatch(registerUser(userData))
    if (registerUser.fulfilled.match(result)) {
      navigate('/dashboard')
      return { success: true }
    }
    return { success: false, error: result.payload }
  }

  const logout = async () => {
    await dispatch(logoutUser())
    navigate('/login')
  }

  const dismissError = () => dispatch(clearError())

  const isTeacher = user?.role === 'ROLE_TEACHER'
  const isStudent = user?.role === 'ROLE_STUDENT'

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    isTeacher,
    isStudent,
    login,
    register,
    logout,
    dismissError,
  }
}
