import { DashboardLayout } from '@/components/dashboard/layout'
import { RoleProtectedRoute } from '@/features/common/authContext'
import React from 'react'

const TeacherLayout = ({children} : {children: React.ReactNode}) => {
  return (
   <RoleProtectedRoute allowedRoles={['Teacher']}>
     <DashboardLayout>{children}</DashboardLayout>
   </RoleProtectedRoute>
  )
}

export default TeacherLayout