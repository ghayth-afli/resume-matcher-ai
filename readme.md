# AI Resume Matching Microservice

A powerful microservice that uses AI to match resumes with job descriptions, providing detailed scoring and analysis for recruitment professionals.

## 🚀 Overview

This microservice leverages Google's Gemini AI to provide sophisticated resume parsing and job matching capabilities. The system analyzes resumes against job descriptions using standardized evaluation criteria with role-specific adaptations for more accurate matching results.

## ✨ Features

- **Resume Parsing**: Extract structured data from PDF, DOCX, and plain text resumes
- **Intelligent Job Matching**: Score resumes against job descriptions with a comprehensive weighted scoring system
- **Role-Specific Evaluation**: Automatically adapt evaluation criteria based on job type/industry
- **Detailed Analysis**: Receive comprehensive match reports with strengths, weaknesses, and specific insights
- **Red Flags & Bonus Points**: Identify potential concerns and standout qualities in candidates

## 🏗️ Architecture

The microservice is built with a modular architecture consisting of:

1. **API Layer** (`app.py`): Flask-based REST API for handling client requests
2. **Resume Parser** (`resume_parser.py`): Extracts structured data from various resume formats
3. **Job Matcher** (`job_matcher.py`): Calculates match scores using standardized criteria
4. **Role Evaluator** (`role_evaluator.py`): Adapts evaluation based on job types
5. **Response Formatter** (`response_formatter.py`): Formats responses according to required templates

## 🛠️ Technologies Used

- **Flask**: Lightweight web framework for the API
- **Google Gemini AI**: AI model for natural language processing tasks
- **PyPDF2 & docx2txt**: Libraries for extracting text from files
- **OpenTelemetry**: For observability and monitoring
- **Prometheus**: For metrics collection

## 🔧 Installation

### Prerequisites

- Python 3.9+
- Google API Key for Gemini

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/ghayth-afli/resume-matcher-ai.git
cd ai-resume-matcher
```

2. **Create a virtual environment**

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**

```bash
pip install -r requirements.txt
```

4. **Set up environment variables**

Create a `.env` file in the project root:

```
GOOGLE_API_KEY=your_google_api_key
PORT=5000
LOG_LEVEL=INFO
```

## 🚀 Running the Service

### Development Mode

```bash
python app.py
```

### Production Mode

```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## 📡 API Endpoints

### Health Check

```
GET /health
```

Response:

```json
{
  "status": "healthy",
  "service": "ai-resume-matcher",
  "version": "1.0.0"
}
```

### Resume-Job Matching

```
POST /api/v1/match
```

Request Body:

```json
{
  "resume": "Base64 encoded resume file or plain text",
  "resume_type": "pdf/docx/txt",
  "job_description": {
    "title": "Software Engineer",
    "description": "...",
    "requirements": ["..."],
    "responsibilities": ["..."]
  },
  "job_id": "J12345678",
  "company_info": {
    "name": "Example Corp",
    "industry": "Technology"
  }
}
```

Response:

```json
{
  "match_result": {
    "score": 0.85,
    "raw_score": 85,
    "interpretation": "Excellent Fit – Highly recommended",
    "details": {
      "skills_match": {
        "raw_score": 9,
        "weighted_score": 31.5,
        "matching_skills": ["Java", "Spring Boot"],
        "missing_skills": ["Kubernetes"],
        "analysis": "The candidate has strong Java skills but lacks Kubernetes experience."
      },
      ...
    },
    "red_flags": ["Six-month employment gap between 2022-2023 with no explanation"],
    "bonus_points": ["Experience at top tech company (3 points)"],
    "role_type": "Engineering/Technical",
    "role_confidence": 0.95,
    "role_specific_insights": [
      "The candidate's experience with Java and Spring Boot aligns perfectly with the backend stack requirements"
    ]
  }
}
```

### Parse Resume Only

```
POST /api/v1/parse-resume
```

Request Body:

```json
{
  "resume": "Base64 encoded resume file or plain text",
  "resume_type": "pdf/docx/txt"
}
```

### Evaluate Role

```
POST /api/v1/evaluate-role
```

Request Body:

```json
{
  "job_description": {
    "title": "Software Engineer",
    "description": "...",
    "requirements": ["..."],
    "responsibilities": ["..."]
  }
}
```

## 🔍 Evaluation Criteria

### Standard Evaluation Criteria

| Criterion             | Weight | Description                                              |
| --------------------- | ------ | -------------------------------------------------------- |
| Skills Match          | 35%    | Alignment of technical, soft, and domain-specific skills |
| Relevant Experience   | 25%    | Years and type of work experience related to the role    |
| Education             | 10%    | Degree level, field of study, and institution relevance  |
| Certifications        | 10%    | Relevant professional certifications                     |
| Cultural Fit          | 10%    | Alignment with company values and team environment       |
| Language Proficiency  | 5%     | Required language fluency                                |
| Achievements/Projects | 5%     | Notable accomplishments and projects                     |

### Role-Specific Adaptations

The system automatically adapts evaluation criteria based on job type:

- **Engineering/Technical**: Emphasizes technical skills and problem-solving
- **Marketing/Sales**: Prioritizes results, metrics, and communication skills
- **Design/Creative**: Values portfolio quality and creativity
- **Healthcare/Medical**: Focuses on certifications, licenses, and clinical experience
- **Leadership/Management**: Emphasizes leadership experience and strategic vision

## 📊 Interpretation Scale

- **85-100**: Excellent Fit – Highly recommended
- **70-84**: Good Fit – Strong candidate, minor gaps
- **50-69**: Moderate Fit – May need development/support
- **Below 50**: Poor Fit – Likely not a match

## 📝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📬 Contact

For questions or support, please contact [mohamed.ghayth12@gmail.com](mailto:mohamed.ghayth12@gmail.com).
