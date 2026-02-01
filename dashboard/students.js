// Students History JavaScript
let allStudentData = {};
let allAssignments = [];
let currentStudent = null;
let currentDateFilter = { start: null, end: null };

// Load all assignment data and aggregate by student
async function loadAllData() {
    try {
        // First load the assignments list
        const assignmentsResponse = await fetch('data/assignments.json');
        const assignmentsData = await assignmentsResponse.json();
        allAssignments = assignmentsData.assignments || [];

        // Populate assignment filter dropdown
        const assignmentFilter = document.getElementById('assignment-filter');
        allAssignments.forEach(assignment => {
            const option = document.createElement('option');
            option.value = assignment.pattern;
            option.textContent = assignment.name;
            assignmentFilter.appendChild(option);
        });

        // Load each assignment's data
        for (const assignment of allAssignments) {
            try {
                const response = await fetch(`data/${assignment.pattern}.json`);
                const data = await response.json();

                // Process each student in this assignment
                if (data.students) {
                    for (const student of data.students) {
                        const studentName = student.name.toLowerCase();

                        if (!allStudentData[studentName]) {
                            allStudentData[studentName] = {
                                name: student.name,
                                assignments: [],
                                history: []
                            };
                        }

                        // Add this assignment to the student's record
                        allStudentData[studentName].assignments.push({
                            assignment: assignment.pattern,
                            assignmentName: assignment.name,
                            repo: student.repo,
                            build: student.build,
                            sonar: student.sonar,
                            todoCount: student.todoCount,
                            estimatedScore: student.estimatedScore,
                            hasStretch: student.hasStretch,
                            needsReview: student.needsReview,
                            comments: student.comments,
                            todos: student.todos,
                            stretchGoals: student.stretchGoals,
                            notes: student.notes,
                            submittedAt: student.submittedAt || data.generated
                        });
                    }
                }
            } catch (error) {
                console.error(`Failed to load ${assignment.pattern}:`, error);
            }
        }

        // Load historical snapshots if available
        try {
            const historyResponse = await fetch('data/history.json');
            const historyData = await historyResponse.json();

            if (historyData.snapshots) {
                for (const snapshot of historyData.snapshots) {
                    for (const student of snapshot.students || []) {
                        const studentName = student.name.toLowerCase();
                        if (allStudentData[studentName]) {
                            allStudentData[studentName].history.push({
                                date: snapshot.date,
                                assignment: snapshot.assignment,
                                ...student
                            });
                        }
                    }
                }
            }
        } catch (error) {
            // History file may not exist yet
            console.log('No history data available yet');
        }

        // Update last updated timestamp
        document.getElementById('last-updated').textContent = `Data loaded from ${allAssignments.length} assignment(s)`;

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

// Apply date filter to assignments
function filterByDate(assignments) {
    if (!currentDateFilter.start && !currentDateFilter.end) {
        return assignments;
    }

    return assignments.filter(a => {
        const date = new Date(a.submittedAt);
        if (currentDateFilter.start && date < currentDateFilter.start) return false;
        if (currentDateFilter.end && date > currentDateFilter.end) return false;
        return true;
    });
}

// Apply assignment filter
function filterByAssignment(assignments) {
    const assignmentFilter = document.getElementById('assignment-filter').value;
    if (!assignmentFilter) return assignments;
    return assignments.filter(a => a.assignment === assignmentFilter);
}

// Calculate student aggregate stats
function calculateStudentStats(student) {
    const assignments = filterByAssignment(filterByDate(student.assignments));

    if (assignments.length === 0) {
        return {
            totalAssignments: 0,
            avgScore: 0,
            passedBuilds: 0,
            failedBuilds: 0,
            stretchCount: 0,
            trend: 'stable'
        };
    }

    const scores = assignments.map(a => a.estimatedScore || 0).filter(s => s > 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const passedBuilds = assignments.filter(a => a.build?.status === 'success').length;
    const failedBuilds = assignments.filter(a => a.build?.status === 'failure').length;
    const stretchCount = assignments.filter(a => a.hasStretch).length;

    // Calculate trend based on last 3 assignments
    let trend = 'stable';
    if (scores.length >= 2) {
        const recent = scores.slice(-2);
        if (recent[1] > recent[0] + 5) trend = 'up';
        else if (recent[1] < recent[0] - 5) trend = 'down';
    }

    return {
        totalAssignments: assignments.length,
        avgScore,
        passedBuilds,
        failedBuilds,
        stretchCount,
        trend
    };
}

// Render the student list
function renderStudentList() {
    const container = document.getElementById('student-list');
    const students = Object.values(allStudentData);

    // Sort by name
    students.sort((a, b) => a.name.localeCompare(b.name));

    // Filter students who have assignments in the current filter
    const filteredStudents = students.filter(s => {
        const filtered = filterByAssignment(filterByDate(s.assignments));
        return filtered.length > 0;
    });

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

        return `
            <div class="student-summary-card p-3" data-student="${student.name.toLowerCase()}" onclick="selectStudent('${student.name.toLowerCase()}')">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${student.name}</strong>
                        <div class="text-muted small">${stats.totalAssignments} assignment(s)</div>
                    </div>
                    <div class="text-right">
                        <div class="h5 mb-0">
                            ${stats.avgScore}%
                            <i class="fas fa-${trendIcon} ${trendClass} ml-1"></i>
                        </div>
                        <div class="small">
                            <span class="text-success">${stats.passedBuilds} <i class="fas fa-check"></i></span>
                            ${stats.failedBuilds > 0 ? `<span class="text-danger ml-2">${stats.failedBuilds} <i class="fas fa-times"></i></span>` : ''}
                            ${stats.stretchCount > 0 ? `<span class="text-info ml-2">${stats.stretchCount} <i class="fas fa-star"></i></span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="progress progress-mini mt-2">
                    <div class="progress-bar bg-success" style="width: ${stats.passedBuilds / stats.totalAssignments * 100}%"></div>
                    <div class="progress-bar bg-danger" style="width: ${stats.failedBuilds / stats.totalAssignments * 100}%"></div>
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
    const assignments = filterByAssignment(filterByDate(student.assignments));

    // Sort assignments by date (most recent first)
    assignments.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    const container = document.getElementById('student-detail');

    container.innerHTML = `
        <div class="mb-4">
            <h3><i class="fas fa-user"></i> ${student.name}</h3>
            <div class="row mt-3">
                <div class="col-md-2 text-center">
                    <div class="h2 mb-0">${stats.avgScore}%</div>
                    <div class="small text-muted">Average Score</div>
                </div>
                <div class="col-md-2 text-center">
                    <div class="h2 mb-0">${stats.totalAssignments}</div>
                    <div class="small text-muted">Assignments</div>
                </div>
                <div class="col-md-2 text-center">
                    <div class="h2 mb-0 text-success">${stats.passedBuilds}</div>
                    <div class="small text-muted">Passed</div>
                </div>
                <div class="col-md-2 text-center">
                    <div class="h2 mb-0 text-danger">${stats.failedBuilds}</div>
                    <div class="small text-muted">Failed</div>
                </div>
                <div class="col-md-2 text-center">
                    <div class="h2 mb-0 text-info">${stats.stretchCount}</div>
                    <div class="small text-muted">Stretch Goals</div>
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
        </div>

        <hr>

        <h5><i class="fas fa-history"></i> Assignment History</h5>

        <div class="timeline mt-4">
            ${assignments.map(a => renderAssignmentTimeline(a)).join('')}
        </div>

        ${assignments.length === 0 ? `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-inbox fa-2x"></i>
                <p class="mt-2">No assignments match the current filters</p>
            </div>
        ` : ''}
    `;
}

// Render a single assignment in the timeline
function renderAssignmentTimeline(assignment) {
    const buildClass = assignment.build?.status === 'success' ? 'build-pass' : assignment.build?.status === 'failure' ? 'build-fail' : '';
    const buildIcon = assignment.build?.status === 'success' ? 'check-circle text-success' : assignment.build?.status === 'failure' ? 'times-circle text-danger' : 'question-circle text-secondary';

    const date = assignment.submittedAt ? new Date(assignment.submittedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : 'Unknown date';

    return `
        <div class="timeline-item ${buildClass}">
            <div class="timeline-date">${date}</div>
            <div class="assignment-card">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <strong>${assignment.assignmentName || assignment.assignment}</strong>
                        <div class="small text-muted">${assignment.repo}</div>
                    </div>
                    <div class="text-right">
                        <span class="badge badge-${assignment.estimatedScore >= 80 ? 'success' : assignment.estimatedScore >= 60 ? 'warning' : 'danger'}">${assignment.estimatedScore || 0}%</span>
                    </div>
                </div>

                <div class="row mt-2 small">
                    <div class="col-3">
                        <span class="text-muted">Build:</span>
                        <i class="fas fa-${buildIcon}"></i>
                    </div>
                    <div class="col-3">
                        <span class="text-muted">Maintainability:</span>
                        ${assignment.sonar?.maintainability ? `<span class="rating-badge rating-${assignment.sonar.maintainability}">${assignment.sonar.maintainability}</span>` : '-'}
                    </div>
                    <div class="col-3">
                        <span class="text-muted">TODOs:</span>
                        ${assignment.todoCount || 0}
                    </div>
                    <div class="col-3">
                        ${assignment.hasStretch ? '<span class="stretch-badge"><i class="fas fa-star"></i> Stretch</span>' : ''}
                    </div>
                </div>

                ${assignment.comments && assignment.comments.length > 0 ? `
                    <div class="mt-2 small">
                        <strong class="text-warning"><i class="fas fa-comment"></i> ${assignment.comments.length} Comment(s)</strong>
                    </div>
                ` : ''}

                ${assignment.notes && assignment.notes.length > 0 ? `
                    <div class="mt-2 small text-muted">
                        ${assignment.notes.join(' | ')}
                    </div>
                ` : ''}

                <div class="mt-2">
                    <a href="https://github.com/WCTC-Net-Database/${assignment.repo}" target="_blank" class="btn btn-sm btn-outline-secondary">
                        <i class="fab fa-github"></i> Repo
                    </a>
                    ${assignment.build?.url ? `
                        <a href="${assignment.build.url}" target="_blank" class="btn btn-sm btn-outline-secondary">
                            <i class="fas fa-cog"></i> Build
                        </a>
                    ` : ''}
                    ${assignment.sonar?.projectKey ? `
                        <a href="https://sonarcloud.io/project/overview?id=${assignment.sonar.projectKey}" target="_blank" class="btn btn-sm btn-outline-secondary">
                            <i class="fas fa-chart-bar"></i> Sonar
                        </a>
                    ` : ''}
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
    document.getElementById('start-date').addEventListener('change', () => {
        document.querySelectorAll('.date-preset').forEach(b => b.classList.remove('active'));
        updateDateFilter();
    });
    document.getElementById('end-date').addEventListener('change', () => {
        document.querySelectorAll('.date-preset').forEach(b => b.classList.remove('active'));
        updateDateFilter();
    });

    // Assignment filter
    document.getElementById('assignment-filter').addEventListener('change', () => {
        renderStudentList();
        if (currentStudent) {
            selectStudent(currentStudent);
        }
    });
});
