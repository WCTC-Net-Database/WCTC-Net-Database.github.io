// Dashboard JavaScript
let allStudents = [];
let renderedStudents = []; // Currently displayed students (after filter/sort)
let studentAssignments = {}; // Track all assignments per student (from history)
let studentEntries = {}; // studentKey -> { assignmentPattern -> studentData } for badge switching
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

        // Initialize assignment tracking and per-entry lookup from current data
        allStudents.forEach(s => {
            const key = s.name.toLowerCase();
            if (!studentAssignments[key]) {
                studentAssignments[key] = new Set();
            }
            if (s.assignmentPattern) {
                studentAssignments[key].add(s.assignmentPattern);
            }
            // Build per-student per-assignment lookup for badge switching
            if (!studentEntries[key]) studentEntries[key] = {};
            if (s.assignmentPattern) {
                studentEntries[key][s.assignmentPattern] = s;
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
// "All" view: deduplicate to one card per student (most recently pushed repo = their active work)
// Assignment view: show all entries for that pattern (teacher checks Canvas for which repo matters)
function filterByAssignment(students) {
    if (currentAssignmentFilter === 'all') {
        // Deduplicate: one card per student, keep most recently pushed
        const byStudent = {};
        for (const s of students) {
            const key = s.name.toLowerCase();
            if (!byStudent[key] || (s.pushedAt && s.pushedAt > (byStudent[key].pushedAt || ''))) {
                byStudent[key] = s;
            }
        }
        return Object.values(byStudent);
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
        case 'template':
            return students.filter(s => s.isTemplateOnly || s.studentCommitCount === 0);
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

    // Sort: template-only first, then needs review, then failed builds, then by score descending
    students.sort((a, b) => {
        const aTemplate = a.isTemplateOnly || a.studentCommitCount === 0;
        const bTemplate = b.isTemplateOnly || b.studentCommitCount === 0;
        if (aTemplate !== bTemplate) return bTemplate - aTemplate;
        if (a.needsReview !== b.needsReview) return b.needsReview - a.needsReview;
        if (a.build?.status === 'failure' && b.build?.status !== 'failure') return -1;
        if (b.build?.status === 'failure' && a.build?.status !== 'failure') return 1;
        return (b.estimatedScore || 0) - (a.estimatedScore || 0);
    });

    // Store rendered list so copyFeedback can reference the correct student
    renderedStudents = students;

    container.innerHTML = students.map((student, index) => renderStudentCard(student, index)).join('');
}

// Render a single student card
function renderStudentCard(student, index) {
    const buildStatus = student.build?.status || 'unknown';
    const buildIcon = buildStatus === 'success' ? 'check' : buildStatus === 'failure' ? 'times' : 'question';
    const buildClass = buildStatus === 'success' ? 'pass' : buildStatus === 'failure' ? 'fail' : 'unknown';

    const isTemplate = student.isTemplateOnly || student.studentCommitCount === 0;

    let cardClass = 'student-card';
    if (isTemplate) cardClass += ' template-only';
    else if (student.build?.status === 'failure') cardClass += ' build-failed';
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
        const isViewing = (a === student.assignmentPattern);
        const badgeClass = isViewing ? 'badge badge-primary badge-active mr-1' : 'badge badge-info badge-clickable mr-1';
        const onclick = isViewing ? '' : ` onclick="switchAssignment('${studentKey}', '${a}', ${index})"`;
        return `<span class="${badgeClass}" title="${a}"${onclick}>${abbrev}</span>`;
    }).join('');

    // Format submission date
    const submittedDate = student.submittedAt
        ? new Date(student.submittedAt).toLocaleDateString()
        : '';

    return `
        <div class="col-md-6 col-lg-4" id="card-${studentKey}">
            <div class="card ${cardClass}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title mb-0">
                            <span class="status-badge status-${buildClass}"></span>
                            ${student.name}
                        </h5>
                        ${isTemplate
                            ? '<span class="template-badge">Template Only</span>'
                            : `<span class="badge badge-secondary">${student.estimatedScore || '-'}%</span>`}
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
                            <div class="metric-value">${student.sonar?.projectKey && student.sonar?.codeSmells !== undefined ? `<a href="https://sonarcloud.io/project/issues?id=${student.sonar.projectKey}&types=CODE_SMELL" target="_blank" title="View code smells in SonarCloud">${student.sonar.codeSmells}</a>` : (student.sonar?.codeSmells ?? '-')}</div>
                        </div>
                    </div>

                    <div class="mt-3">
                        ${isTemplate ? `<span class="template-badge"><i class="fas fa-exclamation-circle"></i> No Student Work</span> ` : ''}
                        ${student.hasStretch ? `<span class="stretch-badge"><i class="fas fa-star"></i> Stretch Goal</span> ` : ''}
                        ${(student.studentComments > 0 || hasComments) ? `<span class="attention-badge"><i class="fas fa-comment"></i> ${student.studentComments || student.comments?.length || 0} comment(s)</span>` : ''}
                    </div>

                    <!-- Action buttons -->
                    <div class="mt-3 d-flex flex-wrap gap-1">
                        <button class="btn btn-sm btn-outline-primary" type="button" data-toggle="collapse" data-target="#${collapseId}" aria-expanded="false">
                            <i class="fas fa-chevron-down"></i> Details & Feedback
                        </button>
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

                    <!-- Expandable Details Section (always show for feedback) -->
                    <div class="collapse mt-3" id="${collapseId}">
                        <div class="details-section">
                            ${renderDetailsSection(student, index)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Render the expandable details section
function renderDetailsSection(student, index) {
    let html = '';

    // Build Errors (show at top for visibility)
    if (student.build?.status === 'failure' && (student.build?.errorStep || (student.build?.errorLines && student.build.errorLines.length > 0))) {
        html += `
            <div class="detail-group">
                <div class="detail-header"><i class="fas fa-exclamation-triangle text-danger"></i> Build Error Details</div>
                <div class="detail-content">
                    ${student.build.errorStep ? `<div class="mb-2"><strong>Failed Step:</strong> ${escapeHtml(student.build.errorStep)}</div>` : ''}
                    ${student.build.errorLines && student.build.errorLines.length > 0 ? `
                        <pre class="build-error-log">${student.build.errorLines.map(l => escapeHtml(l)).join('\n')}</pre>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Generated Feedback (always show)
    const feedback = generateFeedback(student);
    html += `
        <div class="detail-group">
            <div class="detail-header d-flex justify-content-between align-items-center">
                <span><i class="fas fa-clipboard-check text-primary"></i> Generated Feedback</span>
                <button id="copy-btn-${index}" class="btn btn-sm btn-outline-primary" onclick="copyFeedback(${index})">
                    <i class="fas fa-copy"></i> Copy
                </button>
            </div>
            <div class="detail-content">
                <pre class="feedback-text mb-0" style="white-space: pre-wrap; font-family: inherit; font-size: 0.9em; background: #f8f9fa; padding: 10px; border-radius: 4px;">${escapeHtml(feedback)}</pre>
            </div>
        </div>
    `;

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

    // Stretch Goals (with credit tracking)
    if (student.stretchGoals && student.stretchGoals.length > 0) {
        const goalItems = student.stretchGoals.map(goalId => {
            const goal = STRETCH_GOALS[goalId] || { name: goalId, week: '?', desc: '' };
            const credited = isStretchCredited(student.name, goalId);
            return `
                <div class="stretch-goal-item d-flex align-items-center mb-2">
                    <label class="mb-0 d-flex align-items-center" title="Check to mark credit given for this stretch goal">
                        <input type="checkbox" class="mr-2" ${credited ? 'checked' : ''}
                            onchange="toggleStretchCredit('${student.name}', '${goalId}', this)">
                        <span class="badge badge-success mr-2">${goal.week}</span>
                        <strong>${escapeHtml(goal.name)}</strong>
                        ${credited ? '<span class="ml-2 text-success small"><i class="fas fa-check"></i> credited</span>' : ''}
                    </label>
                </div>
            `;
        }).join('');
        html += `
            <div class="detail-group">
                <div class="detail-header"><i class="fas fa-star text-success"></i> Stretch Goals Detected</div>
                <div class="detail-content">${goalItems}</div>
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
                        ${student.sonar.bugs !== undefined ? `<div class="col-6"><strong>Bugs:</strong> <a href="https://sonarcloud.io/project/issues?id=${student.sonar.projectKey}&types=BUG" target="_blank" title="View bugs in SonarCloud">${student.sonar.bugs}</a></div>` : ''}
                        ${student.sonar.vulnerabilities !== undefined ? `<div class="col-6"><strong>Vulnerabilities:</strong> <a href="https://sonarcloud.io/project/issues?id=${student.sonar.projectKey}&types=VULNERABILITY" target="_blank" title="View vulnerabilities in SonarCloud">${student.sonar.vulnerabilities}</a></div>` : ''}
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

// Stretch goal definitions (id -> display info)
const STRETCH_GOALS = {
    'CsvHelper':        { name: 'CsvHelper Library', week: 'W1-W2', desc: 'Use CsvHelper NuGet package for CSV handling' },
    'Spectre.Console':  { name: 'Spectre.Console', week: 'W3', desc: 'Use Spectre.Console for enhanced console output' },
    'JsonFileHandler':  { name: 'JSON File Handler', week: 'W4', desc: 'Implement runtime CSV/JSON format switching' },
    'CommandPattern':   { name: 'Command Pattern', week: 'W5', desc: 'Implement ICommand interface with Execute()' },
    'ExtraCharacters':  { name: 'Extra Characters', week: 'W6', desc: 'Add 2+ additional character classes' },
    'ItemCombat':       { name: 'Item Combat', week: 'W8', desc: 'Implement item-driven combat system' },
    'EFCoreUpdate':     { name: 'EF Core Update', week: 'W9', desc: 'Find and update characters via EF Core' }
};

// Stretch goal suggested per assignment (for feedback when none detected)
const stretchGoalDescriptions = {
    'w1-file-i-o': 'Use the CsvHelper NuGet package for file operations',
    'w2-csv-parsing': 'Use CsvHelper library for robust CSV handling',
    'w3-srp-linq': 'Use Spectre.Console for enhanced console output',
    'w4-ocp-interfaces': 'Implement runtime CSV/JSON format switching',
    'w5-lsp-isp': 'Implement the Command Pattern (ICommand)',
    'w6-dip-abstractions': 'Add 2+ additional character classes',
    'w7-midterm-prep': 'Complete all SOLID principle implementations',
    'w8-midterm': 'Implement item-driven combat or consumable items',
    'w9-efcore-intro': 'Find and update characters via EF Core'
};

// localStorage helpers for stretch goal credit tracking
function isStretchCredited(studentName, goalId) {
    return localStorage.getItem(`stretch-credit:${studentName.toLowerCase()}:${goalId}`) === 'true';
}

function setStretchCredit(studentName, goalId, credited) {
    const key = `stretch-credit:${studentName.toLowerCase()}:${goalId}`;
    if (credited) {
        localStorage.setItem(key, 'true');
    } else {
        localStorage.removeItem(key);
    }
}

function toggleStretchCredit(studentName, goalId, checkbox) {
    setStretchCredit(studentName, goalId, checkbox.checked);
}

// Generate feedback text for a student
function generateFeedback(student) {
    // Short-circuit for template-only repos
    if (student.isTemplateOnly || student.studentCommitCount === 0) {
        return `TEMPLATE ONLY - No student commits detected\n\nThis repository contains only the template code. No student work has been submitted.\n\nAction: Follow up with student about missing submission.`;
    }

    const lines = [];
    const assignment = student.assignmentPattern || 'assignment';
    const weekNum = assignment.match(/w(\d+)/)?.[1] || '';
    const weekLabel = weekNum ? `Week ${weekNum}` : 'Assignment';

    // Build status
    if (student.build?.status === 'success') {
        lines.push(`✓ Build: Passing`);
    } else if (student.build?.status === 'failure') {
        lines.push(`✗ Build: Failing`);
        if (student.build?.errorStep) {
            lines.push(`  Failed step: ${student.build.errorStep}`);
        }
        if (student.build?.errorLines?.length > 0) {
            lines.push(`  Error details:`);
            student.build.errorLines.slice(0, 5).forEach(l => {
                lines.push(`    ${l}`);
            });
        }
        if (student.build?.url) {
            lines.push(`  → ${student.build.url}`);
        }
    }

    // Code quality
    const maint = student.sonar?.maintainability;
    if (maint) {
        if (maint === 'A') {
            lines.push(`✓ Code Quality: Excellent (${maint} rating)`);
        } else if (maint === 'B') {
            lines.push(`✓ Code Quality: Good (${maint} rating)`);
        } else if (maint === 'C') {
            lines.push(`○ Code Quality: Acceptable (${maint} rating) - review code smells`);
        } else {
            lines.push(`✗ Code Quality: Needs improvement (${maint} rating) - refactor to reduce complexity`);
        }
    }

    // Completeness (TODOs)
    const todoCount = student.todoCount || 0;
    if (todoCount === 0) {
        lines.push(`✓ Completeness: All tasks completed`);
    } else if (todoCount <= 3) {
        lines.push(`○ Completeness: ${todoCount} TODO(s) remaining`);
    } else {
        lines.push(`✗ Completeness: ${todoCount} TODOs remaining - significant work incomplete`);
    }

    // Code smells / bugs
    const smells = parseInt(student.sonar?.codeSmells) || 0;
    const bugs = parseInt(student.sonar?.bugs) || 0;
    const projectKey = student.sonar?.projectKey;
    if (bugs > 0 && projectKey) {
        lines.push(`○ Bugs: ${bugs} detected by SonarCloud - review and fix`);
        lines.push(`  → https://sonarcloud.io/project/issues?id=${projectKey}&types=BUG`);
    } else if (bugs > 0) {
        lines.push(`○ Bugs: ${bugs} detected by SonarCloud - review and fix`);
    }
    if (smells > 10 && projectKey) {
        lines.push(`○ Code Smells: ${smells} - consider refactoring for cleaner code`);
        lines.push(`  → https://sonarcloud.io/project/issues?id=${projectKey}&types=CODE_SMELL`);
    } else if (smells > 10) {
        lines.push(`○ Code Smells: ${smells} - consider refactoring for cleaner code`);
    }

    // Stretch goals
    if (student.stretchGoals && student.stretchGoals.length > 0) {
        const goalNames = student.stretchGoals.map(id => {
            const goal = STRETCH_GOALS[id];
            const credited = isStretchCredited(student.name, id);
            return goal ? `${goal.name} (${goal.week})${credited ? ' [credited]' : ''}` : id;
        });
        lines.push(`★ Stretch Goal: ${goalNames.join(', ')}`);
    } else {
        const stretchDesc = stretchGoalDescriptions[assignment];
        if (stretchDesc) {
            lines.push(`○ Stretch Goal: Not attempted - try: ${stretchDesc}`);
        }
    }

    // Student comments needing attention
    if (student.studentComments > 0 || (student.comments && student.comments.length > 0)) {
        const count = student.studentComments || student.comments?.length || 0;
        lines.push(`! Review: ${count} comment(s) in code may need attention`);
    }

    return lines.join('\n');
}

// Copy feedback to clipboard
function copyFeedback(studentIndex) {
    const student = renderedStudents[studentIndex];
    if (!student) return;

    const feedback = generateFeedback(student);
    navigator.clipboard.writeText(feedback).then(() => {
        // Show brief confirmation
        const btn = document.querySelector(`#copy-btn-${studentIndex}`);
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            btn.classList.add('btn-success');
            btn.classList.remove('btn-outline-primary');
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('btn-success');
                btn.classList.add('btn-outline-primary');
            }, 2000);
        }
    });
}

// Switch a card to show a different assignment's data
function switchAssignment(studentKey, assignmentPattern, cardIndex) {
    const entry = studentEntries[studentKey]?.[assignmentPattern];
    if (!entry) return;

    // Update renderedStudents so copyFeedback references the right data
    renderedStudents[cardIndex] = entry;

    const cardCol = document.getElementById(`card-${studentKey}`);
    if (!cardCol) return;

    // Remember if the details panel was expanded
    const wasExpanded = cardCol.querySelector('.collapse.show') !== null;

    // Re-render the card with the new assignment's data
    cardCol.outerHTML = renderStudentCard(entry, cardIndex);

    // Re-expand details if they were open
    if (wasExpanded) {
        const newCard = document.getElementById(`card-${studentKey}`);
        const collapse = newCard?.querySelector('.collapse');
        if (collapse) {
            collapse.classList.add('show');
        }
    }
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
