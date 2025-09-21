import { SUBJECTS } from './studyPlan.js';

let SCRIPT_URL = null;

// --- Логирование ---
function log(message, ...details) {
    console.log(`[Materials LOG] ${message}`, ...details);
}

// --- Получение конфигурации ---
async function fetchConfig() {
    if (SCRIPT_URL) return SCRIPT_URL;
    try {
        const response = await fetch('/api/config');
        if (!response.ok) throw new Error('サーバーから設定を取得できませんでした。');
        const config = await response.json();
        if (config.cms_link) {
            SCRIPT_URL = config.cms_link;
            log("CMSの設定が正常に読み込まれました。");
            return SCRIPT_URL;
        } else {
            throw new Error('サーバーの応答にCMSのリンクが含まれていません。');
        }
    } catch (error) {
        console.error("[FATAL] CMS設定の読み込みエラー:", error);
        return null;
    }
}

// --- Рендеринг контента ---
function renderContent(container, data) {
    container.innerHTML = '';

    if (Object.keys(data).length === 0) {
        container.innerHTML = `<div class="text-center py-16 text-gray-500 dark:text-gray-400">この章に登録された教材はありません。</div>`;
        return;
    }

    for (const lessonTitle in data) {
        const lessonElement = document.createElement('section');
        lessonElement.className = 'bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-8';

        let contentHtml = `<h2 class="text-2xl font-bold text-indigo-800 dark:text-indigo-300 mb-4">${lessonTitle}</h2><div class="space-y-3">`;

        data[lessonTitle].forEach(item => {
            switch (item.type) {
                case 'header':
                    contentHtml += `<h3 class="text-xl font-semibold mt-6 mb-2 border-b-2 border-gray-200 dark:border-gray-700 pb-1">${item.content_1}</h3>`;
                    break;
                case 'text':
                    contentHtml += `<p class="dark:text-gray-300 whitespace-pre-wrap">${item.content_1}</p>`;
                    break;
                case 'image':
                    contentHtml += `<div><img src="${item.content_1}" alt="${item.content_2 || '教材画像'}" class="my-2 rounded-lg shadow-md max-w-full h-auto"></div>`;
                    break;
                case 'link':
                case 'video':
                    const icon = item.type === 'video' ? '▶️' : '🔗';
                    contentHtml += `<a href="${item.content_1}" target="_blank" rel="noopener noreferrer" class="block p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">${icon} <span class="underline">${item.content_2 || item.content_1}</span></a>`;
                    break;
            }
        });

        contentHtml += `</div>`;
        lessonElement.innerHTML = contentHtml;
        container.appendChild(lessonElement);
    }
}

function renderError(container, message) {
    container.innerHTML = `<div class="bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-4 rounded-md">
        <h4 class="font-bold">教材の読み込みに失敗しました。</h4>
        <p>${message}</p>
    </div>`;
}

// --- Основная функция ---
async function initialize() {
    const titleElement = document.getElementById('materials-title');
    const container = document.getElementById('materials-container');

    // Получаем ID предмета и главы из URL
    const pathParts = window.location.pathname.split('/').filter(p => p);
    if (pathParts.length < 3) {
        renderError(container, "URLが無効です。");
        return;
    }
    const subjectId = pathParts[1];
    const chapterNo = pathParts[2];

    const subject = SUBJECTS.find(s => s.id === subjectId);
    if (subject) {
        titleElement.textContent = `${subject.name} - 第${chapterNo}章`;
    }

    const url = await fetchConfig();
    if (!url) {
        renderError(container, "CMSの設定を読み込めませんでした。");
        return;
    }

    try {
        const requestUrl = `${url}?subject=${subjectId}&chapter=${chapterNo}`;
        log(`リクエストを送信します: ${requestUrl}`);
        const response = await fetch(requestUrl);
        if (!response.ok) throw new Error(`ネットワークエラー (ステータス: ${response.status})`);
        const data = await response.json();
        if (data.error) throw new Error(`スクриプトエラー: ${data.details || data.error}`);

        renderContent(container, data);
        log("コンテンツが正常に表示されました。");

    } catch (error) {
        log("致命的なエラー：教材の読み込み中:", error);
        renderError(container, error.message);
    }
}

document.addEventListener('DOMContentLoaded', initialize);