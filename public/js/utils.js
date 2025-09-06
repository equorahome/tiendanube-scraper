// Utility Functions

// API Base Configuration
const API_BASE = window.location.origin;
const API_ENDPOINTS = {
    products: '/api/products',
    scrape: '/api/scrape-simple',
    scrapeFull: '/api/scrape',
    test: '/api/test',
    analytics: '/api/analytics',
    compare: '/api/compare'
};

// Cache Management
class Cache {
    constructor(ttl = 300000) { // 5 minutes default
        this.cache = new Map();
        this.ttl = ttl;
    }
    
    set(key, value) {
        const expiry = Date.now() + this.ttl;
        this.cache.set(key, { value, expiry });
    }
    
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }
    
    clear() {
        this.cache.clear();
    }
    
    delete(key) {
        this.cache.delete(key);
    }
}

const apiCache = new Cache(300000); // 5 minutes

// HTTP Client
class ApiClient {
    static async request(url, options = {}) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        try {
            showLoading(true);
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            showToast('Error', error.message, 'error');
            throw error;
        } finally {
            showLoading(false);
        }
    }
    
    static async get(endpoint, params = {}) {
        const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
        const cached = apiCache.get(cacheKey);
        
        if (cached) {
            return cached;
        }
        
        const queryString = new URLSearchParams(params).toString();
        const url = `${API_BASE}${endpoint}${queryString ? '?' + queryString : ''}`;
        
        const data = await this.request(url);
        apiCache.set(cacheKey, data);
        
        return data;
    }
    
    static async post(endpoint, body = {}) {
        const url = `${API_BASE}${endpoint}`;
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }
}

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle utility
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Format currency
function formatCurrency(amount, currency = 'ARS') {
    if (amount === null || amount === undefined) return 'N/A';
    
    try {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    } catch (error) {
        return `$${amount.toLocaleString('es-AR')}`;
    }
}

// Format number with separators
function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString('es-AR');
}

// Format date
function formatDate(dateString, options = {}) {
    if (!dateString) return 'N/A';
    
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', { ...defaultOptions, ...options });
}

// Relative time formatting
function formatTimeAgo(dateString) {
    if (!dateString) return 'Nunca';
    
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'hace un momento';
}

// Calculate percentage change
function calculatePercentageChange(oldValue, newValue) {
    if (!oldValue || oldValue === 0) return 0;
    return ((newValue - oldValue) / oldValue) * 100;
}

// Format percentage
function formatPercentage(percentage) {
    if (percentage === null || percentage === undefined) return '0%';
    const sign = percentage > 0 ? '+' : '';
    return `${sign}${percentage.toFixed(1)}%`;
}

// Generate price change indicator
function getPriceChangeIndicator(currentPrice, previousPrice) {
    if (!previousPrice) return { class: '', icon: '', text: 'Nuevo' };
    
    if (currentPrice > previousPrice) {
        const change = calculatePercentageChange(previousPrice, currentPrice);
        return {
            class: 'price-up',
            icon: '📈',
            text: formatPercentage(change)
        };
    } else if (currentPrice < previousPrice) {
        const change = calculatePercentageChange(previousPrice, currentPrice);
        return {
            class: 'price-down',
            icon: '📉',
            text: formatPercentage(change)
        };
    }
    
    return { class: '', icon: '➖', text: 'Sin cambio' };
}

// Store name to emoji mapping
const STORE_EMOJIS = {
    'Shiva Home': '🏠',
    'Bazar Nuba': '🛍️',
    'Nimba': '🌟',
    'Vienna Hogar': '🏰',
    'Magnolias Deco': '🌸',
    'Duvet': '🛏️',
    'Ganga Home': '💰',
    'Binah Deco': '✨'
};

function getStoreEmoji(storeName) {
    return STORE_EMOJIS[storeName] || '🏪';
}

// Toast notification system
function showToast(title, message, type = 'info', duration = 5000) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after duration
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

// Loading state management
let loadingCount = 0;

