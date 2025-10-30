// GitHub API Integration
const GITHUB_USERNAME = 'Mester2001';
const GITHUB_API_URL = 'https://api.github.com';

// تنسيق التاريخ بالعربية
const formatDate = (dateString) => {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('ar-EG', options);
};

// جلب بيانات GitHub
async function fetchGitHubData() {
    try {
        const [profile, repos, followers, events] = await Promise.all([
            fetchData(`${GITHUB_API_URL}/users/${GITHUB_USERNAME}`),
            fetchData(`${GITHUB_API_URL}/users/${GITHUB_USERNAME}/repos?per_page=100`),
            fetchData(`${GITHUB_API_URL}/users/${GITHUB_USERNAME}/followers`),
            fetchData(`${GITHUB_API_URL}/users/${GITHUB_USERNAME}/events?per_page=20`)
        ]);

        updateGitHubUI(profile, repos, followers, events);
    } catch (error) {
        console.error('Error fetching GitHub data:', error);
        showErrorUI();
    }
}

// دالة مساعدة لجلب البيانات
async function fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

// عرض رسالة الخطأ
function showErrorUI() {
    const elements = {
        'github-bio': 'تعذر تحميل السيرة الذاتية',
        'github-repos': '0',
        'github-followers': '0',
        'github-activity': '<p class="text-gray-500 dark:text-gray-400">تعذر تحميل النشاطات</p>'
    };

    Object.entries(elements).forEach(([id, text]) => {
        const element = document.getElementById(id);
        if (element) element.innerHTML = text;
    });
}

// تحديث واجهة المستخدم ببيانات GitHub
function updateGitHubUI(profile, repos, followers, events) {
    // تحديث البيانات الأساسية
    updateBasicInfo(profile, repos, followers);
    
    // تحديث النشاطات
    updateActivity(events);
    
    // تحديث الإحصائيات
    updateStats(repos, followers);
}

// تحديث المعلومات الأساسية
function updateBasicInfo(profile, repos, followers) {
    const elements = {
        'github-bio': profile.bio || 'لا توجد سيرة ذاتية متاحة',
        'github-repos': repos.length || '0',
        'github-followers': followers.length || '0'
    };

    // تحديث العناصر
    Object.entries(elements).forEach(([id, text]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = text;
    });

    // تحديث صورة الملف الشخصي
    const profileImage = document.querySelector('#github img');
    if (profileImage && profile.avatar_url) {
        profileImage.src = profile.avatar_url;
        profileImage.alt = `${profile.name || GITHUB_USERNAME}'s GitHub profile`;
    }
}

// تحديث النشاطات
function updateActivity(events) {
    const activityList = document.getElementById('github-activity');
    if (!activityList) return;

    // تصفية الأحداث المهمة فقط
    const validEvents = events.filter(event => 
        event.type && event.repo && 
        ['PushEvent', 'CreateEvent', 'WatchEvent', 'ForkEvent', 'PullRequestEvent'].includes(event.type)
    ).slice(0, 5); // آخر 5 أحداث

    if (validEvents.length === 0) {
        activityList.innerHTML = '<p class="text-gray-500 dark:text-gray-400">لا توجد نشاطات حديثة</p>';
        return;
    }

    activityList.innerHTML = validEvents.map(event => createEventItem(event)).join('');
}

// إنشاء عنصر نشاط
function createEventItem(event) {
    const eventText = getEventText(event);
    const eventDate = formatDate(event.created_at);
    const repoName = event.repo.name.replace(`${GITHUB_USERNAME}/`, '');
    
    return `
        <div class="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <div class="flex-shrink-0 mt-1">
                ${getEventIcon(event.type)}
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-800 dark:text-gray-200">
                    ${eventText}
                    <a href="https://github.com/${event.repo.name}" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       class="text-blue-600 dark:text-blue-400 hover:underline">
                        ${repoName}
                    </a>
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <time datetime="${event.created_at}">${eventDate}</time>
                </p>
            </div>
        </div>
    `;
}

