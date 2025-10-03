// Global variables
let isAuthenticated = false;
let currentEntryId = null;
let charts = {};
let isFormDirty = false; // Track if form has been modified
let pageUnloadProtection = false; // Track if we should warn before leaving

// Register Chart.js plugins
Chart.register(ChartDataLabels);

// DOM elements
const authBtn = document.getElementById('auth-btn');
const authStatus = document.getElementById('auth-status');
const authModal = document.getElementById('auth-modal');
const authForm = document.getElementById('auth-form');
const passwordInput = document.getElementById('password');
const cancelAuthBtn = document.getElementById('cancel-auth');

const chartsModal = document.getElementById('charts-modal');
let viewChartsBtn;

// Charts filter elements
let chartsFilters = {};

const applyChartsFiltersBtn = document.getElementById('apply-charts-filters');
const clearChartsFiltersBtn = document.getElementById('clear-charts-filters');

const entryModal = document.getElementById('entry-modal');
const cvarEntryForm = document.getElementById('cvar-entry-form');
const xvaEntryForm = document.getElementById('xva-entry-form');
const regEntryForm = document.getElementById('reg-entry-form');
const othersEntryForm = document.getElementById('others-entry-form');
const modalTitle = document.getElementById('modal-title');
let addEntryBtn;
const cancelCvarEntryBtn = document.getElementById('cancel-cvar-entry');
const cancelXvaEntryBtn = document.getElementById('cancel-xva-entry');
const cancelRegEntryBtn = document.getElementById('cancel-reg-entry');
const cancelOthersEntryBtn = document.getElementById('cancel-others-entry');
const closeBtns = document.querySelectorAll('.close');

const filters = {
    startDate: document.getElementById('start-date'),
    endDate: document.getElementById('end-date'),
    application: 'CVAR ALL', // Default to CVAR ALL
    prbOnly: document.getElementById('prb-only'),
    hiimOnly: document.getElementById('hiim-only'),
    timeLossOnly: document.getElementById('time-loss-only')
};

// Search elements
const freeSearchInput = document.getElementById('free-search');
const clearSearchBtn = document.getElementById('clear-search');
const downloadExcelBtn = document.getElementById('download-excel-btn');

const applyFiltersBtn = document.getElementById('apply-filters');
const clearFiltersBtn = document.getElementById('clear-filters');
const entriesTable = document.getElementById('entries-table');
const entriesTbody = document.getElementById('entries-tbody');

// Chart elements
const qualityChartEl = document.getElementById('quality-chart');
const punctualityChartEl = document.getElementById('punctuality-chart');
const prbChartEl = document.getElementById('prb-chart');
const hiimChartEl = document.getElementById('hiim-chart');
const fullscreenChartEl = document.getElementById('fullscreen-chart');

// XVA Chart elements
const xvaMonthlyRedChartEl = document.getElementById('xva-monthly-red-chart');
const xvaRootCauseChartEl = document.getElementById('xva-root-cause-chart');


// Chart visibility filters
const chartVisibilityFilters = {
    quality: document.getElementById('show-quality-chart'),
    punctuality: document.getElementById('show-punctuality-chart'),
    prb: document.getElementById('show-prb-chart'),
    hiim: document.getElementById('show-hiim-chart'),
    'xva-monthly-red': document.getElementById('show-xva-monthly-red-chart'),
    'xva-root-cause': document.getElementById('show-xva-root-cause-chart')
};

// Fullscreen modal elements
const fullscreenModal = document.getElementById('fullscreen-chart-modal');
const fullscreenChartTitle = document.getElementById('fullscreen-chart-title');
const exitFullscreenBtn = document.getElementById('exit-fullscreen');

// Fullscreen all charts modal elements
const fullscreenAllModal = document.getElementById('fullscreen-all-charts-modal');
const fullscreenAllBtn = document.getElementById('fullscreen-all-charts');
const exitFullscreenAllBtn = document.getElementById('exit-fullscreen-all');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements after DOM is loaded
    addEntryBtn = document.getElementById('add-entry-btn');
    viewChartsBtn = document.getElementById('view-charts-btn');
    
    // Initialize charts filters
    chartsFilters = {
        year: document.getElementById('charts-year-filter'),
        month: document.getElementById('charts-month-filter')
    };
    
    initializeApp();
    setupEventListeners();
    setupCustomMultiselect();
    // loadData() will be called after authentication check in initializeApp()
});

function initializeApp() {
    // Set default date range (last 30 days)
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    filters.endDate.value = todayString;
    // Start date left empty by default
    
    // Set max date to today for all date inputs to prevent future dates
    setMaxDateToToday();
    
    // Initialize UI state (hide actions by default)
    updateAuthUI();
    
    // Check authentication status and load data
    checkAuthStatus().then(() => {
        // Ensure UI is updated before loading data
        updateAuthUI();
    // Initialize column visibility based on current application
    toggleColumnsForApplication(filters.application);
    
    // Initialize column resizing
    initializeColumnResizing();
        loadData();
    });
}

function setupEventListeners() {
    // Authentication
    authBtn.addEventListener('click', showAuthModal);
    authForm.addEventListener('submit', handleLogin);
    cancelAuthBtn.addEventListener('click', hideAuthModal);
    
    // Entry management
    if (addEntryBtn) {
        addEntryBtn.addEventListener('click', () => showEntryModal());
    }
    // Multi-item add button (CVAR) - adds combined card with all three types
    const addCombinedItemBtn = document.getElementById('add-combined-item-btn');
    
    if (addCombinedItemBtn) {
        addCombinedItemBtn.addEventListener('click', function() {
            addCombinedItemCard(false);
        });
    }
    
    // XVA multi-item add button - adds combined card with all three types
    const xvaAddCombinedItemBtn = document.getElementById('xva-add-combined-item-btn');
    
    if (xvaAddCombinedItemBtn) {
        xvaAddCombinedItemBtn.addEventListener('click', function() {
            addCombinedItemCard(true);
        });
    }
    cvarEntryForm.addEventListener('submit', handleCVAREntrySubmit);
    xvaEntryForm.addEventListener('submit', handleXVAEntrySubmit);
    regEntryForm.addEventListener('submit', handleREGEntrySubmit);
    othersEntryForm.addEventListener('submit', handleOTHERSEntrySubmit);
    cancelCvarEntryBtn.addEventListener('click', hideEntryModal);
    cancelXvaEntryBtn.addEventListener('click', hideEntryModal);
    cancelRegEntryBtn.addEventListener('click', hideEntryModal);
    cancelOthersEntryBtn.addEventListener('click', hideEntryModal);
    
    // Download button
    if (downloadExcelBtn) {
        downloadExcelBtn.addEventListener('click', downloadExcel);
    }
    
    // Time formatting for PRC Mail and CP Alerts
    setupTimeFormatting();
    
    // Weekend warning for date changes
    setupWeekendWarning();
    
    // Charts modal
    if (viewChartsBtn) {
        viewChartsBtn.addEventListener('click', showChartsModal);
    }
    applyChartsFiltersBtn.addEventListener('click', loadChartsData);
    clearChartsFiltersBtn.addEventListener('click', clearChartsFilters);
    
    // Chart visibility filters
    Object.values(chartVisibilityFilters).forEach(checkbox => {
        checkbox.addEventListener('change', updateChartVisibility);
    });
    
    // Add window resize listener for responsive chart adjustments
    window.addEventListener('resize', () => {
        updateChartVisibility();
    });
    
    // Add beforeunload protection to prevent accidental page refreshes during editing
    window.addEventListener('beforeunload', function(event) {
        if (pageUnloadProtection && isFormDirty) {
            event.preventDefault();
            event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return 'You have unsaved changes. Are you sure you want to leave?';
        }
    });
    
    // Add global error handler to prevent unhandled errors from causing page issues
    window.addEventListener('error', function(event) {
        console.error('Global error caught:', event.error);
        // Don't let JavaScript errors break the page functionality
        return false;
    });
    
    // Add unhandled promise rejection handler
    window.addEventListener('unhandledrejection', function(event) {
        console.error('Unhandled promise rejection:', event.reason);
        // Prevent the error from causing page issues
        event.preventDefault();
    });
    
    
    // Fullscreen functionality
    document.querySelectorAll('.fullscreen-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const chartType = this.getAttribute('data-chart');
            openFullscreenChart(chartType);
        });
    });
    
    exitFullscreenBtn.addEventListener('click', closeFullscreenChart);
    
    // Fullscreen all charts functionality
    fullscreenAllBtn.addEventListener('click', openAllChartsFullscreen);
    exitFullscreenAllBtn.addEventListener('click', closeAllChartsFullscreen);
    
    
    // Application filter buttons (both header and filter versions)
    document.querySelectorAll('.header-app-btn, .filter-app-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all app buttons
            document.querySelectorAll('.header-app-btn, .filter-app-btn').forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            // Set the application filter
            filters.application = this.getAttribute('data-app');
            // Show/hide columns based on application
            toggleColumnsForApplication(filters.application);
            // Show/hide XVA fields in modal based on application
            toggleXVAFields(filters.application);
            // Load data with new application filter
            loadData();
        });
    });
    
    // Filters
    applyFiltersBtn.addEventListener('click', loadData);
    clearFiltersBtn.addEventListener('click', clearFilters);
    
    // Count link click handlers
    setupCountLinkHandlers();
    
    // Clickable ID handlers for table entries
    setupClickableIdHandlers();
    
    // Conditional field validation
    setupConditionalFieldValidation();
    
    
    // Modal close buttons
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                if (modal.id === 'charts-modal') {
                    hideChartsModal();
                } else {
                    modal.style.display = 'none';
                }
            }
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            if (event.target.id === 'fullscreen-chart-modal') {
                closeFullscreenChart();
            } else if (event.target.id === 'fullscreen-all-charts-modal') {
                closeAllChartsFullscreen();
            } else {
                event.target.style.display = 'none';
            }
        }
    });

    // Search functionality
    if (freeSearchInput) {
        freeSearchInput.addEventListener('input', performSearch);
        freeSearchInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                performSearch();
            }
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', clearSearch);
    }
}

// Fullscreen Filter Listeners
function setupFullscreenFilterListeners() {
    // Single chart fullscreen filters
    const fullscreenApplyBtn = document.getElementById('fullscreen-apply-filters');
    if (fullscreenApplyBtn && !fullscreenApplyBtn.hasAttribute('data-listener-added')) {
        fullscreenApplyBtn.addEventListener('click', handleFullscreenFilterApply);
        fullscreenApplyBtn.setAttribute('data-listener-added', 'true');
    }
    
    // All charts fullscreen filters
    const fullscreenAllApplyBtn = document.getElementById('fullscreen-all-apply-filters');
    if (fullscreenAllApplyBtn && !fullscreenAllApplyBtn.hasAttribute('data-listener-added')) {
        fullscreenAllApplyBtn.addEventListener('click', handleFullscreenAllFilterApply);
        fullscreenAllApplyBtn.setAttribute('data-listener-added', 'true');
    } else if (fullscreenAllApplyBtn) {
    }
}

// Fullscreen filter handlers
function handleFullscreenFilterApply() {
    // Copy filter values from fullscreen to main filters
    const fullscreenYear = document.getElementById('fullscreen-year-filter');
    const fullscreenMonth = document.getElementById('fullscreen-month-filter');
    const fullscreenApp = document.getElementById('fullscreen-application-filter');
    const fullscreenGraphType = document.querySelector('input[name="fullscreen-graph-type"]:checked');
    
    // Update main filters
    if (chartsFilters.year && fullscreenYear) {
        Array.from(chartsFilters.year.options).forEach(option => {
            option.selected = Array.from(fullscreenYear.selectedOptions).some(selected => selected.value === option.value);
        });
    }
    
    if (chartsFilters.month && fullscreenMonth) {
        Array.from(chartsFilters.month.options).forEach(option => {
            option.selected = Array.from(fullscreenMonth.selectedOptions).some(selected => selected.value === option.value);
        });
    }
    
    if (filters.application && fullscreenApp) {
        filters.application = fullscreenApp.value;
    }
    
    
    // Reload charts data
    loadChartsData();
    
    // Update the fullscreen chart
    updateFullscreenChart();
}

function handleFullscreenAllFilterApply() {
    // Copy filter values from fullscreen all to main filters
    const fullscreenAllYear = document.getElementById('fullscreen-all-year-filter');
    const fullscreenAllMonth = document.getElementById('fullscreen-all-month-filter');
    const fullscreenAllApp = document.getElementById('fullscreen-all-application-filter');
    const fullscreenAllGraphType = document.querySelector('input[name="fullscreen-all-graph-type"]:checked');
    
    // Update main filters
    if (chartsFilters.year && fullscreenAllYear) {
        Array.from(chartsFilters.year.options).forEach(option => {
            option.selected = Array.from(fullscreenAllYear.selectedOptions).some(selected => selected.value === option.value);
        });
    }
    
    if (chartsFilters.month && fullscreenAllMonth) {
        Array.from(chartsFilters.month.options).forEach(option => {
            option.selected = Array.from(fullscreenAllMonth.selectedOptions).some(selected => selected.value === option.value);
        });
    }
    
    if (filters.application && fullscreenAllApp) {
        filters.application = fullscreenAllApp.value;
    }
    
    
    // Reload charts data
    loadChartsData();
    
    // Update all fullscreen charts
    updateAllFullscreenCharts();
}


// Sync functions
function syncFullscreenFilters() {
    // Sync year filter
    const fullscreenYear = document.getElementById('fullscreen-year-filter');
    if (fullscreenYear && chartsFilters.year) {
        Array.from(fullscreenYear.options).forEach(option => {
            option.selected = Array.from(chartsFilters.year.selectedOptions).some(selected => selected.value === option.value);
        });
    }
    
    // Sync month filter
    const fullscreenMonth = document.getElementById('fullscreen-month-filter');
    if (fullscreenMonth && chartsFilters.month) {
        Array.from(fullscreenMonth.options).forEach(option => {
            option.selected = Array.from(chartsFilters.month.selectedOptions).some(selected => selected.value === option.value);
        });
    }
    
    // Sync application filter
    const fullscreenApp = document.getElementById('fullscreen-application-filter');
    if (fullscreenApp && filters.application) {
        fullscreenApp.value = filters.application;
    }
    
}

function syncFullscreenAllFilters() {
    // Sync year filter
    const fullscreenAllYear = document.getElementById('fullscreen-all-year-filter');
    if (fullscreenAllYear && chartsFilters.year) {
        Array.from(fullscreenAllYear.options).forEach(option => {
            option.selected = Array.from(chartsFilters.year.selectedOptions).some(selected => selected.value === option.value);
        });
    }
    
    // Sync month filter
    const fullscreenAllMonth = document.getElementById('fullscreen-all-month-filter');
    if (fullscreenAllMonth && chartsFilters.month) {
        Array.from(fullscreenAllMonth.options).forEach(option => {
            option.selected = Array.from(chartsFilters.month.selectedOptions).some(selected => selected.value === option.value);
        });
    }
    
    // Sync application filter
    const fullscreenAllApp = document.getElementById('fullscreen-all-application-filter');
    if (fullscreenAllApp && filters.application) {
        fullscreenAllApp.value = filters.application;
    }
    
}

// Update fullscreen chart functions
function updateFullscreenChart() {
    // This function will be called when fullscreen filters are applied
    // It should recreate the fullscreen chart with new data
    const chartType = getCurrentFullscreenChartType();
    if (chartType) {
        openFullscreenChart(chartType);
    }
}

function updateAllFullscreenCharts() {
    // This function will be called when fullscreen all filters are applied
    // It should recreate all fullscreen charts with new data
    openAllChartsFullscreen();
}

function getCurrentFullscreenChartType() {
    // Determine which chart type is currently being displayed in fullscreen
    // This is a simplified version - you might need to track this differently
    if (charts.quality) return 'quality';
    if (charts.punctuality) return 'punctuality';
    if (charts.prb) return 'prb';
    if (charts.hiim) return 'hiim';
    return null;
}

// Custom Multiselect functionality
function setupCustomMultiselect() {
    // Year multiselect
    const yearTrigger = document.getElementById('year-trigger');
    const yearDropdown = document.getElementById('year-dropdown');
    const yearOptions = yearDropdown.querySelectorAll('.multiselect-option');
    const yearSelect = document.getElementById('charts-year-filter');
    
    // Month multiselect
    const monthTrigger = document.getElementById('month-trigger');
    const monthDropdown = document.getElementById('month-dropdown');
    const monthOptions = monthDropdown.querySelectorAll('.multiselect-option');
    const monthSelect = document.getElementById('charts-month-filter');
    
    // Initialize year multiselect
    setupMultiselect(yearTrigger, yearDropdown, yearOptions, yearSelect, 'year');
    
    // Initialize month multiselect
    setupMultiselect(monthTrigger, monthDropdown, monthOptions, monthSelect, 'month');
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.custom-multiselect')) {
            closeAllDropdowns();
        }
    });
}

function setupMultiselect(trigger, dropdown, options, select, type) {
    let selectedValues = new Set();
    
    // Trigger click handler
    trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Check if month selection is allowed
        if (type === 'month' && !isYearSelected()) {
            showMonthSelectionWarning();
            return;
        }
        
        toggleDropdown(dropdown);
        updateTriggerState(trigger, dropdown);
    });
    
    // Option click handlers
    options.forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Prevent clicking on disabled options
            if (this.classList.contains('disabled')) {
                return;
            }
            
            // Check if month selection is allowed
            if (type === 'month' && !isYearSelected()) {
                showMonthSelectionWarning();
                return;
            }
            
            const value = this.getAttribute('data-value');
            
            if (selectedValues.has(value)) {
                selectedValues.delete(value);
                this.classList.remove('selected');
            } else {
                selectedValues.add(value);
                this.classList.add('selected');
            }
            
            updateSelectedDisplay(trigger, selectedValues, type);
            updateHiddenSelect(select, selectedValues);
            
            // If year is selected, enable month selection
            if (type === 'year' && selectedValues.size > 0) {
                enableMonthSelection();
                // Disable future months when year changes
                disableFutureMonths();
            }
        });
    });
    
    // Initialize display
    updateSelectedDisplay(trigger, selectedValues, type);
    
    // Disable month selection initially
    if (type === 'month') {
        disableMonthSelection();
    }
}

function toggleDropdown(dropdown) {
    const isOpen = dropdown.classList.contains('show');
    closeAllDropdowns();
    
    if (!isOpen) {
        dropdown.classList.add('show');
        dropdown.previousElementSibling.classList.add('active');
    }
}

function closeAllDropdowns() {
    document.querySelectorAll('.multiselect-dropdown').forEach(dropdown => {
        dropdown.classList.remove('show');
        dropdown.previousElementSibling.classList.remove('active');
    });
}

function getVisibleColumnsForApplication(application) {
    // Define columns to hide for XVA (old columns)
    const xvaHiddenColumns = ['prc_mail', 'cp_alerts', 'quality', 'remarks'];
    
    // Define columns to show only for XVA (new XVA-specific columns)
    const xvaOnlyColumns = ['acq', 'valo', 'sensi', 'cf_ra', 'quality_legacy', 'quality_target', 'root_cause_application', 'root_cause_type', 'xva_remarks'];
    
    // Define columns to show only for REG (REG-specific columns - completely separate)
    const regOnlyColumns = ['closing', 'iteration', 'reg_issue', 'action_taken_and_update', 'reg_status', 'reg_prb', 'reg_hiim', 'backlog_item'];
    
    // Define columns to show only for OTHERS
    const othersOnlyColumns = ['dare', 'timings', 'puntuality_issue', 'quality', 'quality_issue', 'others_prb', 'others_hiim'];
    
    // Standard columns that are always visible (for CVAR/XVA only)
    const standardColumns = ['date', 'day', 'issue_description', 'time_loss', 'prb_id', 'hiim_id'];
    
    // Actions column is always visible
    const actionsColumn = ['actions'];
    
    if (application === 'XVA') {
        // For XVA, show standard columns + XVA-specific columns + actions
        return [...standardColumns, ...xvaOnlyColumns, ...actionsColumn];
    } else if (application === 'REG') {
        // For REG, show only date, day + REG-specific columns + actions (completely separate)
        return ['date', 'day', ...regOnlyColumns, ...actionsColumn];
    } else if (application === 'OTHERS') {
        // For OTHERS, show only date, day + OTHERS-specific columns + actions
        return ['date', 'day', ...othersOnlyColumns, ...actionsColumn];
    } else {
        // For CVAR ALL and CVAR NYQ, show standard columns + original columns + actions
        // For CVAR, the Quality column comes from `quality_status`
        const originalColumns = ['prc_mail', 'cp_alerts', 'quality_status', 'remarks'];
        return [...standardColumns, ...originalColumns, ...actionsColumn];
    }
}

function toggleColumnsForApplication(application) {
    // Define columns to hide for XVA (old columns)
    const xvaHiddenColumns = ['prc_mail', 'cp_alerts', 'quality_status', 'remarks'];
    
    // Define columns to show only for XVA (new XVA-specific columns)
    const xvaOnlyColumns = ['acq', 'valo', 'sensi', 'cf_ra', 'quality_legacy', 'quality_target', 'root_cause_application', 'root_cause_type', 'xva_remarks'];
    
    // Define columns to show only for REG (REG-specific columns - completely separate)
    const regOnlyColumns = ['closing', 'iteration', 'reg_issue', 'action_taken_and_update', 'reg_status', 'reg_prb', 'reg_hiim', 'backlog_item'];
    
    // Define columns to show only for OTHERS
    const othersOnlyColumns = ['dare', 'timings', 'puntuality_issue', 'quality', 'quality_issue', 'others_prb', 'others_hiim'];
    
    // Define columns to hide for REG (all CVAR/XVA columns)
    const regHiddenColumns = ['prc_mail', 'cp_alerts', 'quality_status', 'remarks', 'issue_description', 'time_loss', 'prb_id', 'hiim_id', ...xvaOnlyColumns, ...othersOnlyColumns];
    
    // Define columns to hide for OTHERS (all CVAR/XVA/REG columns)
    const othersHiddenColumns = ['prc_mail', 'cp_alerts', 'quality_status', 'remarks', 'issue_description', 'time_loss', 'prb_id', 'hiim_id', ...xvaOnlyColumns, ...regOnlyColumns];
    
    // Get all table headers
    const headers = document.querySelectorAll('#entries-table thead th');
    
    headers.forEach(header => {
        const column = header.getAttribute('data-column');
        // Don't change visibility of the Actions column here.
        // Actions visibility is controlled by authentication (body.edit-mode via CSS).
        if (column === 'actions') {
            return; // leave display as-is (CSS will handle showing/hiding)
        }
        
        if (application === 'XVA') {
            // Hide old columns and show XVA-specific columns
            if (xvaHiddenColumns.includes(column) || regOnlyColumns.includes(column) || othersOnlyColumns.includes(column)) {
                header.style.display = 'none';
            } else if (xvaOnlyColumns.includes(column)) {
                header.style.display = '';
            } else {
                // Show standard columns (date, day, issue_description, prb_id, hiim_id)
                header.style.display = '';
            }
        } else if (application === 'REG') {
            // Hide all CVAR/XVA/OTHERS columns and show only REG-specific columns + date/day
            if (regHiddenColumns.includes(column)) {
                header.style.display = 'none';
            } else if (regOnlyColumns.includes(column)) {
                header.style.display = '';
            } else if (column === 'date' || column === 'day') {
                // Show only date and day from standard columns
                header.style.display = '';
            } else {
                // Hide all other columns for REG
                header.style.display = 'none';
            }
        } else if (application === 'OTHERS') {
            // Hide all CVAR/XVA/REG columns and show only OTHERS-specific columns + date/day
            if (othersHiddenColumns.includes(column)) {
                header.style.display = 'none';
            } else if (othersOnlyColumns.includes(column)) {
                header.style.display = '';
            } else if (column === 'date' || column === 'day') {
                // Show only date and day from standard columns
                header.style.display = '';
            } else {
                // Hide all other columns for OTHERS
                header.style.display = 'none';
            }
        } else {
            // For CVAR ALL and CVAR NYQ, hide XVA, REG, and OTHERS-specific columns and show CVAR columns
            if (xvaOnlyColumns.includes(column) || regOnlyColumns.includes(column) || othersOnlyColumns.includes(column)) {
                header.style.display = 'none';
            } else {
                header.style.display = '';
            }
        }
    });
    
    // Also hide/show corresponding cells in existing rows
    const rows = document.querySelectorAll('#entries-table tbody tr');
    // Build a set of visible columns for the current application to drive cell visibility
    const visibleColumnsSet = new Set(getVisibleColumnsForApplication(application));
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        cells.forEach((cell, index) => {
            const header = headers[index];
            if (!header) return;
            const column = header.getAttribute('data-column');

            // Skip actions column; its visibility is handled via CSS/auth state
            if (column === 'actions') return;

            // Show cell only if its column is in the visible set for this application
            if (visibleColumnsSet.has(column)) {
                cell.style.display = '';
            } else {
                cell.style.display = 'none';
            }
        });
    });
    
    // Toggle form field validation based on application
    toggleFormFieldValidation(application);
    
    // Toggle XVA-specific charts and tables visibility
    toggleXVAChartsAndTables(application);
    
    // Toggle quality and punctuality chart visibility filters for REG
    toggleQualityPunctualityFilters(application);
    
    // Reinitialize column resizing for newly visible columns
    // Use a small delay to ensure DOM updates are complete
    setTimeout(() => {
        reinitializeColumnResizing();
        // Also reload column widths to ensure they're applied correctly
        loadColumnWidths();
    }, 10);
}

function toggleFormFieldValidation(application) {
    
    // Define fields that are required for CVAR but not for XVA
    const cvarRequiredFields = [
        'prc_mail_text', 'prc_mail_status',
        'quality_status'
    ];
    
    // Define fields that are required for XVA but not for CVAR
    const xvaRequiredFields = [
        // No required fields for XVA - all fields are optional except date and application_name
    ];
    
    // Toggle CVAR required fields
    cvarRequiredFields.forEach(fieldName => {
        const field = document.getElementById(`entry-${fieldName.replace(/_/g, '-')}`);
        if (field) {
            if (application === 'XVA') {
                // Remove required attribute for XVA (fields are hidden)
                field.removeAttribute('required');
            } else {
                // Add required attribute back for CVAR applications
                field.setAttribute('required', 'required');
            }
        }
    });
    
    // Toggle XVA required fields
    xvaRequiredFields.forEach(fieldName => {
        const field = document.getElementById(`entry-${fieldName.replace(/_/g, '-')}`);
        if (field) {
            if (application === 'XVA') {
                // Add required attribute for XVA
                field.setAttribute('required', 'required');
            } else {
                // Remove required attribute for CVAR applications (fields are hidden)
                field.removeAttribute('required');
            }
        }
    });
}

function toggleXVAChartsAndTables(application) {
    // Toggle XVA chart wrappers
    const xvaChartWrappers = document.querySelectorAll('.xva-only');
    xvaChartWrappers.forEach(wrapper => {
        if (application === 'XVA') {
            wrapper.style.display = '';
        } else {
            wrapper.style.display = 'none';
        }
    });
    
    // Toggle XVA tables section
    const xvaTablesSection = document.getElementById('xva-tables-section');
    if (xvaTablesSection) {
        if (application === 'XVA') {
            xvaTablesSection.style.display = 'block';
        } else {
            xvaTablesSection.style.display = 'none';
        }
    }
    
    // Toggle XVA chart visibility filters
    const xvaVisibilityLabels = document.querySelectorAll('.visibility-label.xva-only');
    xvaVisibilityLabels.forEach(label => {
        if (application === 'XVA') {
            label.style.display = '';
        } else {
            label.style.display = 'none';
        }
    });
}

function toggleQualityPunctualityFilters(application) {
    // Toggle quality and punctuality chart visibility filters for REG
    const qualityPunctualityLabels = document.querySelectorAll('.visibility-label.quality-punctuality-only');
    qualityPunctualityLabels.forEach(label => {
        if (application === 'REG') {
            label.style.display = 'none';
        } else {
            label.style.display = '';
        }
    });
}

