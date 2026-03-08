import { Routes, Route } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import AuthGuard from './components/layout/AuthGuard'
import AdminGuard from './components/layout/AdminGuard'
import DashboardPage from './features/dashboard/DashboardPage'
import Chapter2Page from './features/learning-modules/Chapter2Page'
import Chapter7Page from './features/learning-modules/Chapter7Page'
import Chapter7ListPage from './features/learning-modules/Chapter7ListPage'
import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import APActivityPage from './features/learning-modules/APActivityPage'
import RobotManualPage from './features/learning-modules/RobotManualPage'
import AdminLayout from './features/admin/AdminLayout'
import AdminDashboardPage from './features/admin/AdminDashboardPage'
import AdminUsersPage from './features/admin/AdminUsersPage'
import AdminLogsPage from './features/admin/AdminLogsPage'
import AdminQuestionsPage from './features/admin/AdminQuestionsPage'
import TestPage from './features/learning-modules/TestPage'
import ProfileDashboardPage from './features/profile/ProfileDashboardPage'
import QuestionnairePage from './features/questionnaire/QuestionnairePage'
import ProfileSetupPage from './features/auth/ProfileSetupPage'

function App() {
    return (
        <Routes>
            {/* ── Auth Routes (public) ── */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile-setup" element={<ProfileSetupPage />} />

            {/* ── Protected Routes (browser with login) ── */}
            <Route path="/" element={
                <AuthGuard>
                    <MainLayout />
                </AuthGuard>
            }>
                <Route index element={<DashboardPage />} />
                <Route path="profile" element={<ProfileDashboardPage />} />
                <Route path="chapter2" element={<Chapter2Page />} />
                <Route path="chapter7" element={<Chapter7ListPage />} />
                <Route path="test/:type/:chapter" element={<TestPage />} />
                <Route path="questionnaire/:chapter" element={<QuestionnairePage />} />
            </Route>

            {/* ── Admin Routes ── */}
            <Route path="/admin" element={
                <AdminGuard>
                    <AdminLayout />
                </AdminGuard>
            }>
                <Route index element={<AdminDashboardPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="logs" element={<AdminLogsPage />} />
                <Route path="questions" element={<AdminQuestionsPage />} />
            </Route>

            {/* ── Embedded Routes (React Native WebView — no auth guard, token injected) ── */}
            <Route path="/embed/chapter7" element={<Chapter7Page isEmbedded />} />
            <Route path="/embed/ap-k7-02" element={<APActivityPage activityId="ap-k7-02" />} />
            <Route path="/embed/ap-k7-03" element={<APActivityPage activityId="ap-k7-03" />} />
            <Route path="/embed/ap-k7-04" element={<APActivityPage activityId="ap-k7-04" />} />
            <Route path="/embed/ap-k7-08" element={<RobotManualPage />} />
        </Routes>
    )
}

export default App
