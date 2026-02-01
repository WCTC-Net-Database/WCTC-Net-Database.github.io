// Dashboard JavaScript
let allStudents = [];
let studentAssignments = {}; // Track all assignments per student (from history)
let currentFilter = 'all';
let currentAssignmentFilter = 'all';
let currentDateFilter = { start: null, end: null };
let availableAssignments = [];

// Load current state (all students, deduplicated) and history for assignment badges
async function loadCurrentData() {
    try {
        const response = await fetch('data/current.json');
        const data = await response.json();

        if (data.generated) {
            document.getElementById('last-updated').textContent = `Last updated: ${formatDate(data.generated)}`;
        }

        allStudents = data.students || [];

        // Initialize assignment tracking from current data
        allStudents.forEach(s => {
            const key = s.name.toLowerCase();
            if (!studentAssignments[key]) {
                studentAssignments[key] = new Set();
            }
            if (s.assignmentPattern) {
                studentAssignments[key].add(s.assignmentPattern);
            }
        });

        // Load history to get all assignments per student
        try {
            const historyResponse = await fetch('data/history.json');
            const historyData = await historyResponse.json();

            if (historyData.snapshots) {
                for (const snapshot of historyData.snapshots) {
                    const snapshotAssignment = snapshot.assignment;
                    for (const student of snapshot.students || []) {
                        const key = student.name.toLowerCase();
                        const pattern = student.assignmentPattern || snapshotAssignment;
                        if (!studentAssignments[key]) {
                            studentAssignments[key] = new Set();
                        }
                        if (pattern) {
                            studentAssignments[key].add(pattern);
                        }
                    }
                }
            }
        } catch (e) {
            console.log('No history data available');
        }

        // Extract unique assignment patterns for filter (from all sources)
        const allPatterns = new Set();
        allStudents.forEach(s => s.assignmentPattern && allPatterns.add(s.assignmentPattern));
        Object.values(studentAssignments).forEach(set => set.forEach(p => allPatterns.add(p)));
        availableAssignments = Array.from(allPatterns).sort();

        populateAssignmentFilter();
        applyFiltersAndRender();
    } catch (error) {
        console.error('Failed to load current data:', error);
        // Fallback to loading assignments the old way
        loadAssignments();
    }
}

// Populate assignment filter dropdown
function populateAssignmentFilter() {
    const select = document.getElementById('assignment-select');
    select.innerHTML = '<option value="all">All Assignments</option>';

    availableAssignments.forEach(pattern => {
        const option = document.createElement('option');
        option.value = pattern;
        const name = pattern.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        option.textContent = name;
        select.appendChild(option);
    });
}

// Fallback: Load assignments the old way
async function loadAssignments() {
    try {
        const response = await fetch('data/assignments.json');
        const data = await response.json();

        const select = document.getElementById('assignment-select');
        select.innerHTML = '<option value="all">All Assignments</option>';

        if (data.assignments && data.assignments.length > 0) {
            availableAssignments = data.assignments.map(a => a.pattern);
            data.assignments.forEach(assignment => {
                const option = document.createElement('option');
                option.value = assignment.pattern;
                option.textContent = assignment.name;
                select.appendChild(option);
            });

            // Load first assignment data
            loadAssignmentData(data.assignments[0].pattern);
        } else {
            showNoData();
        }
    } catch (error) {
        console.error('Failed to load assignments:', error);
        showNoData();
    }
}

// Load data for a specific assignment (for backward compatibility)
async function loadAssignmentData(pattern) {
    try {
        const response = await fetch(`data/${pattern}.json`);
        const data = await response.json();

        if (data.generated) {
            document.getElementById('last-updated').textContent = `Last updated: ${formatDate(data.generated)}`;
        }

        // Add assignmentPattern to each student for consistency
        allStudents = (data.students || []).map(s => ({
            ...s,
            assignmentPattern: pattern
        }));

        applyFiltersAndRender();
    } catch (error) {
        console.error('Failed to load assignment data:', error);
        showNoData();
    }
}

// Format date for display
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString();
}

// Filter students by date
function filterByDate(students) {
    if (!currentDateFilter.start && !currentDateFilter.end) {
        return students;
    }

    return students.filter(s => {
        if (!s.submittedAt) return true;
        const date = new Date(s.submittedAt);
        if (currentDateFilter.start && date < currentDateFilter.start) return false;
        if (currentDateFilter.end && date > currentDateFilter.end) return false;
        return true;
    });
}

