/**
 * 사용자 관리 시스템
 * localStorage 기반 회원별 데이터 관리
 */

class UserManager {
    constructor() {
        this.currentUser = null;
        this.usersKey = 'registeredUsers';
        this.init();
    }

    init() {
        // 등록된 사용자 목록이 없으면 초기화
        if (!localStorage.getItem(this.usersKey)) {
            localStorage.setItem(this.usersKey, JSON.stringify({}));
        }
    }

    // 사용자 등록
    registerUser(userId, userData = {}) {
        if (!userId || typeof userId !== 'string') {
            throw new Error('유효한 사용자 ID가 필요합니다.');
        }

        const users = this.getAllUsers();
        
        if (users[userId]) {
            console.log('기존 사용자 로그인:', userId);
            return this.getUser(userId);
        }

        // 새 사용자 생성
        const newUser = {
            id: userId,
            displayName: userData.displayName || userId,
            email: userData.email || '',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            preferences: {
                defaultPomodoroLength: 25,
                breakLength: 5,
                longBreakLength: 15,
                weeklyGoal: 140, // minutes
                theme: 'default'
            }
        };

        // 사용자 등록
        users[userId] = newUser;
        localStorage.setItem(this.usersKey, JSON.stringify(users));

        // 초기 통계 데이터 생성
        this.initializeUserStats(userId);

        console.log('✅ 새 사용자 등록 완료:', userId);
        return newUser;
    }

    // 사용자 통계 초기화
    initializeUserStats(userId) {
        const userStatsKey = `userStats_${userId}`;
        
        const initialStats = {
            userId: userId,
            totalSessions: 0,
            completedSessions: 0,
            totalMinutes: 0,
            completedMinutes: 0,
            streakDays: 0,
            longestStreak: 0,
            lastSessionDate: null,
            weeklyGoal: 140,
            monthlyStats: {},
            dailyStats: {},
            tags: {},
            locations: {},
            completionRate: 0,
            averageSessionLength: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem(userStatsKey, JSON.stringify(initialStats));
        
        // 빈 세션 배열도 초기화
        const userSessionsKey = `pomodoroSessions_${userId}`;
        localStorage.setItem(userSessionsKey, JSON.stringify([]));

        console.log('📊 사용자 통계 초기화 완료:', userId);
    }

    // 사용자 로그인
    loginUser(userId) {
        const users = this.getAllUsers();
        
        if (!users[userId]) {
            // 새 사용자로 자동 등록
            return this.registerUser(userId);
        }

        // 마지막 로그인 시간 업데이트
        users[userId].lastLogin = new Date().toISOString();
        localStorage.setItem(this.usersKey, JSON.stringify(users));
        
        this.currentUser = users[userId];
        console.log('🔐 사용자 로그인:', userId);
        return users[userId];
    }

    // 사용자 정보 가져오기
    getUser(userId) {
        const users = this.getAllUsers();
        return users[userId] || null;
    }

    // 모든 사용자 가져오기
    getAllUsers() {
        return JSON.parse(localStorage.getItem(this.usersKey) || '{}');
    }

    // 사용자 통계 가져오기
    getUserStats(userId) {
        const userStatsKey = `userStats_${userId}`;
        const stats = JSON.parse(localStorage.getItem(userStatsKey) || 'null');
        
        if (!stats) {
            // 통계가 없으면 초기화
            this.initializeUserStats(userId);
            return JSON.parse(localStorage.getItem(userStatsKey));
        }
        
        return stats;
    }

    // 사용자 세션 가져오기
    getUserSessions(userId) {
        const userSessionsKey = `pomodoroSessions_${userId}`;
        return JSON.parse(localStorage.getItem(userSessionsKey) || '[]');
    }

    // 사용자 활성 세션 가져오기
    getActiveSession(userId) {
        const activeSessionKey = `activePomodoroSession_${userId}`;
        const sessionData = localStorage.getItem(activeSessionKey);
        return sessionData ? JSON.parse(sessionData) : null;
    }

    // 사용자 데이터 완전 삭제 (관리자 기능)
    deleteUser(userId) {
        if (!userId) return false;

        // 사용자 목록에서 제거
        const users = this.getAllUsers();
        delete users[userId];
        localStorage.setItem(this.usersKey, JSON.stringify(users));

        // 관련된 모든 데이터 삭제
        const keysToDelete = [
            `userStats_${userId}`,
            `pomodoroSessions_${userId}`,
            `activePomodoroSession_${userId}`
        ];

        keysToDelete.forEach(key => {
            localStorage.removeItem(key);
        });

        console.log('🗑️ 사용자 데이터 삭제 완료:', userId);
        return true;
    }

    // 사용자 통계 업데이트
    updateUserStats(userId, updates) {
        const userStatsKey = `userStats_${userId}`;
        const currentStats = this.getUserStats(userId);
        
        const updatedStats = {
            ...currentStats,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        // 완료율 계산
        if (updatedStats.totalSessions > 0) {
            updatedStats.completionRate = Math.round(
                (updatedStats.completedSessions / updatedStats.totalSessions) * 100
            );
        }

        // 평균 세션 길이 계산
        if (updatedStats.completedSessions > 0) {
            updatedStats.averageSessionLength = Math.round(
                updatedStats.completedMinutes / updatedStats.completedSessions
            );
        }

        localStorage.setItem(userStatsKey, JSON.stringify(updatedStats));
        return updatedStats;
    }

    // 전체 사용자 통계 (관리자 기능)
    getAllUsersStats() {
        const users = this.getAllUsers();
        const allStats = {};

        Object.keys(users).forEach(userId => {
            allStats[userId] = {
                user: users[userId],
                stats: this.getUserStats(userId),
                sessionCount: this.getUserSessions(userId).length,
                hasActiveSession: !!this.getActiveSession(userId)
            };
        });

        return allStats;
    }

    // 사용자 수 반환
    getUserCount() {
        return Object.keys(this.getAllUsers()).length;
    }

    // 최근 활동한 사용자들
    getRecentUsers(limit = 5) {
        const users = this.getAllUsers();
        
        return Object.values(users)
            .sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin))
            .slice(0, limit);
    }

