import AppRoutes from './routes/AppRoutes.jsx';
import { NotificationProvider } from './components/NotificationProvider.jsx';

export default function App() {
  return (
    <NotificationProvider>
      <AppRoutes />
    </NotificationProvider>
  );
}
