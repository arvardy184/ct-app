import { useAppStore } from '../../stores/useAppStore'

export default function GamificationHeader() {
    const { userSession } = useAppStore()

    if (!userSession) return null

    const xpProgress = userSession.xp % 100 // Progress to next level (0-100)
    const xpToNextLevel = 100 - xpProgress

    return (
        <header className="bg-white px-6 py-4 shadow-sm border-b border-slate-200">
            <div className="container mx-auto flex items-center justify-between">
                {/* Logo & Title */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl shadow-sm border border-indigo-100">
                        🎮
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">
                            Computational Thinking Quest
                        </h1>
                        <p className="text-slate-500 text-sm">Belajar Algoritma dengan Bermain</p>
                    </div>
                </div>

                {/* User Stats */}
                <div className="flex items-center gap-4">
                    {/* Level Badge */}
                    <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-full border border-yellow-200">
                        <span className="text-yellow-500 text-xl animate-bounce-slow">⭐</span>
                        <div>
                            <p className="text-yellow-700 text-xs font-medium">Level</p>
                            <p className="text-yellow-800 font-bold text-lg leading-none">{userSession.level}</p>
                        </div>
                    </div>

                    {/* XP Progress */}
                    <div className="flex items-center gap-3 bg-green-50 px-4 py-2 rounded-xl border border-green-200">
                        <div className="text-right">
                            <p className="text-green-700 text-xs font-medium">Experience Points</p>
                            <p className="text-green-800 font-bold leading-none">{userSession.xp} XP</p>
                        </div>
                        <div className="w-24">
                            <div className="w-full h-2.5 bg-green-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 transition-all duration-500 ease-out"
                                    style={{ width: `${xpProgress}%` }}
                                />
                            </div>
                            <p className="text-green-600 text-[10px] mt-0.5 text-right font-medium">
                                {xpToNextLevel} XP to Lv {userSession.level + 1}
                            </p>
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-1 bg-purple-50 px-3 py-2 rounded-xl border border-purple-200 h-full">
                        <span className="text-purple-600 text-sm mr-1">🏆</span>
                        {userSession.badges.length === 0 ? (
                            <span className="text-purple-400 text-xs font-medium">No badges</span>
                        ) : (
                            <>
                                {userSession.badges.slice(0, 3).map((badge, i) => (
                                    <span key={i} className="text-xl" title={badge}>
                                        {badge}
                                    </span>
                                ))}
                                {userSession.badges.length > 3 && (
                                    <span className="text-purple-600 font-bold text-xs ml-1 bg-purple-200 px-1 rounded">
                                        +{userSession.badges.length - 3}
                                    </span>
                                )}
                            </>
                        )}
                    </div>

                    {/* User Avatar */}
                    <div className="flex items-center gap-3 ml-2 pl-4 border-l border-slate-200">
                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            {userSession.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="hidden lg:block">
                            <p className="text-slate-800 font-semibold text-sm leading-tight">{userSession.name}</p>
                            <p className="text-slate-500 text-[11px] font-medium">Group {userSession.groupType}</p>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}
