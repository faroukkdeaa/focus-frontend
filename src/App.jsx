import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import AiChat from './pages/AiChat';
import Remediation from './pages/Remediation';
import ForgotPassword from './pages/ForgotPassword';
import LessonInterface from './pages/LessonInterface';
import SubjectPage from './pages/SubjectPage';
import Quiz from './pages/Quiz';
import Profile from './pages/Profile';
import TeacherDashboard from './pages/TeacherDashboard';
import LandingPage from './pages/LandingPage';
import QuizResults from './pages/QuizResults';
import NotFound from './pages/NotFound';
import Settings from './pages/Settings';
import WeaknessReport from './pages/WeaknessReport';
import FocusedQuiz from './pages/FocusedQuiz';
import UploadWizard from './pages/UploadWizard';
import ProgressAnalytics from './pages/ProgressAnalytics';
import TeacherAnalytics from './pages/TeacherAnalytics';
import AdminDashboard from './pages/AdminDashboard';
import Notifications from './pages/Notifications';
import VideoDetails from './pages/VideoDetails';
import QuizDetails from './pages/QuizDetails';
import ProtectedRoute from './components/ProtectedRoute';
import { ProtectedLayout, PublicLayout } from './components/Layout';
import EditQuiz from './pages/EditQuiz';
import SearchResults from './pages/SearchResults';



function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public Routes ── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ── Public Routes WITH PublicLayout (simple navbar for visitors) ── */}
        <Route element={<PublicLayout />}>
          <Route path="/subject/:subjectId" element={<SubjectPage />} />
          <Route path="/search" element={<SearchResults />} />
        </Route>

        {/* ── Protected Routes WITH global Layout (navbar + drawer) ── */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard"         element={<Dashboard />} />
          <Route path="/ai-chat"           element={<AiChat />} />
          <Route path="/remediation"       element={<Remediation />} />
          <Route path="/profile"           element={<Profile />} />
          <Route path="/settings"          element={<Settings />} />
          <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
          <Route path="/progress"          element={<ProgressAnalytics />} />
          <Route path="/teacher-analytics" element={<TeacherAnalytics />} />
          <Route path="/admin-dashboard"   element={<AdminDashboard />} />
          <Route path="/notifications"     element={<Notifications />} />
          <Route path="/quiz-results"      element={<QuizResults />} />
          <Route path="/video-details/:id" element={<VideoDetails />} />
          <Route path="/quizzes-details/:id" element={<QuizDetails />} />
          <Route path="/edit-quiz/:id" element={<EditQuiz />} />
          <Route path="/weakness-report"   element={<WeaknessReport />} />
        </Route>

        {/* ── Protected Routes WITHOUT Layout (fullscreen / wizard flows) ── */}
        <Route path="/quiz/:lessonId/:teacherId/:quizId" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
        <Route path="/focused-quiz" element={<ProtectedRoute><FocusedQuiz /></ProtectedRoute>} />
        <Route path="/course-details" element={<ProtectedRoute><LessonInterface /></ProtectedRoute>} />
        <Route path="/upload-wizard" element={<ProtectedRoute><UploadWizard /></ProtectedRoute>} />

        {/* ── 404 Catch-All ── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;