function toggleXVAFields(application) {
    const xvaFieldsSection = document.getElementById('xva-fields');
    if (xvaFieldsSection) {
        if (application === 'XVA') {
            xvaFieldsSection.style.display = 'block';
        } else {
            xvaFieldsSection.style.display = 'none';
        }
    }
    
    // Toggle non-XVA fields
    const nonXvaFields = document.querySelectorAll('.non-xva-field');
    nonXvaFields.forEach(field => {
        if (application === 'XVA') {
            field.style.display = 'none';
        } else {
            field.style.display = 'block';
        }
    });
    
    // Setup status select styling for all applications
    setupStatusSelectStyling();
}

function setupStatusSelectStyling() {
    // Get all status select elements
    const statusSelects = document.querySelectorAll('.status-select');
    
    statusSelects.forEach(select => {
        // Remove existing event listeners to avoid duplicates
        select.removeEventListener('change', updateStatusSelectBackground);
        
        // Add change event listener
        select.addEventListener('change', updateStatusSelectBackground);
        
        // Apply initial styling
        updateStatusSelectBackground({ target: select });
    });
}

function updateStatusSelectBackground(event) {
    const select = event.target;
    const value = select.value;
    
    // Remove existing background classes
    select.classList.remove('status-red', 'status-yellow', 'status-green');
    
    // Add appropriate background class
    if (value === 'Red') {
        select.classList.add('status-red');
    } else if (value === 'Yellow') {
        select.classList.add('status-yellow');
    } else if (value === 'Green') {
        select.classList.add('status-green');
    }
}

function createStatusBadge(timeText, status) {
    if (!timeText && !status) {
        return 'N/A';
    }
    
    const timeDisplay = timeText || '';
    const statusDisplay = status || '';
    
    if (!statusDisplay) {
        return timeDisplay;
    }
    
    // Apply color directly to the timing text
    let statusClass = '';
    if (status === 'Red') {
        statusClass = 'timing-red';
    } else if (status === 'Yellow') {
        statusClass = 'timing-yellow';
    } else if (status === 'Green') {
        statusClass = 'timing-green';
    }
    
    return `<span class="timing-text ${statusClass}">${timeDisplay}</span>`;
}

function createXVAStatusBadge(timeText, status, dateString, fieldType) {
    if (!timeText) {
        return 'N/A';
    }
    
    const timeDisplay = timeText || '';
    
    if (!timeDisplay) {
        return 'N/A';
    }
    
    // Use 24-hour format time directly (no AM/PM parsing needed)
    const formattedTime = timeDisplay;
    
    // For XVA, use the actual status color (Red, Yellow, Green) instead of time-based colors
    // If no status is provided, use a default color
    let statusColor = 'default';
    if (status && (status === 'Red' || status === 'Yellow' || status === 'Green')) {
        statusColor = status;
    }
    
    return `<span class="status-badge status-${statusColor}">${formattedTime}</span>`;
}

function createQualityBadge(qualityStatus) {
    if (!qualityStatus) {
        return 'N/A';
    }
    
    // Create colored badge for quality status
    let statusClass = '';
    if (qualityStatus === 'Red') {
        statusClass = 'status-red';
    } else if (qualityStatus === 'Yellow') {
        statusClass = 'status-yellow';
    } else if (qualityStatus === 'Green') {
        statusClass = 'status-green';
    }
    
    return `<span class="status-badge ${statusClass}">${qualityStatus}</span>`;
}

function createXVAQualityBadge(qualityStatus) {
    if (!qualityStatus) {
        return 'N/A';
    }
    
    // Use the same light colored class structure as CVAR dashboards
    return `<span class="status-badge status-${qualityStatus}">${qualityStatus}</span>`;
}

function updateTriggerState(trigger, dropdown) {
    const isOpen = dropdown.classList.contains('show');
    if (isOpen) {
        trigger.classList.add('active');
    } else {
        trigger.classList.remove('active');
    }
}

function updateSelectedDisplay(trigger, selectedValues, type) {
    const textElement = trigger.querySelector('.multiselect-text');
    
    if (selectedValues.size === 0) {
        textElement.textContent = type === 'year' ? 'Select Year(s)' : 'Select Month(s)';
        textElement.classList.remove('has-selection');
    } else {
        const selectedTexts = Array.from(selectedValues).map(value => {
            if (type === 'year') {
                return value;
            } else {
                const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                                  'July', 'August', 'September', 'October', 'November', 'December'];
                return monthNames[parseInt(value)];
            }
        });
        
        if (selectedTexts.length <= 2) {
            textElement.textContent = selectedTexts.join(', ');
        } else {
            textElement.textContent = `${selectedTexts.length} selected`;
        }
        textElement.classList.add('has-selection');
    }
}

function updateHiddenSelect(select, selectedValues) {
    // Clear existing selections
    Array.from(select.options).forEach(option => {
        option.selected = false;
    });
    
    // Set selected options
    selectedValues.forEach(value => {
        const option = select.querySelector(`option[value="${value}"]`);
        if (option) {
            option.selected = true;
        }
    });
}

function isYearSelected() {
    const yearSelect = document.getElementById('charts-year-filter');
    return yearSelect.selectedOptions.length > 0;
}

function showMonthSelectionWarning() {
    // Create or show warning message
    let warningDiv = document.getElementById('month-selection-warning');
    if (!warningDiv) {
        warningDiv = document.createElement('div');
        warningDiv.id = 'month-selection-warning';
        warningDiv.className = 'month-selection-warning';
        warningDiv.innerHTML = `
            <div class="warning-content">
                <span class="warning-icon">⚠️</span>
                <span class="warning-text">Please select at least one year before selecting months.</span>
            </div>
        `;
        
        // Insert after the month filter group
        const monthFilterGroup = document.querySelector('.filter-group:has(#month-trigger)');
        monthFilterGroup.insertAdjacentElement('afterend', warningDiv);
    } else {
        warningDiv.style.display = 'block';
    }
    
    // Hide warning after 3 seconds
    setTimeout(() => {
        if (warningDiv) {
            warningDiv.style.display = 'none';
        }
    }, 3000);
}

function enableMonthSelection() {
    const monthTrigger = document.getElementById('month-trigger');
    const monthDropdown = document.getElementById('month-dropdown');
    
    monthTrigger.classList.remove('disabled');
    monthTrigger.style.cursor = 'pointer';
    monthTrigger.style.opacity = '1';
    
    // Hide warning if it exists
    const warningDiv = document.getElementById('month-selection-warning');
    if (warningDiv) {
        warningDiv.style.display = 'none';
    }
}

function disableMonthSelection() {
    const monthTrigger = document.getElementById('month-trigger');
    const monthDropdown = document.getElementById('month-dropdown');
    
    monthTrigger.classList.add('disabled');
    monthTrigger.style.cursor = 'not-allowed';
    monthTrigger.style.opacity = '0.6';
}

function disableFutureMonths() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
    
    // Get all month filter elements
    const monthSelectors = [
        'charts-month-filter',
        'fullscreen-month-filter', 
        'fullscreen-all-month-filter'
    ];
    
    monthSelectors.forEach(selectorId => {
        const monthSelect = document.getElementById(selectorId);
        if (monthSelect) {
            Array.from(monthSelect.options).forEach(option => {
                const monthValue = parseInt(option.value);
                const yearValue = getSelectedYearForMonth(selectorId);
                
                // Disable future months
                if (yearValue === currentYear && monthValue > currentMonth) {
                    option.disabled = true;
                    option.style.color = '#ccc';
                } else if (yearValue > currentYear) {
                    option.disabled = true;
                    option.style.color = '#ccc';
                } else {
                    option.disabled = false;
                    option.style.color = '';
                }
            });
        }
    });
    
    // Also disable future months in custom multiselect dropdowns
    const monthDropdowns = [
        'month-dropdown'
    ];
    
    monthDropdowns.forEach(dropdownId => {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            const monthOptions = dropdown.querySelectorAll('.multiselect-option');
            monthOptions.forEach(option => {
                const monthValue = parseInt(option.dataset.value);
                const yearValue = getSelectedYearForMonth(dropdownId);
                
                // Disable future months
                if (yearValue === currentYear && monthValue > currentMonth) {
                    option.classList.add('disabled');
                    option.style.color = '#ccc';
                    option.style.cursor = 'not-allowed';
                } else if (yearValue > currentYear) {
                    option.classList.add('disabled');
                    option.style.color = '#ccc';
                    option.style.cursor = 'not-allowed';
                } else {
                    option.classList.remove('disabled');
                    option.style.color = '';
                    option.style.cursor = 'pointer';
                }
            });
        }
    });
}

function getSelectedYearForMonth(selectorId) {
    // Get the corresponding year selector based on the month selector
    let yearSelectorId;
    if (selectorId.includes('fullscreen-all')) {
        yearSelectorId = 'fullscreen-all-year-filter';
    } else if (selectorId.includes('fullscreen')) {
        yearSelectorId = 'fullscreen-year-filter';
    } else {
        yearSelectorId = 'charts-year-filter';
    }
    
    const yearSelect = document.getElementById(yearSelectorId);
    if (yearSelect && yearSelect.selectedOptions.length > 0) {
        return parseInt(yearSelect.selectedOptions[0].value);
    }
    
    // Default to current year if no year is selected
    return new Date().getFullYear();
}

// Authentication functions
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/status', {
            credentials: 'include'
        });
        const data = await response.json();
        isAuthenticated = data.authenticated;
        updateAuthUI();
        return Promise.resolve();
    } catch (error) {
        console.error('Error checking auth status:', error);
        isAuthenticated = false;
        updateAuthUI();
        return Promise.resolve();
    }
}

function updateAuthUI() {
    if (isAuthenticated) {
        authBtn.textContent = 'Logout';
        authStatus.textContent = '✓ Authenticated';
        authStatus.style.color = 'white';
        if (addEntryBtn) {
            addEntryBtn.style.display = 'inline-block';
        }
        if (downloadExcelBtn) {
            downloadExcelBtn.style.display = 'inline-block';
        }
        document.body.classList.add('edit-mode');
    } else {
        authBtn.textContent = 'Enable Edit';
        authStatus.textContent = '';
        if (addEntryBtn) {
            addEntryBtn.style.display = 'none';
        }
        if (downloadExcelBtn) {
            downloadExcelBtn.style.display = 'none';
        }
        document.body.classList.remove('edit-mode');
    }
    
    // Authentication state is now handled by CSS classes
}


function showAuthModal() {
    if (isAuthenticated) {
        handleLogout();
    } else {
        authModal.style.display = 'flex';
        passwordInput.focus();
    }
}

function hideAuthModal() {
    authModal.style.display = 'none';
    passwordInput.value = '';
}

