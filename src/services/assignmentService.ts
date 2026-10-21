import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Assignment, Submission } from '../types';

const ASSIGNMENTS_COLLECTION = 'assignments';
const SUBMISSIONS_COLLECTION = 'submissions';

// Initial default assignments seeded if database has none
export const INITIAL_ASSIGNMENTS: Omit<Assignment, 'id'>[] = [
  {
    title: 'Assignment 1: Distributed Key-Value Store',
    courseCode: 'CS401 - Distributed Systems',
    description:
      'Design and document a high-throughput distributed key-value store supporting Raft consensus, partitioned hashing, and read replication. Submit your comprehensive technical architecture report in PDF or DOCX.',
    dueDate: '2026-11-05T23:59:59.000Z',
    maxMarks: 100,
    createdAt: new Date().toISOString(),
  },
  {
    title: 'Assignment 2: Neural Network Classifier from Scratch',
    courseCode: 'AI302 - Machine Learning',
    description:
      'Implement multi-layer backpropagation without high-level ML libraries. Include architecture diagrams, convergence plots, evaluation metrics (accuracy, F1-score), and hyperparameter tuning reflections in your report.',
    dueDate: '2026-11-12T23:59:59.000Z',
    maxMarks: 100,
    createdAt: new Date().toISOString(),
  },
  {
    title: 'Assignment 3: Cloud Microservices Deployment',
    courseCode: 'SE310 - Cloud Computing',
    description:
      'Submit your deployment report detailing Docker containerization, Kubernetes ingress configurations, load testing results, and CI/CD automated pipeline metrics.',
    dueDate: '2026-11-18T23:59:59.000Z',
    maxMarks: 50,
    createdAt: new Date().toISOString(),
  },
];

// Subscribe to assignments in real-time
export function subscribeToAssignments(
  onUpdate: (assignments: Assignment[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = collection(db, ASSIGNMENTS_COLLECTION);
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Assignment[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          title: data.title || '',
          courseCode: data.courseCode || '',
          description: data.description || '',
          dueDate: data.dueDate || '',
          maxMarks: data.maxMarks ?? 100,
          createdAt: data.createdAt || '',
        });
      });
      onUpdate(items);
    },
    (error) => {
      if (onError) {
        onError(error as Error);
      }
      handleFirestoreError(error, OperationType.GET, ASSIGNMENTS_COLLECTION);
    }
  );
}

// Seed initial assignments if collection is empty
export async function seedInitialAssignments(): Promise<void> {
  const path = ASSIGNMENTS_COLLECTION;
  try {
    for (let i = 0; i < INITIAL_ASSIGNMENTS.length; i++) {
      const item = INITIAL_ASSIGNMENTS[i];
      const docId = `asgn_seed_${i + 1}`;
      await setDoc(doc(db, path, docId), item, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Create new assignment
export async function createAssignment(assignment: Omit<Assignment, 'id'>): Promise<string> {
  const docId = `asgn_${Date.now()}`;
  const path = `${ASSIGNMENTS_COLLECTION}/${docId}`;
  try {
    await setDoc(doc(db, ASSIGNMENTS_COLLECTION, docId), assignment);
    return docId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Subscribe to submissions in real-time
export function subscribeToSubmissions(
  onUpdate: (submissions: Submission[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(collection(db, SUBMISSIONS_COLLECTION), orderBy('submittedAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Submission[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          studentName: data.studentName || '',
          rollNumber: data.rollNumber || '',
          assignmentId: data.assignmentId || '',
          assignmentTitle: data.assignmentTitle || '',
          fileName: data.fileName || '',
          fileType: data.fileType || '',
          fileSize: data.fileSize || 0,
          fileData: data.fileData || '',
          fileTextPreview: data.fileTextPreview || '',
          studentNotes: data.studentNotes || '',
          status: data.status || 'submitted',
          grade: data.grade,
          maxMarks: data.maxMarks ?? 100,
          teacherFeedback: data.teacherFeedback || '',
          submittedAt: data.submittedAt || '',
          gradedAt: data.gradedAt || '',
          gradedBy: data.gradedBy || '',
        });
      });
      onUpdate(items);
    },
    (error) => {
      if (onError) {
        onError(error as Error);
      }
      handleFirestoreError(error, OperationType.LIST, SUBMISSIONS_COLLECTION);
    }
  );
}

// Submit a new assignment
export async function submitAssignment(submission: Omit<Submission, 'id'>): Promise<string> {
  const cleanId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const path = `${SUBMISSIONS_COLLECTION}/${cleanId}`;
  try {
    await setDoc(doc(db, SUBMISSIONS_COLLECTION, cleanId), submission);
    return cleanId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Update grading and teacher feedback
export async function updateSubmissionGrade(
  submissionId: string,
  grade: number,
  feedback: string,
  teacherNameOrEmail: string
): Promise<void> {
  const path = `${SUBMISSIONS_COLLECTION}/${submissionId}`;
  try {
    const docRef = doc(db, SUBMISSIONS_COLLECTION, submissionId);
    await updateDoc(docRef, {
      grade,
      teacherFeedback: feedback,
      status: 'graded',
      gradedAt: new Date().toISOString(),
      gradedBy: teacherNameOrEmail,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Delete submission
export async function deleteSubmission(submissionId: string): Promise<void> {
  const path = `${SUBMISSIONS_COLLECTION}/${submissionId}`;
  try {
    await deleteDoc(doc(db, SUBMISSIONS_COLLECTION, submissionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
