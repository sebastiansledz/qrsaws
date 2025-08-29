import React from 'react';
import { motion } from 'framer-motion';
import { Menu, User, LogOut, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import useAuth from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface NavBarProps {
  onMenuClick?: () => void;
}

export const NavBar: React.FC<NavBarProps> = ({ onMenuClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      // Immediately route to sign-in; ProtectedRoute will keep it honest
      navigate('/auth/signin', { replace: true });
    } catch (e) {
      // optional: toast error
      console.error('Sign out failed', e);
    }
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-900">QRSaws</h1>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 hidden sm:block">
              {user?.email || 'Użytkownik'}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-gray-100"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="hover:bg-gray-100"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};