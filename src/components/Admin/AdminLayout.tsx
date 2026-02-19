import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';

export const AdminLayout: React.FC = () => {
  const [messagesUnread, setMessagesUnread] = useState(0);

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar messagesUnread={messagesUnread} />
      <main className="flex-1 p-8 overflow-auto">
        <Outlet context={{ setMessagesUnread }} />
      </main>
    </div>
  );
};
