import React from 'react';
import SignupPage from '../components/SignupPage';
import MainLayout from '../components/MainLayout';

export default function Signup() {
  return (
    <MainLayout title="Sign Up - Scientific Computing for Drug Discovery">
      <SignupPage />
    </MainLayout>
  );
}