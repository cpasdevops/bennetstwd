export interface Assignment {
  id: string;
  title: string;
  courseCode: string;
  description: string;
  dueDate: string;
  maxMarks: number;
  createdAt: string;
}

export type SubmissionStatus = 'submitted' | 'reviewed' | 'graded';

export interface Submission {
  id: string;
  studentName: string;
  rollNumber: string;
  assignmentId: string;
  assignmentTitle: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: string; // Base64 data URL
  fileTextPreview?: string;
  studentNotes?: string;
  status: SubmissionStatus;
  grade?: number;
  maxMarks: number;
  teacherFeedback?: string;
  submittedAt: string;
  gradedAt?: string;
  gradedBy?: string;
}

export interface SubmissionStats {
  total: number;
  graded: number;
  pending: number;
  averageScore: number;
}
