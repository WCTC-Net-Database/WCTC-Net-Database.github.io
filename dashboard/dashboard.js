// Dashboard JavaScript
let allStudents = [];
let currentFilter = 'all';

// Load available assignments
async function loadAssignments() {
    try {
        const response = await fetch('data/assignments.json');
        const data = await response.json();

        const select = document.getElementById('assignment-select');
        select.innerHTML = '';

        if (data.assignments && data.assignments.length > 0) {
            data.assignments.forEach((assignment, index) => {
                const option = document.createElement('option');
                option.value = assignment.pattern;
                option.textContent = `${assignment.name} (${assignment.pattern})`;
                select.appendChild(option);
            });

            // Load first assignment by default
            loadAssignmentData(data.assignments[0].pattern);
        } else {
            select.innerHTML = '<option value="">No assignments found</option>';
            showNoData();
        }
    } catch (error) {
        console.error('Failed to load assignments:', error);
        document.getElementById('assignment-select').innerHTML = '<option value="">Error loading assignments</option>';
        showNoData();
    }
}

// Load data for a specific assignment
async function loadAssignmentData(pattern) {
    try {
        const response = await fetch(`data/${pattern}.json`);
        const data = await response.json();

        // Update last updated timestamp
        if (data.generated) {
            document.getElementById('last-updated').textContent = `Last updated: ${data.generated}`;
        }

        allStudents = data.students || [];
        updateSummary(allStudents);
        renderStudents(filterStudents(allStudents, currentFilter));
    } catch (error) {
        console.error('Failed to load assignment data:', error);
        showNoData();
    }
}

// Filter students based on criteria
function filterStudents(students, filter) {
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
                <p class="mt-3 text-muted">No students match the current filter</p>
            </div>
        `;
        return;
    }

    // Sort: needs review first, then by score descending
    students.sort((a, b) => {
        if (a.needsReview !== b.needsReview) return b.needsReview - a.needsReview;
        if (a.build?.status === 'failure' && b.build?.status !== 'failure') return -1;
        if (b.build?.status === 'failure' && a.build?.status !== 'failure') return 1;
        return (b.estimatedScore || 0) - (a.estimatedScore || 0);
    });

    container.innerHTML = students.map(student => renderStudentCard(student)).join('');
}

// Render a single student card
function renderStudentCard(student) {
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

    return `
        <div class="col-md-6 col-lg-4">
            <div class="card ${cardClass}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h5 class="card-title mb-0">
                            <span class="status-badge status-${buildClass}"></span>
                            ${student.name}
                        </h5>
                        <span class="badge badge-secondary">${student.estimatedScore || '-'}%</span>
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
                        ${student.studentComments > 0 ? `<span class="attention-badge"><i class="fas fa-comment"></i> ${student.studentComments} comment(s)</span>` : ''}
                    </div>

                    ${student.build?.url ? `
                    <div class="mt-3">
                        <a href="${student.build.url}" target="_blank" class="btn btn-sm btn-outline-secondary">
                            <i class="fas fa-external-link-alt"></i> View Build
                        </a>
                        <a href="https://github.com/WCTC-Net-Database/${student.repo}" target="_blank" class="btn btn-sm btn-outline-secondary">
                            <i class="fab fa-github"></i> Repo
                        </a>
                        ${student.sonar?.projectKey ? `
                        <a href="https://sonarcloud.io/project/overview?id=${student.sonar.projectKey}" target="_blank" class="btn btn-sm btn-outline-secondary">
                            <i class="fas fa-chart-bar"></i> SonarCloud
                        </a>
                        ` : ''}
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// Show no data message
function showNoData() {
    document.getElementById('students-container').innerHTML = `
        <div class="col-12 text-center py-5">
            <i class="fas fa-database fa-3x text-muted"></i>
            <p class="mt-3 text-muted">No dashboard data available yet.<br>Run the update workflow to generate data.</p>
        </div>
    `;

    // Reset summary
    ['total', 'passed', 'failed', 'review', 'stretch'].forEach(id => {
        document.getElementById(`${id}-count`).textContent = '-';
    });
    document.getElementById('avg-score').textContent = '-';
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadAssignments();

    // Assignment selector change
    document.getElementById('assignment-select').addEventListener('change', (e) => {
        if (e.target.value) {
            loadAssignmentData(e.target.value);
        }
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderStudents(filterStudents(allStudents, currentFilter));
        });
    });
});