async function handleLogin(event) {
    event.preventDefault();
    
    const password = passwordInput.value;
    if (!password) return;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            isAuthenticated = true;
            updateAuthUI();
            hideAuthModal();
            loadData(); // Refresh data to show edit capabilities
        } else {
            alert('Invalid password: ' + data.error);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

async function handleLogout() {
    try {
        await fetch('/api/auth/logout', { 
            method: 'POST',
            credentials: 'include'
        });
        isAuthenticated = false;
        updateAuthUI();
        loadData(); // Refresh data to hide edit capabilities
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Data loading functions
async function loadData() {
    try {
        showLoading();
        
        // Load entries only
        const entriesResponse = await fetch('/api/entries?' + buildQueryString());
        const entries = await entriesResponse.json();
        
        if (entriesResponse.ok) {
            displayEntries(entries);
        } else {
            throw new Error('Failed to load data');
        }
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Failed to load data. Please try again.');
    } finally {
        hideLoading();
    }
}

function buildQueryString() {
    const params = new URLSearchParams();
    
    if (filters.startDate.value) params.append('start_date', filters.startDate.value);
    if (filters.endDate.value) params.append('end_date', filters.endDate.value);
    if (filters.application) params.append('application', filters.application);
    if (filters.prbOnly.checked) params.append('prb_only', 'true');
    if (filters.hiimOnly.checked) params.append('hiim_only', 'true');
    if (filters.timeLossOnly.checked) params.append('time_loss_only', 'true');
    
    return params.toString();
}

function buildChartsQueryString() {
    const params = new URLSearchParams();
    
    // Handle year filter (multiple selection)
    const selectedYears = Array.from(chartsFilters.year.selectedOptions).map(option => option.value);
    if (selectedYears.length > 0) {
        selectedYears.forEach(year => params.append('year', year));
    }
    
    // Handle month filter (multiple selection)
    const selectedMonths = Array.from(chartsFilters.month.selectedOptions).map(option => option.value);
    if (selectedMonths.length > 0) {
        selectedMonths.forEach(month => params.append('month', month));
    }
    
    if (filters.application) params.append('application', filters.application);
    
    return params.toString();
}

function calculatePrbCounts(entries) {
    const prbIds = new Set();
    const activePrbIds = new Set();
    const closedPrbIds = new Set();
    
    entries.forEach(entry => {
        // Legacy single-field
        if (entry.prb_id_number) {
            prbIds.add(entry.prb_id_number);
            if (entry.prb_id_status === 'active') activePrbIds.add(entry.prb_id_number);
            else if (entry.prb_id_status === 'closed') closedPrbIds.add(entry.prb_id_number);
        }
        // New normalized array
        if (Array.isArray(entry.prbs)) {
            entry.prbs.forEach(p => {
                const id = p.prb_id_number || p.prb_id || null;
                if (id) {
                    prbIds.add(id);
                    if (p.prb_id_status === 'active') activePrbIds.add(id);
                    else if (p.prb_id_status === 'closed') closedPrbIds.add(id);
                }
            });
        }
    });
    
    return {
        total: prbIds.size,
        active: activePrbIds.size,
        closed: closedPrbIds.size
    };
}

function calculateHiimCounts(entries) {
    const hiimIds = new Set();
    const activeHiimIds = new Set();
    const closedHiimIds = new Set();
    
    entries.forEach(entry => {
        // Legacy single-field
        if (entry.hiim_id_number) {
            hiimIds.add(entry.hiim_id_number);
            if (entry.hiim_id_status === 'active') activeHiimIds.add(entry.hiim_id_number);
            else if (entry.hiim_id_status === 'closed') closedHiimIds.add(entry.hiim_id_number);
        }
        // New normalized array
        if (Array.isArray(entry.hiims)) {
            entry.hiims.forEach(h => {
                const id = h.hiim_id_number || h.hiim_id || null;
                if (id) {
                    hiimIds.add(id);
                    if (h.hiim_id_status === 'active') activeHiimIds.add(id);
                    else if (h.hiim_id_status === 'closed') closedHiimIds.add(id);
                }
            });
        }
    });
    
    return {
        total: hiimIds.size,
        active: activeHiimIds.size,
        closed: closedHiimIds.size
    };
}

// Function to calculate month-end Q and P counts for the current application
async function calculateMonthEndCounts(month, year) {
    try {
        // Build API URL with date range for the entire month AND current application filter
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        const params = new URLSearchParams();
        params.append('start_date', startDateStr);
        params.append('end_date', endDateStr);
        
        // IMPORTANT: Filter by current application to get correct counts
        if (filters.application) {
            params.append('application', filters.application);
        }
        
        const response = await fetch(`/api/entries?${params.toString()}`);
        if (!response.ok) {
            throw new Error('Failed to fetch month data');
        }
        
        const allMonthEntries = await response.json();
        
        let qualityRedCount = 0;
        let punctualityRedCount = 0;
        
        allMonthEntries.forEach(entry => {
            // Count Quality red - handle XVA vs other applications differently
            if (filters.application === 'XVA') {
                // For XVA: Quality is red if either Legacy OR Target is red
                if (entry.quality_legacy === 'Red' || entry.quality_target === 'Red') {
                    qualityRedCount++;
                }
            } else {
                // For other applications: Use quality_status field
                if (entry.quality_status === 'Red') {
                    qualityRedCount++;
                }
            }
            
            // Count Punctuality red - handle XVA vs other applications differently
            if (filters.application === 'XVA') {
                // For XVA: Punctuality is red if any of valo, sensi, or cf_ra is red
                if (entry.valo_status === 'Red' || entry.sensi_status === 'Red' || entry.cf_ra_status === 'Red') {
                    punctualityRedCount++;
                }
            } else {
                // For other applications: Use prc_mail and cp_alerts
                if (entry.prc_mail_status === 'Red' || entry.cp_alerts_status === 'Red') {
                    punctualityRedCount++;
                }
            }
        });
        
        return {
            quality: qualityRedCount,
            punctuality: punctualityRedCount
        };
    } catch (error) {
        console.error('Error calculating month-end counts:', error);
        return { quality: 0, punctuality: 0 };
    }
}

function displayEntries(entries) {
    entriesTbody.innerHTML = '';
    
    // Show/hide count displays based on filters
    const countDisplaysContainer = document.getElementById('count-displays-container');
    const prbCountDisplay = document.getElementById('prb-count-display');
    const hiimCountDisplay = document.getElementById('hiim-count-display');
    
    let shouldShowCounts = false;
    
    // Show PRB counts if PRB Only filter is checked
    if (filters.prbOnly.checked && entries.length > 0) {
        const prbCounts = calculatePrbCounts(entries);
        document.getElementById('prb-total-count').textContent = prbCounts.total;
        document.getElementById('prb-active-count').textContent = prbCounts.active;
        document.getElementById('prb-closed-count').textContent = prbCounts.closed;
        prbCountDisplay.style.display = 'block';
        shouldShowCounts = true;
    } else {
        prbCountDisplay.style.display = 'none';
    }
    
    // Show HIIM counts if HIIM Only filter is checked
    if (filters.hiimOnly.checked && entries.length > 0) {
        const hiimCounts = calculateHiimCounts(entries);
        document.getElementById('hiim-total-count').textContent = hiimCounts.total;
        document.getElementById('hiim-active-count').textContent = hiimCounts.active;
        document.getElementById('hiim-closed-count').textContent = hiimCounts.closed;
        hiimCountDisplay.style.display = 'block';
        shouldShowCounts = true;
    } else {
        hiimCountDisplay.style.display = 'none';
    }
    
    // Show container if any counts should be displayed
    countDisplaysContainer.style.display = shouldShowCounts ? 'flex' : 'none';
    
    if (entries.length === 0) {
        const visibleColumns = getVisibleColumnsForApplication(filters.application);
        const colspan = visibleColumns.length;
        entriesTbody.innerHTML = `<tr><td colspan="${colspan}" class="text-center">No entries found</td></tr>`;
        return;
    }

    // Detect if we're in row-level filtering mode (PRB Only, HIIM Only, or Time Loss Only)
    const isRowLevelFiltering = filters.prbOnly.checked || filters.hiimOnly.checked || filters.timeLossOnly.checked;
    
    if (isRowLevelFiltering) {
        // Row-level filtering: Display each entry as an individual row without grouping/expansion
        displayIndividualRows(entries);
    } else {
        // Normal display: Group entries by week and expand multi-item entries
        displayGroupedEntries(entries);
    }
    
    // Apply column visibility based on current application
    toggleColumnsForApplication(filters.application);
    
    // Authentication state is now handled by CSS classes
}

function displayIndividualRows(entries) {
    /**
     * Display individual rows for row-level filtering (PRB Only, HIIM Only, Time Loss Only)
     * Each entry is treated as a separate row without grouping or expansion
     */
    
    // Sort entries by date descending
    const sortedEntries = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedEntries.forEach(entry => {
        // Create a single row for each individual entry
        const row = createSingleEntryRow(entry);
        entriesTbody.appendChild(row);
    });
}

function displayGroupedEntries(entries) {
    /**
     * Normal display logic: Group entries by week and expand multi-item entries
     */
    
    // Group entries by week
    const weeklyGroups = {};
    entries.forEach(entry => {
        const weekStart = getWeekStartDate(entry.date);
        if (!weeklyGroups[weekStart]) {
            weeklyGroups[weekStart] = [];
        }
        weeklyGroups[weekStart].push(entry);
    });
    
    // Sort weeks by date (newest first)
    const sortedWeeks = Object.keys(weeklyGroups).sort((a, b) => new Date(b) - new Date(a));
    
    sortedWeeks.forEach(weekStart => {
        const weekEntries = weeklyGroups[weekStart];
        
        // Check if this is the 3rd weekend of the month
        const isInfraWeekend = isThirdWeekendOfMonth(weekStart);
        
        // Add week header
        const weekHeaderRow = document.createElement('tr');
        weekHeaderRow.className = 'week-header';
        // Check if this is a month-end week
        const weekStartDate = new Date(weekStart);
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 6);
        
        // Check if this is the last week of the month
        const lastDayOfMonth = new Date(weekStartDate.getFullYear(), weekStartDate.getMonth() + 1, 0);
        const lastDay = lastDayOfMonth.getDate();
        
        // Check if this is the last week of the month
        // Either the week spans across months OR the week contains the last day of the month
        // But only if this week actually contains entries for the current month
        const weekContainsCurrentMonthData = weekEntries.some(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.getMonth() === weekStartDate.getMonth() && 
                   entryDate.getFullYear() === weekStartDate.getFullYear();
        });
        
        const isMonthEndWeek = weekContainsCurrentMonthData && (
            weekStartDate.getMonth() !== weekEndDate.getMonth() || 
            weekEndDate.getDate() >= lastDay
        );
        
        // Calculate red counts for entire month (only if month-end week)
        let qualityRedCount = 0;
        let punctualityRedCount = 0;
        
        if (isMonthEndWeek) {
            // Get all entries for the current month (need to fetch all data, not just filtered)
            const currentMonth = weekStartDate.getMonth();
            const currentYear = weekStartDate.getFullYear();
            
            // Calculate Q and P counts for the entire month using all entries
            // We need to fetch all entries for the month, not just the filtered ones
            calculateMonthEndCounts(currentMonth, currentYear).then(counts => {
                qualityRedCount = counts.quality;
                punctualityRedCount = counts.punctuality;
                
                // Update the week header with the correct counts
                const weekMetricsDiv = weekHeaderRow.querySelector('.week-metrics');
                if (weekMetricsDiv) {
                    weekMetricsDiv.innerHTML = `
                        ${qualityRedCount > 0 ? `<span class="metric-badge quality-red">Q: ${qualityRedCount}</span>` : ''}
                        ${punctualityRedCount > 0 ? `<span class="metric-badge punctuality-red">P: ${punctualityRedCount}</span>` : ''}
                    `;
                }
            });
        }
        
        // Calculate colspan based on visible columns for current application
        const visibleColumns = getVisibleColumnsForApplication(filters.application);
        const colspan = visibleColumns.length;
        
        weekHeaderRow.innerHTML = `
            <td colspan="${colspan}" class="week-header-cell">
                <div class="week-header-content">
                    <span class="week-title">${formatWeekRange(weekStart)}</span>
                    ${isInfraWeekend ? '<span class="infra-weekend-badge">Infra weekend</span>' : ''}
                    ${isMonthEndWeek ? `
                        <div class="week-metrics">
                            <span class="loading">Loading Q & P counts...</span>
                        </div>
                    ` : ''}
                </div>
            </td>
        `;
        entriesTbody.appendChild(weekHeaderRow);
        
        // Add entries for this week, expanding multiple items per date into separate rows
        weekEntries.forEach(entry => {
            const expandedRows = createExpandedEntryRows(entry);
            expandedRows.forEach(row => {
                entriesTbody.appendChild(row);
            });
        });
    });
}

function createSingleEntryRow(entry) {
    /**
     * Create a single row for an individual entry (used in row-level filtering)
     * No expansion or grouping - just display the entry as-is
     */
    
    const entryId = `entry-${entry.id}`;
    
    // Determine the item type based on the entry's row_type and content
    let itemType = 'main';
    if (entry.row_type) {
        itemType = entry.row_type;
    } else {
        // Legacy detection for entries without explicit row_type
        if (entry.prb_id_number && !entry.hiim_id_number && !entry.issue_description) {
            itemType = 'prb';
        } else if (entry.hiim_id_number && !entry.prb_id_number && !entry.issue_description) {
            itemType = 'hiim';
        } else if (entry.issue_description && !entry.prb_id_number && !entry.hiim_id_number) {
            itemType = 'issue';
        }
    }
    
    // Use the existing createEntryRow function
    // Parameters: (entry, isFirstRow, itemType, entryId, childCount)
    const row = createEntryRow(entry, true, itemType, entryId, 0);
    
    // Add specific styling for individual row display
    row.classList.add('individual-row');
    if (entry.row_type) {
        row.classList.add(`row-type-${entry.row_type}`);
    }
    
    return row;
}

function createExpandedEntryRows(entry) {
    const rows = [];
    const entryId = `entry-${entry.id}`;

    // NEW APPROACH: Use row_position-based Item Set alignment
    // Create Item Sets based on row_position from database independent rows
    const itemSets = [];
    
    // Get all items and sort by row_position to maintain Item Set ordering
    const allItems = [];
    
    // Add issues with their positions
    const issues = entry.issues || [];
    issues.forEach(issue => {
        allItems.push({
            type: 'issue',
            position: issue.row_position || 0,
            data: issue
        });
    });
    
    // Add PRBs with their positions
    const prbs = entry.prbs || [];
    prbs.forEach(prb => {
        allItems.push({
            type: 'prb', 
            position: prb.row_position || 0,
            data: prb
        });
    });
    
    // Add HIIMs with their positions
    const hiims = entry.hiims || [];
    hiims.forEach(hiim => {
        allItems.push({
            type: 'hiim',
            position: hiim.row_position || 0,
            data: hiim
        });
    });
    
    // Handle legacy single-value entries (for backward compatibility)
    if (entry.issue_description && allItems.filter(i => i.type === 'issue').length === 0) {
        allItems.push({
            type: 'issue',
            position: 0,
            data: { description: entry.issue_description }
        });
    }
    
    if (entry.prb_id_number && allItems.filter(i => i.type === 'prb').length === 0) {
        allItems.push({
            type: 'prb',
            position: 0,
            data: { 
                prb_id_number: entry.prb_id_number, 
                prb_id_status: entry.prb_id_status, 
                prb_link: entry.prb_link 
            }
        });
    }
    
    if (entry.hiim_id_number && allItems.filter(i => i.type === 'hiim').length === 0) {
        allItems.push({
            type: 'hiim',
            position: 0,
            data: { 
                hiim_id_number: entry.hiim_id_number, 
                hiim_id_status: entry.hiim_id_status, 
                hiim_link: entry.hiim_link 
            }
        });
    }
    
    // Group items by row_position to create Item Sets
    const positionGroups = {};
    allItems.forEach(item => {
        const pos = item.position;
        if (!positionGroups[pos]) {
            positionGroups[pos] = { issue: null, prb: null, hiim: null };
        }
        positionGroups[pos][item.type] = item.data;
    });
    
    // Sort positions and create Item Sets
    const positions = Object.keys(positionGroups).map(Number).sort((a, b) => a - b);
    
    // Ensure we have at least one row (main row)
    if (positions.length === 0) {
        positions.push(0);
        positionGroups[0] = { issue: null, prb: null, hiim: null };
    }
    
    const totalChildRows = Math.max(positions.length - 1, 0);
    
    // Create rows for each Item Set position
    positions.forEach((position, index) => {
        const isFirst = index === 0;
        const rowId = isFirst ? entryId : `${entryId}-child-${index - 1}`;
        const itemSet = positionGroups[position];
        
        // Build per-row entry with only the items for this position
        const itemEntry = {
            ...entry,
            issue_description: itemSet.issue ? itemSet.issue.description : '',
            issues: itemSet.issue ? [itemSet.issue] : [],
            prbs: itemSet.prb ? [itemSet.prb] : [],
            hiims: itemSet.hiim ? [itemSet.hiim] : [],
            prb_id_number: itemSet.prb ? (itemSet.prb.prb_id_number || itemSet.prb.prb_id || '') : '',
            prb_id_status: itemSet.prb ? (itemSet.prb.prb_id_status || 'default') : '',
            prb_link: itemSet.prb ? (itemSet.prb.prb_link || '') : '',
            hiim_id_number: itemSet.hiim ? (itemSet.hiim.hiim_id_number || itemSet.hiim.hiim_id || '') : '',
            hiim_id_status: itemSet.hiim ? (itemSet.hiim.hiim_id_status || 'default') : '',
            hiim_link: itemSet.hiim ? (itemSet.hiim.hiim_link || '') : ''
        };
        
        // Determine row type based on what's present in this Item Set
        let rowType = 'issue';
        if (!itemSet.issue && itemSet.prb && !itemSet.hiim) rowType = 'prb';
        else if (!itemSet.issue && itemSet.hiim && !itemSet.prb) rowType = 'hiim';
        else if (!itemSet.issue && itemSet.prb && itemSet.hiim) rowType = 'issue'; // mixed row
        
        const row = createEntryRow(itemEntry, isFirst, rowType, rowId, isFirst ? totalChildRows : 0);
        if (!isFirst) {
            row.classList.add('child-row', 'hidden');
            row.setAttribute('data-parent-id', entryId);
        }
        rows.push(row);
    });

    return rows;
}

// Developer diagnostic helper (non-production impact): run in console to verify mapping
// Example: window._debugMap(2,1,1) => two issues, one prb, one hiim bottom-aligned
window._debugMap = function(issueCount, prbCount, hiimCount) {
    const issueList = Array.from({length: issueCount}, (_,i)=>`ISSUE_${i+1}`);
    const prbList = Array.from({length: prbCount}, (_,i)=>`PRB_${i+1}`);
    const hiimList = Array.from({length: hiimCount}, (_,i)=>`HIIM_${i+1}`);
    const extraPrb = Math.max(0, prbCount - issueCount);
    const extraHiim = Math.max(0, hiimCount - issueCount);
    const extraRows = Math.max(extraPrb, extraHiim);
    const totalRows = Math.max(1, issueCount) + extraRows;
    const prbStartIndex = prbCount <= issueCount ? (issueCount - prbCount) : 0;
    const hiimStartIndex = hiimCount <= issueCount ? (issueCount - hiimCount) : 0;
    const rows = [];
    for (let i=0;i<totalRows;i++) {
        let issue = i < issueCount ? issueList[i] : null;
        let prb = null;
        if (prbCount > 0) {
            if (prbCount <= issueCount) {
                if (i >= prbStartIndex && i < issueCount) prb = prbList[i - prbStartIndex];
            } else {
                if (i < issueCount) prb = prbList[i]; else prb = prbList[issueCount + (i - issueCount)] || null;
            }
        }
        let hiim = null;
        if (hiimCount > 0) {
            if (hiimCount <= issueCount) {
                if (i >= hiimStartIndex && i < issueCount) hiim = hiimList[i - hiimStartIndex];
            } else {
                if (i < issueCount) hiim = hiimList[i]; else hiim = hiimList[issueCount + (i - issueCount)] || null;
            }
        }
        rows.push({row:i+1, issue, prb, hiim});
    }
    console.table(rows);
    return rows;
};

// Function to toggle visibility of child rows
function toggleChildRows(entryId) {
    const parentRow = document.getElementById(entryId);
    if (!parentRow) return;
    
    const childRows = document.querySelectorAll(`[data-parent-id="${entryId}"]`);
    const expandButton = parentRow.querySelector('.expand-button');
    const expandArrow = parentRow.querySelector('.expand-arrow');
    
    if (!expandButton || !expandArrow) return;
    
    const isCurrentlyExpanded = expandButton.classList.contains('expanded');
    
    if (isCurrentlyExpanded) {
        // Collapse - hide child rows
        childRows.forEach(row => {
            row.classList.add('hidden');
            row.classList.remove('visible');
        });
        expandArrow.textContent = '▼';
        expandButton.classList.remove('expanded');
        expandButton.title = expandButton.title.replace('Hide', 'Show');
    } else {
        // Expand - show child rows
        childRows.forEach(row => {
            row.classList.remove('hidden');
            row.classList.add('visible');
        });
        expandArrow.textContent = '▲';
        expandButton.classList.add('expanded');
        expandButton.title = expandButton.title.replace('Show', 'Hide');
    }
}

function createEntryRow(entry, isFirstRow, itemType, entryId, childCount) {
    // Set defaults manually for better compatibility
    if (isFirstRow === undefined) isFirstRow = true;
    if (itemType === undefined) itemType = null;
    if (entryId === undefined) entryId = null;
    if (childCount === undefined) childCount = 0;
    
    const row = document.createElement('tr');
    row.className = 'fade-in';
    
    // Add ID if provided
    if (entryId) {
        row.id = entryId;
    }
    
    // Add special classes for grouped rows
    if (!isFirstRow) {
        row.classList.add('sub-row');
        if (itemType) {
            row.classList.add(`sub-row-${itemType}`);
        }
    }
    
    // DEBUG: log the entry being rendered to help diagnose missing items in the UI

    
    
    // Check if it's a weekend
    const isWeekendDay = isWeekend(entry.date);
    if (isWeekendDay) {
        row.classList.add('weekend-row');
    }
    
    // Parse combined fields
    const prcMailText = entry.prc_mail_text || '';
    const prcMailStatus = entry.prc_mail_status || '';
    const cpAlertsText = entry.cp_alerts_text || '';
    const cpAlertsStatus = entry.cp_alerts_status || '';
    // Support arrays from normalized DB
    const prbIdNumber = entry.prb_id_number || '';
    const prbIdStatus = entry.prb_id_status || '';
    const hiimIdNumber = entry.hiim_id_number || '';
    const hiimIdStatus = entry.hiim_id_status || '';
    const prbs = entry.prbs || [];
    const hiims = entry.hiims || [];
    const issues = entry.issues || [];
    
    // Get time-based colors for PRC Mail and CP Alerts
    const prcMailTimeColor = getTimeBasedColor(prcMailText, entry.date, filters.application, 'prc_mail');
    const cpAlertsTimeColor = getTimeBasedColor(cpAlertsText, entry.date, filters.application, 'cp_alerts');
    
    // Prefer explicit status selected by user; otherwise fall back to time-based color
    const prcMailColor = prcMailStatus ? prcMailStatus : prcMailTimeColor;
    const cpAlertsColor = cpAlertsStatus ? cpAlertsStatus : cpAlertsTimeColor;
    
    // Create status badges with appropriate color coding
    const prcMailBadge = prcMailStatus ? `<span class="status-badge status-${prcMailColor}">${formatTimeDisplay(prcMailText)}</span>` : 'N/A';
    const cpAlertsBadge = cpAlertsStatus ? `<span class="status-badge status-${cpAlertsColor}">${formatTimeDisplay(cpAlertsText)}</span>` : 'N/A';
    
    // Helpers to normalize IDs for robust de-duplication (handle case, prefixes, spacing)
    const normalizePrbId = (num) => {
        if (num == null) return '';
        let s = String(num).trim().toUpperCase();
        // Remove common prefix variations like PRB, PRB-, PRB_, PRB space
        s = s.replace(/^PRB[-_\s]?/, '');
        // Remove spaces
        s = s.replace(/\s+/g, '');
        return s;
    };
    const normalizeHiimId = (num) => {
        if (num == null) return '';
        let s = String(num).trim().toUpperCase();
        s = s.replace(/^HIIM[-_\s]?/, '');
        s = s.replace(/\s+/g, '');
        return s;
    };

    // Create clickable PRB and HIIM badges with de-duplication by normalized ID number
    // Render PRBs: combine array items and legacy single value, then deduplicate
    let prbIdBadge = 'N/A';
    const allPrbs = [];
    
    // First, add all PRBs from the array
    if (Array.isArray(prbs)) {
        allPrbs.push(...prbs);
    }
    
    // Then add legacy PRB if it exists, but check against ALL existing PRBs (including array ones)
    if (prbIdNumber && prbIdNumber.toString().trim()) {
        const legacyPrbNorm = normalizePrbId(prbIdNumber);
        if (legacyPrbNorm) {
            // Check if this PRB ID is already present in any form
            const isAlreadyPresent = allPrbs.some(p => {
                const raw = p && (p.prb_id_number != null ? p.prb_id_number : (p.prb_id != null ? p.prb_id : ''));
                return normalizePrbId(raw) === legacyPrbNorm;
            });
            
            if (!isAlreadyPresent) {
                // Create PRB object from legacy fields
                const legacyPrb = {
                    prb_id_number: prbIdNumber,
                    prb_id_status: prbIdStatus || 'default',
                    prb_link: entry.prb_link
                };
                allPrbs.push(legacyPrb);
            }
        }
    }
    
    // Final deduplication across all sources
    if (allPrbs.length > 0) {
        const seenPrbNums = new Set();
        const uniquePrbs = [];
        allPrbs.forEach(p => {
            if (!p) return; // Skip null/undefined PRBs
            const raw = p.prb_id_number != null ? p.prb_id_number : (p.prb_id != null ? p.prb_id : '');
            const norm = normalizePrbId(raw);
            if (!norm) return; // Skip empty/invalid PRB IDs
            
            if (!seenPrbNums.has(norm)) {
                seenPrbNums.add(norm);
                uniquePrbs.push(p);
            }
        });
        
        if (uniquePrbs.length > 0) {
            prbIdBadge = uniquePrbs.map(p => {
                const prbNumber = p.prb_id_number || p.prb_id || '';
                const prbStatus = p.prb_id_status || 'default';
                const prbLink = p.prb_link;
                
                return prbLink
                    ? `<span class="status-badge status-${prbStatus} clickable-id" data-link="${prbLink}" data-type="prb" title="Click to open PRB link">${prbNumber}</span>`
                    : `<span class="status-badge status-${prbStatus}">${prbNumber}</span>`;
            }).join(' ');
        }
    }

    // Render HIIMs: combine array items and legacy single value, then deduplicate
    let hiimIdBadge = 'N/A';
    const allHiims = [];
    
    // First, add all HIIMs from the array
    if (Array.isArray(hiims)) {
        allHiims.push(...hiims);
    }
    
    // Then add legacy HIIM if it exists, but check against ALL existing HIIMs (including array ones)
    if (hiimIdNumber && hiimIdNumber.toString().trim()) {
        const legacyHiimNorm = normalizeHiimId(hiimIdNumber);
        if (legacyHiimNorm) {
            // Check if this HIIM ID is already present in any form
            const isAlreadyPresent = allHiims.some(h => {
                const raw = h && (h.hiim_id_number != null ? h.hiim_id_number : (h.hiim_id != null ? h.hiim_id : ''));
                return normalizeHiimId(raw) === legacyHiimNorm;
            });
            
            if (!isAlreadyPresent) {
                // Create HIIM object from legacy fields
                const legacyHiim = {
                    hiim_id_number: hiimIdNumber,
                    hiim_id_status: hiimIdStatus || 'default',
                    hiim_link: entry.hiim_link
                };
                allHiims.push(legacyHiim);
            }
        }
    }
    
    // Final deduplication across all sources
    if (allHiims.length > 0) {
        const seenHiimNums = new Set();
        const uniqueHiims = [];
        allHiims.forEach(h => {
            if (!h) return; // Skip null/undefined HIIMs
            const raw = h.hiim_id_number != null ? h.hiim_id_number : (h.hiim_id != null ? h.hiim_id : '');
            const norm = normalizeHiimId(raw);
            if (!norm) return; // Skip empty/invalid HIIM IDs
            
            if (!seenHiimNums.has(norm)) {
                seenHiimNums.add(norm);
                uniqueHiims.push(h);
            }
        });
        
        if (uniqueHiims.length > 0) {
            hiimIdBadge = uniqueHiims.map(h => {
                const hiimNumber = h.hiim_id_number || h.hiim_id || '';
                const hiimStatus = h.hiim_id_status || 'default';
                const hiimLink = h.hiim_link;
                
                return hiimLink
                    ? `<span class="status-badge status-${hiimStatus} clickable-id" data-link="${hiimLink}" data-type="hiim" title="Click to open HIIM link">${hiimNumber}</span>`
                    : `<span class="status-badge status-${hiimStatus}">${hiimNumber}</span>`;
            }).join(' ');
        }
    }
    
    const qualityClass = entry.quality_status ? `quality-${entry.quality_status.toLowerCase()}` : '';
    const qualityBadge = entry.quality_status ? `<span class="quality-badge ${qualityClass}">${entry.quality_status}</span>` : 'N/A';
    
    // Format date with weekend indicator and expand button (only show on first row)
    let dateDisplay = '';
    if (isFirstRow) {
        const baseDateDisplay = isWeekendDay ? 
            `${formatDate(entry.date)} <span class="weekend-indicator">🏖️ Holiday - No Batch</span>` : 
            formatDate(entry.date);
        
        // Add expand button if there are child rows
        if (childCount > 0) {
            dateDisplay = `
                <div class="date-with-expand">
                    <div class="date-text">${baseDateDisplay}</div>
                    <div class="expand-button" onclick="toggleChildRows('${entryId}')" title="Show ${childCount} more items">
                        <span class="expand-arrow">▼</span>
                        <span class="expand-count">(+${childCount})</span>
                    </div>
                </div>
            `;
        } else {
            dateDisplay = baseDateDisplay;
        }
    }
    
    // Get day of week (only show on first row)
    const dayOfWeek = isFirstRow ? getDayOfWeek(entry.date) : '';
    
    // Show common fields only on first row, leave empty on sub-rows
    const prcMailDisplay = isFirstRow ? prcMailBadge : '';
    const cpAlertsDisplay = isFirstRow ? cpAlertsBadge : '';
    const qualityDisplay = isFirstRow ? qualityBadge : '';
    const remarksDisplay = isFirstRow ? (entry.remarks || 'N/A') : '';
    const actionsDisplay = isFirstRow ? `
        <button class="btn btn-primary btn-sm" onclick="editEntry(${entry.id})" title="Edit">
            <img src="/static/images/icons8-edit-128.png" alt="Edit" style="width: 16px; height: 16px;">
        </button>
        <button class="btn btn-danger btn-sm" onclick="deleteEntry(${entry.id})" title="Delete">
            <img src="/static/images/icons8-delete-48.png" alt="Delete" style="width: 16px; height: 16px;">
        </button>
    ` : '';
    
    // For sub-rows, only show the specific item, clear all other fields
    let issuesDisplay = '';
    let prbDisplay = '';
    let hiimDisplay = '';
    
    if (isFirstRow) {
        // First row shows items normally
        issuesDisplay = issues.length ? issues.filter(i => i !== null).map(i => `<div class="issue-list-item">${escapeHtml(i.description)}</div>`).join('') : (entry.issue_description ? escapeHtml(entry.issue_description) : 'N/A');
        prbDisplay = prbIdBadge;
        hiimDisplay = hiimIdBadge;
    } else {
        // For issue sub-rows, also show its related PRBs/HIIMs in the same row
        if (itemType === 'issue') {
            issuesDisplay = issues.length ? issues.filter(i => i !== null).map(i => `<div class="issue-list-item">${escapeHtml(i.description)}</div>`).join('') : (entry.issue_description ? escapeHtml(entry.issue_description) : '');
            prbDisplay = prbIdBadge;
            hiimDisplay = hiimIdBadge;
        } else if (itemType === 'prb') {
            issuesDisplay = '';
            prbDisplay = prbIdBadge;
            hiimDisplay = '';
        } else if (itemType === 'hiim') {
            issuesDisplay = '';
            prbDisplay = '';
            hiimDisplay = hiimIdBadge;
        }
    }
    
    // XVA specific displays (only populate on first row)
    const acqDisplay = isFirstRow ? (entry.acq_text ? `<span class="status-badge">${formatTimeDisplay(entry.acq_text)}</span>` : 'N/A') : '';
    const valoDisplay = isFirstRow ? (entry.valo_status ? `<span class="status-badge status-${(entry.valo_status || '').toLowerCase()}">${formatTimeDisplay(entry.valo_text || '')}</span>` : 'N/A') : '';
    const sensiDisplay = isFirstRow ? (entry.sensi_status ? `<span class="status-badge status-${(entry.sensi_status || '').toLowerCase()}">${formatTimeDisplay(entry.sensi_text || '')}</span>` : 'N/A') : '';
    const cfRaDisplay = isFirstRow ? (entry.cf_ra_status ? `<span class="status-badge status-${(entry.cf_ra_status || '').toLowerCase()}">${formatTimeDisplay(entry.cf_ra_text || '')}</span>` : 'N/A') : '';
    const qualityLegacyDisplay = isFirstRow ? (entry.quality_legacy ? `<span class="quality-badge quality-${(entry.quality_legacy || '').toLowerCase()}">${entry.quality_legacy}</span>` : 'N/A') : '';
    const qualityTargetDisplay = isFirstRow ? (entry.quality_target ? `<span class="quality-badge quality-${(entry.quality_target || '').toLowerCase()}">${entry.quality_target}</span>` : 'N/A') : '';
    const rootCauseApplicationDisplay = isFirstRow ? (entry.root_cause_application || 'N/A') : '';
    const rootCauseTypeDisplay = isFirstRow ? (entry.root_cause_type || 'N/A') : '';
    const xvaRemarksDisplay = isFirstRow ? (entry.xva_remarks || 'N/A') : '';

    // REG specific displays (only populate on first row)
    // REG ID removed from UI
    const closingDisplay = isFirstRow ? (entry.closing || 'N/A') : '';
    const iterationDisplay = isFirstRow ? (entry.iteration || 'N/A') : '';
    const regIssueDisplay = isFirstRow ? (entry.reg_issue || 'N/A') : '';
    const actionTakenDisplay = isFirstRow ? (entry.action_taken_and_update || 'N/A') : '';
    const regStatusRaw = (entry.reg_status || '').toLowerCase();
    const regStatusClass = (regStatusRaw === 'in progress' || regStatusRaw === 'resolved') ? 'ongoing' : regStatusRaw.replace(/\s+/g, '-');
    const regStatusDisplay = isFirstRow ? (entry.reg_status ? `<span class="status-badge status-${regStatusClass}">${entry.reg_status}</span>` : 'N/A') : '';
    const regPrbDisplay = isFirstRow ? (entry.reg_prb || 'N/A') : '';
    const regHiimDisplay = isFirstRow ? (entry.reg_hiim || 'N/A') : '';
    const backlogItemDisplay = isFirstRow ? (entry.backlog_item || 'N/A') : '';
    
    // OTHERS display variables
    const dareDisplay = isFirstRow ? (entry.dare || 'N/A') : '';
    const timingsDisplay = isFirstRow ? (entry.timings || 'N/A') : '';
    const puntualityIssueDisplay = isFirstRow ? (entry.puntuality_issue || 'N/A') : '';
    const othersQualityDisplay = isFirstRow ? (entry.quality || 'N/A') : '';
    const qualityIssueDisplay = isFirstRow ? (entry.quality_issue || 'N/A') : '';
    const othersPrbDisplay = isFirstRow ? (entry.others_prb || 'N/A') : '';
    const othersHiimDisplay = isFirstRow ? (entry.others_hiim || 'N/A') : '';

    // Render all columns in the current order as defined by columnOrder and add data-column for robustness
    const columnContent = {
        date: { html: dateDisplay, cls: 'date-cell' },
        day: { html: dayOfWeek, cls: 'day-column' },
        prc_mail: { html: prcMailDisplay, cls: 'common-field' },
        cp_alerts: { html: cpAlertsDisplay, cls: 'common-field' },
    quality_status: { html: qualityDisplay, cls: 'common-field' },
        issue_description: { html: issuesDisplay, cls: 'item-field' },
        time_loss: { html: isFirstRow ? (entry.time_loss ? escapeHtml(entry.time_loss) : 'N/A') : '', cls: 'common-field' },
        prb_id: { html: prbDisplay, cls: 'item-field' },
        hiim_id: { html: hiimDisplay, cls: 'item-field' },
        remarks: { html: remarksDisplay, cls: 'common-field' },
        acq: { html: acqDisplay, cls: 'common-field' },
        valo: { html: valoDisplay, cls: 'common-field' },
        sensi: { html: sensiDisplay, cls: 'common-field' },
        cf_ra: { html: cfRaDisplay, cls: 'common-field' },
        quality_legacy: { html: qualityLegacyDisplay, cls: 'common-field' },
        quality_target: { html: qualityTargetDisplay, cls: 'common-field' },
        root_cause_application: { html: rootCauseApplicationDisplay, cls: 'common-field' },
        root_cause_type: { html: rootCauseTypeDisplay, cls: 'common-field' },
        xva_remarks: { html: xvaRemarksDisplay, cls: 'common-field' },
    // reg_id removed from UI
        closing: { html: closingDisplay, cls: 'common-field' },
        iteration: { html: iterationDisplay, cls: 'common-field' },
        reg_issue: { html: regIssueDisplay, cls: 'common-field' },
        action_taken_and_update: { html: actionTakenDisplay, cls: 'common-field' },
        reg_status: { html: regStatusDisplay, cls: 'common-field' },
        reg_prb: { html: regPrbDisplay, cls: 'common-field' },
        reg_hiim: { html: regHiimDisplay, cls: 'common-field' },
        backlog_item: { html: backlogItemDisplay, cls: 'common-field' },
        // OTHERS columns
        dare: { html: dareDisplay, cls: 'common-field' },
        timings: { html: timingsDisplay, cls: 'common-field' },
        puntuality_issue: { html: puntualityIssueDisplay, cls: 'common-field' },
    quality: { html: othersQualityDisplay, cls: 'common-field' },
        quality_issue: { html: qualityIssueDisplay, cls: 'common-field' },
        others_prb: { html: othersPrbDisplay, cls: 'common-field' },
        others_hiim: { html: othersHiimDisplay, cls: 'common-field' },
        actions: { html: actionsDisplay, cls: 'edit-column' }
    };

    // Fallback if columnOrder is not initialized
    const order = (typeof columnOrder !== 'undefined' && Array.isArray(columnOrder) && columnOrder.length)
        ? columnOrder
    : ['date', 'day', 'prc_mail', 'cp_alerts', 'quality', 'issue_description', 'time_loss', 'prb_id', 'hiim_id', 'remarks', 'acq', 'valo', 'sensi', 'cf_ra', 'quality_legacy', 'quality_target', 'root_cause_application', 'root_cause_type', 'xva_remarks', 'closing', 'iteration', 'reg_issue', 'action_taken_and_update', 'reg_status', 'reg_prb', 'reg_hiim', 'backlog_item', 'dare', 'timings', 'puntuality_issue', 'quality', 'quality_issue', 'others_prb', 'others_hiim', 'actions'];

    // Only render cells for columns intended to be visible for the current application.
    const visibleSet = new Set(getVisibleColumnsForApplication(filters.application));
    const cellsHtml = order.map(col => {
        const shouldShow = visibleSet.has(col);
        const c = columnContent[col] || { html: '', cls: 'common-field' };
        // Always include a TD in the correct order so column resizing/reordering indexes stay aligned,
        // but hide it via inline style when not part of the current application's columns.
        const style = shouldShow ? '' : ' style="display:none"';
        return `<td class="${c.cls}" data-column="${col}"${style}>${shouldShow ? (c.html || '') : ''}</td>`;
    }).join('');
    row.innerHTML = cellsHtml;
    
    // Add click handlers for clickable IDs
    setTimeout(() => {
        const clickableIds = row.querySelectorAll('.clickable-id');
        clickableIds.forEach(element => {
            element.addEventListener('click', function() {
                const link = this.getAttribute('data-link');
                const type = this.getAttribute('data-type');
                if (link) {
                    window.open(link, '_blank');
                }
            });
        });
    }, 0);
    // DEBUG: log the generated HTML for this row so we can inspect whether multiple items were rendered

    
    return row;
}

function updateCharts(stats) {
    // Update chart titles
    updateChartTitles();
    
    // Quality chart
    if (chartVisibilityFilters.quality.checked) {
        updateQualityBarChart(stats.quality_distribution, stats.monthly_quality);
    }
    
    // Punctuality chart
    if (chartVisibilityFilters.punctuality.checked) {
        updatePunctualityBarChart(stats.punctuality_distribution, stats.monthly_punctuality);
    }
    
    // PRB chart
    if (chartVisibilityFilters.prb.checked) {
        updatePRBBarChart(stats.prb_distribution, stats.monthly_prb);
    }
    
    // HIIM chart
    if (chartVisibilityFilters.hiim.checked) {
        updateHIIMBarChart(stats.hiim_distribution, stats.monthly_hiim);
    }
    
    // Update chart visibility
    updateChartVisibility();
}

function updateXVACharts(xvaStats) {
    // Update XVA Monthly Red Count chart
    if (chartVisibilityFilters['xva-monthly-red'].checked) {
        updateXVAMonthlyRedChart(xvaStats.monthly_red_counts);
    }
    
    // Update XVA Root Cause Analysis chart
    if (chartVisibilityFilters['xva-root-cause'].checked) {
        updateXVARootCauseChart(xvaStats.root_cause_analysis);
    }
}

// Helper functions

function updateChartTitles() {
    const titles = {
        quality: 'Quality Status Comparison',
        punctuality: 'Punctuality Status Comparison',
        prb: 'PRB Status Comparison',
        hiim: 'HIIM Status Comparison',
        'xva-monthly-red': 'XVA Monthly Red Count',
        'xva-root-cause': 'XVA Root Cause Analysis'
    };
    
    Object.keys(titles).forEach(chartType => {
        const titleElement = document.getElementById(`${chartType}-chart-title`);
        if (titleElement) {
            titleElement.textContent = titles[chartType];
        }
    });
}



// Quality Bar Chart (Comparison)
function updateQualityBarChart(qualityData, monthlyData) {
    const ctx = qualityChartEl.getContext('2d');
    
    if (charts.quality) {
        charts.quality.destroy();
    }
    
    // Get selected months for chart title
    const selectedMonths = Array.from(chartsFilters.month.selectedOptions).map(option => option.text);
    const selectedYears = Array.from(chartsFilters.year.selectedOptions).map(option => option.value);
    const periodLabel = selectedMonths.length > 0 ? 
        `${selectedMonths.join(', ')} ${selectedYears.join(', ')}` : 
        'Selected Period';
    
    // Prepare data for grouped bar chart
    let labels, datasets;
    
    if (monthlyData && monthlyData.length > 1) {
        // Multiple months - show grouped bars
        labels = monthlyData.map(item => item[1].month_name);
        datasets = [
            {
                label: 'Red',
                data: monthlyData.map(item => item[1].Red || 0),
                backgroundColor: '#dc3545',
                borderColor: '#c82333',
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
            },
            {
                label: 'Yellow',
                data: monthlyData.map(item => item[1].Yellow || 0),
                backgroundColor: '#ffc107',
                borderColor: '#e0a800',
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
            },
            {
                label: 'Green',
                data: monthlyData.map(item => item[1].Green || 0),
                backgroundColor: '#28a745',
                borderColor: '#1e7e34',
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
            }
        ];
    } else {
        // Single month or no monthly data - show simple bars
        labels = ['Red', 'Yellow', 'Green'];
        datasets = [{
            label: `Quality Status (${periodLabel})`,
            data: [qualityData.Red || 0, qualityData.Yellow || 0, qualityData.Green || 0],
            backgroundColor: ['#dc3545', '#ffc107', '#28a745'],
            borderColor: ['#c82333', '#e0a800', '#1e7e34'],
            borderWidth: 2,
            borderRadius: 6,
            borderSkipped: false,
        }];
    }
    
    charts.quality = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: monthlyData && monthlyData.length > 1
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y}`;
                        }
                    }
                },
                datalabels: {
                    display: true,
                    color: 'white',
                    font: {
                        weight: 'bold',
                        size: 12
                    },
                    formatter: function(value) {
                        return value > 0 ? value : '';
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: monthlyData && monthlyData.length > 1 ? 'Month' : 'Quality Status'
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Count'
                    },
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    });
}


// Punctuality Bar Chart (Comparison)
function updatePunctualityBarChart(punctualityData, monthlyData) {
    if (!punctualityChartEl) {
        console.error('Punctuality chart element not found');
        return;
    }
    
    const ctx = punctualityChartEl.getContext('2d');
    
    if (charts.punctuality) {
        charts.punctuality.destroy();
    }
    
    // Get selected months for chart title
    const selectedMonths = Array.from(chartsFilters.month.selectedOptions).map(option => option.text);
    const selectedYears = Array.from(chartsFilters.year.selectedOptions).map(option => option.value);
    const periodLabel = selectedMonths.length > 0 ? 
        `${selectedMonths.join(', ')} ${selectedYears.join(', ')}` : 
        'Selected Period';
    
    // Prepare data for grouped bar chart
    let labels, datasets;
    
    if (monthlyData && monthlyData.length > 1) {
        // Multiple months - show grouped bars
        labels = monthlyData.map(item => item[1].month_name);
        datasets = [
            {
                label: 'Red',
                data: monthlyData.map(item => item[1].Red || 0),
                backgroundColor: '#dc3545',
                borderColor: '#c82333',
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
            },
            {
                label: 'Yellow',
                data: monthlyData.map(item => item[1].Yellow || 0),
                backgroundColor: '#ffc107',
                borderColor: '#e0a800',
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
            },
            {
                label: 'Green',
                data: monthlyData.map(item => item[1].Green || 0),
                backgroundColor: '#28a745',
                borderColor: '#1e7e34',
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
            }
        ];
    } else {
        // Single month or no monthly data - show simple bars
        labels = ['Red', 'Yellow', 'Green'];
        datasets = [{
            label: `Punctuality Status (${periodLabel})`,
            data: [punctualityData.Red || 0, punctualityData.Yellow || 0, punctualityData.Green || 0],
            backgroundColor: ['#dc3545', '#ffc107', '#28a745'],
            borderColor: ['#c82333', '#e0a800', '#1e7e34'],
            borderWidth: 2,
            borderRadius: 6,
            borderSkipped: false,
        }];
    }
    
    charts.punctuality = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: monthlyData && monthlyData.length > 1
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y}`;
                        }
                    }
                },
                datalabels: {
                    display: true,
                    color: 'white',
                    font: {
                        weight: 'bold',
                        size: 12
                    },
                    formatter: function(value) {
                        return value > 0 ? value : '';
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: monthlyData && monthlyData.length > 1 ? 'Month' : 'Punctuality Status'
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Count'
                    },
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    });
}


