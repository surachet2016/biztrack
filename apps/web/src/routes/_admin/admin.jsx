import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_admin/admin')({
  component: AdminSection,
});

// Layout wrapper — child routes (index, users, payments, settings) render via <Outlet />
function AdminSection() {
  return <Outlet />;
}
