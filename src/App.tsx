import { Routes, Route } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import AuthGuard from './components/layout/AuthGuard'
import DashboardPage from './features/dashboard/DashboardPage'
import Chapter2Page from './features/learning-modules/Chapter2Page'
import Chapter7Page from './features/learning-modules/Chapter7Page'
import Chapter7ListPage from './features/learning-modules/Chapter7ListPage'
import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import APActivityPage from './features/learning-modules/APActivityPage'
import RobotManualPage from './features/learning-modules/RobotManualPage'

function App() {
    return (
        <Routes>
            {/* ── Auth Routes (public) ── */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* ── Protected Routes (browser with login) ── */}
            <Route path="/" element={
                <AuthGuard>
                    <MainLayout />
                </AuthGuard>
            }>
                <Route index element={<DashboardPage />} />
                <Route path="chapter2" element={<Chapter2Page />} />
                <Route path="chapter7" element={<Chapter7ListPage />} />
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
