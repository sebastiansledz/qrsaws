import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SignIn } from './SignIn';
import { SignUp } from './SignUp';
import { Reset } from './Reset';

export default function AuthRoutes() {
  return (
    <Routes>
      <Route path="signin" element={<SignIn />} />
      <Route path="signup" element={<SignUp />} />
      <Route path="reset" element={<Reset />} />
      <Route path="*" element={<Navigate to="/auth/signin" replace />} />
    </Routes>
  );
}