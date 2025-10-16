# Audit Logging Enhancement: Combined Snapshot with Anomalies + LLM Explanations

## Goal
Enhance the audit logging system to capture a complete JSON snapshot of checks + anomalies + optional LLM explanations, and add a human-readable note field for each audit run.

## Implementation Plan

### 1. Database Schema Updates
- [ ] Add `snapshot_json` JSONB column to `audit_runs` table to store complete snapshot
- [ ] Add `note` TEXT column to `audit_runs` table for human-readable summary
- [ ] Add `anomalies_count` INTEGER column to track number of anomalies detected
- [ ] Create migration SQL script: `sql/05b_add_snapshot_fields.sql`
- [ ] Execute the SQL script in Supabase

### 2. Update Server Action (lib/actions/audit.ts)
- [ ] Update `runValidationChecks()` to detect anomalies and generate LLM explanations
- [ ] Combine checks + anomalies (with summaries) into a single JSON snapshot
- [ ] Generate a human-readable note summarizing the audit run
- [ ] Store the snapshot_json and note in the audit_runs table
- [ ] Update the return type to include snapshot and note

### 3. Update /audit Page UI
- [ ] Update `app/audit/page.tsx` to display the snapshot JSON
- [ ] Add a section to show the human-readable note
- [ ] Update `AuditSnapshot` component to show anomalies from the snapshot
- [ ] Add collapsible JSON viewer for technical details
- [ ] Show LLM explanation source (OpenAI/Anthropic/Fallback) when available

### 4. Verification & Testing
- [ ] Run validation checks and verify snapshot is created
- [ ] Check that anomalies are included in the snapshot
- [ ] Verify LLM explanations are generated (if API key available)
- [ ] Test the /audit page displays all information correctly
- [ ] Verify the note is human-readable and informative

### 5. Git Commit
- [ ] Review all changes
- [ ] Commit to git with descriptive message

## Technical Details

### Snapshot JSON Structure
```json
{
  "timestamp": "2025-10-14T22:50:00Z",
  "checks": [
    {
      "check_name": "...",
      "category": "...",
      "status": "PASS/FAIL/WARN",
      "failures": 0,
      "total": 100,
      "description": "..."
    }
  ],
  "anomalies": [
    {
      "date": "2025-10-10",
      "value": 1500.00,
      "mean": 1000.00,
      "zScore": 2.5,
      "severity": "WARNING",
      "type": "SPIKE",
      "deviationPercent": 50.0,
      "explanation": "...",
      "explanationSource": "anthropic"
    }
  ],
  "summary": {
    "totalChecks": 10,
    "passed": 8,
    "failed": 1,
    "warnings": 1,
    "anomaliesDetected": 2,
    "criticalAnomalies": 0,
    "warningAnomalies": 2
  }
}
```

### Human-Readable Note Example
```
Validation completed at 10:50 PM. 8/10 checks passed, 1 failed, 1 warning.
2 cost anomalies detected: WARNING spike on 2025-10-10 (+50.0%),
INFO dip on 2025-10-08 (-15.2%). Overall status: WARN.
```

## Key Files to Modify
- `sql/05b_add_snapshot_fields.sql` (NEW)
- `lib/actions/audit.ts` (UPDATE - lines 39-129)
- `app/audit/page.tsx` (UPDATE - add snapshot display)
- `app/components/AuditSnapshot.tsx` (UPDATE - show anomalies)
