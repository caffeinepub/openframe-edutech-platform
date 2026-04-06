import type {
  Certificate,
  Course,
  ExamAttempt,
  ExamQuestion,
  FieldExecutive,
  Notification,
  Registration,
  Student,
} from "../types/models";

const KEYS = {
  FES: "openframe_fes",
  COURSES: "openframe_courses",
  QUESTIONS: "openframe_questions",
  REGISTRATIONS: "openframe_registrations",
  STUDENTS: "openframe_students",
  EXAM_ATTEMPTS: "openframe_exam_attempts",
  CERTIFICATES: "openframe_certificates",
  NOTIFICATIONS: "openframe_notifications",
  SEEDED: "openframe_seeded",
  SESSION: "openframe_session",
  MIGRATED_V1: "openframe_migrated_v1",
};

function getItem<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function setItem<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ---- MIGRATION: reset fake placeholder principals ----
function migrateV1(): void {
  if (localStorage.getItem(KEYS.MIGRATED_V1)) return;
  const fes = getItem<FieldExecutive>(KEYS.FES);
  const migrated = fes.map((fe) =>
    fe.principal.startsWith("fe-principal-") ? { ...fe, principal: "" } : fe,
  );
  setItem(KEYS.FES, migrated);
  localStorage.setItem(KEYS.MIGRATED_V1, "true");
}

