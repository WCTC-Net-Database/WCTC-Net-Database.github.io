// Students History JavaScript
let allStudentData = {};
let currentStudent = null;
let currentDateFilter = { start: null, end: null };
let currentAssignmentFilter = '';

// Load all student data from current.json and history
async function loadAllData() {
    try {
        // Load current state (deduplicated students)
        const currentResponse = await fetch('data/current.json');
        const currentData = await currentResponse.json();

        // Initialize student data from current state
        if (currentData.students) {
            for (const student of currentData.students) {
                const studentKey = student.name.toLowerCase();

                allStudentData[studentKey] = {
                    name: student.name,
                    currentRepo: student.repo,
                    currentPattern: student.assignmentPattern,
                    current: student,
                    snapshots: []
                };
            }
        }

        // Extract unique assignment patterns for filter
        const patterns = [...new Set(currentData.students?.map(s => s.assignmentPattern).filter(Boolean) || [])];
        populateAssignmentFilter(patterns.sort());

        // Load historical snapshots
        try {
            const historyResponse = await fetch('data/history.json');
            const historyData = await historyResponse.json();

            if (historyData.snapshots) {
                for (const snapshot of historyData.snapshots) {
                    for (const student of snapshot.students || []) {
                        const studentKey = student.name.toLowerCase();

                        // Create student entry if not exists (student in history but not in current)
                        if (!allStudentData[studentKey]) {
                            allStudentData[studentKey] = {
                                name: student.name,
                                currentRepo: student.repo,
                                currentPattern: student.assignmentPattern,
                                current: null,
                                snapshots: []
                            };
                        }

                        allStudentData[studentKey].snapshots.push({
                            date: snapshot.date,
                            ...student
                        });
                    }
                }
            }
        } catch (error) {
            console.log('No history data available yet');
        }

        // Update timestamp
        if (currentData.generated) {
            document.getElementById('last-updated').textContent = `Last updated: ${formatDate(currentData.generated)}`;
        }

        // Render student list
        renderStudentList();

    } catch (error) {
        console.error('Failed to load data:', error);
        document.getElementById('student-list').innerHTML = `
            <div class="text-center py-5 text-danger">
                <i class="fas fa-exclamation-triangle fa-2x"></i>
                <p class="mt-2">Failed to load student data</p>
            </div>
        `;
    }
}

// Populate assignment filter dropdown
function populateAssignmentFilter(patterns) {
    const select = document.getElementById('assignment-filter');
    select.innerHTML = '<option value="">All Assignments</option>';

    patterns.forEach(pattern => {
        const option = document.createElement('option');
        option.value = pattern;
        const name = pattern.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        option.textContent = name;
        select.appendChild(option);
    });
}

// Format date for display
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString();
}

// Apply date filter to snapshots
function filterSnapshotsByDate(snapshots) {
    if (!currentDateFilter.start && !currentDateFilter.end) {
        return snapshots;
    }

    return snapshots.filter(s => {
        const date = new Date(s.date);
        if (currentDateFilter.start && date < currentDateFilter.start) return false;
        if (currentDateFilter.end && date > currentDateFilter.end) return false;
        return true;
    });
}

// Apply assignment filter
function filterByAssignment(student) {
    if (!currentAssignmentFilter) {
        return true;
    }
    return student.currentPattern === currentAssignmentFilter ||
           student.snapshots?.some(s => s.assignmentPattern === currentAssignmentFilter);
}

// Calculate student aggregate stats
function calculateStudentStats(student) {
    const snapshots = filterSnapshotsByDate(student.snapshots || []);
    const current = student.current;

    // Get scores from snapshots (unique by date to avoid duplicates)
    const scoresByDate = {};
    snapshots.forEach(s => {
        const dateKey = s.date.split('T')[0];
        if (!scoresByDate[dateKey] || new Date(s.date) > new Date(scoresByDate[dateKey].date)) {
            scoresByDate[dateKey] = s;
        }
    });

    const uniqueSnapshots = Object.values(scoresByDate).sort((a, b) => new Date(a.date) - new Date(b.date));
    const scores = uniqueSnapshots.map(s => s.estimatedScore || 0).filter(s => s > 0);

    // Include current score
    const currentScore = current?.estimatedScore || 0;
    if (currentScore > 0 && scores.length === 0) {
        scores.push(currentScore);
    }

    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    // Build status from current
    const buildPassed = current?.build?.status === 'success';
    const buildFailed = current?.build?.status === 'failure';
    const hasStretch = current?.hasStretch || false;

    // Calculate trend from recent snapshots
    let trend = 'stable';
    if (scores.length >= 2) {
        const recent = scores.slice(-2);
        if (recent[1] > recent[0] + 5) trend = 'up';
        else if (recent[1] < recent[0] - 5) trend = 'down';
    }

    // Count unique assignments (from snapshots + current)
    const assignmentSet = new Set();
    if (current?.assignmentPattern) {
        assignmentSet.add(current.assignmentPattern);
    }
    snapshots.forEach(s => {
        if (s.assignmentPattern) {
            assignmentSet.add(s.assignmentPattern);
        }
    });
    const uniqueAssignments = Array.from(assignmentSet).sort();

    return {
        currentScore: currentScore || avgScore,
        avgScore,
        snapshotCount: uniqueSnapshots.length,
        buildPassed,
        buildFailed,
        hasStretch,
        trend,
        todoCount: current?.todoCount || 0,
        assignmentCount: uniqueAssignments.length,
        assignments: uniqueAssignments
    };
}

