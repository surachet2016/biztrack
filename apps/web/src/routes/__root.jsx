import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { Toaster } from '@/components/ui/toaster';

export const Route = createRootRouteWithContext()({
  component: () => (
    <>
      <Outlet />
      <Toaster />
    </>
  ),
});