// PRB Bar Chart (Comparison)
function updatePRBBarChart(prbData, monthlyData) {
    const ctx = prbChartEl.getContext('2d');
    
    if (charts.prb) {
        charts.prb.destroy();
    }
    
    // Get selected months for chart title
    const selectedMonths = Array.from(chartsFilters.month.selectedOptions).map(option => option.text);
    const selectedYears = Array.from(chartsFilters.year.selectedOptions).map(option => option.value);
    const periodLabel = selectedMonths.length > 0 ? 
        `${selectedMonths.join(', ')} ${selectedYears.join(', ')}` : 
        'Selected Period';
    
    // Prepare data for grouped bar chart
    let labels, datasets;
    
    if (monthlyData && monthlyData.length > 1) {
        // Multiple months - show grouped bars
        labels = monthlyData.map(item => item[1].month_name);
        datasets = [
            {
                label: 'Active',
                data: monthlyData.map(item => item[1].active || 0),
                backgroundColor: '#ffc107',
                borderColor: '#e0a800',
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
            },
            {
                label: 'Closed',
                data: monthlyData.map(item => item[1].closed || 0),
                backgroundColor: '#28a745',
                borderColor: '#1e7e34',
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
            }
        ];
    } else {
        // Single month or no monthly data - show simple bars
        labels = ['Active', 'Closed'];
        datasets = [{
            label: `PRB Status (${periodLabel})`,
            data: [prbData.active || 0, prbData.closed || 0],
            backgroundColor: ['#ffc107', '#28a745'],
            borderColor: ['#e0a800', '#1e7e34'],
            borderWidth: 2,
            borderRadius: 6,
            borderSkipped: false,
        }];
    }
    
    charts.prb = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: monthlyData && monthlyData.length > 1
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y}`;
                        }
                    }
                },
                datalabels: {
                    display: true,
                    color: 'white',
                    font: {
                        weight: 'bold',
                        size: 12
                    },
                    formatter: function(value) {
                        return value > 0 ? value : '';
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: monthlyData && monthlyData.length > 1 ? 'Month' : 'PRB Status'
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Count'
                    },
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    });
}


// HIIM Bar Chart (Comparison)
function updateHIIMBarChart(hiimData, monthlyData) {
    const ctx = hiimChartEl.getContext('2d');
    
    if (charts.hiim) {
        charts.hiim.destroy();
    }
    
    // Get selected months for chart title
    const selectedMonths = Array.from(chartsFilters.month.selectedOptions).map(option => option.text);
    const selectedYears = Array.from(chartsFilters.year.selectedOptions).map(option => option.value);
    const periodLabel = selectedMonths.length > 0 ? 
        `${selectedMonths.join(', ')} ${selectedYears.join(', ')}` : 
        'Selected Period';
    
    // Prepare data for grouped bar chart
    let labels, datasets;
    
    if (monthlyData && monthlyData.length > 1) {
        // Multiple months - show grouped bars
        labels = monthlyData.map(item => item[1].month_name);
        datasets = [
            {
                label: 'Active',
                data: monthlyData.map(item => item[1].active || 0),
                backgroundColor: '#ffc107',
                borderColor: '#e0a800',
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
            },
            {
                label: 'Closed',
                data: monthlyData.map(item => item[1].closed || 0),
                backgroundColor: '#28a745',
                borderColor: '#1e7e34',
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
            }
        ];
    } else {
        // Single month or no monthly data - show simple bars
        labels = ['Active', 'Closed'];
        datasets = [{
            label: `HIIM Status (${periodLabel})`,
            data: [hiimData.active || 0, hiimData.closed || 0],
            backgroundColor: ['#ffc107', '#28a745'],
            borderColor: ['#e0a800', '#1e7e34'],
            borderWidth: 2,
            borderRadius: 6,
            borderSkipped: false,
        }];
    }
    
    charts.hiim = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: monthlyData && monthlyData.length > 1
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y}`;
                        }
                    }
                },
                datalabels: {
                    display: true,
                    color: 'white',
                    font: {
                        weight: 'bold',
                        size: 12
                    },
                    formatter: function(value) {
                        return value > 0 ? value : '';
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: monthlyData && monthlyData.length > 1 ? 'Month' : 'HIIM Status'
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Count'
                    },
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    });
}

// XVA Chart Functions
function updateXVAMonthlyRedChart(monthlyData) {
    const ctx = xvaMonthlyRedChartEl.getContext('2d');
    
    if (charts['xva-monthly-red']) {
        charts['xva-monthly-red'].destroy();
    }
    
    // Prepare data for grouped bar chart
    const labels = monthlyData.map(item => item[1].month_name);
    const datasets = [
        {
            label: 'Valo Red',
            data: monthlyData.map(item => item[1].valo_red || 0),
            backgroundColor: '#dc3545',
            borderColor: '#c82333',
            borderWidth: 2,
            borderRadius: 6,
            borderSkipped: false,
        },
        {
            label: 'Sensi Red',
            data: monthlyData.map(item => item[1].sensi_red || 0),
            backgroundColor: '#fd7e14',
            borderColor: '#e55100',
            borderWidth: 2,
            borderRadius: 6,
            borderSkipped: false,
        },
        {
            label: 'CF RA Red',
            data: monthlyData.map(item => item[1].cf_ra_red || 0),
            backgroundColor: '#6f42c1',
            borderColor: '#5a32a3',
            borderWidth: 2,
            borderRadius: 6,
            borderSkipped: false,
        }
    ];
    
    charts['xva-monthly-red'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y}`;
                        }
                    }
                },
                datalabels: {
                    display: true,
                    color: 'white',
                    font: {
                        weight: 'bold',
                        size: 12
                    },
                    formatter: function(value) {
                        return value > 0 ? value : '';
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Month'
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Red Count'
                    },
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    });
}

function updateXVARootCauseChart(rootCauseData) {
    const ctx = xvaRootCauseChartEl.getContext('2d');
    
    if (charts['xva-root-cause']) {
        charts['xva-root-cause'].destroy();
    }
    
    // Group data by application for pie chart
    const appCounts = {};
    rootCauseData.forEach(item => {
        const app = item.root_cause_application;
        if (!appCounts[app]) {
            appCounts[app] = 0;
        }
        appCounts[app] += item.count;
    });
    
    const labels = Object.keys(appCounts);
    const data = Object.values(appCounts);
    
    // Generate distinct colors for each application
    const colors = generateDistinctColors(labels.length);
    
    charts['xva-root-cause'] = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.backgroundColor,
                borderColor: colors.borderColor,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                },
                datalabels: {
                    display: true,
                    color: 'white',
                    font: {
                        weight: 'bold',
                        size: 12
                    },
                    formatter: function(value, context) {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${value}\n(${percentage}%)`;
                    }
                }
            }
        }
    });
}

function generateDistinctColors(count) {
    const colors = [
        { bg: '#dc3545', border: '#c82333' }, // Red
        { bg: '#fd7e14', border: '#e55100' }, // Orange
        { bg: '#ffc107', border: '#e0a800' }, // Yellow
        { bg: '#28a745', border: '#1e7e34' }, // Green
        { bg: '#20c997', border: '#1aa085' }, // Teal
        { bg: '#17a2b8', border: '#117a8b' }, // Cyan
        { bg: '#007bff', border: '#0056b3' }, // Blue
        { bg: '#6f42c1', border: '#5a32a3' }, // Purple
        { bg: '#e83e8c', border: '#d91a72' }, // Pink
        { bg: '#6c757d', border: '#545b62' }  // Gray
    ];
    
    const backgroundColor = [];
    const borderColor = [];
    
    for (let i = 0; i < count; i++) {
        const colorIndex = i % colors.length;
        backgroundColor.push(colors[colorIndex].bg);
        borderColor.push(colors[colorIndex].border);
    }
    
    return { backgroundColor, borderColor };
}

function updateXVATables(xvaStats) {
    // Update Monthly Red Count table
    updateMonthlyRedTable(xvaStats.monthly_red_counts);
    
    // Update Root Cause Analysis table
    updateRootCauseTable(xvaStats.root_cause_analysis, xvaStats.grand_total);
}

function updateMonthlyRedTable(monthlyData) {
    const tbody = document.getElementById('xva-monthly-red-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    monthlyData.forEach(([monthKey, data]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${data.month_name}</td>
            <td>${data.valo_red}</td>
            <td>${data.sensi_red}</td>
            <td>${data.cf_ra_red}</td>
            <td><strong>${data.total_red}</strong></td>
        `;
        tbody.appendChild(row);
    });
}

function updateRootCauseTable(rootCauseData, grandTotal) {
    const tbody = document.getElementById('xva-root-cause-tbody');
    const grandTotalElement = document.getElementById('grand-total-count');
    
    if (!tbody || !grandTotalElement) return;
    
    tbody.innerHTML = '';
    
    rootCauseData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.root_cause_application}</td>
            <td>${item.root_cause_type}</td>
            <td>${item.count}</td>
        `;
        tbody.appendChild(row);
    });
    
    grandTotalElement.textContent = grandTotal;
}

// Form state management functions
function enableFormProtection() {
    pageUnloadProtection = true;
    isFormDirty = false;
}

function disableFormProtection() {
    pageUnloadProtection = false;
    isFormDirty = false;
}

function markFormDirty() {
    if (pageUnloadProtection) {
        isFormDirty = true;
    }
}

function addFormChangeListeners(formElement) {
    if (!formElement) return;
    
    // Add listeners to all form inputs
    const inputs = formElement.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('input', markFormDirty);
        input.addEventListener('change', markFormDirty);
    });
    
    // Also listen for dynamically added elements
    formElement.addEventListener('input', markFormDirty);
    formElement.addEventListener('change', markFormDirty);
}

// Entry management functions
function showEntryModal(entry = null) {
    if (!isAuthenticated) {
        alert('Please authenticate to add/edit entries.');
        return;
    }
    
    currentEntryId = entry ? entry.id : null;
    
    // Enable form protection when opening modal
    enableFormProtection();
    
    // Ensure max date is set to today (in case page has been open for a while)
    setMaxDateToToday();
    
    // Show/hide appropriate form based on current application
    if (filters.application === 'XVA') {
        cvarEntryForm.style.display = 'none';
        xvaEntryForm.style.display = 'block';
        regEntryForm.style.display = 'none';
        othersEntryForm.style.display = 'none';
        
        if (entry) {
            modalTitle.textContent = 'Edit XVA Entry';
            populateXVAEntryForm(entry);
        } else {
            modalTitle.textContent = 'Add New XVA Entry';
            xvaEntryForm.reset();
            // Clear the combined items container for new entries
            clearContainerItems('xva-combined-items-container');
            // Set default date based on current day
            const defaultDate = getDefaultEntryDate();
            document.getElementById('xva-entry-date').value = defaultDate;
            
            // Check if the default date is a weekend and show warning
            if (isWeekend(defaultDate)) {
                showWeekendWarning();
            }
        }
    } else if (filters.application === 'REG') {
        cvarEntryForm.style.display = 'none';
        xvaEntryForm.style.display = 'none';
        regEntryForm.style.display = 'block';
        othersEntryForm.style.display = 'none';
        
        if (entry) {
            modalTitle.textContent = 'Edit REG Entry';
            populateREGEntryForm(entry);
        } else {
            modalTitle.textContent = 'Add New REG Entry';
            regEntryForm.reset();
            // Clear the combined items container for new entries (if REG uses combined items)
            // Note: REG form doesn't appear to use combined items based on HTML structure
            // Set default date based on current day
            const defaultDate = getDefaultEntryDate();
            document.getElementById('reg-entry-date').value = defaultDate;
            
            // Check if the default date is a weekend and show warning
            if (isWeekend(defaultDate)) {
                showWeekendWarning();
            }
        }
    } else if (filters.application === 'OTHERS') {
        cvarEntryForm.style.display = 'none';
        xvaEntryForm.style.display = 'none';
        regEntryForm.style.display = 'none';
        othersEntryForm.style.display = 'block';
        
        if (entry) {
            modalTitle.textContent = 'Edit OTHERS Entry';
            populateOTHERSEntryForm(entry);
        } else {
            modalTitle.textContent = 'Add New OTHERS Entry';
            othersEntryForm.reset();
            // Clear the combined items container for new entries (if OTHERS uses combined items)
            // Note: OTHERS form doesn't appear to use combined items based on HTML structure
            // Set default date based on current day
            const defaultDate = getDefaultEntryDate();
            document.getElementById('others-entry-date').value = defaultDate;
            
            // Check if the default date is a weekend and show warning
            if (isWeekend(defaultDate)) {
                showWeekendWarning();
            }
        }
    } else {
        xvaEntryForm.style.display = 'none';
        regEntryForm.style.display = 'none';
        othersEntryForm.style.display = 'none';
        cvarEntryForm.style.display = 'block';
        
        if (entry) {
            modalTitle.textContent = 'Edit CVAR Entry';
            populateCVAREntryForm(entry);
        } else {
            modalTitle.textContent = 'Add New CVAR Entry';
            cvarEntryForm.reset();
            // Clear the combined items container for new entries
            clearContainerItems('combined-items-container');
            // Set default date based on current day
            const defaultDate = getDefaultEntryDate();
            document.getElementById('entry-date').value = defaultDate;
            
            // Check if the default date is a weekend and show warning
            if (isWeekend(defaultDate)) {
                showWeekendWarning();
            }
        }
    }
    
    // Setup status select styling for all applications
    setupStatusSelectStyling();
    
    // Add form change listeners to track dirty state
    addFormChangeListeners(cvarEntryForm);
    addFormChangeListeners(xvaEntryForm);
    addFormChangeListeners(regEntryForm);
    addFormChangeListeners(othersEntryForm);
    
    entryModal.style.display = 'flex';
}

function showWeekendWarning() {
    // Weekend warning functionality - no visual display
    let warningDiv = document.getElementById('weekend-warning');
    if (!warningDiv) {
        warningDiv = document.createElement('div');
        warningDiv.id = 'weekend-warning';
        warningDiv.className = 'weekend-warning';
        warningDiv.style.display = 'none';
        
        // Insert after the modal title
        const modalHeader = document.querySelector('.modal-header');
        modalHeader.insertAdjacentElement('afterend', warningDiv);
    } else {
        warningDiv.style.display = 'none';
    }
}

function hideWeekendWarning() {
    const warningDiv = document.getElementById('weekend-warning');
    if (warningDiv) {
        warningDiv.style.display = 'none';
    }
}

function hideEntryModal() {
    // Disable form protection when closing modal
    disableFormProtection();
    
    entryModal.style.display = 'none';
    // Reset both forms
    if (cvarEntryForm) cvarEntryForm.reset();
    if (xvaEntryForm) xvaEntryForm.reset();
    // Clear combined items containers to ensure fresh state
    clearContainerItems('combined-items-container');
    clearContainerItems('xva-combined-items-container');
    currentEntryId = null;
    hideWeekendWarning();
}

function showChartsModal() {
    // Check if required elements exist
    if (!chartsFilters.year || !chartsFilters.month || !chartsModal) {
        return;
    }
    
    // No default year selection - keep empty by default
    setCustomMultiselectSelection('year', []);
    
    // Enable month selection since year is selected
    enableMonthSelection();
    
    // Disable future months
    disableFutureMonths();
    
    // No default month selection - keep empty by default
    setCustomMultiselectSelection('month', []);
    
    chartsModal.style.display = 'flex';
    
    // Load charts data when modal is shown
    loadChartsData();
}

function hideChartsModal() {
    chartsModal.style.display = 'none';
}

async function loadChartsData() {
    try {
        const response = await fetch('/api/stats?' + buildChartsQueryString());
        const stats = await response.json();
        
        
        if (response.ok) {
            updateCharts(stats);
            
            // Load XVA-specific data if XVA is selected
            if (filters.application === 'XVA') {
                await loadXVAData();
            }
        } else {
            throw new Error('Failed to load charts data');
        }
    } catch (error) {
        console.error('Error loading charts data:', error);
        alert('Failed to load charts data. Please try again.');
    }
}

async function loadXVAData() {
    try {
        const response = await fetch('/api/xva/stats?' + buildChartsQueryString());
        const xvaStats = await response.json();
        
        if (response.ok) {
            updateXVACharts(xvaStats);
            updateXVATables(xvaStats);
        } else {
            throw new Error('Failed to load XVA data');
        }
    } catch (error) {
        console.error('Error loading XVA data:', error);
        alert('Failed to load XVA data. Please try again.');
    }
}

function populateCVAREntryForm(entry) {
    document.getElementById('entry-date').value = entry.date;
    
    // Set PRC Mail time (24-hour format)
    document.getElementById('entry-prc-mail-text').value = entry.prc_mail_text || '';
    document.getElementById('entry-prc-mail-status').value = entry.prc_mail_status || '';
    
    // Set CP Alerts time (24-hour format)
    document.getElementById('entry-cp-alerts-text').value = entry.cp_alerts_text || '';
    document.getElementById('entry-cp-alerts-status').value = entry.cp_alerts_status || '';
    
    document.getElementById('entry-quality').value = entry.quality_status || '';
    // Populate combined item cards for CVAR
    populateCombinedFromEntry(entry, false);

    document.getElementById('entry-remarks').value = entry.remarks || '';
}

function populateXVAEntryForm(entry) {
    document.getElementById('xva-entry-date').value = entry.date;
    // Note: singular legacy PRB/HIIM/issue fields removed from XVA form. Repeatable containers will be populated below.
    
    // XVA specific fields - timing fields (24-hour format)
    // Set ACQ time
    document.getElementById('xva-entry-acq-text').value = entry.acq_text || '';
    
    // Set VALO time and status
    document.getElementById('xva-entry-valo-text').value = entry.valo_text || '';
    document.getElementById('xva-entry-valo-status').value = entry.valo_status || '';
    
    // Set SENSI time and status
    document.getElementById('xva-entry-sensi-text').value = entry.sensi_text || '';
    document.getElementById('xva-entry-sensi-status').value = entry.sensi_status || '';
    
    // Set CF RA time and status
    document.getElementById('xva-entry-cf-ra-text').value = entry.cf_ra_text || '';
    document.getElementById('xva-entry-cf-ra-status').value = entry.cf_ra_status || '';
    document.getElementById('xva-entry-quality-legacy').value = entry.quality_legacy || '';
    document.getElementById('xva-entry-quality-target').value = entry.quality_target || '';
    document.getElementById('xva-entry-root-cause-application').value = entry.root_cause_application || '';
    document.getElementById('xva-entry-root-cause-type').value = entry.root_cause_type || '';
    document.getElementById('xva-entry-xva-remarks').value = entry.xva_remarks || '';
    
    // Apply status styling for XVA fields after populating values
    setTimeout(() => {
        setupStatusSelectStyling();
    }, 100);
    // Populate combined item cards for XVA
    populateCombinedFromEntry(entry, true);
}

function populateREGEntryForm(entry) {
    document.getElementById('reg-entry-date').value = entry.date;
    // reg-entry-id removed
    const closingSelect = document.getElementById('reg-entry-closing');
    if (closingSelect) {
        if (entry.closing && !Array.from(closingSelect.options).some(opt => opt.value === entry.closing)) {
            const opt = document.createElement('option');
            opt.value = entry.closing;
            opt.textContent = entry.closing;
            closingSelect.appendChild(opt);
        }
        closingSelect.value = entry.closing || '';
    }
    document.getElementById('reg-entry-iteration').value = entry.iteration || '';
    document.getElementById('reg-entry-issue').value = entry.reg_issue || '';
    document.getElementById('reg-entry-action-taken').value = entry.action_taken_and_update || '';
    // Map legacy statuses to new options
    const legacy = (entry.reg_status || '').toLowerCase();
    let mapped = legacy;
    if (legacy === 'in progress' || legacy === 'resolved') {
        mapped = 'ongoing';
    }
    if (legacy === 'open' || legacy === 'closed' || legacy === 'ongoing') {
        document.getElementById('reg-entry-status').value = mapped;
    } else {
        // If legacy value like 'Open' with caps, set to lowercase equivalent when possible
        if (entry.reg_status === 'Open') document.getElementById('reg-entry-status').value = 'open';
        else if (entry.reg_status === 'Closed') document.getElementById('reg-entry-status').value = 'closed';
        else document.getElementById('reg-entry-status').value = '';
    }
    document.getElementById('reg-entry-prb').value = entry.reg_prb || '';
    document.getElementById('reg-entry-hiim').value = entry.reg_hiim || '';
    document.getElementById('reg-entry-backlog-item').value = entry.backlog_item || '';
    
    // Apply status styling for REG fields after populating values
    setTimeout(() => {
        setupStatusSelectStyling();
    }, 100);
}

function populateOTHERSEntryForm(entry) {
    document.getElementById('others-entry-date').value = entry.date;
    document.getElementById('others-entry-dare').value = entry.dare || '';
    document.getElementById('others-entry-timings').value = entry.timings || '';
    document.getElementById('others-entry-puntuality-issue').value = entry.puntuality_issue || '';
    document.getElementById('others-entry-quality').value = entry.quality || '';
    document.getElementById('others-entry-quality-issue').value = entry.quality_issue || '';
    document.getElementById('others-entry-prb').value = entry.others_prb || '';
    document.getElementById('others-entry-hiim').value = entry.others_hiim || '';
}

// Populate the new combined item cards UI from an entry object's issues/prbs/hiims
function populateCombinedFromEntry(entry, isXva) {
    const containerId = isXva ? 'xva-combined-items-container' : 'combined-items-container';
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Clear any existing cards
    container.innerHTML = '';

    const issues = Array.isArray(entry.issues) && entry.issues.length ? entry.issues : [];
    const prbs = Array.isArray(entry.prbs) && entry.prbs.length ? entry.prbs : [];
    const hiims = Array.isArray(entry.hiims) && entry.hiims.length ? entry.hiims : [];

    // Get legacy single fields if arrays are empty
    const legacyIssue = entry.issue_description || '';
    const legacyPrb = entry.prb_id_number ? {
        prb_id_number: entry.prb_id_number,
        prb_id_status: entry.prb_id_status || '',
        prb_link: entry.prb_link || ''
    } : null;
    const legacyHiim = entry.hiim_id_number ? {
        hiim_id_number: entry.hiim_id_number,
        hiim_id_status: entry.hiim_id_status || '',
        hiim_link: entry.hiim_link || ''
    } : null;

    const timeLoss = entry.time_loss || '';
    let cardCreated = false;

    // Create one card per issue with completely independent PRB/HIIM slots
    // This ensures each issue has its own PRB/HIIM without cross-contamination
    if (issues.length > 0) {
        issues.forEach((issue, index) => {
            // Handle null placeholders in issues array
            if (issue === null) {
                return; // Skip null placeholders
            }
            const issueDescription = issue.description || issue;
            const relatedPrb = index < prbs.length ? prbs[index] : null;
            const relatedHiim = index < hiims.length ? hiims[index] : null;
            const cardTimeLoss = index === 0 ? timeLoss : '';
            
            addCombinedItemCard(isXva, { 
                issue: issueDescription, 
                prb: relatedPrb, 
                hiim: relatedHiim, 
                time_loss: cardTimeLoss 
            });
            cardCreated = true;
        });
        
        // If there are more PRBs or HIIMs than issues, create additional cards for them
        const maxExtraItems = Math.max(prbs.length, hiims.length) - issues.length;
        for (let i = issues.length; i < issues.length + maxExtraItems; i++) {
            const extraPrb = i < prbs.length ? prbs[i] : null;
            const extraHiim = i < hiims.length ? hiims[i] : null;
            
            if (extraPrb || extraHiim) {
                addCombinedItemCard(isXva, { 
                    issue: '', 
                    prb: extraPrb, 
                    hiim: extraHiim, 
                    time_loss: '' 
                });
                cardCreated = true;
            }
        }
    } else if (prbs.length > 0 || hiims.length > 0) {
        // No issues, but have PRBs/HIIMs
        const maxItems = Math.max(prbs.length, hiims.length);
        for (let i = 0; i < maxItems; i++) {
            const prb = i < prbs.length ? prbs[i] : null;
            const hiim = i < hiims.length ? hiims[i] : null;
            const cardTimeLoss = i === 0 ? timeLoss : '';
            
            addCombinedItemCard(isXva, { 
                issue: '', 
                prb: prb, 
                hiim: hiim, 
                time_loss: cardTimeLoss 
            });
            cardCreated = true;
        }
    } else if (legacyIssue || legacyPrb || legacyHiim) {
        // Use legacy data
        addCombinedItemCard(isXva, { 
            issue: legacyIssue, 
            prb: legacyPrb, 
            hiim: legacyHiim, 
            time_loss: timeLoss 
        });
        cardCreated = true;
    }

    // If no data at all, create one empty card
    if (!cardCreated) {
        addCombinedItemCard(isXva, { issue: '', prb: null, hiim: null, time_loss: timeLoss });
    }
}

function parseTimeWithAmPm(timeString) {
    // Handle different formats: "9:30 AM", "09:30AM", "9:30", etc.
    const match = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/i);
    
    if (match) {
        return {
            time: `${match[1]}:${match[2]}`,
            amPm: match[3] ? match[3].toUpperCase() : 'AM'
        };
    }
    
    // Fallback for existing data without AM/PM
    return {
        time: timeString.replace(/[^\d:]/g, ''),
        amPm: 'AM'
    };
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.replace(/[&<"'`=\/]/g, function (s) {
        return ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        })[s];
    });
}

// -------------------- Multi-item helpers --------------------
function clearContainerItems(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    // Keep one template item but clear its fields
    container.innerHTML = '';
}

