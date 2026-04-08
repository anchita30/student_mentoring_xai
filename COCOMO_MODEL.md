# COCOMO Model for DomainDNA (Student Analytics Platform)

## Overview

This document presents the **Constructive Cost Model (COCOMO)** estimation for the DomainDNA Student Analytics project, providing effort, time, and cost estimations based on the projected lines of code and team parameters.

---

## Step 1 — Lines of Code Estimation (NOP)

### Module-wise Breakdown

| Module | Estimated Lines of Code |
|--------|------------------------|
| **Frontend** | |
| Landing Page | 150 |
| Student Login/Register | 200 |
| Mentor Login/Register | 200 |
| Student Dashboard | 600 |
| Mentor Dashboard | 700 |
| **Backend** | |
| FastAPI Main + Config | 100 |
| Database Models | 150 |
| API Schemas | 150 |
| Student API Endpoints | 300 |
| Mentor API Endpoints | 150 |
| ML Inference Module | 250 |
| SHAP Explanation Module | 200 |
| **ML** | |
| Dataset Generator | 150 |
| Model Training Script | 150 |
| **Total** | **~3,300 lines** |

### Function Points Conversion

```
Function Points (NOP) = Total LOC / 100
                      = 3300 / 100
                      = 33 NOP (approx)
```

---

## Step 2 — Effort Calculation

Using the **Basic COCOMO Model** with Object Points approach:

| Parameter | Value |
|-----------|-------|
| New Object Points (NOP) | 33 |
| Productivity (PROD) | 10 OP/Person-Month |

### Effort Formula

```
Effort = NOP / Productivity
       = 33 / 10
       = 3.3 Person-Months
       ≈ 4 Person-Months
```

---

## Step 3 — Team Size and Duration

| Parameter | Value |
|-----------|-------|
| Calculated Effort | 4 Person-Months |
| Team Size | 4 Members |

### Duration Formula

```
Time = Effort / Team Size
     = 4 / 3
     ≈ 1.5 Months
     ≈ 2 Months (rounded)
```

---

## Step 4 — Cost Estimation

| Sr. No. | Cost Component | Calculation | Amount (₹) |
|---------|---------------|-------------|------------|
| 1 | Software Cost | Open-source (Next.js, Python, PostgreSQL, FastAPI, SHAP) | 0 |
| 2 | Developer Cost | 2 × ₹15,000 × 3 months | 90,000 |
| 3 | System Cost | (₹40,000 × 3) × 0.2 (depreciation) | 24,000 |
| 4 | Additional Hardware | Cloud hosting / Docker server | 5,000 |
| 5 | Miscellaneous | Internet, testing tools | 3,000 |
| | **Total Estimated Cost** | | **₹1,22,000** |

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Lines of Code** | ~3,300 LOC |
| **Function Points (NOP)** | 33 |
| **Effort** | 4 Person-Months |
| **Team Size** | 4 Members |
| **Development Time** | 2 Months |
| **Total Cost** | ₹1,22,000 |

---

## Technology Stack (Open Source)

- **Frontend:** Next.js, React, TailwindCSS
- **Backend:** Python, FastAPI
- **Database:** PostgreSQL
- **ML/AI:** Scikit-learn, SHAP
- **Deployment:** Docker, Cloud Hosting

---

## Notes

1. COCOMO model used: **Basic COCOMO** with Object Points methodology
2. Productivity rate assumed: **10 OP/Person-Month** (typical for experienced team)
3. All software tools are **open-source**, resulting in zero licensing costs
4. Cost estimates are in **Indian Rupees (₹)**

---

*Document generated for academic/project planning purposes.*
