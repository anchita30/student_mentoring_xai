# 🚀 DomainDNA - Setup & Testing Guide

## ✅ What We've Implemented

### 1. **PDF Download Feature** ✓
- Professional one-page PDF report with student analysis
- Includes domain scores, SHAP chart, academic performance, and mentor feedback
- Available in mentor dashboard when viewing a student

### 2. **ML Backend Integration** ✓
- **`/predict` endpoint** - Generates domain scores for students
- **`/predict/{student_id}/explain` endpoint** - SHAP explanations (XAI Point 1)
- **`/predict/global-importance` endpoint** - Global feature importance (XAI Point 3)
- Automatic prediction generation after student saves data

### 3. **Frontend-Backend Connection** ✓
- Student dashboard saves data to database (marks, projects, skills, certificates)
- Mentor dashboard fetches real SHAP explanations from API
- Analytics tab shows global feature importance insights

### 4. **XAI Integration** ✓
- **XAI Point 1**: Individual student SHAP in mentor dashboard (shows why a domain was recommended)
- **XAI Point 3**: Global feature importance in analytics tab (shows what matters most across all students)

---

## 🛠️ Setup Instructions

### **Step 1: Start the Database**

```bash
# Start Docker Desktop first, then:
docker-compose up -d

# Verify it's running:
docker ps
# Should show: student_analytics_db on port 5433
```

### **Step 2: Start the Backend**

```bash
cd backend

# Activate virtual environment (if not active)
source venv/Scripts/activate  # Windows Git Bash
# OR
venv\Scripts\activate         # Windows CMD

# Install dependencies (if needed)
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: **http://localhost:8000**

API docs: **http://localhost:8000/docs**

### **Step 3: Start the Frontend**

```bash
cd frontend

# Install dependencies (if needed)
npm install

# Start development server
npm run dev
```

Frontend will be available at: **http://localhost:3000**

---

## 🧪 Testing the Full Workflow

### **Test 1: Student Enters Data**

1. Go to http://localhost:3000
2. Click **"I am a Student"** → **"Get Started"**
3. Enter data in each tab:
   - **Marks**: Fill in subject marks + GPA
   - **Projects**: Add at least 1 project with domain
   - **Skills**: Rate your skills (1-10)
   - **Certificates**: Add online courses (optional)
4. Click **"Save"** on each tab
5. ✅ Data should save successfully + ML prediction runs automatically

### **Test 2: Mentor Views Student Analysis**

1. Go to http://localhost:3000
2. Click **"I am a Mentor"** → **"View Students"**
3. Click on any student card to view details
4. ✅ You should see:
   - Domain scores (from ML model)
   - **SHAP chart** showing feature contributions (XAI Point 1)
   - Academic performance
   - Mentor feedback form

### **Test 3: Download PDF Report**

1. While viewing a student, click **"📄 Download PDF"**
2. ✅ A PDF should download with:
   - Student info
   - Domain scores with progress bars
   - SHAP feature contributions
   - Academic stats

### **Test 4: Global Feature Importance (XAI Point 3)**

1. In mentor dashboard, click **"Analytics"** tab
2. Scroll down to **"Global Feature Importance (XAI)"** section
3. ✅ You should see:
   - Top 10 features that matter most for domain predictions
   - Ranked by importance percentage
   - Visual bars showing relative importance

---

## 📊 Sample Test Data

For testing, you can create a student with these values:

**Student Info:**
- Name: Rohit Sharma
- Email: rohit@example.com
- Enrollment: EN2024001
- Semester: 5
- Branch: CS

**Marks:**
- Internet Programming: 88
- Computer Network Security: 72
- Entrepreneurship: 65
- Software Engineering: 80
- GPA: 8.5

**Skills:**
- Math Comfort: 8
- Programming Comfort: 7
- Problem Solving: 8
- Communication: 6
- Hackathons: 2
- Clubs: 1
- Competitions: 3

**Project:**
- Title: Image Classifier
- Domain: Machine Learning
- Difficulty: 4
- Technologies: Python, TensorFlow
- GitHub: https://github.com/example/classifier

---

## 🔧 Troubleshooting

### Database Connection Error
```
ERROR: psycopg2.OperationalError: could not connect
```
**Fix:** Make sure Docker is running and database container is up:
```bash
docker-compose up -d
docker ps  # Should show student_analytics_db
```

### CORS Error in Frontend
```
Access to fetch has been blocked by CORS policy
```
**Fix:** Backend CORS is already configured for `http://localhost:3000`. Verify backend is running on port 8000.

### ML Model Not Loading
```
FileNotFoundError: [Errno 2] No such file or directory: 'ml/models/domain_model.joblib'
```
**Fix:** Train the ML model first:
```bash
cd ml
python train_model.py
```

### Frontend API Errors
If API calls fail, the app will:
- Use mock data for demo purposes
- Show loading/error states
- Log errors to browser console (F12 → Console tab)

---

## 📁 Project Structure

```
student-analytics/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── students.py     # Student CRUD endpoints
│   │   │   └── predictions.py  # ML prediction + SHAP endpoints
│   │   ├── services/
│   │   │   └── ml_service.py   # ML model loading + inference
│   │   ├── models/
│   │   │   └── models.py       # SQLAlchemy database models
│   │   └── schemas.py          # Pydantic validation schemas
│   └── main.py                 # FastAPI app entry point
├── frontend/
│   ├── app/
│   │   ├── page.tsx           # Home page
│   │   ├── student/dashboard/ # Student dashboard
│   │   └── mentor/dashboard/  # Mentor dashboard
│   └── lib/
│       ├── api.ts             # API service layer
│       └── generatePDF.ts     # PDF generation utility
├── ml/
│   ├── train_model.py         # Model training script
│   ├── data/
│   │   └── students_dataset.csv
│   └── models/
│       ├── domain_model.joblib
│       ├── scaler.joblib
│       └── feature_columns.joblib
└── docker-compose.yml         # PostgreSQL database setup
```

---

## 🎯 What's Next?

### Still TODO (Optional):
1. **Authentication System**
   - Login functionality (currently students/mentors are hardcoded)
   - JWT tokens
   - Protected routes

2. **XAI Point 2** (Student Plain English Explanations)
   - Convert SHAP values to plain English sentences
   - Show in student dashboard

3. **Real-time Updates**
   - WebSocket notifications when mentor adds feedback
   - Live domain score updates

4. **Data Validation**
   - Form validation
   - Error handling improvements

---

## 🎉 Demo Highlights

### For Panel Presentation:

1. **Show the workflow:**
   - Student enters data → Auto ML prediction → Mentor reviews → PDF report

2. **Highlight XAI:**
   - Individual SHAP chart: "Programming comfort boosted ML score by +3.5"
   - Global importance: "Math comfort is the #1 predictor across all students"

3. **Demo PDF download:**
   - One-click professional report generation

4. **Show scalability:**
   - Analytics tab with trends across multiple students

---

## 🐛 Known Issues

1. **Student ID Hardcoded**: Currently `studentId = 1` is hardcoded. Need auth system.
2. **Mock Data Fallback**: Mentor dashboard uses mock students if API fails (good for demo!)
3. **Docker on Windows**: May need to start Docker Desktop manually before `docker-compose up`

---

## 📚 API Documentation

Once backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

Test all endpoints directly from the browser!

---

**Good luck with your demo! 🚀**