function addIssueItem(initialText = '', isXva = false) {
    const containerId = isXva ? 'xva-issues-container' : 'issues-container';
    const container = document.getElementById(containerId);
    if (!container) return;

    const item = document.createElement('div');
    item.className = 'issue-item item-row';

    const textarea = document.createElement('textarea');
    textarea.className = 'issue-description';
    textarea.rows = 2;
    textarea.placeholder = 'Enter punctuality issue description';
    textarea.value = initialText || '';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-outline remove-item-btn';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
        item.remove();
        updateIssueRemoveButtons(isXva);
    });

    item.appendChild(textarea);
    item.appendChild(removeBtn);
    container.appendChild(item);
    // Update remove buttons visibility for this container
    updateIssueRemoveButtons(isXva);
}

function addPrbItem(isXva = false, prbData = null) {
    const containerId = isXva ? 'xva-prbs-container' : 'prbs-container';
    const container = document.getElementById(containerId);
    if (!container) return;

    const item = document.createElement('div');
    item.className = 'prb-item item-row';

    const idInput = document.createElement('input');
    idInput.type = 'number';
    idInput.className = 'prb-id-number';
    idInput.placeholder = 'PRB ID';
    idInput.min = 1;
    idInput.step = 1;
    // Accept both shapes: {id} (old) or {prb_id_number}
    if (prbData && (prbData.prb_id_number || prbData.id)) idInput.value = prbData.prb_id_number || prbData.id;

    const statusSelect = document.createElement('select');
    statusSelect.className = 'prb-id-status';
    statusSelect.innerHTML = '<option value="">Select Status</option><option value="active">Active</option><option value="closed">Closed</option>';
    if (prbData && (prbData.prb_id_status || prbData.status)) statusSelect.value = prbData.prb_id_status || prbData.status;

    const linkInput = document.createElement('input');
    linkInput.type = 'url';
    linkInput.className = 'prb-link';
    linkInput.placeholder = 'https://prb.example.com/12345';
    if (prbData && (prbData.prb_link || prbData.link)) linkInput.value = prbData.prb_link || prbData.link;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-outline remove-item-btn';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
        item.remove();
        updatePrbRemoveButtons(isXva);
    });

    item.appendChild(idInput);
    item.appendChild(statusSelect);
    item.appendChild(linkInput);
    item.appendChild(removeBtn);
    container.appendChild(item);
    // Update remove buttons visibility for this container
    updatePrbRemoveButtons(isXva);
}

function addHiimItem(isXva = false, hiimData = null) {
    const containerId = isXva ? 'xva-hiims-container' : 'hiims-container';
    const container = document.getElementById(containerId);
    if (!container) return;

    const item = document.createElement('div');
    item.className = 'hiim-item item-row';

    const idInput = document.createElement('input');
    idInput.type = 'number';
    idInput.className = 'hiim-id-number';
    idInput.placeholder = 'HIIM ID';
    idInput.min = 1;
    idInput.step = 1;
    if (hiimData && (hiimData.hiim_id_number || hiimData.id)) idInput.value = hiimData.hiim_id_number || hiimData.id;

    const statusSelect = document.createElement('select');
    statusSelect.className = 'hiim-id-status';
    statusSelect.innerHTML = '<option value="">Select Status</option><option value="active">Active</option><option value="closed">Closed</option>';
    if (hiimData && (hiimData.hiim_id_status || hiimData.status)) statusSelect.value = hiimData.hiim_id_status || hiimData.status;

    const linkInput = document.createElement('input');
    linkInput.type = 'url';
    linkInput.className = 'hiim-link';
    linkInput.placeholder = 'https://hiim.example.com/12345';
    if (hiimData && (hiimData.hiim_link || hiimData.link)) linkInput.value = hiimData.hiim_link || hiimData.link;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-outline remove-item-btn';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
        item.remove();
        updateHiimRemoveButtons(isXva);
    });

    item.appendChild(idInput);
    item.appendChild(statusSelect);
    item.appendChild(linkInput);
    item.appendChild(removeBtn);
    container.appendChild(item);
    // Update remove buttons visibility for this container
    updateHiimRemoveButtons(isXva);
}

function addCombinedItemCard(isXva = false, initialData = null) {
    const containerId = isXva ? 'xva-combined-items-container' : 'combined-items-container';
    const container = document.getElementById(containerId);
    if (!container) return;

    // Create the main card container
    const card = document.createElement('div');
    card.className = 'combined-item-card';

    // Create card header with title and remove button
    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header';

    const cardTitle = document.createElement('h4');
    cardTitle.className = 'card-title';
    cardTitle.textContent = 'Item Set #' + (container.children.length + 1);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-outline card-remove-btn';
    removeBtn.textContent = '× Remove';
    removeBtn.addEventListener('click', () => {
        card.remove();
        // Update card numbers
        updateCardNumbers(containerId);
    });

    cardHeader.appendChild(cardTitle);
    cardHeader.appendChild(removeBtn);

    // Create Issue section
    const issueSection = document.createElement('div');
    issueSection.className = 'item-section';

    const issueLabel = document.createElement('label');
    issueLabel.className = 'section-label';
    issueLabel.textContent = 'Issue';

    const issueFields = document.createElement('div');
    issueFields.className = 'section-fields';

    const issueTextarea = document.createElement('textarea');
    issueTextarea.className = 'issue-description';
    issueTextarea.rows = 2;
    issueTextarea.placeholder = 'Enter punctuality issue description';
    if (initialData && initialData.issue) {
        issueTextarea.value = initialData.issue;
    }

    issueFields.appendChild(issueTextarea);
    issueSection.appendChild(issueLabel);
    issueSection.appendChild(issueFields);

    // Create Time Loss section
    const timeLossSection = document.createElement('div');
    timeLossSection.className = 'item-section';

    const timeLossLabel = document.createElement('label');
    timeLossLabel.className = 'section-label';
    timeLossLabel.textContent = 'Time Loss';

    const timeLossFields = document.createElement('div');
    timeLossFields.className = 'section-fields';

    const timeLossInput = document.createElement('input');
    timeLossInput.type = 'text';
    timeLossInput.className = 'time-loss';
    timeLossInput.placeholder = 'e.g., 15 min, 2 hours, 1hr 30min';
    timeLossInput.title = 'Enter time duration (e.g., 15 min, 2 hours, 1hr 30min)';
    if (initialData && initialData.time_loss) {
        timeLossInput.value = initialData.time_loss;
    }

    // Add input validation for timing format
    timeLossInput.addEventListener('input', function() {
        const value = this.value.trim();
        if (value) {
            // Enhanced regex to handle complex time formats like "1 hour 30 minutes" or "2hrs 15min"
            const timePattern = /^(\d+\s*(hour|hours|hr|hrs|h)\s*)?(\d+\s*(min|mins|minute|minutes|m))?\s*$/i;
            const simplePattern = /^\d+\s*(min|mins|minute|minutes|hour|hours|hr|hrs|h|m)\s*$/i;
            
            if (!timePattern.test(value) && !simplePattern.test(value)) {
                this.setCustomValidity('Please enter time duration (e.g., 15 min, 2 hours, 1hr 30min)');
                this.style.borderColor = '#dc3545';
            } else {
                this.setCustomValidity('');
                this.style.borderColor = '';
            }
        } else {
            this.setCustomValidity('');
            this.style.borderColor = '';
        }
    });

    timeLossFields.appendChild(timeLossInput);
    timeLossSection.appendChild(timeLossLabel);
    timeLossSection.appendChild(timeLossFields);

    // Create PRB section
    const prbSection = document.createElement('div');
    prbSection.className = 'item-section';

    const prbLabel = document.createElement('label');
    prbLabel.className = 'section-label';
    prbLabel.textContent = 'PRB';

    // Add helper text for PRB section
    const prbHelper = document.createElement('div');
    prbHelper.className = 'helper-text';
    prbHelper.textContent = 'Requires punctuality issue description to be filled first';

    const prbFields = document.createElement('div');
    prbFields.className = 'section-fields';

    const prbIdInput = document.createElement('input');
    prbIdInput.type = 'number';
    prbIdInput.className = 'prb-id-number';
    prbIdInput.placeholder = 'PRB ID';
    prbIdInput.min = 1;
    prbIdInput.step = 1;
    prbIdInput.disabled = true; // Initially disabled

    const prbStatusSelect = document.createElement('select');
    prbStatusSelect.className = 'prb-id-status';
    prbStatusSelect.innerHTML = '<option value="">Select Status</option><option value="active">Active</option><option value="closed">Closed</option>';
    prbStatusSelect.disabled = true; // Initially disabled

    const prbLinkInput = document.createElement('input');
    prbLinkInput.type = 'url';
    prbLinkInput.className = 'prb-link';
    prbLinkInput.placeholder = 'https://prb.example.com/12345';
    prbLinkInput.disabled = true; // Initially disabled

    // Populate initial data if provided
    if (initialData && initialData.prb) {
        const p = initialData.prb;
        prbIdInput.value = p.prb_id_number || p.id || '';
        prbStatusSelect.value = p.prb_id_status || p.status || '';
        prbLinkInput.value = p.prb_link || p.link || '';
    }

    prbFields.appendChild(prbIdInput);
    prbFields.appendChild(prbStatusSelect);
    prbFields.appendChild(prbLinkInput);
    prbSection.appendChild(prbLabel);
    prbSection.appendChild(prbHelper);
    prbSection.appendChild(prbFields);

    // Create HIIM section
    const hiimSection = document.createElement('div');
    hiimSection.className = 'item-section';

    const hiimLabel = document.createElement('label');
    hiimLabel.className = 'section-label';
    hiimLabel.textContent = 'HIIM';

    // Add helper text for HIIM section
    const hiimHelper = document.createElement('div');
    hiimHelper.className = 'helper-text';
    hiimHelper.textContent = 'Requires punctuality issue description to be filled first';

    const hiimFields = document.createElement('div');
    hiimFields.className = 'section-fields';

    const hiimIdInput = document.createElement('input');
    hiimIdInput.type = 'number';
    hiimIdInput.className = 'hiim-id-number';
    hiimIdInput.placeholder = 'HIIM ID';
    hiimIdInput.min = 1;
    hiimIdInput.step = 1;
    hiimIdInput.disabled = true; // Initially disabled

    const hiimStatusSelect = document.createElement('select');
    hiimStatusSelect.className = 'hiim-id-status';
    hiimStatusSelect.innerHTML = '<option value="">Select Status</option><option value="active">Active</option><option value="closed">Closed</option>';
    hiimStatusSelect.disabled = true; // Initially disabled

    const hiimLinkInput = document.createElement('input');
    hiimLinkInput.type = 'url';
    hiimLinkInput.className = 'hiim-link';
    hiimLinkInput.placeholder = 'https://hiim.example.com/12345';
    hiimLinkInput.disabled = true; // Initially disabled

    // Populate initial data if provided
    if (initialData && initialData.hiim) {
        const h = initialData.hiim;
        hiimIdInput.value = h.hiim_id_number || h.id || '';
        hiimStatusSelect.value = h.hiim_id_status || h.status || '';
        hiimLinkInput.value = h.hiim_link || h.link || '';
    }

    hiimFields.appendChild(hiimIdInput);
    hiimFields.appendChild(hiimStatusSelect);
    hiimFields.appendChild(hiimLinkInput);
    hiimSection.appendChild(hiimLabel);
    hiimSection.appendChild(hiimHelper);
    hiimSection.appendChild(hiimFields);

    // Add event listener to issue description to enable/disable PRB and HIIM fields
    issueTextarea.addEventListener('input', function() {
        const hasIssueText = this.value.trim().length > 0;
        
        // Enable/disable PRB fields
        prbIdInput.disabled = !hasIssueText;
        prbStatusSelect.disabled = !hasIssueText;
        prbLinkInput.disabled = !hasIssueText;
        
        // Enable/disable HIIM fields
        hiimIdInput.disabled = !hasIssueText;
        hiimStatusSelect.disabled = !hasIssueText;
        hiimLinkInput.disabled = !hasIssueText;
        
        // Toggle helper text visibility
        prbHelper.style.display = hasIssueText ? 'none' : 'block';
        hiimHelper.style.display = hasIssueText ? 'none' : 'block';
        
        // Clear PRB and HIIM values if issue is cleared
        if (!hasIssueText) {
            prbIdInput.value = '';
            prbStatusSelect.value = '';
            prbLinkInput.value = '';
            hiimIdInput.value = '';
            hiimStatusSelect.value = '';
            hiimLinkInput.value = '';
        }
    });

    // Assemble the card
    card.appendChild(cardHeader);
    card.appendChild(issueSection);
    card.appendChild(timeLossSection);
    card.appendChild(prbSection);
    card.appendChild(hiimSection);

    container.appendChild(card);

    // If we have an initial issue description, enable PRB/HIIM fields
    if (issueTextarea.value.trim().length > 0) {
        const hasIssueText = true;
        prbIdInput.disabled = !hasIssueText;
        prbStatusSelect.disabled = !hasIssueText;
        prbLinkInput.disabled = !hasIssueText;
        hiimIdInput.disabled = !hasIssueText;
        hiimStatusSelect.disabled = !hasIssueText;
        hiimLinkInput.disabled = !hasIssueText;
        prbHelper.style.display = 'none';
        hiimHelper.style.display = 'none';
    }
}

function updateCardNumbers(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const cards = container.querySelectorAll('.combined-item-card');
    cards.forEach((card, index) => {
        const title = card.querySelector('.card-title');
        if (title) {
            title.textContent = 'Item Set #' + (index + 1);
        }
    });
}

function serializeIssues() {
    return serializeIssuesFor(false);
}

function serializeIssuesFor(isXva = false) {
    // First check for combined cards
    const combinedContainerId = isXva ? 'xva-combined-items-container' : 'combined-items-container';
    const combinedContainer = document.getElementById(combinedContainerId);
    const issues = [];
    
    if (combinedContainer) {
        const cards = combinedContainer.querySelectorAll('.combined-item-card');
        cards.forEach((card, index) => {
            const textarea = card.querySelector('.issue-description');
            if (textarea && textarea.value.trim()) {
                // Item Set has issue data
                issues.push({ description: textarea.value.trim() });
            } else {
                // Item Set has no issue - add null placeholder to maintain position alignment
                issues.push(null);
            }
        });
    }
    
    // Fallback to old individual containers if they exist
    const containerId = isXva ? 'xva-issues-container' : 'issues-container';
    const container = document.getElementById(containerId);
    if (container) {
        const items = Array.from(container.querySelectorAll('.issue-item'));
        items.forEach(item => {
            const textarea = item.querySelector('.issue-description');
            if (textarea && textarea.value.trim()) {
                issues.push({ description: textarea.value.trim() });
            }
        });
    }
    
    return issues;
}

function serializeTimeLossFor(isXva = false) {
    // First check for combined cards
    const combinedContainerId = isXva ? 'xva-combined-items-container' : 'combined-items-container';
    const combinedContainer = document.getElementById(combinedContainerId);
    const timeLossData = [];
    
    if (combinedContainer) {
        const cards = combinedContainer.querySelectorAll('.combined-item-card');
        cards.forEach(card => {
            const input = card.querySelector('.time-loss');
            if (input && input.value.trim()) {
                timeLossData.push(input.value.trim());
            }
        });
    }
    
    // Return a single string if there's data, empty string if not
    return timeLossData.length > 0 ? timeLossData.join('; ') : '';
}

function serializePrbs(isXva = false) {
    // First check for combined cards
    const combinedContainerId = isXva ? 'xva-combined-items-container' : 'combined-items-container';
    const combinedContainer = document.getElementById(combinedContainerId);
    const prbs = [];
    
    if (combinedContainer) {
        const cards = combinedContainer.querySelectorAll('.combined-item-card');
        cards.forEach((card, index) => {
            const idInput = card.querySelector('.prb-id-number');
            const statusSelect = card.querySelector('.prb-id-status');
            const linkInput = card.querySelector('.prb-link');
            const issueTextarea = card.querySelector('.issue-description');
            
            if (idInput && idInput.value) {
                // Item Set has PRB data
                prbs.push({
                    prb_id_number: parseInt(idInput.value),
                    prb_id_status: statusSelect ? statusSelect.value : '',
                    prb_link: linkInput ? linkInput.value : '',
                    related_issue: issueTextarea && issueTextarea.value ? issueTextarea.value.trim() : ''
                });
            } else {
                // Item Set has no PRB - add null placeholder to maintain position alignment
                prbs.push(null);
            }
        });
    }
    
    // Fallback to old individual containers if they exist
    const containerId = isXva ? 'xva-prbs-container' : 'prbs-container';
    const container = document.getElementById(containerId);
    if (container) {
        const items = Array.from(container.querySelectorAll('.prb-item'));
        items.forEach(item => {
            const idInput = item.querySelector('.prb-id-number');
            const statusSelect = item.querySelector('.prb-id-status');
            const linkInput = item.querySelector('.prb-link');
            
            if (idInput && idInput.value) {
                prbs.push({
                    prb_id_number: parseInt(idInput.value),
                    prb_id_status: statusSelect ? statusSelect.value : '',
                    prb_link: linkInput ? linkInput.value : ''
                });
            }
        });
    }
    
    return prbs;
}

function serializeHiims(isXva = false) {
    // First check for combined cards
    const combinedContainerId = isXva ? 'xva-combined-items-container' : 'combined-items-container';
    const combinedContainer = document.getElementById(combinedContainerId);
    const hiims = [];
    
    if (combinedContainer) {
        const cards = combinedContainer.querySelectorAll('.combined-item-card');
        cards.forEach((card, index) => {
            const idInput = card.querySelector('.hiim-id-number');
            const statusSelect = card.querySelector('.hiim-id-status');
            const linkInput = card.querySelector('.hiim-link');
            const issueTextarea = card.querySelector('.issue-description');
            
            if (idInput && idInput.value) {
                // Item Set has HIIM data
                hiims.push({
                    hiim_id_number: parseInt(idInput.value),
                    hiim_id_status: statusSelect ? statusSelect.value : '',
                    hiim_link: linkInput ? linkInput.value : '',
                    related_issue: issueTextarea && issueTextarea.value ? issueTextarea.value.trim() : ''
                });
            } else {
                // Item Set has no HIIM - add null placeholder to maintain position alignment
                hiims.push(null);
            }
        });
    }
    
    // Fallback to old individual containers if they exist
    const containerId = isXva ? 'xva-hiims-container' : 'hiims-container';
    const container = document.getElementById(containerId);
    if (container) {
        const items = Array.from(container.querySelectorAll('.hiim-item'));
        items.forEach(item => {
            const idInput = item.querySelector('.hiim-id-number');
            const statusSelect = item.querySelector('.hiim-id-status');
            const linkInput = item.querySelector('.hiim-link');
            
            if (idInput && idInput.value) {
                hiims.push({
                    hiim_id_number: parseInt(idInput.value),
                    hiim_id_status: statusSelect ? statusSelect.value : '',
                    hiim_link: linkInput ? linkInput.value : ''
                });
            }
        });
    }
    
    return hiims;
}

function updateIssueRemoveButtons(isXva = false) {
    const containerId = isXva ? 'xva-issues-container' : 'issues-container';
    const container = document.getElementById(containerId);
    if (!container) return;
    const issueItems = container.querySelectorAll('.issue-item');
    issueItems.forEach((item, index) => {
        const removeBtn = item.querySelector('.remove-item-btn');
        if (removeBtn) {
            // Only show remove button for items that are not the first one (index > 0)
            removeBtn.style.display = index > 0 ? 'inline-block' : 'none';
        }
    });
}

function updatePrbRemoveButtons(isXva = false) {
    const containerId = isXva ? 'xva-prbs-container' : 'prbs-container';
    const container = document.getElementById(containerId);
    if (!container) return;
    const prbItems = container.querySelectorAll('.prb-item');
    prbItems.forEach((item, index) => {
        const removeBtn = item.querySelector('.remove-item-btn');
        if (removeBtn) {
            // Only show remove button for items that are not the first one (index > 0)
            removeBtn.style.display = index > 0 ? 'inline-block' : 'none';
        }
    });
}

function updateHiimRemoveButtons(isXva = false) {
    const containerId = isXva ? 'xva-hiims-container' : 'hiims-container';
    const container = document.getElementById(containerId);
    if (!container) return;
    const hiimItems = container.querySelectorAll('.hiim-item');
    hiimItems.forEach((item, index) => {
        const removeBtn = item.querySelector('.remove-item-btn');
        if (removeBtn) {
            // Only show remove button for items that are not the first one (index > 0)
            removeBtn.style.display = index > 0 ? 'inline-block' : 'none';
        }
    });
}

// -------------------- End multi-item helpers --------------------

// Validation function to check PRB/HIIM require issue description
function validateCombinedItems(isXva = false) {
    const combinedContainerId = isXva ? 'xva-combined-items-container' : 'combined-items-container';
    const combinedContainer = document.getElementById(combinedContainerId);
    const errors = [];
    
    if (combinedContainer) {
        const cards = combinedContainer.querySelectorAll('.combined-item-card');
        cards.forEach((card, index) => {
            const issueTextarea = card.querySelector('.issue-description');
            const prbIdInput = card.querySelector('.prb-id-number');
            const hiimIdInput = card.querySelector('.hiim-id-number');
            
            const hasIssue = issueTextarea && issueTextarea.value.trim();
            const hasPrb = prbIdInput && prbIdInput.value.trim();
            const hasHiim = hiimIdInput && hiimIdInput.value.trim();
            
            if ((hasPrb || hasHiim) && !hasIssue) {
                errors.push(`Item Set #${index + 1}: PRB or HIIM entries require a punctuality issue description.`);
            }
        });
    }
    
    return errors;
}

function formatTimeDisplay(timeString) {
    if (!timeString) {
        return 'N/A';
    }
    
    // Return 24-hour format time directly (no AM/PM needed)
    return timeString;
}

async function handleCVAREntrySubmit(event) {
    event.preventDefault();
    
    // Validate combined items first
    const validationErrors = validateCombinedItems(false);
    if (validationErrors.length > 0) {
        alert('Validation Error:\n\n' + validationErrors.join('\n'));
        return;
    }
    
    const formData = new FormData(cvarEntryForm);
    
    // Get CVAR timing fields (24-hour format, no AM/PM needed)
    const prcMailTime = formData.get('prc_mail_text');
    const cpAlertsTime = formData.get('cp_alerts_text');
    
    // Build CVAR entry data
    const entryData = {
        date: formData.get('date'),
        day: new Date(formData.get('date')).toLocaleDateString('en-US', { weekday: 'long' }),
        application_name: filters.application,
        issue_description: formData.get('issue_description'),
        prb_id_number: formData.get('prb_id_number') ? parseInt(formData.get('prb_id_number')) : null,
        prb_id_status: formData.get('prb_id_status'),
        prb_link: formData.get('prb_link'),
        hiim_id_number: formData.get('hiim_id_number') ? parseInt(formData.get('hiim_id_number')) : null,
        hiim_id_status: formData.get('hiim_id_status'),
        hiim_link: formData.get('hiim_link'),
        remarks: formData.get('remarks'),
        time_loss: serializeTimeLossFor(false),
    // CVAR specific fields - 24-hour format times
        prc_mail_text: prcMailTime || '',
        prc_mail_status: formData.get('prc_mail_status'),
        cp_alerts_text: cpAlertsTime || '',
        cp_alerts_status: formData.get('cp_alerts_status'),
        quality_status: formData.get('quality_status'),
        // XVA fields set to empty for CVAR
        acq_text: '',
        valo_text: '',
        valo_status: '',
        sensi_text: '',
        sensi_status: '',
        cf_ra_text: '',
        cf_ra_status: '',
        quality_legacy: '',
        quality_target: '',
        root_cause_application: '',
        root_cause_type: '',
        xva_remarks: ''
    };

    // Attach arrays (issues/prbs/hiims) serialized from dynamic UI. If empty, keep legacy single fields for backward compatibility.
    const issuesArray = serializeIssues();
    if (issuesArray.length) {
        entryData.issues = issuesArray;
        // Clear legacy single field to avoid duplication on server if you prefer; otherwise server migrates first item.
        entryData.issue_description = '';
    }

    const prbsArray = serializePrbs(false);
    if (prbsArray.length) {
        entryData.prbs = prbsArray;
        entryData.prb_id_number = null;
        entryData.prb_id_status = '';
        entryData.prb_link = '';
    }

    const hiimsArray = serializeHiims(false);
    if (hiimsArray.length) {
        entryData.hiims = hiimsArray;
        entryData.hiim_id_number = null;
        entryData.hiim_id_status = '';
        entryData.hiim_link = '';
    }
    
    try {
        const url = currentEntryId ? `/api/entries/${currentEntryId}` : '/api/entries';
        const method = currentEntryId ? 'PUT' : 'POST';
        
        console.log(`🚀 Making ${method} request to: ${url}`);
        console.log('📤 Request body:', JSON.stringify(entryData, null, 2));
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(entryData)
        });
        
        console.log(`📥 Response status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            console.log('✅ Entry saved successfully!');
            hideEntryModal();
            loadData(); // Refresh data
        } else {
            const error = await response.json();
            console.log('❌ Error response:', error);
            if (error.error && error.error.includes('already exists')) {
                alert('Error: ' + error.error + '\n\nPlease edit the existing entry or choose a different date.');
            } else {
                alert('Error saving entry: ' + error.error);
            }
        }
    } catch (error) {
        console.error('Error saving CVAR entry:', error);
        alert('Failed to save CVAR entry. Please try again.');
    }
}

async function handleXVAEntrySubmit(event) {
    event.preventDefault();
    
    // Validate combined items first
    const validationErrors = validateCombinedItems(true);
    if (validationErrors.length > 0) {
        alert('Validation Error:\n\n' + validationErrors.join('\n'));
        return;
    }
    
    console.log('=== XVA SAVE BUTTON DEBUG ===');
    console.log('Current application:', filters.application);
    console.log('XVA Form data being submitted...');
    
    const formData = new FormData(xvaEntryForm);
    
    // Debug: Log all form data
    console.log('Form data entries:');
    for (let [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`);
    }
    
    // Get XVA timing fields (24-hour format, no AM/PM needed)
    const acqTime = formData.get('acq_text');
    const valoTime = formData.get('valo_text');
    const sensiTime = formData.get('sensi_text');
    const cfRaTime = formData.get('cf_ra_text');
    
    // Build XVA entry data
    const entryData = {
        date: formData.get('date'),
        day: new Date(formData.get('date')).toLocaleDateString('en-US', { weekday: 'long' }),
        application_name: 'XVA',
        issue_description: formData.get('issue_description'),
        prb_id_number: formData.get('prb_id_number') ? parseInt(formData.get('prb_id_number')) : null,
        prb_id_status: formData.get('prb_id_status'),
        prb_link: formData.get('prb_link'),
        hiim_id_number: formData.get('hiim_id_number') ? parseInt(formData.get('hiim_id_number')) : null,
        hiim_id_status: formData.get('hiim_id_status'),
        hiim_link: formData.get('hiim_link'),
        remarks: formData.get('remarks'),
        // XVA specific fields - 24-hour format times
        acq_text: acqTime || '',
        valo_text: valoTime || '',
        valo_status: formData.get('valo_status'),
        sensi_text: sensiTime || '',
        sensi_status: formData.get('sensi_status'),
        cf_ra_text: cfRaTime || '',
        cf_ra_status: formData.get('cf_ra_status'),
        quality_legacy: formData.get('quality_legacy'),
        quality_target: formData.get('quality_target'),
        root_cause_application: formData.get('root_cause_application'),
        root_cause_type: formData.get('root_cause_type'),
        xva_remarks: formData.get('xva_remarks'),
        // CVAR fields set to empty for XVA
        prc_mail_text: '',
        prc_mail_status: '',
        cp_alerts_text: '',
        cp_alerts_status: '',
        quality_status: ''
    };

    // Attach arrays for XVA if provided
    const xvaPrbs = serializePrbs(true);
    if (xvaPrbs.length) {
        entryData.prbs = xvaPrbs;
        entryData.prb_id_number = null;
        entryData.prb_id_status = '';
        entryData.prb_link = '';
    }

    const xvaHiims = serializeHiims(true);
    if (xvaHiims.length) {
        entryData.hiims = xvaHiims;
        entryData.hiim_id_number = null;
        entryData.hiim_id_status = '';
        entryData.hiim_link = '';
    }

    const xvaIssues = serializeIssuesFor(true);
    if (xvaIssues.length) {
        entryData.issues = xvaIssues;
        entryData.issue_description = '';
    }
    
    console.log('📝 Constructed XVA entry data:', entryData);
    
    // Validate conditional status requirements
    const validationError = validateXVAStatusRequirements(entryData);
    if (validationError) {
        alert(validationError);
        return;
    }
    
    try {
        const url = currentEntryId ? `/api/entries/${currentEntryId}` : '/api/entries';
        const method = currentEntryId ? 'PUT' : 'POST';
        
        console.log(`🚀 Making ${method} request to: ${url}`);
        console.log('📤 Request body:', JSON.stringify(entryData, null, 2));
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(entryData)
        });
        
        console.log(`📥 Response status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            console.log('✅ XVA Entry saved successfully!');
            hideEntryModal();
            loadData(); // Refresh data
        } else {
            const error = await response.json();
            console.log('❌ Error response:', error);
            if (error.error && error.error.includes('already exists')) {
                alert('Error: ' + error.error + '\n\nPlease edit the existing entry or choose a different date.');
            } else {
                alert('Error saving XVA entry: ' + error.error);
            }
        }
    } catch (error) {
        console.error('Error saving XVA entry:', error);
        alert('Failed to save XVA entry. Please try again.');
    }
}

async function handleREGEntrySubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(regEntryForm);
    

    // Build REG entry data using only REG fields and user input
    const entryData = {
        date: formData.get('date'),
        day: new Date(formData.get('date')).toLocaleDateString('en-US', { weekday: 'long' }),
        application_name: 'REG',
    // reg_id removed
        closing: formData.get('closing'),
        iteration: formData.get('iteration'),
        reg_issue: formData.get('reg_issue'),
        action_taken_and_update: formData.get('action_taken_and_update'),
        reg_status: formData.get('reg_status'),
        reg_prb: formData.get('reg_prb'),
        reg_hiim: formData.get('reg_hiim'),
        backlog_item: formData.get('backlog_item')
    };
    
    try {
        const url = currentEntryId ? `/api/entries/${currentEntryId}` : '/api/entries';
        const method = currentEntryId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(entryData)
        });
        
        if (response.ok) {
            hideEntryModal();
            loadData(); // Refresh data
        } else {
            const error = await response.json();
            if (error.error && error.error.includes('already exists')) {
                alert('Error: ' + error.error + '\n\nPlease edit the existing entry or choose a different date.');
            } else {
                alert('Error saving REG entry: ' + error.error);
            }
        }
    } catch (error) {
        console.error('Error saving REG entry:', error);
        alert('Failed to save REG entry. Please try again.');
    }
}

async function handleOTHERSEntrySubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(othersEntryForm);
    
    // Build OTHERS entry data using only OTHERS fields and user input
    const entryData = {
        date: formData.get('date'),
        day: new Date(formData.get('date')).toLocaleDateString('en-US', { weekday: 'long' }),
        application_name: 'OTHERS',
        dare: formData.get('dare'),
        timings: formData.get('timings'),
        puntuality_issue: formData.get('puntuality_issue'),
        quality: formData.get('quality'),
        quality_issue: formData.get('quality_issue'),
        others_prb: formData.get('others_prb'),
        others_hiim: formData.get('others_hiim')
    };
    
    try {
        const url = currentEntryId ? `/api/entries/${currentEntryId}` : '/api/entries';
        const method = currentEntryId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(entryData)
        });
        
        if (response.ok) {
            hideEntryModal();
            loadData(); // Refresh data
        } else {
            const error = await response.json();
            if (error.error && error.error.includes('already exists')) {
                alert('Error: ' + error.error + '\n\nPlease edit the existing entry or choose a different date.');
            } else {
                alert('Error saving OTHERS entry: ' + error.error);
            }
        }
    } catch (error) {
        console.error('Error saving OTHERS entry:', error);
        alert('Failed to save OTHERS entry. Please try again.');
    }
}

async function editEntry(entryId) {
    try {
        // Fetch the entry data from the API
        const response = await fetch(`/api/entries/${entryId}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const entry = await response.json();
            showEntryModal(entry);
        } else {
            alert('Failed to load entry data');
        }
    } catch (error) {
        console.error('Error loading entry:', error);
        alert('Failed to load entry data');
    }
}

