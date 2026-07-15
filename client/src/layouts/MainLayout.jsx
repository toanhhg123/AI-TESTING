import { Outlet } from 'react-router-dom';

import Footer from '../components/Footer.jsx';
import Header from '../components/Header.jsx';
import ChatbotBubble from '../components/ChatbotBubble.jsx';

export default function MainLayout() {
  return (
    <div className="app-shell">
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      <ChatbotBubble />
    </div>
  );
}