// Filter students by assignment
function filterByAssignment(students) {
    if (currentAssignmentFilter === 'all') {
        return students;
    }
    return students.filter(s => s.assignmentPattern === currentAssignmentFilter);
}

// Filter students based on status criteria
function filterByStatus(students, filter) {
    switch (filter) {
        case 'failed':
            return students.filter(s => s.build?.status === 'failure');
        case 'review':
            return students.filter(s => s.needsReview);
        case 'stretch':
            return students.filter(s => s.hasStretch);
        default:
            return students;
    }
}

// Apply all filters and render
function applyFiltersAndRender() {
    let filtered = allStudents;
    filtered = filterByDate(filtered);
    filtered = filterByAssignment(filtered);
    filtered = filterByStatus(filtered, currentFilter);

    updateSummary(filtered);
    renderStudents(filtered);
}

// Update summary cards
function updateSummary(students) {
    const total = students.length;
    const passed = students.filter(s => s.build?.status === 'success').length;
    const failed = students.filter(s => s.build?.status === 'failure').length;
    const needsReview = students.filter(s => s.needsReview).length;
    const hasStretch = students.filter(s => s.hasStretch).length;

    const scores = students.map(s => s.estimatedScore || 0).filter(s => s > 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : '-';

    document.getElementById('total-count').textContent = total;
    document.getElementById('passed-count').textContent = passed;
    document.getElementById('failed-count').textContent = failed;
    document.getElementById('review-count').textContent = needsReview;
    document.getElementById('stretch-count').textContent = hasStretch;
    document.getElementById('avg-score').textContent = avgScore;
}

// Render student cards
function renderStudents(students) {
    const container = document.getElementById('students-container');

    if (students.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-inbox fa-3x text-muted"></i>
                <p class="mt-3 text-muted">No students match the current filters</p>
            </div>
        `;
        return;
    }

    // Sort: needs review first, then failed builds, then by score descending
    students.sort((a, b) => {
        if (a.needsReview !== b.needsReview) return b.needsReview - a.needsReview;
        if (a.build?.status === 'failure' && b.build?.status !== 'failure') return -1;
        if (b.build?.status === 'failure' && a.build?.status !== 'failure') return 1;
        return (b.estimatedScore || 0) - (a.estimatedScore || 0);
    });

    container.innerHTML = students.map((student, index) => renderStudentCard(student, index)).join('');
}

// Render a single student card
function renderStudentCard(student, index) {
    const buildStatus = student.build?.status || 'unknown';
    const buildIcon = buildStatus === 'success' ? 'check' : buildStatus === 'failure' ? 'times' : 'question';
    const buildClass = buildStatus === 'success' ? 'pass' : buildStatus === 'failure' ? 'fail' : 'unknown';

    let cardClass = 'student-card';
    if (student.build?.status === 'failure') cardClass += ' build-failed';
    else if (student.needsReview) cardClass += ' needs-review';
    else if (student.hasStretch) cardClass += ' has-stretch';

    const todoClass = student.todoCount === 0 ? 'todo-0' : student.todoCount <= 3 ? 'todo-low' : 'todo-high';

    const maintainability = student.sonar?.maintainability || '-';
    const maintClass = maintainability !== '-' ? `rating-${maintainability}` : '';

    // Check if there are details to show
    const hasComments = student.comments && student.comments.length > 0;
    const hasTodos = student.todos && student.todos.length > 0;
    const hasStretchDetails = student.stretchGoals && student.stretchGoals.length > 0;
    const hasSonarDetails = student.sonar && (student.sonar.bugs || student.sonar.vulnerabilities || student.sonar.reliability);
    const hasNotes = student.notes && student.notes.length > 0;
    const hasDetails = hasComments || hasTodos || hasStretchDetails || hasSonarDetails || hasNotes;

    const collapseId = `details-${index}`;

    // Format assignment badges (all assignments from history)
    const studentKey = student.name.toLowerCase();
    const assignments = studentAssignments[studentKey]
        ? Array.from(studentAssignments[studentKey]).sort()
        : (student.assignmentPattern ? [student.assignmentPattern] : []);
    const assignmentBadges = assignments.map(a => {
        const abbrev = a.replace('w', 'W').replace(/-.*/, ''); // e.g., "w1-file-i-o" -> "W1"
        return `<span class="badge badge-info mr-1" title="${a}">${abbrev}</span>`;
    }).join('');

    // Format submission date
    const submittedDate = student.submittedAt
        ? new Date(student.submittedAt).toLocaleDateString()
        : '';

    return `
        <div class="col-md-6 col-lg-4">
            <div class="card ${cardClass}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title mb-0">
                            <span class="status-badge status-${buildClass}"></span>
                            ${student.name}
                        </h5>
                        <span class="badge badge-secondary">${student.estimatedScore || '-'}%</span>
                    </div>

                    <div class="mb-2">
                        ${assignmentBadges}
                        ${submittedDate ? `<small class="text-muted ml-2">${submittedDate}</small>` : ''}
                    </div>

                    <div class="row mb-2">
                        <div class="col-6">
                            <div class="metric-label">Build</div>
                            <div class="metric-value">
                                <i class="fas fa-${buildIcon}-circle text-${buildStatus === 'success' ? 'success' : buildStatus === 'failure' ? 'danger' : 'secondary'}"></i>
                                ${buildStatus === 'success' ? 'Passed' : buildStatus === 'failure' ? 'Failed' : 'Unknown'}
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="metric-label">Maintainability</div>
                            <div class="metric-value">
                                ${maintainability !== '-' ? `<span class="rating-badge ${maintClass}">${maintainability}</span>` : '-'}
                            </div>
                        </div>
                    </div>

                    <div class="row mb-2">
                        <div class="col-6">
                            <div class="metric-label">TODOs</div>
                            <div class="metric-value">
                                <span class="todo-count ${todoClass}">${student.todoCount ?? '-'}</span>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="metric-label">Code Smells</div>
                            <div class="metric-value">${student.sonar?.codeSmells ?? '-'}</div>
                        </div>
                    </div>

                    <div class="mt-3">
                        ${student.hasStretch ? `<span class="stretch-badge"><i class="fas fa-star"></i> Stretch Goal</span> ` : ''}
                        ${(student.studentComments > 0 || hasComments) ? `<span class="attention-badge"><i class="fas fa-comment"></i> ${student.studentComments || student.comments?.length || 0} comment(s)</span>` : ''}
                    </div>

                    <!-- Action buttons -->
                    <div class="mt-3 d-flex flex-wrap gap-1">
                        ${hasDetails ? `
                        <button class="btn btn-sm btn-outline-primary" type="button" data-toggle="collapse" data-target="#${collapseId}" aria-expanded="false">
                            <i class="fas fa-chevron-down"></i> Details
                        </button>
                        ` : ''}
                        ${student.build?.url ? `
                        <a href="${student.build.url}" target="_blank" class="btn btn-sm btn-outline-secondary">
                            <i class="fas fa-external-link-alt"></i> Build
                        </a>
                        ` : ''}
                        <a href="https://github.com/WCTC-Net-Database/${student.repo}" target="_blank" class="btn btn-sm btn-outline-secondary">
                            <i class="fab fa-github"></i> Repo
                        </a>
                        ${student.sonar?.projectKey ? `
                        <a href="https://sonarcloud.io/project/overview?id=${student.sonar.projectKey}" target="_blank" class="btn btn-sm btn-outline-secondary">
                            <i class="fas fa-chart-bar"></i> Sonar
                        </a>
                        ` : ''}
                    </div>

                    <!-- Expandable Details Section -->
                    ${hasDetails ? `
                    <div class="collapse mt-3" id="${collapseId}">
                        <div class="details-section">
                            ${renderDetailsSection(student)}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// Render the expandable details section
function renderDetailsSection(student) {
    let html = '';

    // Student Comments
    if (student.comments && student.comments.length > 0) {
        html += `
            <div class="detail-group">
                <div class="detail-header"><i class="fas fa-comment text-warning"></i> Student Comments</div>
                <div class="detail-content">
                    ${student.comments.map(c => `
                        <div class="comment-item">
                            <div class="comment-location"><code>${c.file}:${c.line}</code></div>
                            <div class="comment-text">${escapeHtml(c.text)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // TODO Locations
    if (student.todos && student.todos.length > 0) {
        html += `
            <div class="detail-group">
                <div class="detail-header"><i class="fas fa-list-check text-info"></i> TODO Locations</div>
                <div class="detail-content">
                    <ul class="todo-list">
                        ${student.todos.slice(0, 10).map(t => `<li><code>${t}</code></li>`).join('')}
                        ${student.todos.length > 10 ? `<li class="text-muted">...and ${student.todos.length - 10} more</li>` : ''}
                    </ul>
                </div>
            </div>
        `;
    }

    // Stretch Goals
    if (student.stretchGoals && student.stretchGoals.length > 0) {
        html += `
            <div class="detail-group">
                <div class="detail-header"><i class="fas fa-star text-success"></i> Stretch Goals Achieved</div>
                <div class="detail-content">
                    <ul class="stretch-list">
                        ${student.stretchGoals.map(g => `<li>${escapeHtml(g)}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    // SonarCloud Details
    if (student.sonar && (student.sonar.bugs || student.sonar.vulnerabilities || student.sonar.reliability || student.sonar.security)) {
        html += `
            <div class="detail-group">
                <div class="detail-header"><i class="fas fa-chart-bar text-primary"></i> SonarCloud Details</div>
                <div class="detail-content">
                    <div class="row">
                        ${student.sonar.bugs !== undefined ? `<div class="col-6"><strong>Bugs:</strong> ${student.sonar.bugs}</div>` : ''}
                        ${student.sonar.vulnerabilities !== undefined ? `<div class="col-6"><strong>Vulnerabilities:</strong> ${student.sonar.vulnerabilities}</div>` : ''}
                        ${student.sonar.reliability ? `<div class="col-6"><strong>Reliability:</strong> <span class="rating-badge rating-${student.sonar.reliability}">${student.sonar.reliability}</span></div>` : ''}
                        ${student.sonar.security ? `<div class="col-6"><strong>Security:</strong> <span class="rating-badge rating-${student.sonar.security}">${student.sonar.security}</span></div>` : ''}
                        ${student.sonar.duplication !== undefined ? `<div class="col-6"><strong>Duplication:</strong> ${student.sonar.duplication}%</div>` : ''}
                        ${student.sonar.linesOfCode !== undefined ? `<div class="col-6"><strong>Lines of Code:</strong> ${student.sonar.linesOfCode}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // Grading Notes
    if (student.notes && student.notes.length > 0) {
        html += `
            <div class="detail-group">
                <div class="detail-header"><i class="fas fa-clipboard-list text-secondary"></i> Grading Notes</div>
                <div class="detail-content">
                    <ul class="notes-list">
                        ${student.notes.map(n => `<li>${escapeHtml(n)}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    return html || '<p class="text-muted">No additional details available.</p>';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show no data message
function showNoData() {
    document.getElementById('students-container').innerHTML = `
        <div class="col-12 text-center py-5">
            <i class="fas fa-database fa-3x text-muted"></i>
            <p class="mt-3 text-muted">No dashboard data available yet.<br>Run the update workflow to generate data.</p>
        </div>
    `;

    ['total', 'passed', 'failed', 'review', 'stretch'].forEach(id => {
        document.getElementById(`${id}-count`).textContent = '-';
    });
    document.getElementById('avg-score').textContent = '-';
}

// Update date filter
function updateDateFilter() {
    const startInput = document.getElementById('start-date');
    const endInput = document.getElementById('end-date');

    currentDateFilter.start = startInput.value ? new Date(startInput.value) : null;
    currentDateFilter.end = endInput.value ? new Date(endInput.value + 'T23:59:59') : null;

    applyFiltersAndRender();
}

// Set date preset
function setDatePreset(days) {
    const startInput = document.getElementById('start-date');
    const endInput = document.getElementById('end-date');

    if (days === 0) {
        startInput.value = '';
        endInput.value = '';
    } else {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);

        startInput.value = start.toISOString().split('T')[0];
        endInput.value = end.toISOString().split('T')[0];
    }

    updateDateFilter();
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load current data (all students, deduplicated)
    loadCurrentData();

    // Assignment filter change
    document.getElementById('assignment-select').addEventListener('change', (e) => {
        currentAssignmentFilter = e.target.value;
        applyFiltersAndRender();
    });

    // Status filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            applyFiltersAndRender();
        });
    });

    // Date preset buttons
    document.querySelectorAll('.date-preset').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.date-preset').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            setDatePreset(parseInt(e.target.dataset.days));
        });
    });

    // Date input changes
    document.getElementById('start-date')?.addEventListener('change', () => {
        document.querySelectorAll('.date-preset').forEach(b => b.classList.remove('active'));
        updateDateFilter();
    });
    document.getElementById('end-date')?.addEventListener('change', () => {
        document.querySelectorAll('.date-preset').forEach(b => b.classList.remove('active'));
        updateDateFilter();
    });
});