async function deleteEntry(entryId) {
    if (!confirm('Are you sure you want to delete this entry?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/entries/${entryId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            loadData(); // Refresh data
        } else {
            const error = await response.json();
            alert('Error deleting entry: ' + error.error);
        }
    } catch (error) {
        console.error('Error deleting entry:', error);
        alert('Failed to delete entry. Please try again.');
    }
}

// Filter functions
function clearFilters() {
    filters.startDate.value = '';
    filters.endDate.value = '';
    filters.prbOnly.checked = false;
    filters.hiimOnly.checked = false;
    filters.timeLossOnly.checked = false;
    
    // Reset application to CVAR ALL
    filters.application = 'CVAR ALL';
    document.querySelectorAll('.header-app-btn, .filter-app-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector('.header-app-btn[data-app="CVAR ALL"]') || document.querySelector('.filter-app-btn[data-app="CVAR ALL"]');
    if (activeBtn) activeBtn.classList.add('active');
    
    loadData();
}

function clearChartsFilters() {
    // Clear year selection
    Array.from(chartsFilters.year.options).forEach(option => option.selected = false);
    clearCustomMultiselect('year');
    
    // Clear month selection
    Array.from(chartsFilters.month.options).forEach(option => option.selected = false);
    clearCustomMultiselect('month');
    
    // Reset chart visibility to show all
    Object.values(chartVisibilityFilters).forEach(checkbox => {
        checkbox.checked = true;
    });
    
    // No default year and month selection - keep empty by default
    setCustomMultiselectSelection('year', []);
    setCustomMultiselectSelection('month', []);
    
    // Enable month selection since year is selected
    enableMonthSelection();
    
    // Disable future months
    disableFutureMonths();
    
    loadChartsData();
}

function clearCustomMultiselect(type) {
    const trigger = document.getElementById(`${type}-trigger`);
    const dropdown = document.getElementById(`${type}-dropdown`);
    const options = dropdown.querySelectorAll('.multiselect-option');
    
    // Clear visual selections
    options.forEach(option => {
        option.classList.remove('selected');
    });
    
    // Reset display
    const textElement = trigger.querySelector('.multiselect-text');
    textElement.textContent = type === 'year' ? 'Select Year(s)' : 'Select Month(s)';
    textElement.classList.remove('has-selection');
}

function setCustomMultiselectSelection(type, values) {
    const trigger = document.getElementById(`${type}-trigger`);
    const dropdown = document.getElementById(`${type}-dropdown`);
    const options = dropdown.querySelectorAll('.multiselect-option');
    
    // Clear existing selections
    options.forEach(option => {
        option.classList.remove('selected');
    });
    
    // Set new selections
    values.forEach(value => {
        const option = dropdown.querySelector(`[data-value="${value}"]`);
        if (option) {
            option.classList.add('selected');
        }
    });
    
    // Update display
    const selectedValues = new Set(values);
    updateSelectedDisplay(trigger, selectedValues, type);
}

function updateChartVisibility() {
    // Show/hide chart wrappers based on checkbox states
    const chartWrappers = {
        quality: document.getElementById('quality-chart-wrapper'),
        punctuality: document.getElementById('punctuality-chart-wrapper'),
        prb: document.getElementById('prb-chart-wrapper'),
        hiim: document.getElementById('hiim-chart-wrapper'),
        'xva-monthly-red': document.getElementById('xva-monthly-red-chart-wrapper'),
        'xva-root-cause': document.getElementById('xva-root-cause-chart-wrapper')
    };
    
    Object.keys(chartWrappers).forEach(chartType => {
        const wrapper = chartWrappers[chartType];
        const checkbox = chartVisibilityFilters[chartType];
        
        if (wrapper && checkbox) {
            // For REG view, hide quality and punctuality charts regardless of checkbox state
            if (filters.application === 'REG' && (chartType === 'quality' || chartType === 'punctuality')) {
                wrapper.classList.add('hidden');
            } else if (checkbox.checked) {
                wrapper.classList.remove('hidden');
            } else {
                wrapper.classList.add('hidden');
            }
        }
    });
    
    // Update grid layout for regular charts container
    updateChartsGridLayout();
    
    // Update fullscreen charts visibility
    updateFullscreenChartsVisibility();
}

function updateChartsGridLayout() {
    const chartsContainer = document.querySelector('.charts-container');
    if (!chartsContainer) return;
    
    const visibleCharts = Array.from(chartsContainer.querySelectorAll('.chart-wrapper:not(.hidden)'));
    const visibleCount = visibleCharts.length;
    
    if (visibleCount === 0) return;
    
    // Auto-adjust grid based on number of visible charts
    if (visibleCount === 1) {
        chartsContainer.style.gridTemplateColumns = '1fr';
        chartsContainer.style.justifyItems = 'center';
    } else if (visibleCount === 2) {
        chartsContainer.style.gridTemplateColumns = '1fr 1fr';
        chartsContainer.style.justifyItems = 'stretch';
    } else if (visibleCount === 3) {
        chartsContainer.style.gridTemplateColumns = '1fr 1fr';
        chartsContainer.style.justifyItems = 'stretch';
    } else {
        chartsContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
        chartsContainer.style.justifyItems = 'stretch';
    }
}

function updateFullscreenChartsVisibility() {
    const visibleCharts = {
        quality: document.getElementById('show-quality-chart')?.checked || false,
        punctuality: document.getElementById('show-punctuality-chart')?.checked || false,
        prb: document.getElementById('show-prb-chart')?.checked || false,
        hiim: document.getElementById('show-hiim-chart')?.checked || false,
        'xva-monthly-red': document.getElementById('show-xva-monthly-red-chart')?.checked || false,
        'xva-root-cause': document.getElementById('show-xva-root-cause-chart')?.checked || false
    };
    
    // Update fullscreen chart items visibility
    Object.keys(visibleCharts).forEach(chartType => {
        const chartItem = document.querySelector(`[data-chart="${chartType}"]`);
        if (chartItem) {
            if (visibleCharts[chartType]) {
                chartItem.style.display = 'flex';
            } else {
                chartItem.style.display = 'none';
            }
        }
    });
    
    // Update grid layout based on number of visible charts
    const visibleCount = Object.values(visibleCharts).filter(Boolean).length;
    const gridContainer = document.querySelector('.fullscreen-chart-grid');
    
    if (gridContainer) {
        if (visibleCount === 1) {
            gridContainer.style.gridTemplateColumns = '1fr';
            gridContainer.style.gridTemplateRows = '1fr';
        } else if (visibleCount === 2) {
            gridContainer.style.gridTemplateColumns = '1fr 1fr';
            gridContainer.style.gridTemplateRows = '1fr';
        } else if (visibleCount === 3) {
            gridContainer.style.gridTemplateColumns = '1fr 1fr';
            gridContainer.style.gridTemplateRows = '1fr 1fr';
        } else {
            gridContainer.style.gridTemplateColumns = '1fr 1fr';
            gridContainer.style.gridTemplateRows = '1fr 1fr';
        }
    }
}

function openFullscreenChart(chartType) {
    console.log('Opening fullscreen chart for type:', chartType);
    try {
        const chart = charts[chartType];
        if (!chart) {
            console.error('Chart not available for fullscreen view:', chartType);
            alert('Chart not available for fullscreen view');
            return;
        }
        
        // Set the title
        const titles = {
            quality: 'Quality Distribution (Bar Chart)',
            punctuality: 'PRC Mail Punctuality (Bar Chart)',
            prb: 'PRB Distribution (Circle Chart)',
            hiim: 'HIIM Distribution (Pie Chart)',
            'xva-monthly-red': 'XVA Monthly Red Count (Bar Chart)',
            'xva-root-cause': 'XVA Root Cause Analysis (Pie Chart)'
        };
        
        fullscreenChartTitle.textContent = titles[chartType] || 'Chart';
        
        // Show fullscreen modal first
        fullscreenModal.style.display = 'flex';
        console.log('Fullscreen modal displayed:', fullscreenModal.style.display);
        
        // Wait for modal to be displayed, then sync filters and set up listeners
        setTimeout(() => {
            console.log('Setting up fullscreen filters after modal display...');
            syncFullscreenFilters();
            setupFullscreenFilterListeners();
            // Disable future months in fullscreen
            disableFutureMonths();
        }, 100);
        
        // Wait a bit for the modal to be displayed, then create the chart
        setTimeout(() => {
            try {
                console.log('Creating fullscreen chart for type:', chartType);
                
                // Destroy existing fullscreen chart if any
                if (charts.fullscreen) {
                    console.log('Destroying existing fullscreen chart');
                    charts.fullscreen.destroy();
                }
                
                // Get canvas context
                const ctx = fullscreenChartEl.getContext('2d');
                console.log('Canvas context:', ctx);
                
                // Create fullscreen chart based on chart type
                if (chartType === 'quality') {
                    console.log('Creating quality fullscreen chart');
                    charts.fullscreen = createFullscreenQualityChart(ctx);
                } else if (chartType === 'punctuality') {
                    console.log('Creating punctuality fullscreen chart');
                    charts.fullscreen = createFullscreenPunctualityChart(ctx);
                } else if (chartType === 'prb') {
                    console.log('Creating PRB fullscreen chart');
                    charts.fullscreen = createFullscreenPRBChart(ctx);
                } else if (chartType === 'hiim') {
                    console.log('Creating HIIM fullscreen chart');
                    charts.fullscreen = createFullscreenHIIMChart(ctx);
                }
                
                console.log('Fullscreen chart created:', charts.fullscreen);
            } catch (error) {
                console.error('Error creating fullscreen chart:', error);
                alert('Error creating fullscreen chart: ' + error.message);
            }
        }, 100);
    } catch (error) {
        console.error('Error opening fullscreen chart:', error);
        alert('Error opening fullscreen chart: ' + error.message);
    }
}

function closeFullscreenChart() {
    fullscreenModal.style.display = 'none';
    if (charts.fullscreen) {
        charts.fullscreen.destroy();
        charts.fullscreen = null;
    }
}

async function openAllChartsFullscreen() {
    // Show fullscreen all charts modal
    fullscreenAllModal.style.display = 'flex';
    
    // Wait for modal to be displayed, then sync filters and set up listeners
    setTimeout(() => {
        syncFullscreenAllFilters();
        setupFullscreenFilterListeners();
        // Disable future months in fullscreen
        disableFutureMonths();
    }, 100);
    
    // Load data and create charts
    try {
        // Load charts data first
        const response = await fetch('/api/stats?' + buildChartsQueryString());
        const stats = await response.json();
        
        if (response.ok) {
            // Wait a bit for the modal to be displayed, then create visible charts only
            setTimeout(() => {
                try {
                    // Destroy existing fullscreen charts if any
                    destroyAllFullscreenCharts();
                    
                    // Get visible charts based on visibility checkboxes
                    const visibleCharts = getVisibleCharts();
                    // Create only visible charts in fullscreen with data
                    if (visibleCharts.quality) {
                        const qualityCtx = document.getElementById('fullscreen-quality-chart').getContext('2d');
                        charts.fullscreenQuality = createFullscreenQualityChartWithData(qualityCtx, stats.quality_distribution, stats.monthly_quality);
                    }
                    
                    if (visibleCharts.punctuality) {
                        const punctualityCtx = document.getElementById('fullscreen-punctuality-chart').getContext('2d');
                        charts.fullscreenPunctuality = createFullscreenPunctualityChartWithData(punctualityCtx, stats.punctuality_distribution, stats.monthly_punctuality);
                    }
                    
                    if (visibleCharts.prb) {
                        const prbCtx = document.getElementById('fullscreen-prb-chart').getContext('2d');
                        charts.fullscreenPRB = createFullscreenPRBChartWithData(prbCtx, stats.prb_distribution, stats.monthly_prb);
                    }
                    
                    if (visibleCharts.hiim) {
                        const hiimCtx = document.getElementById('fullscreen-hiim-chart').getContext('2d');
                        charts.fullscreenHIIM = createFullscreenHIIMChartWithData(hiimCtx, stats.hiim_distribution, stats.monthly_hiim);
                    }
                    
                    // Hide/show chart containers based on visibility
                    updateFullscreenChartVisibility(visibleCharts);
                    
                } catch (error) {
                    console.error('Error creating all fullscreen charts:', error);
                    alert('Error creating fullscreen charts: ' + error.message);
                }
            }, 100);
        } else {
            throw new Error('Failed to load charts data');
        }
    } catch (error) {
        console.error('Error loading charts data for fullscreen:', error);
        alert('Failed to load charts data. Please try again.');
    }
}

function closeAllChartsFullscreen() {
    fullscreenAllModal.style.display = 'none';
    destroyAllFullscreenCharts();
}

function destroyAllFullscreenCharts() {
    if (charts.fullscreenQuality) {
        charts.fullscreenQuality.destroy();
        charts.fullscreenQuality = null;
    }
    if (charts.fullscreenPunctuality) {
        charts.fullscreenPunctuality.destroy();
        charts.fullscreenPunctuality = null;
    }
    if (charts.fullscreenPRB) {
        charts.fullscreenPRB.destroy();
        charts.fullscreenPRB = null;
    }
    if (charts.fullscreenHIIM) {
        charts.fullscreenHIIM.destroy();
        charts.fullscreenHIIM = null;
    }
}

function getVisibleCharts() {
    return {
        quality: chartVisibilityFilters.quality.checked,
        punctuality: chartVisibilityFilters.punctuality.checked,
        prb: chartVisibilityFilters.prb.checked,
        hiim: chartVisibilityFilters.hiim.checked
    };
}

function updateFullscreenChartVisibility(visibleCharts) {
    const chartItems = {
        quality: document.querySelector('.fullscreen-chart-item[data-chart="quality"]'),
        punctuality: document.querySelector('.fullscreen-chart-item[data-chart="punctuality"]'),
        prb: document.querySelector('.fullscreen-chart-item[data-chart="prb"]'),
        hiim: document.querySelector('.fullscreen-chart-item[data-chart="hiim"]')
    };
    
    // Show/hide chart items based on visibility
    Object.keys(chartItems).forEach(chartType => {
        const chartItem = chartItems[chartType];
        if (chartItem) {
            if (visibleCharts[chartType]) {
                chartItem.style.display = 'flex';
            } else {
                chartItem.style.display = 'none';
            }
        }
    });
    
    // Update grid layout based on number of visible charts
    const visibleCount = Object.values(visibleCharts).filter(Boolean).length;
    const gridContainer = document.querySelector('.fullscreen-chart-grid');
    
    if (gridContainer) {
        if (visibleCount === 1) {
            gridContainer.style.gridTemplateColumns = '1fr';
            gridContainer.style.gridTemplateRows = '1fr';
        } else if (visibleCount === 2) {
            gridContainer.style.gridTemplateColumns = '1fr 1fr';
            gridContainer.style.gridTemplateRows = '1fr';
        } else if (visibleCount === 3) {
            gridContainer.style.gridTemplateColumns = '1fr 1fr';
            gridContainer.style.gridTemplateRows = '1fr 1fr';
        } else {
            gridContainer.style.gridTemplateColumns = '1fr 1fr';
            gridContainer.style.gridTemplateRows = '1fr 1fr';
        }
    }
}


// Fullscreen chart creation functions
function createFullscreenQualityChart(ctx) {
    // Use the same logic as the small screen chart
    // Always use bar chart logic
        // Get data from the existing chart
        let qualityData = { Red: 0, Yellow: 0, Green: 0 };
        let monthlyData = [];
        
        if (charts.quality && charts.quality.data) {
            // Extract data from the existing chart
            if (charts.quality.data.datasets && charts.quality.data.datasets.length > 0) {
                const firstDataset = charts.quality.data.datasets[0];
                if (firstDataset.data && firstDataset.data.length >= 3) {
                    qualityData = {
                        Red: firstDataset.data[0] || 0,
                        Yellow: firstDataset.data[1] || 0,
                        Green: firstDataset.data[2] || 0
                    };
                }
                
                // Check if it's a grouped chart (multiple datasets)
                if (charts.quality.data.datasets.length > 1) {
                    // This is a grouped chart, extract monthly data
                    const labels = charts.quality.data.labels || [];
                    monthlyData = labels.map((label, index) => [
                        index,
                        {
                            month_name: label,
                            Red: charts.quality.data.datasets[0].data[index] || 0,
                            Yellow: charts.quality.data.datasets[1].data[index] || 0,
                            Green: charts.quality.data.datasets[2].data[index] || 0
                        }
                    ]);
                }
            }
        }
        
        // Get selected months for chart title
        const selectedMonths = Array.from(chartsFilters.month.selectedOptions).map(option => option.text);
        const selectedYears = Array.from(chartsFilters.year.selectedOptions).map(option => option.value);
        const periodLabel = selectedMonths.length > 0 ? 
            `${selectedMonths.join(', ')} ${selectedYears.join(', ')}` : 
            'Selected Period';
        
        // Prepare data for grouped bar chart (same logic as small screen)
        let labels, datasets;
        
        if (monthlyData && monthlyData.length > 1) {
            // Multiple months - show grouped bars
            labels = monthlyData.map(item => item[1].month_name);
            datasets = [
                {
                    label: 'Red',
                    data: monthlyData.map(item => item[1].Red || 0),
                    backgroundColor: '#dc3545',
                    borderColor: '#c82333',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                },
                {
                    label: 'Yellow',
                    data: monthlyData.map(item => item[1].Yellow || 0),
                    backgroundColor: '#ffc107',
                    borderColor: '#e0a800',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                },
                {
                    label: 'Green',
                    data: monthlyData.map(item => item[1].Green || 0),
                    backgroundColor: '#28a745',
                    borderColor: '#1e7e34',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                }
            ];
        } else {
            // Single period - show simple bars
            labels = ['Red', 'Yellow', 'Green'];
            datasets = [{
                label: `Quality Status (${periodLabel})`,
                data: [qualityData.Red || 0, qualityData.Yellow || 0, qualityData.Green || 0],
                backgroundColor: ['#dc3545', '#ffc107', '#28a745'],
                borderColor: ['#c82333', '#e0a800', '#1e7e34'],
                borderWidth: 3,
                borderRadius: 6,
                borderSkipped: false,
            }];
        }
        
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: monthlyData && monthlyData.length > 1
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y}`;
                            }
                        }
                    },
                    datalabels: {
                        display: true,
                        color: 'white',
                        font: {
                            weight: 'bold',
                            size: 12
                        },
                        formatter: function(value) {
                            return value > 0 ? value : '';
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
}

function createFullscreenPunctualityChart(ctx) {
    // Use the same logic as the small screen chart
    // Always use bar chart logic
        // Get data from the existing chart
        let punctualityData = { Red: 0, Yellow: 0, Green: 0 };
        let monthlyData = [];
        
        if (charts.punctuality && charts.punctuality.data) {
            // Extract data from the existing chart
            if (charts.punctuality.data.datasets && charts.punctuality.data.datasets.length > 0) {
                const firstDataset = charts.punctuality.data.datasets[0];
                if (firstDataset.data && firstDataset.data.length >= 3) {
                    punctualityData = {
                        Red: firstDataset.data[0] || 0,
                        Yellow: firstDataset.data[1] || 0,
                        Green: firstDataset.data[2] || 0
                    };
                }
                
                // Check if it's a grouped chart (multiple datasets)
                if (charts.punctuality.data.datasets.length > 1) {
                    // This is a grouped chart, extract monthly data
                    const labels = charts.punctuality.data.labels || [];
                    monthlyData = labels.map((label, index) => [
                        index,
                        {
                            month_name: label,
                            Red: charts.punctuality.data.datasets[0].data[index] || 0,
                            Yellow: charts.punctuality.data.datasets[1].data[index] || 0,
                            Green: charts.punctuality.data.datasets[2].data[index] || 0
                        }
                    ]);
                }
            }
        }
        
        // Get selected months for chart title
        const selectedMonths = Array.from(chartsFilters.month.selectedOptions).map(option => option.text);
        const selectedYears = Array.from(chartsFilters.year.selectedOptions).map(option => option.value);
        const periodLabel = selectedMonths.length > 0 ? 
            `${selectedMonths.join(', ')} ${selectedYears.join(', ')}` : 
            'Selected Period';
        
        // Prepare data for grouped bar chart (same logic as small screen)
        let labels, datasets;
        
        if (monthlyData && monthlyData.length > 1) {
            // Multiple months - show grouped bars
            labels = monthlyData.map(item => item[1].month_name);
            datasets = [
                {
                    label: 'Red',
                    data: monthlyData.map(item => item[1].Red || 0),
                    backgroundColor: '#dc3545',
                    borderColor: '#c82333',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                },
                {
                    label: 'Yellow',
                    data: monthlyData.map(item => item[1].Yellow || 0),
                    backgroundColor: '#ffc107',
                    borderColor: '#e0a800',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                },
                {
                    label: 'Green',
                    data: monthlyData.map(item => item[1].Green || 0),
                    backgroundColor: '#28a745',
                    borderColor: '#1e7e34',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                }
            ];
        } else {
            // Single period - show simple bars
            labels = ['Red', 'Yellow', 'Green'];
            datasets = [{
                label: `Punctuality Status (${periodLabel})`,
                data: [punctualityData.Red || 0, punctualityData.Yellow || 0, punctualityData.Green || 0],
                backgroundColor: ['#dc3545', '#ffc107', '#28a745'],
                borderColor: ['#c82333', '#e0a800', '#1e7e34'],
                borderWidth: 3,
                borderRadius: 6,
                borderSkipped: false,
            }];
        }
        
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: monthlyData && monthlyData.length > 1
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y}`;
                            }
                        }
                    },
                    datalabels: {
                        display: true,
                        color: 'white',
                        font: {
                            weight: 'bold',
                            size: 12
                        },
                        formatter: function(value) {
                            return value > 0 ? value : '';
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
}

function createFullscreenPRBChart(ctx) {
    // Use the same logic as the small screen chart
    // Always use bar chart logic
        // Get data from the existing chart
        let prbData = { active: 0, closed: 0 };
        let monthlyData = [];
        
        if (charts.prb && charts.prb.data) {
            // Extract data from the existing chart
            if (charts.prb.data.datasets && charts.prb.data.datasets.length > 0) {
                const firstDataset = charts.prb.data.datasets[0];
                if (firstDataset.data && firstDataset.data.length >= 2) {
                    prbData = {
                        active: firstDataset.data[0] || 0,
                        closed: firstDataset.data[1] || 0
                    };
                }
                
                // Check if it's a grouped chart (multiple datasets)
                if (charts.prb.data.datasets.length > 1) {
                    // This is a grouped chart, extract monthly data
                    const labels = charts.prb.data.labels || [];
                    monthlyData = labels.map((label, index) => [
                        index,
                        {
                            month_name: label,
                            active: charts.prb.data.datasets[0].data[index] || 0,
                            closed: charts.prb.data.datasets[1].data[index] || 0
                        }
                    ]);
                }
            }
        }
        
        // Get selected months for chart title
        const selectedMonths = Array.from(chartsFilters.month.selectedOptions).map(option => option.text);
        const selectedYears = Array.from(chartsFilters.year.selectedOptions).map(option => option.value);
        const periodLabel = selectedMonths.length > 0 ? 
            `${selectedMonths.join(', ')} ${selectedYears.join(', ')}` : 
            'Selected Period';
        
        // Prepare data for grouped bar chart (same logic as small screen)
        let labels, datasets;
        
        if (monthlyData && monthlyData.length > 1) {
            // Multiple months - show grouped bars
            labels = monthlyData.map(item => item[1].month_name);
            datasets = [
                {
                    label: 'Active',
                    data: monthlyData.map(item => item[1].active || 0),
                    backgroundColor: '#ffc107',
                    borderColor: '#e0a800',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                },
                {
                    label: 'Closed',
                    data: monthlyData.map(item => item[1].closed || 0),
                    backgroundColor: '#28a745',
                    borderColor: '#1e7e34',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                }
            ];
        } else {
            // Single period - show simple bars
            labels = ['Active', 'Closed'];
            datasets = [{
                label: `PRB Status (${periodLabel})`,
                data: [prbData.active || 0, prbData.closed || 0],
                backgroundColor: ['#ffc107', '#28a745'],
                borderColor: ['#e0a800', '#1e7e34'],
                borderWidth: 3,
                borderRadius: 6,
                borderSkipped: false,
            }];
        }
        
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: monthlyData && monthlyData.length > 1
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y}`;
                            }
                        }
                    },
                    datalabels: {
                        display: true,
                        color: 'white',
                        font: {
                            weight: 'bold',
                            size: 12
                        },
                        formatter: function(value) {
                            return value > 0 ? value : '';
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
}

function createFullscreenHIIMChart(ctx) {
    // Use the same logic as the small screen chart
    // Always use bar chart logic
        // Get data from the existing chart
        let hiimData = { active: 0, closed: 0 };
        let monthlyData = [];
        
        if (charts.hiim && charts.hiim.data) {
            // Extract data from the existing chart
            if (charts.hiim.data.datasets && charts.hiim.data.datasets.length > 0) {
                const firstDataset = charts.hiim.data.datasets[0];
                if (firstDataset.data && firstDataset.data.length >= 2) {
                    hiimData = {
                        active: firstDataset.data[0] || 0,
                        closed: firstDataset.data[1] || 0
                    };
                }
                
                // Check if it's a grouped chart (multiple datasets)
                if (charts.hiim.data.datasets.length > 1) {
                    // This is a grouped chart, extract monthly data
                    const labels = charts.hiim.data.labels || [];
                    monthlyData = labels.map((label, index) => [
                        index,
                        {
                            month_name: label,
                            active: charts.hiim.data.datasets[0].data[index] || 0,
                            closed: charts.hiim.data.datasets[1].data[index] || 0
                        }
                    ]);
                }
            }
        }
        
        // Get selected months for chart title
        const selectedMonths = Array.from(chartsFilters.month.selectedOptions).map(option => option.text);
        const selectedYears = Array.from(chartsFilters.year.selectedOptions).map(option => option.value);
        const periodLabel = selectedMonths.length > 0 ? 
            `${selectedMonths.join(', ')} ${selectedYears.join(', ')}` : 
            'Selected Period';
        
        // Prepare data for grouped bar chart (same logic as small screen)
        let labels, datasets;
        
        if (monthlyData && monthlyData.length > 1) {
            // Multiple months - show grouped bars
            labels = monthlyData.map(item => item[1].month_name);
            datasets = [
                {
                    label: 'Active',
                    data: monthlyData.map(item => item[1].active || 0),
                    backgroundColor: '#ffc107',
                    borderColor: '#e0a800',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                },
                {
                    label: 'Closed',
                    data: monthlyData.map(item => item[1].closed || 0),
                    backgroundColor: '#28a745',
                    borderColor: '#1e7e34',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                }
            ];
        } else {
            // Single period - show simple bars
            labels = ['Active', 'Closed'];
            datasets = [{
                label: `HIIM Status (${periodLabel})`,
                data: [hiimData.active || 0, hiimData.closed || 0],
                backgroundColor: ['#ffc107', '#28a745'],
                borderColor: ['#e0a800', '#1e7e34'],
                borderWidth: 3,
                borderRadius: 6,
                borderSkipped: false,
            }];
        }
        
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: monthlyData && monthlyData.length > 1
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y}`;
                            }
                        }
                    },
                    datalabels: {
                        display: true,
                        color: 'white',
                        font: {
                            weight: 'bold',
                            size: 12
                        },
                        formatter: function(value) {
                            return value > 0 ? value : '';
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
}

// New fullscreen chart functions that accept data as parameters
function createFullscreenQualityChartWithData(ctx, qualityData, monthlyData) {
    // Bar chart logic (same as regular chart)
        const selectedMonths = Array.from(chartsFilters.month.selectedOptions).map(option => option.text);
        const selectedYears = Array.from(chartsFilters.year.selectedOptions).map(option => option.value);
        const periodLabel = selectedMonths.length > 0 ? 
            `${selectedMonths.join(', ')} ${selectedYears.join(', ')}` : 
            'Selected Period';
        
        let labels, datasets;
        
        if (monthlyData && monthlyData.length > 1) {
            // Multiple months - show grouped bars
            labels = monthlyData.map(item => item[1].month_name);
            datasets = [
                {
                    label: 'Red',
                    data: monthlyData.map(item => item[1].Red || 0),
                    backgroundColor: '#dc3545',
                    borderColor: '#c82333',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                },
                {
                    label: 'Yellow',
                    data: monthlyData.map(item => item[1].Yellow || 0),
                    backgroundColor: '#ffc107',
                    borderColor: '#e0a800',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                },
                {
                    label: 'Green',
                    data: monthlyData.map(item => item[1].Green || 0),
                    backgroundColor: '#28a745',
                    borderColor: '#1e7e34',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                }
            ];
        } else {
            // Single month or no monthly data - show simple bars
            labels = ['Red', 'Yellow', 'Green'];
            datasets = [{
                label: `Quality Status (${periodLabel})`,
                data: [qualityData.Red || 0, qualityData.Yellow || 0, qualityData.Green || 0],
                backgroundColor: ['#dc3545', '#ffc107', '#28a745'],
                borderColor: ['#c82333', '#e0a800', '#1e7e34'],
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
            }];
        }
        
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: monthlyData && monthlyData.length > 1
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y}`;
                            }
                        }
                    },
                    datalabels: {
                        display: true,
                        color: 'white',
                        font: {
                            weight: 'bold',
                            size: 12
                        },
                        formatter: function(value) {
                            return value > 0 ? value : '';
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
}

function createFullscreenPunctualityChartWithData(ctx, punctualityData, monthlyData) {
    // Bar chart logic (same as regular chart)
        const selectedMonths = Array.from(chartsFilters.month.selectedOptions).map(option => option.text);
        const selectedYears = Array.from(chartsFilters.year.selectedOptions).map(option => option.value);
        const periodLabel = selectedMonths.length > 0 ? 
            `${selectedMonths.join(', ')} ${selectedYears.join(', ')}` : 
            'Selected Period';
        
        let labels, datasets;
        
        if (monthlyData && monthlyData.length > 1) {
            // Multiple months - show grouped bars
            labels = monthlyData.map(item => item[1].month_name);
            datasets = [
                {
                    label: 'Red',
                    data: monthlyData.map(item => item[1].Red || 0),
                    backgroundColor: '#dc3545',
                    borderColor: '#c82333',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                },
                {
                    label: 'Yellow',
                    data: monthlyData.map(item => item[1].Yellow || 0),
                    backgroundColor: '#ffc107',
                    borderColor: '#e0a800',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                },
                {
                    label: 'Green',
                    data: monthlyData.map(item => item[1].Green || 0),
                    backgroundColor: '#28a745',
                    borderColor: '#1e7e34',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                }
            ];
        } else {
            // Single month or no monthly data - show simple bars
            labels = ['Red', 'Yellow', 'Green'];
            datasets = [{
                label: `Punctuality Status (${periodLabel})`,
                data: [punctualityData.Red || 0, punctualityData.Yellow || 0, punctualityData.Green || 0],
                backgroundColor: ['#dc3545', '#ffc107', '#28a745'],
                borderColor: ['#c82333', '#e0a800', '#1e7e34'],
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
            }];
        }
        
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: monthlyData && monthlyData.length > 1
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y}`;
                            }
                        }
                    },
                    datalabels: {
                        display: true,
                        color: 'white',
                        font: {
                            weight: 'bold',
                            size: 12
                        },
                        formatter: function(value) {
                            return value > 0 ? value : '';
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
}

function createFullscreenPRBChartWithData(ctx, prbData, monthlyData) {
    // Bar chart logic (same as regular chart)
        const selectedMonths = Array.from(chartsFilters.month.selectedOptions).map(option => option.text);
        const selectedYears = Array.from(chartsFilters.year.selectedOptions).map(option => option.value);
        const periodLabel = selectedMonths.length > 0 ? 
            `${selectedMonths.join(', ')} ${selectedYears.join(', ')}` : 
            'Selected Period';
        
        let labels, datasets;
        
        if (monthlyData && monthlyData.length > 1) {
            // Multiple months - show grouped bars
            labels = monthlyData.map(item => item[1].month_name);
            datasets = [
                {
                    label: 'Active',
                    data: monthlyData.map(item => item[1].active || 0),
                    backgroundColor: '#ffc107',
                    borderColor: '#e0a800',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                },
                {
                    label: 'Closed',
                    data: monthlyData.map(item => item[1].closed || 0),
                    backgroundColor: '#28a745',
                    borderColor: '#1e7e34',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                }
            ];
        } else {
            // Single month or no monthly data - show simple bars
            labels = ['Active', 'Closed'];
            datasets = [{
                label: `PRB Status (${periodLabel})`,
                data: [prbData.active || 0, prbData.closed || 0],
                backgroundColor: ['#ffc107', '#28a745'],
                borderColor: ['#e0a800', '#1e7e34'],
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
            }];
        }
        
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: monthlyData && monthlyData.length > 1
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y}`;
                            }
                        }
                    },
                    datalabels: {
                        display: true,
                        color: 'white',
                        font: {
                            weight: 'bold',
                            size: 12
                        },
                        formatter: function(value) {
                            return value > 0 ? value : '';
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
}

function createFullscreenHIIMChartWithData(ctx, hiimData, monthlyData) {
    // Bar chart logic (same as regular chart)
        const selectedMonths = Array.from(chartsFilters.month.selectedOptions).map(option => option.text);
        const selectedYears = Array.from(chartsFilters.year.selectedOptions).map(option => option.value);
        const periodLabel = selectedMonths.length > 0 ? 
            `${selectedMonths.join(', ')} ${selectedYears.join(', ')}` : 
            'Selected Period';
        
        let labels, datasets;
        
        if (monthlyData && monthlyData.length > 1) {
            // Multiple months - show grouped bars
            labels = monthlyData.map(item => item[1].month_name);
            datasets = [
                {
                    label: 'Active',
                    data: monthlyData.map(item => item[1].active || 0),
                    backgroundColor: '#ffc107',
                    borderColor: '#e0a800',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                },
                {
                    label: 'Closed',
                    data: monthlyData.map(item => item[1].closed || 0),
                    backgroundColor: '#28a745',
                    borderColor: '#1e7e34',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                }
            ];
        } else {
            // Single month or no monthly data - show simple bars
            labels = ['Active', 'Closed'];
            datasets = [{
                label: `HIIM Status (${periodLabel})`,
                data: [hiimData.active || 0, hiimData.closed || 0],
                backgroundColor: ['#ffc107', '#28a745'],
                borderColor: ['#e0a800', '#1e7e34'],
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
            }];
        }
        
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: monthlyData && monthlyData.length > 1
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y}`;
                            }
                        }
                    },
                    datalabels: {
                        display: true,
                        color: 'white',
                        font: {
                            weight: 'bold',
                            size: 12
                        },
                        formatter: function(value) {
                            return value > 0 ? value : '';
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
}

// Weekend and weekly logic
function isWeekend(dateString) {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
}

function getWeekNumber(dateString) {
    const date = new Date(dateString);
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

function getWeekStartDate(dateString) {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
    const weekStart = new Date(date.setDate(diff));
    return weekStart.toISOString().split('T')[0];
}

function formatWeekRange(weekStartDate) {
    const start = new Date(weekStartDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    return `Week of ${startStr} - ${endStr}`;
}

function isThirdWeekendOfMonth(weekStartDate) {
    const start = new Date(weekStartDate);
    const month = start.getMonth();
    const year = start.getFullYear();
    
    // Find all weekends (Saturday-Sunday pairs) in the month
    const weekendPairs = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Check each day of the month to find weekend pairs
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();
        
        // If it's a Saturday, check if the next day (Sunday) is also in the same month
        if (dayOfWeek === 6) { // Saturday
            const nextDay = new Date(year, month, day + 1);
            if (nextDay.getMonth() === month) { // Sunday is in the same month
                weekendPairs.push({ saturday: day, sunday: day + 1 });
            }
        }
    }
    
    // Check if this week contains the 3rd weekend pair
    const weekEnd = new Date(start);
    weekEnd.setDate(start.getDate() + 6);
    
    // Find the 3rd weekend pair (0-indexed, so [2] is the 3rd weekend)
    const thirdWeekend = weekendPairs[2];
    
    if (thirdWeekend) {
        const thirdWeekendSaturday = new Date(year, month, thirdWeekend.saturday);
        const thirdWeekendSunday = new Date(year, month, thirdWeekend.sunday);
        
        // Check if this week contains either the Saturday or Sunday of the 3rd weekend
        return (thirdWeekendSaturday >= start && thirdWeekendSaturday <= weekEnd) ||
               (thirdWeekendSunday >= start && thirdWeekendSunday <= weekEnd);
    }
    
    return false;
}

function isMondayAfterInfraWeekend(dateString) {
    const date = new Date(dateString);
    
    // Check if it's a Monday
    if (date.getDay() !== 1) {
        return false;
    }
    
    // Get the previous week's start date
    const previousWeekStart = new Date(date);
    previousWeekStart.setDate(date.getDate() - 7);
    
    // Check if the previous week was an Infra weekend
    return isThirdWeekendOfMonth(previousWeekStart.toISOString().split('T')[0]);
}

// Time-based color logic
function getTimeBasedColor(timeText, dateString, application, fieldType) {
    const date = new Date(dateString);
    const isMonday = date.getDay() === 1;
    const isMondayAfterInfra = isMondayAfterInfraWeekend(dateString);
    
    // Parse time from text (format: "HH:MM AM/PM" or "HH:MM")
    const timeMatch = timeText.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/i);
    if (!timeMatch) {
        return 'Green'; // Default if time parsing fails
    }
    
    let hour = parseInt(timeMatch[1]);
    const minute = parseInt(timeMatch[2]);
    // If AM/PM explicitly provided, normalize and convert; otherwise treat input as 24-hour format
    const ampm = timeMatch[3] ? timeMatch[3].toUpperCase() : null;

    if (ampm) {
        // Convert to 24-hour format when AM/PM is present
        if (ampm === 'PM' && hour !== 12) {
            hour += 12;
        } else if (ampm === 'AM' && hour === 12) {
            hour = 0;
        }
    } else {
        // No AM/PM provided: assume the input is already in 24-hour format.
        // Handle possible edge-case where user supplied '24:00' -> treat as '00:00'.
        if (hour === 24) {
            hour = 0;
        }
        // Leave hour as-is for 0-23
    }
    
    const timeInMinutes = hour * 60 + minute;
    
    // Special Monday logic
    if (isMonday) {
        // PRC Mail on Monday: Always Green (except after Infra weekend)
        if (fieldType === 'prc_mail') {
            if (isMondayAfterInfra) {
                // After Infra weekend: Follow normal time-based rules
                return getTimeBasedColorForApplication(timeInMinutes, application);
            } else {
                // Regular Monday: Always Green
                return 'Green';
            }
        }
        // CP Alerts on Monday: Always follow normal time-based rules
        else if (fieldType === 'cp_alerts') {
            return getTimeBasedColorForApplication(timeInMinutes, application);
        }
    }
    
    // Non-Monday or other field types: Follow normal time-based rules
    return getTimeBasedColorForApplication(timeInMinutes, application);
}

function getTimeBasedColorForApplication(timeInMinutes, application) {
    // Apply different rules based on application
    if (application === 'CVAR ALL') {
        // CVAR ALL: Evaluate both CVAR ALL rules and CVAR NYQ rules and pick the worst
        // CVAR ALL rules: Green before 9 AM, Yellow 9-11 AM, Red after 11 AM
        const nineAM = 9 * 60; // 9:00 AM
        const elevenAM = 11 * 60; // 11:00 AM
        let colorA;
        if (timeInMinutes < nineAM) {
            colorA = 'Green';
        } else if (timeInMinutes >= nineAM && timeInMinutes <= elevenAM) {
            colorA = 'Yellow';
        } else {
            colorA = 'Red';
        }

        // CVAR NYQ rules (for worst-case comparison): Green before 4 PM, Yellow 4-6 PM, Red after 6 PM
        const fourPM = 16 * 60;
        const sixPM = 18 * 60;
        let colorB;
        if (timeInMinutes < fourPM) {
            colorB = 'Green';
        } else if (timeInMinutes >= fourPM && timeInMinutes <= sixPM) {
            colorB = 'Yellow';
        } else {
            colorB = 'Red';
        }

        // Return the worst color between the two (Red > Yellow > Green)
        const rank = { 'Green': 1, 'Yellow': 2, 'Red': 3 };
        return rank[colorA] >= rank[colorB] ? colorA : colorB;
    } else if (application === 'CVAR NYQ') {
        // CVAR NYQ: Green before 4 PM, Yellow 4-6 PM, Red after 6 PM
        const fourPM = 16 * 60; // 4:00 PM in minutes
        const sixPM = 18 * 60; // 6:00 PM in minutes
        
        if (timeInMinutes < fourPM) {
            return 'Green';
        } else if (timeInMinutes >= fourPM && timeInMinutes <= sixPM) {
            return 'Yellow';
        } else {
            return 'Red';
        }
    } else if (application === 'XVA') {
        // XVA: No time-based rules. Return 'Green' so explicit status (if present) will be used.
        return 'Green';
    }
    
    // Default to Green for other applications
    return 'Green';
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function getDayOfWeek(dateString) {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Return short day name for better table display
    return shortDayNames[dayOfWeek];
}

function getDefaultEntryDate() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // If today is Monday (day 1), set date to Friday (d-3)
    if (dayOfWeek === 1) {
        const friday = new Date(today);
        friday.setDate(today.getDate() - 3);
        return friday.toISOString().split('T')[0];
    }
    
    // For all other days, set date to yesterday (d-1)
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
}

function setMaxDateToToday() {
    const today = new Date().toISOString().split('T')[0];
    
    // Set max date for all date inputs
    const dateInputs = [
        'start-date',
        'end-date', 
        'entry-date',
        'charts-start-date',
        'charts-end-date'
    ];
    
    dateInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.setAttribute('max', today);
        }
    });
}

