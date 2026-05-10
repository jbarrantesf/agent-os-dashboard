# ⚙️ Hermes Heartbeat — Quick checks every 10-15 min

## What to check (rotate through these)

### 🟢 ORBIT & Costs (Priority 1)
```bash
# Quick health + cost in one command
curl -s http://127.0.0.1:18789/health | jq . && ~/.hermes/scripts/orbit-cost-now.sh
```

Run this when:
- Just started a session
- Haven't checked in 30+ minutes
- About to run heavy ORBIT tasks

### 📧 Telegram Backlog
- Any pending messages from José that need responses?
- Check Telegram chat for @hermes mentions

### 💾 Memory & Logs
- Any new items in `~/.hermes/orbit-costs.log`?
- Review last 3 lines for spend trends

---

## Silent checks (no action needed if OK)

✅ = All good, move on
❌ = Alert José immediately

| Check | How | Alert if |
|-------|-----|----------|
| ORBIT alive | `curl http://127.0.0.1:18789/health` | Fails 2x in a row |
| Daily cost < $5 | Compare `usage_daily` vs threshold | Exceeds $5 |
| Weekly cost < $25 | Compare `usage_weekly` vs threshold | Exceeds $25 |
| Telegram responses | Check bot logs | No response in 5min |

---

## When to escalate to José

🔴 **URGENT:**
- ORBIT not responding + launchd restart failed
- Daily spend > $10 (possible runaway)
- Weekly spend > $50 (cost blow-up)

🟠 **NORMAL:**
- Daily spend $2-5 (expected for ORBIT work)
- ORBIT restarted (once per week is OK)
- API rate limits hit (pause tasks, retry later)

---

## Commands for quick access

```bash
# Real-time dashboard
~/.hermes/scripts/orbit-cost-now.sh

# Daily report (same as cron job)
~/.hermes/scripts/orbit-cost-monitor.sh

# Health check
~/.hermes/scripts/orbit-health-check.sh

# View cost log
tail -20 ~/.hermes/orbit-costs.log

# Check ORBIT process
ps aux | grep openclaw | grep -v grep

# View launchd logs (if ORBIT crashed)
log stream --predicate 'eventMessage contains "cr.nexai.orbit"' --level debug
```

---

Updated: 2026-05-04
