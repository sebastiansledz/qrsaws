import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Shield, User, Users, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import useAuth from '../../hooks/useAuth';
import { getClients, listClientsLite } from '../../lib/queriesSupabase';
import { inviteOrCreateUser } from '../../lib/authSupabase';
import { Client } from '../../types/client';
import { useNotify } from '../../lib/notify';


import UsersList from '../../features/admin/UsersList';
import InviteUser from '../../features/admin/InviteUser';

export const AdminUsers: React.FC = () => {
  const { loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Brak uprawnień do zarządzania użytkownikami.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Zarządzanie użytkownikami</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InviteUser />
        <UsersList />
      </div>
    </div>
  );
};

export default AdminUsers;