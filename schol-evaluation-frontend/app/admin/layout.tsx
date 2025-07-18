import { DashboardLayout } from "@/components/dashboard/layout"
import { RoleProtectedRoute } from "@/features/common/authContext"

const AdminLayout = ({children} : {children: React.ReactNode}) => {
  return (
   <RoleProtectedRoute allowedRoles={['Admin']}>
     <DashboardLayout>{children}</DashboardLayout>
   </RoleProtectedRoute>
  )
}
export default AdminLayout