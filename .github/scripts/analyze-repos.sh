#!/usr/bin/env bash
set -euo pipefail

# Code Analysis Script: commit stats, comment density, AI indicators, quiz generation
# Called by .github/workflows/code-analysis.yml

ASSIGNMENT_FILTER="${1:-}"
GENERATED=$(date -u '+%Y-%m-%dT%H:%M:%SZ')

if [ ! -f dashboard/data/current.json ]; then
  echo "ERROR: No current.json found. Run update-dashboard first."
  exit 1
fi

# Load existing analysis if present
if [ -f dashboard/data/analysis.json ]; then
  analysis=$(cat dashboard/data/analysis.json)
  analysis=$(echo "$analysis" | jq --arg ts "$GENERATED" '.generated = $ts')
else
  analysis=$(jq -n --arg ts "$GENERATED" '{"generated": $ts, "students": {}}')
fi

# Get repos to analyze: skip template-only
filter_expr='select(.isTemplateOnly != true and (.studentCommitCount // 0) > 0)'
if [ -n "$ASSIGNMENT_FILTER" ]; then
  filter_expr="$filter_expr | select(.assignmentPattern == \"$ASSIGNMENT_FILTER\")"
fi

repos=$(jq -r ".students[] | $filter_expr | \"\(.name)|\(.repo)|\(.assignmentPattern)\"" dashboard/data/current.json | sort -u)

if [ -z "$repos" ]; then
  echo "No repos to analyze."
  exit 0
fi

