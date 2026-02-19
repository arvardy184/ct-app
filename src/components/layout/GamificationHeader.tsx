import { useAppStore } from '../../stores/useAppStore'

export default function GamificationHeader() {
    const { userSession } = useAppStore()

    if (!userSession) return null

    const xpProgress = userSession.xp % 100 // Progress to next level (0-100)
    const xpToNextLevel = 100 - xpProgress

    return (
        <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-4 shadow-xl">
            <div className="container mx-auto flex items-center justify-between">
                {/* Logo & Title */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                        🎮
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">
                            Computational Thinking Quest
                        </h1>
                        <p className="text-white/70 text-sm">Belajar Algoritma dengan Bermain</p>
                    </div>
                </div>

                {/* User Stats */}
                <div className="flex items-center gap-6">
                    {/* Level Badge */}
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full border border-white/20">
                        <span className="text-yellow-400 text-2xl animate-pulse">⭐</span>
                        <div>
                            <p className="text-white/70 text-xs">Level</p>
                            <p className="text-white font-bold text-lg">{userSession.level}</p>
                        </div>
                    </div>

                    {/* XP Progress */}
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-xl border border-white/20">
                        <div className="text-right">
                            <p className="text-white/70 text-xs">Experience Points</p>
                            <p className="text-white font-bold">{userSession.xp} XP</p>
                        </div>
                        <div className="w-28">
                            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500 ease-out"
                                    style={{ width: `${xpProgress}%` }}
                                />
                            </div>
                            <p className="text-white/50 text-xs mt-0.5 text-right">
                                {xpToNextLevel} XP to Level {userSession.level + 1}
                            </p>
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                        <span className="text-white/70 text-sm mr-2">🏆</span>
                        {userSession.badges.length === 0 ? (
                            <span className="text-white/50 text-sm">No badges yet</span>
                        ) : (
                            <>
                                {userSession.badges.slice(0, 4).map((badge, i) => (
                                    <span key={i} className="text-2xl" title={badge}>
                                        {badge}
                                    </span>
                                ))}
                                {userSession.badges.length > 4 && (
                                    <span className="text-white/70 text-sm ml-1">
                                        +{userSession.badges.length - 4}
                                    </span>
                                )}
                            </>
                        )}
                    </div>

                    {/* User Avatar */}
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-white/30 to-white/10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg border-2 border-white/30">
                            {userSession.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="hidden lg:block">
                            <p className="text-white font-medium">{userSession.name}</p>
                            <p className="text-white/60 text-xs">Group {userSession.groupType}</p>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}