// Render the student list
function renderStudentList() {
    const container = document.getElementById('student-list');
    const students = Object.values(allStudentData);

    // Filter by assignment
    const filteredStudents = students.filter(filterByAssignment);

    // Sort by name
    filteredStudents.sort((a, b) => a.name.localeCompare(b.name));

    document.getElementById('student-count').textContent = filteredStudents.length;

    if (filteredStudents.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="fas fa-search fa-2x"></i>
                <p class="mt-2">No students match the current filters</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredStudents.map(student => {
        const stats = calculateStudentStats(student);
        const trendIcon = stats.trend === 'up' ? 'arrow-up' : stats.trend === 'down' ? 'arrow-down' : 'minus';
        const trendClass = stats.trend === 'up' ? 'trend-up' : stats.trend === 'down' ? 'trend-down' : 'trend-stable';

        // Show assignment badges (abbreviated)
        const assignmentBadges = stats.assignments.map(a => {
            const abbrev = a.replace('w', 'W').replace(/-.*/, ''); // e.g., "w1-file-i-o" -> "W1"
            return `<span class="badge badge-info mr-1" title="${a}">${abbrev}</span>`;
        }).join('');

        return `
            <div class="student-summary-card p-3" data-student="${student.name.toLowerCase()}" onclick="selectStudent('${student.name.toLowerCase()}')">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${student.name}</strong>
                        <div class="small mt-1">${assignmentBadges || '<span class="text-muted">No assignments</span>'}</div>
                    </div>
                    <div class="text-right">
                        <div class="h5 mb-0">
                            ${stats.currentScore}%
                            <i class="fas fa-${trendIcon} ${trendClass} ml-1"></i>
                        </div>
                        <div class="small">
                            ${stats.buildPassed ? '<span class="text-success"><i class="fas fa-check"></i></span>' : ''}
                            ${stats.buildFailed ? '<span class="text-danger"><i class="fas fa-times"></i></span>' : ''}
                            ${stats.hasStretch ? '<span class="text-info ml-1"><i class="fas fa-star"></i></span>' : ''}
                            ${stats.todoCount > 0 ? `<span class="text-warning ml-1">${stats.todoCount} TODOs</span>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Select and display student details
function selectStudent(studentKey) {
    currentStudent = studentKey;

    // Update UI selection
    document.querySelectorAll('.student-summary-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`.student-summary-card[data-student="${studentKey}"]`)?.classList.add('selected');

    const student = allStudentData[studentKey];
    if (!student) return;

    const stats = calculateStudentStats(student);
    const current = student.current;
    const snapshots = filterSnapshotsByDate(student.snapshots || []).sort((a, b) => new Date(b.date) - new Date(a.date));

    const container = document.getElementById('student-detail');

    container.innerHTML = `
        <div class="mb-4">
            <h3><i class="fas fa-user"></i> ${student.name}</h3>

            ${current ? `
            <div class="current-info mt-3 p-3 bg-light rounded">
                <h6><i class="fas fa-code-branch"></i> Latest Repository: <a href="https://github.com/WCTC-Net-Database/${current.repo}" target="_blank"><code>${current.repo}</code></a></h6>
                <div class="row mt-3">
                    <div class="col-md-2 text-center">
                        <div class="h3 mb-0">${stats.currentScore}%</div>
                        <div class="small text-muted">Current Score</div>
                    </div>
                    <div class="col-md-2 text-center">
                        <div class="h4 mb-0">
                            ${stats.buildPassed ? '<i class="fas fa-check-circle text-success"></i>' : ''}
                            ${stats.buildFailed ? '<i class="fas fa-times-circle text-danger"></i>' : ''}
                            ${!stats.buildPassed && !stats.buildFailed ? '<i class="fas fa-question-circle text-secondary"></i>' : ''}
                        </div>
                        <div class="small text-muted">Build</div>
                    </div>
                    <div class="col-md-2 text-center">
                        <div class="h4 mb-0">${current.sonar?.maintainability ? `<span class="rating-badge rating-${current.sonar.maintainability}">${current.sonar.maintainability}</span>` : '-'}</div>
                        <div class="small text-muted">Maintainability</div>
                    </div>
                    <div class="col-md-2 text-center">
                        <div class="h4 mb-0">${stats.todoCount}</div>
                        <div class="small text-muted">TODOs</div>
                    </div>
                    <div class="col-md-2 text-center">
                        <div class="h4 mb-0">${stats.hasStretch ? '<i class="fas fa-star text-info"></i>' : '-'}</div>
                        <div class="small text-muted">Stretch Goal</div>
                    </div>
                    <div class="col-md-2 text-center">
                        <div class="h4 mb-0">
                            ${stats.trend === 'up' ? '<i class="fas fa-arrow-up text-success"></i>' : ''}
                            ${stats.trend === 'down' ? '<i class="fas fa-arrow-down text-danger"></i>' : ''}
                            ${stats.trend === 'stable' ? '<i class="fas fa-minus text-secondary"></i>' : ''}
                        </div>
                        <div class="small text-muted">Trend</div>
                    </div>
                </div>
                <div class="mt-3">
                    <a href="https://github.com/WCTC-Net-Database/${current.repo}" target="_blank" class="btn btn-sm btn-outline-secondary">
                        <i class="fab fa-github"></i> Repository
                    </a>
                    ${current.build?.url ? `
                        <a href="${current.build.url}" target="_blank" class="btn btn-sm btn-outline-secondary">
                            <i class="fas fa-cog"></i> Build
                        </a>
                    ` : ''}
                    ${current.sonar?.projectKey ? `
                        <a href="https://sonarcloud.io/project/overview?id=${current.sonar.projectKey}" target="_blank" class="btn btn-sm btn-outline-secondary">
                            <i class="fas fa-chart-bar"></i> SonarCloud
                        </a>
                    ` : ''}
                </div>
            </div>
            ` : `
            <div class="alert alert-warning mt-3">
                <i class="fas fa-exclamation-triangle"></i> No current submission found for this student.
            </div>
            `}
        </div>

        <hr>

        <h5><i class="fas fa-history"></i> Score History (${snapshots.length} snapshots)</h5>

        ${snapshots.length > 0 ? `
        <div class="timeline mt-4">
            ${snapshots.slice(0, 20).map(s => renderSnapshotTimeline(s)).join('')}
            ${snapshots.length > 20 ? `<div class="text-muted text-center py-2">...and ${snapshots.length - 20} more</div>` : ''}
        </div>
        ` : `
        <div class="text-center py-4 text-muted">
            <i class="fas fa-inbox fa-2x"></i>
            <p class="mt-2">No historical snapshots available yet</p>
        </div>
        `}
    `;
}

// Render a snapshot in the timeline
function renderSnapshotTimeline(snapshot) {
    const buildClass = snapshot.buildStatus === 'success' ? 'build-pass' : snapshot.buildStatus === 'failure' ? 'build-fail' : '';
    const buildIcon = snapshot.buildStatus === 'success' ? 'check-circle text-success' : snapshot.buildStatus === 'failure' ? 'times-circle text-danger' : 'question-circle text-secondary';

    const date = new Date(snapshot.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const patternBadge = snapshot.assignmentPattern
        ? `<span class="badge badge-info">${snapshot.assignmentPattern}</span>`
        : '';

    return `
        <div class="timeline-item ${buildClass}">
            <div class="timeline-date">${date}</div>
            <div class="snapshot-card p-2">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        ${patternBadge}
                        <span class="small text-muted ml-2">${snapshot.repo || ''}</span>
                    </div>
                    <div>
                        <span class="badge badge-${snapshot.estimatedScore >= 80 ? 'success' : snapshot.estimatedScore >= 60 ? 'warning' : 'danger'}">${snapshot.estimatedScore || 0}%</span>
                        <i class="fas fa-${buildIcon} ml-2"></i>
                        ${snapshot.hasStretch ? '<i class="fas fa-star text-info ml-1"></i>' : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Update date filter
function updateDateFilter() {
    const startInput = document.getElementById('start-date');
    const endInput = document.getElementById('end-date');

    currentDateFilter.start = startInput.value ? new Date(startInput.value) : null;
    currentDateFilter.end = endInput.value ? new Date(endInput.value + 'T23:59:59') : null;

    renderStudentList();
    if (currentStudent) {
        selectStudent(currentStudent);
    }
}

// Set date preset
function setDatePreset(days) {
    const endInput = document.getElementById('end-date');
    const startInput = document.getElementById('start-date');

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
    loadAllData();

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

    // Assignment filter
    document.getElementById('assignment-filter')?.addEventListener('change', (e) => {
        currentAssignmentFilter = e.target.value;
        renderStudentList();
        if (currentStudent) {
            selectStudent(currentStudent);
        }
    });
});