while IFS='|' read -r student_name repo assignment; do
  [ -z "$repo" ] && continue

  echo ""
  echo "========================================"
  echo "Analyzing: $student_name / $repo ($assignment)"
  echo "========================================"

  student_key=$(echo "$student_name" | tr '[:upper:]' '[:lower:]')

  # --- Commit Stats ---
  echo "  [1/3] Fetching commit stats..."

  all_commits=$(gh api "repos/WCTC-Net-Database/$repo/commits?per_page=100" 2>/dev/null || echo '[]')

  student_shas=$(echo "$all_commits" | jq -r '[.[] | select(
    (.author.login // "" | test("^(mcarthey|github-classroom\\[bot\\]|web-flow)$") | not) and
    (.commit.author.name // "" | test("^(WCTC Instructor|github-classroom\\[bot\\])$") | not) and
    (.commit.message // "" | test("(?i)(workflow|sonarcloud)") | not)
  )] | .[].sha' 2>/dev/null || echo "")

  commit_count=0
  max_lines=0
  total_lines=0

  for sha in $student_shas; do
    commit_count=$((commit_count + 1))
    additions=$(gh api "repos/WCTC-Net-Database/$repo/commits/$sha" --jq '.stats.additions // 0' 2>/dev/null || echo "0")
    additions=$(echo "$additions" | tr -d '[:space:]')
    additions=${additions:-0}
    total_lines=$((total_lines + additions))
    [ "$additions" -gt "$max_lines" ] && max_lines=$additions
  done

  avg_lines=0
  [ "$commit_count" -gt 0 ] && avg_lines=$((total_lines / commit_count))

  echo "    Commits: $commit_count | Max: $max_lines | Avg: $avg_lines | Total: $total_lines"

  # --- Comment Density ---
  echo "  [2/3] Analyzing comment density..."

  tmpdir=$(mktemp -d)
  gh repo clone "WCTC-Net-Database/$repo" "$tmpdir" -- --depth 1 2>/dev/null || true

  total_code_lines=0
  total_xml_comment_lines=0
  code_content=""

  while IFS= read -r f; do
    [ -z "$f" ] && continue
    relative=$(echo "$f" | sed "s|$tmpdir/||")

    lines=$(wc -l < "$f" | tr -d '[:space:]')
    xml_comments=$(grep -c '^\s*///' "$f" 2>/dev/null || echo "0")
    xml_comments=$(echo "$xml_comments" | tr -d '[:space:]')

    total_code_lines=$((total_code_lines + lines))
    total_xml_comment_lines=$((total_xml_comment_lines + xml_comments))

    # Collect code for quiz generation (cap size)
    current_length=${#code_content}
    if [ "$current_length" -lt 40000 ]; then
      file_content=$(cat "$f")
      code_content="${code_content}"$'\n'"=== ${relative} ==="$'\n'"${file_content}"
    fi
  done < <(find "$tmpdir" -name "*.cs" -not -path "*/obj/*" -not -path "*/bin/*" 2>/dev/null)

  comment_density=0
  if [ "$total_code_lines" -gt 0 ]; then
    comment_density=$(awk "BEGIN {printf \"%.1f\", ($total_xml_comment_lines * 100.0 / $total_code_lines)}")
  fi

  echo "    Code lines: $total_code_lines | XML docs: $total_xml_comment_lines (${comment_density}%)"

  # --- AI Indicators ---
  ai_flags=0
  ai_reasons='[]'

  if [ "$max_lines" -gt 500 ]; then
    ai_flags=$((ai_flags + 1))
    ai_reasons=$(echo "$ai_reasons" | jq --arg r "Large commit: +${max_lines} lines in single commit" '. + [$r]')
  fi

  high_density=$(awk "BEGIN {print ($comment_density > 20.0) ? 1 : 0}")
  if [ "$high_density" -eq 1 ]; then
    ai_flags=$((ai_flags + 1))
    ai_reasons=$(echo "$ai_reasons" | jq --arg r "High XML doc density: ${comment_density}% of code is /// comments" '. + [$r]')
  fi

  if [ "$commit_count" -le 2 ] && [ "$total_lines" -gt 300 ]; then
    ai_flags=$((ai_flags + 1))
    ai_reasons=$(echo "$ai_reasons" | jq --arg r "Bulk submission: ${total_lines} lines in only ${commit_count} commit(s)" '. + [$r]')
  fi

  if [ "$avg_lines" -gt 200 ]; then
    ai_flags=$((ai_flags + 1))
    ai_reasons=$(echo "$ai_reasons" | jq --arg r "High avg commit size: ${avg_lines} lines/commit" '. + [$r]')
  fi

  ai_level="low"
  [ "$ai_flags" -ge 1 ] && ai_level="medium"
  [ "$ai_flags" -ge 2 ] && ai_level="high"

  echo "    AI indicators: $ai_flags flags -> $ai_level"

  # --- Quiz Questions via Claude API ---
  echo "  [3/3] Generating quiz questions..."

  quiz_questions='[]'

  if [ -n "${ANTHROPIC_API_KEY:-}" ] && [ -n "$code_content" ]; then
    prompt_file=$(mktemp)

    # Write prompt (avoiding YAML-breaking heredoc in workflow)
    {
      echo "You are an instructor's assistant for a .NET/C# programming course at WCTC. Analyze the student code below and generate exactly 3 comprehension quiz questions."
      echo ""
      echo "Rules:"
      echo "- Reference SPECIFIC methods, classes, or logic from THEIR code (use actual names)"
      echo "- Question 1 (basic): Ask what a specific method or code block does"
      echo "- Question 2 (design): Ask WHY a design choice was made (interface, pattern, structure)"
      echo "- Question 3 (modify): Ask how they would change or extend something specific"
      echo ""
      echo "The questions must be easy if the student wrote/understood the code, but hard if they pasted AI output without comprehension. Keep each question to 1-2 sentences."
      echo ""
      echo "Respond with ONLY a JSON array - no markdown, no explanation:"
      echo '[{"question": "...", "context": "Filename.cs:MethodName", "difficulty": "basic"}, {"question": "...", "context": "Filename.cs:ClassName", "difficulty": "design"}, {"question": "...", "context": "Filename.cs:MethodName", "difficulty": "modify"}]'
      echo ""
      echo "Assignment: $assignment"
      echo "Student: $student_name"
      echo ""
      echo "--- STUDENT CODE ---"
      echo "$code_content"
    } > "$prompt_file"

    # Build API request
    request_file=$(mktemp)
    jq -n --arg prompt "$(cat "$prompt_file")" \
      '{"model":"claude-haiku-4-5-20251001","max_tokens":1024,"messages":[{"role":"user","content":$prompt}]}' \
      > "$request_file"

    # Call Claude API
    response=$(curl -s --max-time 30 \
      -H "Content-Type: application/json" \
      -H "x-api-key: $ANTHROPIC_API_KEY" \
      -H "anthropic-version: 2023-06-01" \
      -d @"$request_file" \
      https://api.anthropic.com/v1/messages 2>/dev/null || echo '{}')

    quiz_text=$(echo "$response" | jq -r '.content[0].text // ""' 2>/dev/null || echo "")

    if [ -n "$quiz_text" ]; then
      # Strip markdown fencing if present (```json ... ```)
      quiz_text=$(echo "$quiz_text" | sed '/^```/d')
      parsed=$(echo "$quiz_text" | jq '.' 2>/dev/null || echo "")
      if [ -n "$parsed" ] && echo "$parsed" | jq 'type == "array"' 2>/dev/null | grep -q true; then
        quiz_questions="$parsed"
        echo "    Generated $(echo "$quiz_questions" | jq 'length') questions"
      else
        echo "    WARNING: Could not parse response as JSON"
        echo "    Response preview: $(echo "$quiz_text" | head -c 200)"
      fi
    else
      api_error=$(echo "$response" | jq -r '.error.message // "unknown"' 2>/dev/null || echo "unknown")
      echo "    WARNING: No quiz text - $api_error"
    fi

    rm -f "$prompt_file" "$request_file"
  else
    if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
      echo "    SKIPPED: No ANTHROPIC_API_KEY"
    else
      echo "    SKIPPED: No code content"
    fi
  fi

  rm -rf "$tmpdir"

  # --- Build entry ---
  entry=$(jq -n \
    --arg name "$student_name" \
    --arg repo "$repo" \
    --arg assignment "$assignment" \
    --argjson commitCount "$commit_count" \
    --argjson maxLines "$max_lines" \
    --argjson avgLines "$avg_lines" \
    --argjson totalLines "$total_lines" \
    --argjson commentDensity "$comment_density" \
    --argjson xmlComments "$total_xml_comment_lines" \
    --argjson codeLines "$total_code_lines" \
    --arg aiLevel "$ai_level" \
    --argjson aiFlags "$ai_flags" \
    --argjson aiReasons "$ai_reasons" \
    --argjson quizQuestions "$quiz_questions" \
    '{name:$name,repo:$repo,assignment:$assignment,commitStats:{count:$commitCount,maxLines:$maxLines,avgLines:$avgLines,totalLines:$totalLines},commentDensity:$commentDensity,commentDetails:{xmlDocLines:$xmlComments,totalCodeLines:$codeLines},aiIndicators:{level:$aiLevel,flags:$aiFlags,reasons:$aiReasons},quizQuestions:$quizQuestions}')

  analysis=$(echo "$analysis" | jq \
    --arg key "$student_key" \
    --arg assignment "$assignment" \
    --argjson entry "$entry" \
    '.students[$key][$assignment] = $entry')

done < <(echo "$repos")

# Write output
mkdir -p dashboard/data
echo "$analysis" | jq '.' > dashboard/data/analysis.json

echo ""
echo "========================================"
echo "Analysis complete!"
echo "========================================"
jq '.students | keys[]' dashboard/data/analysis.json