// ---- SEED DATA ----
export function seedIfNeeded(): void {
  // Always run migration first, even if already seeded
  migrateV1();

  if (localStorage.getItem(KEYS.SEEDED)) return;

  const courses: Course[] = [
    {
      id: 1,
      title: "Web Fundamentals",
      courseType: "Basic",
      description:
        "Learn the core building blocks of the web: HTML, CSS, and JavaScript. Perfect for beginners starting their tech journey.",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      notes:
        "HTML5 semantic elements, CSS Flexbox & Grid, JavaScript ES6+, DOM manipulation, responsive design fundamentals.",
      price: 2999,
      passingScore: 60,
      isActive: true,
      createdAt: "2024-01-15T10:00:00.000Z",
    },
    {
      id: 2,
      title: "Full Stack Development",
      courseType: "Standard",
      description:
        "Master both frontend and backend development with React, Node.js, and MongoDB. Build real-world projects from scratch.",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      notes:
        "React 18, Node.js, Express, MongoDB, REST APIs, Authentication, Deployment on cloud platforms.",
      price: 5999,
      passingScore: 65,
      isActive: true,
      createdAt: "2024-01-15T10:00:00.000Z",
    },
    {
      id: 3,
      title: "Advanced Software Engineering",
      courseType: "Premium",
      description:
        "Deep dive into system design, microservices, DevOps, and enterprise-grade software architecture. For experienced developers.",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      notes:
        "System design patterns, Microservices architecture, Docker & Kubernetes, CI/CD pipelines, Cloud architecture (AWS/GCP), Performance optimization.",
      price: 9999,
      passingScore: 70,
      isActive: true,
      createdAt: "2024-01-15T10:00:00.000Z",
    },
  ];

  const questions: ExamQuestion[] = [
    // Course 1 - Web Fundamentals
    {
      id: 1,
      courseId: 1,
      question: "Which HTML tag is used to define an internal style sheet?",
      options: ["<script>", "<css>", "<style>", "<link>"],
      correctIndex: 2,
    },
    {
      id: 2,
      courseId: 1,
      question: "What does CSS stand for?",
      options: [
        "Creative Style Sheets",
        "Cascading Style Sheets",
        "Computer Style Sheets",
        "Colorful Style Sheets",
      ],
      correctIndex: 1,
    },
    {
      id: 3,
      courseId: 1,
      question:
        "Which JavaScript method is used to select elements by class name?",
      options: [
        "getElementById()",
        "getElementByClass()",
        "getElementsByClassName()",
        "querySelector()",
      ],
      correctIndex: 2,
    },
    {
      id: 4,
      courseId: 1,
      question: "What is the correct syntax for a CSS Flexbox container?",
      options: [
        "display: block;",
        "display: flex;",
        "display: grid;",
        "display: inline;",
      ],
      correctIndex: 1,
    },
    {
      id: 5,
      courseId: 1,
      question:
        "Which HTML attribute specifies an alternate text for an image?",
      options: ["title", "src", "alt", "href"],
      correctIndex: 2,
    },
    // Course 2 - Full Stack
    {
      id: 6,
      courseId: 2,
      question: "What is React's virtual DOM?",
      options: [
        "A direct copy of the browser DOM",
        "A lightweight JavaScript representation of the real DOM",
        "A server-side rendering technique",
        "A database management system",
      ],
      correctIndex: 1,
    },
    {
      id: 7,
      courseId: 2,
      question:
        "Which hook is used to manage state in React functional components?",
      options: ["useEffect", "useContext", "useState", "useReducer"],
      correctIndex: 2,
    },
    {
      id: 8,
      courseId: 2,
      question: "What is the primary purpose of Express.js?",
      options: [
        "Frontend framework",
        "Database ORM",
        "Minimalist web framework for Node.js",
        "Testing library",
      ],
      correctIndex: 2,
    },
    {
      id: 9,
      courseId: 2,
      question: "In REST APIs, which HTTP method is used to update a resource?",
      options: ["GET", "POST", "PUT", "DELETE"],
      correctIndex: 2,
    },
    {
      id: 10,
      courseId: 2,
      question: "What is MongoDB?",
      options: [
        "A relational database",
        "A NoSQL document database",
        "A graph database",
        "An in-memory cache",
      ],
      correctIndex: 1,
    },
    // Course 3 - Advanced
    {
      id: 11,
      courseId: 3,
      question: "What is the primary benefit of microservices architecture?",
      options: [
        "Simpler codebase",
        "Independent deployment and scalability of services",
        "Faster development speed",
        "Reduced infrastructure costs",
      ],
      correctIndex: 1,
    },
    {
      id: 12,
      courseId: 3,
      question: "What does Docker primarily solve?",
      options: [
        "Database performance",
        "Frontend rendering",
        "Application containerization and portability",
        "Network security",
      ],
      correctIndex: 2,
    },
    {
      id: 13,
      courseId: 3,
      question: "In Kubernetes, what is a Pod?",
      options: [
        "A virtual machine",
        "The smallest deployable unit that can contain one or more containers",
        "A load balancer",
        "A storage volume",
      ],
      correctIndex: 1,
    },
    {
      id: 14,
      courseId: 3,
      question: "What is CI/CD?",
      options: [
        "Cache Invalidation / Content Delivery",
        "Continuous Integration / Continuous Deployment",
        "Code Inspection / Code Deployment",
        "Component Interface / Component Design",
      ],
      correctIndex: 1,
    },
    {
      id: 15,
      courseId: 3,
      question:
        "Which design pattern decouples the creation of objects from their usage?",
      options: ["Singleton", "Observer", "Factory", "Decorator"],
      correctIndex: 2,
    },
  ];

  const fes: FieldExecutive[] = [
    {
      id: 1,
      feCode: "FE001",
      name: "Rahul Sharma",
      phone: "9876543210",
      principal: "",
      createdAt: "2024-02-01T09:00:00.000Z",
      isActive: true,
    },
    {
      id: 2,
      feCode: "FE002",
      name: "Priya Singh",
      phone: "9876543211",
      principal: "",
      createdAt: "2024-02-05T09:00:00.000Z",
      isActive: true,
    },
  ];

  const students: Student[] = [
    {
      id: 1,
      name: "Amit Kumar",
      phone: "9812345678",
      principal: "student-principal-001",
      registrationId: 1,
      createdAt: "2024-03-01T10:00:00.000Z",
    },
    {
      id: 2,
      name: "Sneha Patel",
      phone: "9823456789",
      principal: "student-principal-002",
      registrationId: 2,
      createdAt: "2024-03-05T11:00:00.000Z",
    },
    {
      id: 3,
      name: "Vikram Reddy",
      phone: "9834567890",
      principal: "student-principal-003",
      registrationId: 3,
      createdAt: "2024-03-10T12:00:00.000Z",
    },
  ];

  const registrations: Registration[] = [
    {
      id: 1,
      studentName: "Amit Kumar",
      studentPhone: "9812345678",
      feId: 1,
      feName: "Rahul Sharma",
      feCode: "FE001",
      courseId: 2,
      courseName: "Full Stack Development",
      courseType: "Standard",
      price: 5999,
      status: "Approved",
      paymentStatus: "Paid",
      classLink: "https://meet.google.com/abc-defg-hij",
      schedule: "Mon, Wed, Fri — 7:00 PM to 9:00 PM IST",
      createdAt: "2024-03-01T10:00:00.000Z",
      updatedAt: "2024-03-03T14:00:00.000Z",
    },
    {
      id: 2,
      studentName: "Sneha Patel",
      studentPhone: "9823456789",
      feId: 2,
      feName: "Priya Singh",
      feCode: "FE002",
      courseId: 1,
      courseName: "Web Fundamentals",
      courseType: "Basic",
      price: 2999,
      status: "Approved",
      paymentStatus: "Pending",
      classLink: "",
      schedule: "",
      createdAt: "2024-03-05T11:00:00.000Z",
      updatedAt: "2024-03-06T10:00:00.000Z",
    },
    {
      id: 3,
      studentName: "Vikram Reddy",
      studentPhone: "9834567890",
      feId: 1,
      feName: "Rahul Sharma",
      feCode: "FE001",
      courseId: 3,
      courseName: "Advanced Software Engineering",
      courseType: "Premium",
      price: 9999,
      status: "Pending",
      paymentStatus: "Pending",
      classLink: "",
      schedule: "",
      createdAt: "2024-03-10T12:00:00.000Z",
      updatedAt: "2024-03-10T12:00:00.000Z",
    },
  ];

  const examAttempts: ExamAttempt[] = [
    {
      id: 1,
      studentId: 1,
      registrationId: 1,
      courseId: 2,
      answers: [1, 2, 2, 2, 1],
      score: 80,
      passed: true,
      takenAt: "2024-04-01T15:00:00.000Z",
    },
  ];

  const certificates: Certificate[] = [
    {
      id: 1,
      studentId: 1,
      registrationId: 1,
      courseId: 2,
      studentName: "Amit Kumar",
      courseName: "Full Stack Development",
      certNumber: "CERT-2024-00001",
      issuedAt: "2024-04-01T15:30:00.000Z",
    },
  ];

  const notifications: Notification[] = [
    {
      id: 1,
      recipientType: "all_fe",
      recipientId: null,
      message:
        "Welcome to OpenFrame! Please complete your onboarding and start registering students for the new batch starting April 2024.",
      isRead: false,
      createdAt: "2024-03-01T09:00:00.000Z",
    },
    {
      id: 2,
      recipientType: "fe",
      recipientId: 1,
      message:
        "Congratulations Rahul! You have been assigned as the top performer for March 2024. Keep up the great work!",
      isRead: true,
      createdAt: "2024-04-01T10:00:00.000Z",
    },
  ];

  setItem(KEYS.COURSES, courses);
  setItem(KEYS.QUESTIONS, questions);
  setItem(KEYS.FES, fes);
  setItem(KEYS.STUDENTS, students);
  setItem(KEYS.REGISTRATIONS, registrations);
  setItem(KEYS.EXAM_ATTEMPTS, examAttempts);
  setItem(KEYS.CERTIFICATES, certificates);
  setItem(KEYS.NOTIFICATIONS, notifications);
  localStorage.setItem(KEYS.SEEDED, "true");
}

