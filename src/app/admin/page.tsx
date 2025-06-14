import { DashboardSidebar } from '@/components/ui/dashboard-sidebar';
import { DashboardBreadcrumb } from '@/components/ui/dashboard-breadcrumb';
import AdminDashboard from './components/AdminDashboard';

export default function AdminPage() {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardBreadcrumb />
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
          <p className="text-lg mb-8">
            Welcome to the admin section. Here you can manage various aspects of
            the ScaleSmart Platform.
          </p>
          <AdminDashboard />
        </main>
      </div>
    </div>
  );
}
