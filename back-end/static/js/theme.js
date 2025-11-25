/**
 * Theme Management Module
 * Handles light/dark theme toggling and persistence
 */

const THEME_STORAGE_KEY = 'app-theme';
const LIGHT_THEME = 'light';
const DARK_THEME = 'dark';

/**
 * Initialize theme from localStorage or system preference
 */
function initializeTheme() {
    let savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    
    if (!savedTheme) {
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            savedTheme = DARK_THEME;
        } else {
            savedTheme = LIGHT_THEME;
        }
    }
    
    applyTheme(savedTheme);
    updateThemeButton(savedTheme);
}

/**
 * Apply theme by setting data-theme attribute
 */
function applyTheme(theme) {
    if (theme === DARK_THEME) {
        document.documentElement.setAttribute('data-theme', DARK_THEME);
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
}

/**
 * Toggle theme between light and dark
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || LIGHT_THEME;
    const newTheme = currentTheme === LIGHT_THEME ? DARK_THEME : LIGHT_THEME;
    
    applyTheme(newTheme);
    updateThemeButton(newTheme);
}

/**
 * Update theme button appearance and text
 */
function updateThemeButton(theme) {
    const button = document.getElementById('theme-toggle');
    if (!button) return;
    
    if (theme === DARK_THEME) {
        button.innerHTML = '<i class="fas fa-sun"></i>';
        button.title = 'Switch to Light Mode';
    } else {
        button.innerHTML = '<i class="fas fa-moon"></i>';
        button.title = 'Switch to Dark Mode';
    }
}

/**
 * Listen for system theme preference changes
 */
function watchSystemTheme() {
    if (!window.matchMedia) return;
    
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeQuery.addEventListener('change', (e) => {
        // Only auto-switch if user hasn't manually set a theme
        if (!localStorage.getItem(THEME_STORAGE_KEY)) {
            const newTheme = e.matches ? DARK_THEME : LIGHT_THEME;
            applyTheme(newTheme);
            updateThemeButton(newTheme);
        }
    });
}

// Initialize theme when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeTheme();
        watchSystemTheme();
    });
} else {
    initializeTheme();
    watchSystemTheme();
}

// Export functions to global scope
if (typeof window !== 'undefined') {
    window.toggleTheme = toggleTheme;
    window.applyTheme = applyTheme;
}
