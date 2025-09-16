import React, { createContext, useContext, useState } from 'react';

const AdminBotContext = createContext();

export const useAdminBot = () => {
  const context = useContext(AdminBotContext);
  if (!context) {
    throw new Error('useAdminBot must be used within an AdminBotProvider');
  }
  return context;
};

export const AdminBotProvider = ({ children }) => {
  const [isAdminBotOpen, setIsAdminBotOpen] = useState(false);

  const openAdminBot = () => setIsAdminBotOpen(true);
  const closeAdminBot = () => setIsAdminBotOpen(false);

  return (
    <AdminBotContext.Provider value={{
      isAdminBotOpen,
      openAdminBot,
      closeAdminBot
    }}>
      {children}
    </AdminBotContext.Provider>
  );
};