function showLoading(show = true) {
    const loadingScreen = document.getElementById('loading-screen');
    if (!loadingScreen) return;
    
    if (show) {
        loadingCount++;
        loadingScreen.classList.remove('hidden');
    } else {
        loadingCount = Math.max(0, loadingCount - 1);
        if (loadingCount === 0) {
            loadingScreen.classList.add('hidden');
        }
    }
}

// Modal management
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modals = document.querySelectorAll('.modal.active');
    modals.forEach(modal => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    });
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModal();
    }
});

// Close modal with ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Element creation helpers
function createElement(tag, className = '', attributes = {}) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'textContent') {
            element.textContent = value;
        } else if (key === 'innerHTML') {
            element.innerHTML = value;
        } else {
            element.setAttribute(key, value);
        }
    });
    
    return element;
}

// Safe DOM manipulation
function safeQuerySelector(selector, parent = document) {
    try {
        return parent.querySelector(selector);
    } catch (error) {
        console.warn(`Invalid selector: ${selector}`, error);
        return null;
    }
}

function safeQuerySelectorAll(selector, parent = document) {
    try {
        return parent.querySelectorAll(selector);
    } catch (error) {
        console.warn(`Invalid selector: ${selector}`, error);
        return [];
    }
}

// URL parameter helpers
function getUrlParams() {
    return new URLSearchParams(window.location.search);
}

function setUrlParam(key, value, replace = true) {
    const url = new URL(window.location);
    url.searchParams.set(key, value);
    
    if (replace) {
        window.history.replaceState({}, '', url);
    } else {
        window.history.pushState({}, '', url);
    }
}

function removeUrlParam(key) {
    const url = new URL(window.location);
    url.searchParams.delete(key);
    window.history.replaceState({}, '', url);
}

// Local storage helpers
function getStoredData(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.warn(`Error reading from localStorage: ${key}`, error);
        return defaultValue;
    }
}

function storeData(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.warn(`Error writing to localStorage: ${key}`, error);
        return false;
    }
}

function removeStoredData(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.warn(`Error removing from localStorage: ${key}`, error);
        return false;
    }
}

// Image loading with fallback
function loadImageWithFallback(img, src, fallback = '/assets/images/product-placeholder.svg') {
    return new Promise((resolve) => {
        const image = new Image();
        
        image.onload = () => {
            img.src = src;
            img.classList.remove('loading');
            resolve(true);
        };
        
        image.onerror = () => {
            img.src = fallback;
            img.classList.remove('loading');
            resolve(false);
        };
        
        img.classList.add('loading');
        image.src = src;
    });
}

// Scroll utilities
function scrollToTop(smooth = true) {
    window.scrollTo({
        top: 0,
        behavior: smooth ? 'smooth' : 'auto'
    });
}

function scrollToElement(element, smooth = true) {
    if (element) {
        element.scrollIntoView({
            behavior: smooth ? 'smooth' : 'auto',
            block: 'start'
        });
    }
}

// Animation helpers
function animateValue(element, start, end, duration = 1000) {
    const startTime = performance.now();
    const difference = end - start;
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(start + (difference * easeOut));
        
        element.textContent = formatNumber(currentValue);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Validation helpers
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (error) {
        return false;
    }
}

// Export data utilities
function downloadJSON(data, filename = 'data.json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function downloadCSV(data, filename = 'data.csv') {
    if (!data.length) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => 
                JSON.stringify(row[header] || '')
            ).join(',')
        )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Performance monitoring
const performance_monitor = {
    start: function(label) {
        performance.mark(`${label}-start`);
    },
    
    end: function(label) {
        performance.mark(`${label}-end`);
        performance.measure(label, `${label}-start`, `${label}-end`);
        
        const measure = performance.getEntriesByName(label)[0];
        console.log(`${label}: ${measure.duration.toFixed(2)}ms`);
        
        return measure.duration;
    }
};

// Initialize utils when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🛠️ Utils loaded');
    
    // Hide loading screen
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }, 500);
});