// الحصول على نص النشاط
function getEventText(event) {
    const { type, payload } = event;
    
    switch(type) {
        case 'PushEvent':
            const commitCount = payload?.commits?.length || 0;
            const commitsText = commitCount > 1 ? 'commit' : 'commits';
            return `تم دفع ${commitCount} ${commitsText} إلى `;
        case 'CreateEvent':
            const refType = payload?.ref_type === 'repository' ? 'مستودع' : 'فرع';
            return `تم إنشاء ${refType} `;
        case 'WatchEvent':
            return 'تمت متابعة المستودع ';
        case 'ForkEvent':
            return 'تم عمل Fork للمستودع ';
        case 'PullRequestEvent':
            const action = payload?.action === 'opened' ? 'فتح' : 'تحديث';
            return `${action} طلب سحب في `;
        default:
            return 'نشاط جديد في ';
    }
}

// الحصول على أيقونة النشاط
function getEventIcon(eventType) {
    const icons = {
        PushEvent: 'M7 10l5 5 5-5H7z',
        CreateEvent: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
        WatchEvent: 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
        ForkEvent: 'M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 2c5.514 0 10 4.486 10 10 0 5.515-4.486 10-10 10-5.515 0-10-4.485-10-10 0-5.514 4.485-10 10-10zm-3 14v-4h-1v4h-2v-4h-1v-1h4v5h-1zm5-1h-3v-1h3v1zm1-2h-4v-1h4v1zm0-2h-4v-1h4v1zm0-2h-4v-1h4v1zm0-2h-4v-1h4v1z',
        PullRequestEvent: 'M15 12c0-1.104-.896-2-2-2s-2 .896-2 2 .896 2 2 2 2-.896 2-2zm-2 0c0 .552-.448 1-1 1s-1-.448-1-1 .448-1 1-1 1 .448 1 1zm-2 0c0 1.104.896 2 2 2s2-.896 2-2-.896-2-2-2-2 .896-2 2zm-1-2c-.552 0-1 .448-1 1s.448 1 1 1 1-.448 1-1-.448-1-1-1zm-7 0c-1.104 0-2 .896-2 2s.896 2 2 2 2-.896 2-2-.896-2-2-2zm0 3c-.552 0-1-.448-1-1s.448-1 1-1 1 .448 1 1-.448 1-1 1zm0-5c-1.104 0-2 .896-2 2h1c0-.552.448-1 1-1s1 .448 1 1h1c0-1.104-.896-2-2-2zm10 0c-1.104 0-2 .896-2 2h1c0-.552.448-1 1-1s1 .448 1 1h1c0-1.104-.896-2-2-2z'
    };

    const path = icons[eventType] || icons.PushEvent;
    return `
        <svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="${path}" />
        </svg>
    `;
}

// تحديث الإحصائيات
function updateStats(repos, followers) {
    try {
        // تحديث إحصائيات المستودعات
        const reposStats = {
            total: Array.isArray(repos) ? repos.length : 0,
            stars: Array.isArray(repos) ? repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0) : 0,
            forks: Array.isArray(repos) ? repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0) : 0,
            followers: Array.isArray(followers) ? followers.length : 0
        };

        // تحديث عناصر الإحصائيات في الواجهة
        const statsElements = {
            'github-repos': reposStats.total,
            'github-followers': reposStats.followers,
            'github-stars': reposStats.stars,
            'github-forks': reposStats.forks
        };

        Object.entries(statsElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value.toLocaleString();
        });

        // تسجيل الإحصائيات في الكونسول
        console.log('إحصائيات GitHub:', {
            'إجمالي المستودعات': reposStats.total,
            'إجمالي النجوم': reposStats.stars,
            'إجمالي Forks': reposStats.forks,
            'المتابعون': reposStats.followers
        });
    } catch (error) {
        console.error('خطأ في تحديث الإحصائيات:', error);
    }
}

// تهيئة الصفحة
function initGitHub() {
    // جلب بيانات GitHub
    fetchGitHubData();
    
    // تحديث البيانات كل 5 دقائق
    setInterval(fetchGitHubData, 5 * 60 * 1000);
    
    // إضافة تأثير التحميل
    const loadingElements = document.querySelectorAll('.animate-pulse');
    loadingElements.forEach(el => {
        el.style.display = 'block';
    });
}

// بدء التطبيق عند تحميل الصفحة
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGitHub);
} else {
    initGitHub();
}
