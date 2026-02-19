import { Routes, Route } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import DashboardPage from './features/dashboard/DashboardPage'
import Chapter2Page from './features/learning-modules/Chapter2Page'
import Chapter7Page from './features/learning-modules/Chapter7Page'

function App() {
    return (
        <Routes>
            <Route path="/" element={<MainLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="chapter2" element={<Chapter2Page />} />
                <Route path="chapter7" element={<Chapter7Page />} />
            </Route>

            {/* Routes for React Native WebView (No MainLayout wrapper) */}
            <Route path="/embed/chapter7" element={<Chapter7Page isEmbedded={true} />} />
        </Routes>
    )
}

export default App
