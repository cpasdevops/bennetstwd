/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, testConnection } from './firebase';
import { Assignment, Submission } from './types';
import {
  subscribeToAssignments,
  subscribeToSubmissions,
  seedInitialAssignments,
} from './services/assignmentService';
import { Navbar, ActiveTab } from './components/Navbar';
import { StudentPortal } from './components/StudentPortal';
import { StudentSubmissionsList } from './components/StudentSubmissionsList';
import { TeacherDashboard } from './components/TeacherDashboard';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AlertCircle, RefreshCw, GraduationCap } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('student-submit');

  // Admin username and password login state (persisted in session)
  const [adminUser, setAdminUser] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('edusubmit_admin_user');
    } catch {
      return null;
    }
  });
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);

  // Firestore collections state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Modal states
  const [viewerSubmission, setViewerSubmission] = useState<Submission | null>(null);
  const [initialStatusRollNo, setInitialStatusRollNo] = useState<string>('');

  // 1. Connection check and Auth listener
  useEffect(() => {
    testConnection().catch((err) => {
      console.warn('Firebase test connection:', err);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user?.email === 'vidyasharma121@gmail.com' && !adminUser) {
        setAdminUser('vidyasharma121@gmail.com');
        try {
          sessionStorage.setItem('edusubmit_admin_user', 'vidyasharma121@gmail.com');
        } catch {}
      }
    });

    return () => unsubscribeAuth();
  }, [adminUser]);

  // 2. Real-time Firestore subscriptions
  useEffect(() => {
    setIsLoading(true);

    const unsubscribeAssignments = subscribeToAssignments(
      (items) => {
        setAssignments(items);
        if (items.length === 0) {
          seedInitialAssignments().catch((err) => {
            console.warn('Auto-seed assignments:', err);
          });
        }
        setIsLoading(false);
      },
      (err) => {
        console.error('Assignments subscription error:', err);
        setDbError('Could not sync assignments from Firestore.');
        setIsLoading(false);
      }
    );

    const unsubscribeSubmissions = subscribeToSubmissions(
      (items) => {
        setSubmissions(items);
        if (viewerSubmission) {
          const updated = items.find((s) => s.id === viewerSubmission.id);
          if (updated) setViewerSubmission(updated);
        }
      },
      (err) => {
        console.error('Submissions subscription error:', err);
        setDbError('Could not sync submissions from Firestore.');
      }
    );

    return () => {
      unsubscribeAssignments();
      unsubscribeSubmissions();
    };
  }, []);

  const handleAdminLoginSuccess = (user: string) => {
    setAdminUser(user);
    try {
      sessionStorage.setItem('edusubmit_admin_user', user);
    } catch {}
    setActiveTab('teacher-dashboard');
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    try {
      sessionStorage.removeItem('edusubmit_admin_user');
    } catch {}
    setActiveTab('student-submit');
  };

  // Compute pending submissions count for the navbar badge
  const pendingSubmissionsCount = submissions.filter((s) => s.status !== 'graded').length;

  const currentTeacherIdentifier = adminUser || 'Instructor (Admin)';

  const handleViewMySubmissions = (rollNo?: string) => {
    if (rollNo) setInitialStatusRollNo(rollNo);
    setActiveTab('student-status');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 antialiased font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        adminUser={adminUser}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onAdminLogout={handleAdminLogout}
        pendingCount={pendingSubmissionsCount}
      />

      {/* Database Error Banner if any */}
      {dbError && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{dbError}</span>
            </div>
            <button
              onClick={() => setDbError(null)}
              className="font-bold underline hover:text-amber-900"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {isLoading && submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm font-medium">Connecting to Firestore Database...</p>
          </div>
        ) : (
          <>
            {activeTab === 'student-submit' && (
              <StudentPortal
                currentUser={currentUser}
                onViewMySubmissions={handleViewMySubmissions}
              />
            )}

            {activeTab === 'student-status' && (
              <StudentSubmissionsList
                submissions={submissions}
                initialRollNo={initialStatusRollNo}
                onOpenViewer={(sub) => setViewerSubmission(sub)}
              />
            )}

            {activeTab === 'teacher-dashboard' && (
              <TeacherDashboard
                submissions={submissions}
                assignments={assignments}
                onOpenViewer={(sub) => setViewerSubmission(sub)}
                currentTeacherNameOrEmail={currentTeacherIdentifier}
              />
            )}
          </>
        )}
      </main>

      {/* Admin Username & Password Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* Document Viewer & Live Grading Modal */}
      <DocumentViewerModal
        submission={viewerSubmission}
        onClose={() => setViewerSubmission(null)}
        submissionsList={submissions}
        onSelectSubmission={(sub) => setViewerSubmission(sub)}
        currentTeacherNameOrEmail={currentTeacherIdentifier}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span>EduSubmit Academic Portal</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-400">Database-Driven Cloud Architecture</span>
          </div>
          <div className="text-slate-400">
            Real-time student submissions & teacher grading powered by Firebase Firestore
          </div>
        </div>
      </footer>
    </div>
  );
}