    // 데이터 무결성 검사
    validateUserData(userId) {
        const user = this.getUser(userId);
        const stats = this.getUserStats(userId);
        const sessions = this.getUserSessions(userId);

        const issues = [];

        if (!user) issues.push('사용자 정보가 없습니다');
        if (!stats) issues.push('통계 데이터가 없습니다');
        if (!Array.isArray(sessions)) issues.push('세션 데이터가 유효하지 않습니다');

        if (issues.length > 0) {
            console.warn(`⚠️ 사용자 ${userId} 데이터 문제:`, issues);
            return false;
        }

        return true;
    }

    // localStorage 정리 (사용하지 않는 데이터 정리)
    cleanup() {
        const users = this.getAllUsers();
        const userIds = Object.keys(users);
        const allKeys = Object.keys(localStorage);
        
        let cleanedCount = 0;

        allKeys.forEach(key => {
            // 사용자별 데이터 키 패턴 확인
            const patterns = [
                /^userStats_(.+)$/,
                /^pomodoroSessions_(.+)$/,
                /^activePomodoroSession_(.+)$/
            ];

            patterns.forEach(pattern => {
                const match = key.match(pattern);
                if (match) {
                    const userId = match[1];
                    // 등록되지 않은 사용자의 데이터라면 삭제
                    if (!userIds.includes(userId)) {
                        localStorage.removeItem(key);
                        cleanedCount++;
                    }
                }
            });
        });

        console.log(`🧹 정리 완료: ${cleanedCount}개 항목 삭제`);
        return cleanedCount;
    }
}

// 전역 사용자 매니저 인스턴스
window.userManager = new UserManager();

// 편의 함수들
window.getCurrentUser = () => window.userManager.currentUser;
window.loginUser = (userId) => window.userManager.loginUser(userId);
window.getUserStats = (userId) => window.userManager.getUserStats(userId);
window.getUserSessions = (userId) => window.userManager.getUserSessions(userId);