function showLoading() {
    // Add loading indicator to buttons
    applyFiltersBtn.innerHTML = '<span class="loading"></span> Loading...';
    applyFiltersBtn.disabled = true;
}

function hideLoading() {
    applyFiltersBtn.innerHTML = 'Apply Filters';
    applyFiltersBtn.disabled = false;
}

// Weekend warning functions
function setupWeekendWarning() {
    const dateInput = document.getElementById('entry-date');
    if (dateInput) {
        dateInput.addEventListener('change', function() {
            const selectedDate = this.value;
            if (selectedDate && isWeekend(selectedDate)) {
                showWeekendWarning();
            } else {
                hideWeekendWarning();
            }
        });
    }
    
    // Also check XVA date input
    const xvaDateInput = document.getElementById('xva-entry-date');
    if (xvaDateInput) {
        xvaDateInput.addEventListener('change', function() {
            const selectedDate = this.value;
            if (selectedDate && isWeekend(selectedDate)) {
                showWeekendWarning();
            } else {
                hideWeekendWarning();
            }
        });
    }
}

// Time formatting functions
function setupTimeFormatting() {
    // Standard timing fields
    const prcMailInput = document.getElementById('entry-prc-mail-text');
    const cpAlertsInput = document.getElementById('entry-cp-alerts-text');
    
    // XVA timing fields
    const acqInput = document.getElementById('xva-entry-acq-text');
    const valoInput = document.getElementById('xva-entry-valo-text');
    const sensiInput = document.getElementById('xva-entry-sensi-text');
    const cfRaInput = document.getElementById('xva-entry-cf-ra-text');
    
    // Setup standard fields - colon auto-formatting + validation
    if (prcMailInput) {
        prcMailInput.addEventListener('input', function(e) {
            formatTimeInput(e.target);
        });
        prcMailInput.addEventListener('blur', function(e) {
            validateTimeInput(e.target);
        });
    }
    
    if (cpAlertsInput) {
        cpAlertsInput.addEventListener('input', function(e) {
            formatTimeInput(e.target);
        });
        cpAlertsInput.addEventListener('blur', function(e) {
            validateTimeInput(e.target);
        });
    }
    
    // Setup XVA fields - colon auto-formatting + validation
    if (acqInput) {
        acqInput.addEventListener('input', function(e) {
            formatTimeInput(e.target);
        });
        acqInput.addEventListener('blur', function(e) {
            validateTimeInput(e.target);
        });
    }
    
    if (valoInput) {
        valoInput.addEventListener('input', function(e) {
            formatTimeInput(e.target);
        });
        valoInput.addEventListener('blur', function(e) {
            validateTimeInput(e.target);
        });
    }
    
    if (sensiInput) {
        sensiInput.addEventListener('input', function(e) {
            formatTimeInput(e.target);
        });
        sensiInput.addEventListener('blur', function(e) {
            validateTimeInput(e.target);
        });
    }
    
    if (cfRaInput) {
        cfRaInput.addEventListener('input', function(e) {
            formatTimeInput(e.target);
        });
        cfRaInput.addEventListener('blur', function(e) {
            validateTimeInput(e.target);
        });
    }
    
    // Setup conditional status validation for SENSI, CF RA, and VALO
    setupConditionalStatusValidation();
}

function formatTimeInput(input) {
    let value = input.value.replace(/\D/g, ''); // Remove non-digits
    let cursorPosition = input.selectionStart;
    
    if (value.length >= 3) {
        // Format as H:MM or HH:MM
        if (value.length === 3) {
            value = value.slice(0, 1) + ':' + value.slice(1);
        } else {
            value = value.slice(0, 2) + ':' + value.slice(2, 4);
        }
    } else if (value.length === 2) {
        // Add colon after 2 digits
        value = value + ':';
    }
    
    input.value = value;
    
    // Position cursor after colon when it's added
    if (value.length === 3 && value.includes(':')) {
        // Cursor should be after the colon (position 2)
        setTimeout(() => {
            input.setSelectionRange(3, 3);
        }, 0);
    }
}

function validateTimeInput(input) {
    const value = input.value.trim();
    
    // Clear any existing error styling
    input.style.borderColor = '';
    
    if (!value) {
        return; // Empty values are allowed
    }
    
    // Regex for proper 24-hour format: 00-23:00-59
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    
    if (!timeRegex.test(value)) {
        // Show validation error and clear invalid input
        input.style.borderColor = '#dc3545';
        input.value = ''; // Clear invalid input
        setTimeout(() => {
            input.style.borderColor = '';
        }, 3000);
        return;
    }
    
    // Additional validation for hour and minute ranges
    const match = value.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
    if (match) {
        const hour = parseInt(match[1]);
        const minute = parseInt(match[2]);
        
        // Validate hour range (0-23)
        if (hour < 0 || hour > 23) {
            input.style.borderColor = '#dc3545';
            input.value = ''; // Clear invalid input
            setTimeout(() => {
                input.style.borderColor = '';
            }, 3000);
            return;
        }
        
        // Validate minute range (0-59)
        if (minute < 0 || minute > 59) {
            input.style.borderColor = '#dc3545';
            input.value = ''; // Clear invalid input
            setTimeout(() => {
                input.style.borderColor = '';
            }, 3000);
            return;
        }
    }
}

function setupConditionalStatusValidation() {
    // Define the fields that need conditional status validation
    const conditionalFields = [
        {
            timeField: 'xva-entry-sensi-text',
            statusField: 'xva-entry-sensi-status'
        },
        {
            timeField: 'xva-entry-cf-ra-text',
            statusField: 'xva-entry-cf-ra-status'
        },
        {
            timeField: 'xva-entry-valo-text',
            statusField: 'xva-entry-valo-status'
        }
    ];
    
    conditionalFields.forEach(field => {
        const timeInput = document.getElementById(field.timeField);
        const statusSelect = document.getElementById(field.statusField);
        
        if (timeInput && statusSelect) {
            // Add event listener for timing changes
            timeInput.addEventListener('input', function() {
                updateStatusFieldRequirement(timeInput, statusSelect);
            });
            
            timeInput.addEventListener('blur', function() {
                updateStatusFieldRequirement(timeInput, statusSelect);
            });
            
            // Initial setup
            updateStatusFieldRequirement(timeInput, statusSelect);
        }
    });
}

function updateStatusFieldRequirement(timeInput, statusSelect) {
    const hasTiming = timeInput.value.trim() !== '';
    
    if (hasTiming) {
        // Timing is entered - make status required
        statusSelect.setAttribute('required', 'required');
        statusSelect.style.borderColor = '#dc3545'; // Red border to indicate required
    } else {
        // No timing - make status optional
        statusSelect.removeAttribute('required');
        statusSelect.style.borderColor = ''; // Remove red border
        statusSelect.value = ''; // Clear status when timing is cleared
    }
}

function validateXVAStatusRequirements(entryData) {
    // Check SENSI: if timing is entered, status is required
    if (entryData.sensi_text && entryData.sensi_text.trim() !== '') {
        if (!entryData.sensi_status || entryData.sensi_status.trim() === '') {
            return 'SENSI status is required when timing is entered.';
        }
    }
    
    // Check CF RA: if timing is entered, status is required
    if (entryData.cf_ra_text && entryData.cf_ra_text.trim() !== '') {
        if (!entryData.cf_ra_status || entryData.cf_ra_status.trim() === '') {
            return 'CF RA status is required when timing is entered.';
        }
    }
    
    // Check VALO: if timing is entered, status is required
    if (entryData.valo_text && entryData.valo_text.trim() !== '') {
        if (!entryData.valo_status || entryData.valo_status.trim() === '') {
            return 'VALO status is required when timing is entered.';
        }
    }
    
    // ACQ doesn't need status validation (as per requirement)
    
    return null; // No validation errors
}

// Make functions globally available
window.editEntry = editEntry;
window.deleteEntry = deleteEntry;

// Column Reordering Functionality
let columnOrder = ['date', 'day', 'prc_mail', 'cp_alerts', 'quality_status', 'issue_description', 'time_loss', 'prb_id', 'hiim_id', 'remarks', 'acq', 'valo', 'sensi', 'cf_ra', 'quality_legacy', 'quality_target', 'root_cause_application', 'root_cause_type', 'xva_remarks', 'closing', 'iteration', 'reg_issue', 'action_taken_and_update', 'reg_status', 'reg_prb', 'reg_hiim', 'backlog_item', 'dare', 'timings', 'puntuality_issue', 'quality', 'quality_issue', 'others_prb', 'others_hiim', 'actions'];
let draggedElement = null;
let draggedIndex = -1;

// Ensure all columns are included in the column order
function ensureAllColumnsInOrder() {
    const allColumns = ['date', 'day', 'prc_mail', 'cp_alerts', 'quality_status', 'issue_description', 'time_loss', 'prb_id', 'hiim_id', 'remarks', 'acq', 'valo', 'sensi', 'cf_ra', 'quality_legacy', 'quality_target', 'root_cause_application', 'root_cause_type', 'xva_remarks', 'closing', 'iteration', 'reg_issue', 'action_taken_and_update', 'reg_status', 'reg_prb', 'reg_hiim', 'backlog_item', 'dare', 'timings', 'puntuality_issue', 'quality', 'quality_issue', 'others_prb', 'others_hiim', 'actions'];
    
    // Add any missing columns to the end (before actions)
    const missingColumns = allColumns.filter(col => !columnOrder.includes(col));
    if (missingColumns.length > 0) {
        const actionsIndex = columnOrder.indexOf('actions');
        if (actionsIndex > -1) {
            columnOrder.splice(actionsIndex, 0, ...missingColumns);
        } else {
            columnOrder.push(...missingColumns);
        }
    }
}