// ---- CRUD HELPERS ----
export const db = {
  // Field Executives
  getFEs: (): FieldExecutive[] => getItem<FieldExecutive>(KEYS.FES),
  saveFEs: (fes: FieldExecutive[]) => setItem(KEYS.FES, fes),

  // Courses
  getCourses: (): Course[] => getItem<Course>(KEYS.COURSES),
  saveCourses: (courses: Course[]) => setItem(KEYS.COURSES, courses),

  // Questions
  getQuestions: (): ExamQuestion[] => getItem<ExamQuestion>(KEYS.QUESTIONS),
  saveQuestions: (questions: ExamQuestion[]) =>
    setItem(KEYS.QUESTIONS, questions),

  // Registrations
  getRegistrations: (): Registration[] =>
    getItem<Registration>(KEYS.REGISTRATIONS),
  saveRegistrations: (regs: Registration[]) =>
    setItem(KEYS.REGISTRATIONS, regs),

  // Students
  getStudents: (): Student[] => getItem<Student>(KEYS.STUDENTS),
  saveStudents: (students: Student[]) => setItem(KEYS.STUDENTS, students),

  // Exam Attempts
  getExamAttempts: (): ExamAttempt[] =>
    getItem<ExamAttempt>(KEYS.EXAM_ATTEMPTS),
  saveExamAttempts: (attempts: ExamAttempt[]) =>
    setItem(KEYS.EXAM_ATTEMPTS, attempts),

  // Certificates
  getCertificates: (): Certificate[] => getItem<Certificate>(KEYS.CERTIFICATES),
  saveCertificates: (certs: Certificate[]) => setItem(KEYS.CERTIFICATES, certs),

  // Notifications
  getNotifications: (): Notification[] =>
    getItem<Notification>(KEYS.NOTIFICATIONS),
  saveNotifications: (notifs: Notification[]) =>
    setItem(KEYS.NOTIFICATIONS, notifs),

  // Session
  getSession: () => {
    try {
      const raw = localStorage.getItem(KEYS.SESSION);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  saveSession: (session: unknown) =>
    localStorage.setItem(KEYS.SESSION, JSON.stringify(session)),
  clearSession: () => localStorage.removeItem(KEYS.SESSION),

  // Helpers: get next id
  nextId: (items: { id: number }[]): number =>
    items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1,
};
