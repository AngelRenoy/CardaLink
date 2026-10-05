import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { FarmerDashboard } from '../pages/FarmerDashboard';
import { TraderDashboard } from '../pages/TraderDashboard';
import { ExporterDashboard } from '../pages/ExporterDashboard';
import { AdminDashboard } from '../pages/AdminDashboard';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleProtectedRoute } from './RoleProtectedRoute';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Role Protected Dashboard Routes */}
      <Route
        path="/dashboard/farmer"
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRole="FARMER">
              <FarmerDashboard />
            </RoleProtectedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/trader"
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRole="TRADER">
              <TraderDashboard />
            </RoleProtectedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/exporter"
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRole="EXPORTER">
              <ExporterDashboard />
            </RoleProtectedRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/admin"
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRole="ADMIN">
              <AdminDashboard />
            </RoleProtectedRoute>
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect to Landing Page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
