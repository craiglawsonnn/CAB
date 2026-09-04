import { siteConfig } from '@/content/site';
import AdminDashboard from './AdminDashboard';

export default function AdminDashboardPage() {
  return <AdminDashboard initialContent={siteConfig} />;
}