// Initialize column reordering
function initializeColumnReordering() {
    // Load saved column order from localStorage
    const savedOrder = localStorage.getItem('prodvision_column_order');
    if (savedOrder) {
        try {
            const savedColumnOrder = JSON.parse(savedOrder);
            // Check if saved order includes all current columns
            const allColumns = ['date', 'day', 'prc_mail', 'cp_alerts', 'quality_status', 'issue_description', 'prb_id', 'hiim_id', 'remarks', 'acq', 'valo', 'sensi', 'cf_ra', 'quality_legacy', 'quality_target', 'root_cause_application', 'root_cause_type', 'xva_remarks', 'dare', 'timings', 'puntuality_issue', 'quality', 'quality_issue', 'others_prb', 'others_hiim', 'actions'];
            
            // If saved order is missing new columns, merge them
            const missingColumns = allColumns.filter(col => !savedColumnOrder.includes(col));
            if (missingColumns.length > 0) {
                // Add missing columns to the end (before actions)
                const actionsIndex = savedColumnOrder.indexOf('actions');
                if (actionsIndex > -1) {
                    savedColumnOrder.splice(actionsIndex, 0, ...missingColumns);
                } else {
                    savedColumnOrder.push(...missingColumns);
                }
                // Save updated order
                localStorage.setItem('prodvision_column_order', JSON.stringify(savedColumnOrder));
            }
            
            columnOrder = savedColumnOrder;
            applyColumnOrder();
        } catch (e) {
            console.warn('Failed to parse saved column order, using default');
        }
    }
    
    // Add drag event listeners to headers
    const headers = document.querySelectorAll('.draggable-header');
    headers.forEach((header, index) => {
        header.addEventListener('dragstart', handleDragStart);
        header.addEventListener('dragend', handleDragEnd);
        header.addEventListener('dragover', handleDragOver);
        header.addEventListener('drop', handleDrop);
        header.addEventListener('dragenter', handleDragEnter);
        header.addEventListener('dragleave', handleDragLeave);
    });
    
    // Ensure all columns are included in the order
    ensureAllColumnsInOrder();
    
    // Apply the column order to ensure all columns are visible
    applyColumnOrder();
}

function handleDragStart(e) {
    draggedElement = this;
    draggedIndex = Array.from(this.parentNode.children).indexOf(this);
    
    // Add dragging class for visual feedback
    this.classList.add('dragging');
    
    // Set drag data
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
    
    // Create a custom drag image
    const dragImage = this.cloneNode(true);
    dragImage.style.opacity = '0.8';
    dragImage.style.transform = 'rotate(5deg)';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // Remove the temporary drag image after a short delay
    setTimeout(() => {
        if (document.body.contains(dragImage)) {
            document.body.removeChild(dragImage);
        }
    }, 0);
}

function handleDragEnd(e) {
    // Remove dragging class
    this.classList.remove('dragging');
    
    // Remove drag-over classes from all headers
    const headers = document.querySelectorAll('.draggable-header');
    headers.forEach(header => {
        header.classList.remove('drag-over');
    });
    
    draggedElement = null;
    draggedIndex = -1;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    if (this !== draggedElement) {
        this.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    
    if (draggedElement && this !== draggedElement) {
        const dropIndex = Array.from(this.parentNode.children).indexOf(this);
        const headerRow = this.parentNode;
        
        // Get column names
        const draggedColumn = draggedElement.getAttribute('data-column');
        const dropColumn = this.getAttribute('data-column');
        
        // Update column order array
        const draggedOrderIndex = columnOrder.indexOf(draggedColumn);
        const dropOrderIndex = columnOrder.indexOf(dropColumn);
        
        if (draggedOrderIndex !== -1 && dropOrderIndex !== -1) {
            // Remove dragged column from its position
            columnOrder.splice(draggedOrderIndex, 1);
            // Insert at new position
            columnOrder.splice(dropOrderIndex, 0, draggedColumn);
            
            // Ensure all columns are included before saving
            ensureAllColumnsInOrder();
            
            // Save to localStorage
            localStorage.setItem('prodvision_column_order', JSON.stringify(columnOrder));
            
            // Apply the new column order
            applyColumnOrder();
        }
    }
    
    this.classList.remove('drag-over');
}

function applyColumnOrder() {
    const headerRow = document.getElementById('table-header-row');
    const tbody = document.getElementById('entries-tbody');
    
    if (!headerRow || !tbody) return;
    
    // Create new header row with reordered columns
    const newHeaderRow = document.createElement('tr');
    newHeaderRow.id = 'table-header-row';
    
    columnOrder.forEach(columnName => {
        const originalHeader = headerRow.querySelector(`[data-column="${columnName}"]`);
        if (originalHeader) {
            const clonedHeader = originalHeader.cloneNode(true);
            newHeaderRow.appendChild(clonedHeader);
        }
    });
    
    // Replace the header row
    headerRow.parentNode.replaceChild(newHeaderRow, headerRow);
    
    // Re-attach event listeners to new headers
    const newHeaders = newHeaderRow.querySelectorAll('.draggable-header');
    newHeaders.forEach(header => {
        header.addEventListener('dragstart', handleDragStart);
        header.addEventListener('dragend', handleDragEnd);
        header.addEventListener('dragover', handleDragOver);
        header.addEventListener('drop', handleDrop);
        header.addEventListener('dragenter', handleDragEnter);
        header.addEventListener('dragleave', handleDragLeave);
    });
    
    // Update all existing table rows to match new column order
    updateTableRows();
}

function updateTableRows() {
    const tbody = document.getElementById('entries-tbody');
    if (!tbody) return;
    
    // Get all existing rows
    const existingRows = Array.from(tbody.children);
    
    // Clear tbody
    tbody.innerHTML = '';
    
    // Recreate rows with new column order
    existingRows.forEach(row => {
        if (row.classList.contains('week-header')) {
            // Handle week header rows
            tbody.appendChild(row);
        } else {
            // Handle data rows - need to extract data and recreate with new order
            const entryId = extractEntryIdFromRow(row);
            if (entryId) {
                // Find the entry data from currentEntries
                const entry = currentEntries.find(e => e.id === entryId);
                if (entry) {
                    const newRow = createEntryRow(entry, true, null);
                    tbody.appendChild(newRow);
                } else {
                    // If entry not found, keep original row
                    tbody.appendChild(row);
                }
            } else {
                // Keep non-entry rows as is
                tbody.appendChild(row);
            }
        }
    });
}

function extractEntryIdFromRow(row) {
    const editButton = row.querySelector('button[onclick*="editEntry"]');
    if (editButton) {
        const onclick = editButton.getAttribute('onclick');
        const match = onclick.match(/editEntry\((\d+)\)/);
        return match ? parseInt(match[1]) : null;
    }
    return null;
}

// Initialize column reordering when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeColumnReordering();
});

// Count Link Handlers
function setupCountLinkHandlers() {
    // PRB count links
    const prbTotalLink = document.getElementById('prb-total-link');
    const prbActiveLink = document.getElementById('prb-active-link');
    const prbClosedLink = document.getElementById('prb-closed-link');
    
    // HIIM count links
    const hiimTotalLink = document.getElementById('hiim-total-link');
    const hiimActiveLink = document.getElementById('hiim-active-link');
    const hiimClosedLink = document.getElementById('hiim-closed-link');
    
    // Add click event listeners
    if (prbTotalLink) prbTotalLink.addEventListener('click', (e) => handleCountLinkClick(e, 'prb', 'total'));
    if (prbActiveLink) prbActiveLink.addEventListener('click', (e) => handleCountLinkClick(e, 'prb', 'active'));
    if (prbClosedLink) prbClosedLink.addEventListener('click', (e) => handleCountLinkClick(e, 'prb', 'closed'));
    
    if (hiimTotalLink) hiimTotalLink.addEventListener('click', (e) => handleCountLinkClick(e, 'hiim', 'total'));
    if (hiimActiveLink) hiimActiveLink.addEventListener('click', (e) => handleCountLinkClick(e, 'hiim', 'active'));
    if (hiimClosedLink) hiimClosedLink.addEventListener('click', (e) => handleCountLinkClick(e, 'hiim', 'closed'));
}

function handleCountLinkClick(event, type, status) {
    event.preventDefault();
    
    // Get the current application filter
    const activeAppBtn = document.querySelector('.header-app-btn.active') || document.querySelector('.filter-app-btn.active');
    const application = activeAppBtn ? activeAppBtn.getAttribute('data-app') : 'CVAR ALL';
    
    // Construct the URL based on type and status
    let url = '';
    if (type === 'prb') {
        if (status === 'total') {
            url = `https://prb.example.com/search?app=${encodeURIComponent(application)}`;
        } else if (status === 'active') {
            url = `https://prb.example.com/search?app=${encodeURIComponent(application)}&status=active`;
        } else if (status === 'closed') {
            url = `https://prb.example.com/search?app=${encodeURIComponent(application)}&status=closed`;
        }
    } else if (type === 'hiim') {
        if (status === 'total') {
            url = `https://hiim.example.com/search?app=${encodeURIComponent(application)}`;
        } else if (status === 'active') {
            url = `https://hiim.example.com/search?app=${encodeURIComponent(application)}&status=active`;
        } else if (status === 'closed') {
            url = `https://hiim.example.com/search?app=${encodeURIComponent(application)}&status=closed`;
        }
    }
    
    // Open the URL in a new tab
    if (url) {
        window.open(url, '_blank');
    }
}

// Clickable ID Handlers for table entries
function setupClickableIdHandlers() {
    // Use event delegation to handle dynamically created elements
    document.addEventListener('click', function(event) {
        // Check if the clicked element is a clickable ID
        if (event.target.classList.contains('clickable-id')) {
            event.preventDefault();
            event.stopPropagation();
            
            const link = event.target.getAttribute('data-link');
            const type = event.target.getAttribute('data-type');
            
            if (link) {
                // Open the link in a new tab
                window.open(link, '_blank');
            }
        }
    });
}

// Conditional Field Validation
function setupConditionalFieldValidation() {
    const prbIdInput = document.getElementById('entry-prb-id-number');
    const prbStatusSelect = document.getElementById('entry-prb-id-status');
    const prbLinkInput = document.getElementById('entry-prb-link');
    const prbLinkRequired = document.getElementById('prb-link-required');
    
    const hiimIdInput = document.getElementById('entry-hiim-id-number');
    const hiimStatusSelect = document.getElementById('entry-hiim-id-status');
    const hiimLinkInput = document.getElementById('entry-hiim-link');
    const hiimLinkRequired = document.getElementById('hiim-link-required');
    
    // PRB ID change handler
    if (prbIdInput) {
        prbIdInput.addEventListener('input', function() {
            const hasPrbId = this.value.trim() !== '';
            updateFieldRequirements(hasPrbId, prbStatusSelect, prbLinkInput, prbLinkRequired);
        });
    }
    
    // HIIM ID change handler
    if (hiimIdInput) {
        hiimIdInput.addEventListener('input', function() {
            const hasHiimId = this.value.trim() !== '';
            updateFieldRequirements(hasHiimId, hiimStatusSelect, hiimLinkInput, hiimLinkRequired);
        });
    }
}

function updateFieldRequirements(hasId, statusSelect, linkInput, linkRequiredIndicator) {
    if (hasId) {
        // Make status and link required when ID is provided
        statusSelect.required = true;
        linkInput.required = true;
        linkRequiredIndicator.style.display = 'inline';
        
        // Add visual styling for required fields
        statusSelect.style.borderColor = '#e53e3e';
        linkInput.style.borderColor = '#e53e3e';
    } else {
        // Make status and link optional when ID is empty
        statusSelect.required = false;
        linkInput.required = false;
        linkRequiredIndicator.style.display = 'none';
        
        // Remove visual styling for required fields
        statusSelect.style.borderColor = '';
        linkInput.style.borderColor = '';
        
        // Clear the values when ID is removed
        statusSelect.value = '';
        linkInput.value = '';
    }
}

function validateConditionalFields() {
    console.log('🔍 Validating conditional fields...');
    console.log('🔍 Current application:', filters.application);
    
    const prbIdInput = document.getElementById('entry-prb-id-number');
    const prbStatusSelect = document.getElementById('entry-prb-id-status');
    const prbLinkInput = document.getElementById('entry-prb-link');
    
    const hiimIdInput = document.getElementById('entry-hiim-id-number');
    const hiimStatusSelect = document.getElementById('entry-hiim-id-status');
    const hiimLinkInput = document.getElementById('entry-hiim-link');
    
    console.log('📋 Field values:');
    console.log('  PRB ID:', prbIdInput ? prbIdInput.value : 'element not found');
    console.log('  PRB Status:', prbStatusSelect ? prbStatusSelect.value : 'element not found');
    console.log('  PRB Link:', prbLinkInput ? prbLinkInput.value : 'element not found');
    console.log('  HIIM ID:', hiimIdInput ? hiimIdInput.value : 'element not found');
    console.log('  HIIM Status:', hiimStatusSelect ? hiimStatusSelect.value : 'element not found');
    console.log('  HIIM Link:', hiimLinkInput ? hiimLinkInput.value : 'element not found');
    
    let isValid = true;
    let errorMessage = '';
    
    // Application-specific validation
    if (filters.application === 'XVA') {
        console.log('🔍 Validating XVA-specific fields...');
        console.log('🔍 Quality fields are optional for XVA entries');
        
        // For XVA, quality fields are optional - no validation needed
        // Just clear any existing error styling
        const qualityLegacySelect = document.getElementById('entry-quality-legacy');
        const qualityTargetSelect = document.getElementById('entry-quality-target');
        
        if (qualityLegacySelect) {
            qualityLegacySelect.style.borderColor = '';
        }
        
        if (qualityTargetSelect) {
            qualityTargetSelect.style.borderColor = '';
        }
    }
    
    // Validate PRB fields
    if (prbIdInput && prbIdInput.value.trim() !== '') {
        if (!prbStatusSelect.value) {
            errorMessage += 'PRB Status is required when PRB ID is provided.\n';
            prbStatusSelect.style.borderColor = '#e53e3e';
            isValid = false;
        } else {
            prbStatusSelect.style.borderColor = '';
        }
        
        if (!prbLinkInput.value.trim()) {
            errorMessage += 'PRB Link is required when PRB ID is provided.\n';
            prbLinkInput.style.borderColor = '#e53e3e';
            isValid = false;
        } else {
            prbLinkInput.style.borderColor = '';
        }
    }
    
    // Validate HIIM fields
    if (hiimIdInput && hiimIdInput.value.trim() !== '') {
        if (!hiimStatusSelect.value) {
            errorMessage += 'HIIM Status is required when HIIM ID is provided.\n';
            hiimStatusSelect.style.borderColor = '#e53e3e';
            isValid = false;
        } else {
            hiimStatusSelect.style.borderColor = '';
        }
        
        if (!hiimLinkInput.value.trim()) {
            errorMessage += 'HIIM Link is required when HIIM ID is provided.\n';
            hiimLinkInput.style.borderColor = '#e53e3e';
            isValid = false;
        } else {
            hiimLinkInput.style.borderColor = '';
        }
    }
    
    console.log('🔍 Validation result:');
    console.log('  isValid:', isValid);
    console.log('  errorMessage:', errorMessage.trim() || 'No errors');
    
    if (!isValid) {
        console.log('❌ Validation failed, showing alert');
        alert(errorMessage.trim());
    } else {
        console.log('✅ Validation passed');
    }
    
    return isValid;
}

// Column Resizing Functionality
let isResizing = false;
let currentResizeColumn = null;
let startX = 0;
let startWidth = 0;
let resizeIndicator = null;

function initializeColumnResizing() {
    console.log('🔧 Initializing column resizing...');
    
    // Load saved column widths
    loadColumnWidths();
    
    // Add event listeners to all resize handles
    const resizeHandles = document.querySelectorAll('.column-resize-handle');
    resizeHandles.forEach(handle => {
        handle.addEventListener('mousedown', startResize);
        // Add touch support for mobile devices
        handle.addEventListener('touchstart', startResize, { passive: false });
    });
    
    // Add global event listeners
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
    // Add touch support for mobile devices
    document.addEventListener('touchmove', handleResize, { passive: false });
    document.addEventListener('touchend', stopResize);
    
    console.log('✅ Column resizing initialized');
}

function reinitializeColumnResizing() {
    console.log('🔄 Reinitializing column resizing...');
    
    // Remove existing event listeners from all resize handles
    const existingHandles = document.querySelectorAll('.column-resize-handle');
    console.log('🔍 Found', existingHandles.length, 'existing resize handles');
    existingHandles.forEach(handle => {
        handle.removeEventListener('mousedown', startResize);
        handle.removeEventListener('touchstart', startResize);
    });
    
    // Only add event listeners to visible columns
    const allHeaders = document.querySelectorAll('#entries-table thead th[data-column]');
    let visibleHandles = 0;
    
    allHeaders.forEach((header, index) => {
        const columnName = header.getAttribute('data-column');
        const isVisible = header.style.display !== 'none';
        
        if (isVisible) {
            const resizeHandle = header.querySelector('.column-resize-handle');
            if (resizeHandle) {
                console.log(`🔍 Adding listener to visible column: ${columnName}`);
                
                // Ensure the resize handle is properly positioned and visible
                resizeHandle.style.pointerEvents = 'auto';
                resizeHandle.style.zIndex = '10';
                
                resizeHandle.addEventListener('mousedown', startResize);
                resizeHandle.addEventListener('touchstart', startResize, { passive: false });
                visibleHandles++;
            } else {
                console.log(`❌ No resize handle found for visible column: ${columnName}`);
            }
        } else {
            console.log(`🔍 Skipping hidden column: ${columnName}`);
        }
    });
    
    console.log('✅ Column resizing reinitialized for', visibleHandles, 'visible handles');
}

// Debug function to test column resizing - call from browser console

function startResize(e) {
    console.log('🖱️ startResize called on:', e.target);
    e.preventDefault();
    e.stopPropagation();
    
    isResizing = true;
    currentResizeColumn = e.target.closest('th');
    
    if (!currentResizeColumn) {
        console.error('❌ Could not find column header for resize handle');
        return;
    }
    
    // Handle both mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    startX = clientX;
    startWidth = currentResizeColumn.offsetWidth;
    
    // Add resizing class
    currentResizeColumn.classList.add('resizing');
    
    // Create resize indicator
    createResizeIndicator();
    
    // Prevent text selection during resize
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    
    console.log('🔄 Started resizing column:', currentResizeColumn.dataset.column, 'Width:', startWidth);
}

function handleResize(e) {
    if (!isResizing || !currentResizeColumn) return;
    
    e.preventDefault();
    
    // Handle both mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - startX;
    const newWidth = Math.max(80, Math.min(400, startWidth + deltaX));
    
    console.log('📏 Resizing to width:', newWidth);
    
    // Update column width
    currentResizeColumn.style.width = newWidth + 'px';
    
    // Update all cells in this column using data-column attribute
    const columnName = currentResizeColumn.getAttribute('data-column');
    const allRows = document.querySelectorAll('#entries-table tr');
    
    allRows.forEach(row => {
        // Find the cell that corresponds to this column
        const cells = row.querySelectorAll('td');
        const headers = document.querySelectorAll('#entries-table thead th[data-column]');
        
        // Find the index of our column in the visible headers
        let columnIndex = -1;
        headers.forEach((header, index) => {
            if (header.getAttribute('data-column') === columnName && header.style.display !== 'none') {
                columnIndex = index;
            }
        });
        
        if (columnIndex >= 0 && cells[columnIndex]) {
            cells[columnIndex].style.width = newWidth + 'px';
        }
    });
    
    // Update resize indicator position
    updateResizeIndicator(clientX);
    
    // Force a layout refresh to ensure the width changes are visible
    currentResizeColumn.offsetHeight;
}

function stopResize(e) {
    if (!isResizing) return;
    
    isResizing = false;
    
    if (currentResizeColumn) {
        // Remove resizing class
        currentResizeColumn.classList.remove('resizing');
        
        // Save column width
        saveColumnWidth(currentResizeColumn.dataset.column, currentResizeColumn.offsetWidth);
        
        console.log('✅ Finished resizing column:', currentResizeColumn.dataset.column, 'Width:', currentResizeColumn.offsetWidth);
        
        currentResizeColumn = null;
    }
    
    // Remove resize indicator
    removeResizeIndicator();
    
    // Restore normal cursor and text selection
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
}

function createResizeIndicator() {
    if (resizeIndicator) return;
    
    resizeIndicator = document.createElement('div');
    resizeIndicator.className = 'resize-indicator';
    resizeIndicator.style.position = 'fixed';
    resizeIndicator.style.pointerEvents = 'none';
    resizeIndicator.style.zIndex = '1000';
    document.body.appendChild(resizeIndicator);
}

function updateResizeIndicator(x) {
    if (!resizeIndicator) return;
    
    resizeIndicator.style.left = x + 'px';
    resizeIndicator.style.top = '0px';
    resizeIndicator.style.height = '100vh';
    resizeIndicator.style.display = 'block';
}

function removeResizeIndicator() {
    if (resizeIndicator) {
        resizeIndicator.remove();
        resizeIndicator = null;
    }
}

function saveColumnWidth(columnName, width) {
    try {
        const savedWidths = JSON.parse(localStorage.getItem('columnWidths') || '{}');
        savedWidths[columnName] = width;
        localStorage.setItem('columnWidths', JSON.stringify(savedWidths));
        console.log('💾 Saved width for column', columnName, ':', width);
    } catch (error) {
        console.error('❌ Error saving column width:', error);
    }
}

function loadColumnWidths() {
    try {
        const savedWidths = JSON.parse(localStorage.getItem('columnWidths') || '{}');
        console.log('📂 Loading saved column widths:', savedWidths);
        
        Object.entries(savedWidths).forEach(([columnName, width]) => {
            const column = document.querySelector(`th[data-column="${columnName}"]`);
            if (column && column.style.display !== 'none') {
                column.style.width = width + 'px';
                
                // Apply width to all cells in this column using improved logic
                const allRows = document.querySelectorAll('#entries-table tr');
                const headers = document.querySelectorAll('#entries-table thead th[data-column]');
                
                // Find the index of this column in the visible headers
                let columnIndex = -1;
                headers.forEach((header, index) => {
                    if (header.getAttribute('data-column') === columnName && header.style.display !== 'none') {
                        columnIndex = index;
                    }
                });
                
                if (columnIndex >= 0) {
                    allRows.forEach(row => {
                        const cells = row.querySelectorAll('td');
                        if (cells[columnIndex]) {
                            cells[columnIndex].style.width = width + 'px';
                        }
                    });
                }
                
                console.log('✅ Applied width to column', columnName, ':', width);
            }
        });
    } catch (error) {
        console.error('❌ Error loading column widths:', error);
    }
}

// Search functionality
function performSearch() {
    const searchTerm = freeSearchInput.value.trim().toLowerCase();
    
    if (searchTerm === '') {
        // Show all rows if search is empty
        showAllRows();
        return;
    }
    
    console.log('🔍 Performing search for:', searchTerm);
    
    const tableRows = document.querySelectorAll('#entries-table tbody tr');
    let visibleRowCount = 0;
    
    // Hide all week headers during search using CSS class
    const weekHeaders = document.querySelectorAll('#entries-table tbody tr.week-header');
    weekHeaders.forEach(header => {
        header.classList.add('search-hidden');
    });
    
    tableRows.forEach(row => {
        // Skip week header rows - they're already hidden
        if (row.classList.contains('week-header')) {
            return;
        }
        
        const isParentRow = !row.classList.contains('child-row');
        const isChildRow = row.classList.contains('child-row');
        let shouldShow = false;
        
        // Get all text content from the row
        const rowText = row.textContent.toLowerCase();
        
        // Check if search term matches any content in the row
        if (rowText.includes(searchTerm)) {
            shouldShow = true;
        }
        
        if (shouldShow) {
            row.style.display = '';
            row.classList.remove('hidden');
            visibleRowCount++;
            
            // If this is a child row that matches, also show its parent
            if (isChildRow) {
                const parentId = row.getAttribute('data-parent-id');
                if (parentId) {
                    const parentRow = document.querySelector(`tr[id="${parentId}"]`);
                    if (parentRow) {
                        parentRow.style.display = '';
                        parentRow.classList.remove('hidden');
                    }
                }
            }
            
            // If this is a parent row that matches, show all its children
            if (isParentRow) {
                const rowId = row.getAttribute('id');
                if (rowId) {
                    const childRows = document.querySelectorAll(`tr[data-parent-id="${rowId}"]`);
                    childRows.forEach(childRow => {
                        childRow.style.display = '';
                        childRow.classList.remove('hidden');
                        visibleRowCount++;
                    });
                }
            }
        } else {
            row.style.display = 'none';
        }
    });
    
    console.log('🔍 Search complete. Visible rows:', visibleRowCount, '(Week headers hidden during search)');
}

function showAllRows() {
    console.log('🔍 Showing all rows');
    
    const tableRows = document.querySelectorAll('#entries-table tbody tr');
    
    tableRows.forEach(row => {
        // Handle week header rows - show them all and remove search-hidden class
        if (row.classList.contains('week-header')) {
            row.style.display = '';
            row.classList.remove('search-hidden');
            return;
        }
        
        const isChildRow = row.classList.contains('child-row');
        
        if (isChildRow) {
            // Child rows should be hidden by default unless parent is expanded
            row.style.display = 'none';
            if (!row.classList.contains('hidden')) {
                row.classList.add('hidden');
            }
        } else {
            // Parent rows should be visible
            row.style.display = '';
            row.classList.remove('hidden');
        }
    });
}

function updateWeekHeadersVisibility() {
    const weekHeaders = document.querySelectorAll('#entries-table tbody tr.week-header');
    
    weekHeaders.forEach(header => {
        // Find the next sibling rows until we hit another week header
        let hasVisibleEntries = false;
        let nextSibling = header.nextElementSibling;
        
        while (nextSibling && !nextSibling.classList.contains('week-header')) {
            if (nextSibling.style.display !== 'none') {
                hasVisibleEntries = true;
                break;
            }
            nextSibling = nextSibling.nextElementSibling;
        }
        
        // Show/hide week header based on whether it has visible entries
        header.style.display = hasVisibleEntries ? '' : 'none';
    });
}

function clearSearch() {
    console.log('🔍 Clearing search');
    freeSearchInput.value = '';
    showAllRows();
}

// Excel download function
async function downloadExcel() {
    if (!isAuthenticated) {
        alert('Please authenticate first to download data.');
        return;
    }
    
    try {
        // Show loading state (using text for loading)
        const originalHTML = downloadExcelBtn.innerHTML;
        downloadExcelBtn.innerHTML = '<span style="font-size: 12px;">Loading...</span>';
        downloadExcelBtn.disabled = true;
        
        // Build query parameters with current filters
        const params = new URLSearchParams();
        params.append('application', filters.application);
        
        if (filters.startDate && filters.startDate.value) {
            params.append('start_date', filters.startDate.value);
        }
        if (filters.endDate && filters.endDate.value) {
            params.append('end_date', filters.endDate.value);
        }
        
        const response = await fetch(`/api/download/excel?${params.toString()}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to download Excel file');
        }
        
        // Get the blob from the response
        const blob = await response.blob();
        
        // Get filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get('content-disposition');
        let filename = 'ProdVision_Dashboard_Data.xlsx';
        if (contentDisposition && contentDisposition.includes('filename=')) {
            filename = contentDisposition.split('filename=')[1].replace(/['"]/g, '');
        }
        
        // Create blob URL and trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
    } catch (error) {
        console.error('Error downloading Excel:', error);
        alert('Failed to download Excel file: ' + error.message);
    } finally {
        // Restore button state
        downloadExcelBtn.innerHTML = originalHTML;
        downloadExcelBtn.disabled = false;
    }
}


