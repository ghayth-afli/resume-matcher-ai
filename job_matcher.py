import os
import json
import logging
import google.generativeai as genai
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Gemini API
try:
    GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
    if not GOOGLE_API_KEY:
        logger.warning("GOOGLE_API_KEY environment variable not set")
    
    genai.configure(api_key=GOOGLE_API_KEY)
except Exception as e:
    logger.error(f"Error initializing Gemini API: {e}")

class JobMatcher:
    def __init__(self):
        """Initialize the Job Matcher with Gemini model."""
        try:
            # Use Gemini Pro model for text processing
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        except Exception as e:
            logger.error(f"Failed to initialize Gemini model: {e}")
            raise

    def calculate_match(self, parsed_resume, job_description):
        """
        Calculate the match score between a parsed resume and job description using the defined evaluation rules.
        
        Args:
            parsed_resume: Structured resume data as returned by ResumeParser
            job_description: Job description data
            
        Returns:
            Match score and detailed analysis based on standard evaluation criteria
        """
        try:
            # Convert inputs to JSON strings for the prompt
            resume_json = json.dumps(parsed_resume)
            job_json = json.dumps(job_description)
            
            # Define the prompt for Gemini with the evaluation rules
            prompt = f"""
            You are an expert AI recruitment assistant. Analyze the match between a candidate's resume and job description using the following standardized evaluation criteria:

            Resume Data:
            ```json
            {resume_json}
            ```
            
            Job Description:
            ```json
            {job_json}
            ```
            
            Use this precise scoring system:
            
            1. Skills Match (35% weight): Alignment of technical, soft, and domain-specific skills with job requirements
            2. Relevant Experience (25% weight): Years and type of work experience related to the role or industry
            3. Education (10% weight): Degree level, field of study, and institution relevance
            4. Certifications (10% weight): Relevant professional certifications that enhance qualifications
            5. Cultural Fit (10% weight): Alignment with company values, mission, and team environment
            6. Language Proficiency (5% weight): Required language fluency for communication and documentation
            7. Achievements/Projects (5% weight): Notable accomplishments, publications, or standout projects
            
            For each criterion:
            - Rate on a 0-10 scale
            - Calculate weighted score: (Criterion Score / 10) × Weight
            - Sum all weighted scores for final score out of 100
            
            Interpretation scale:
            - 85-100: Excellent Fit – Highly recommended
            - 70-84: Good Fit – Strong candidate, minor gaps
            - 50-69: Moderate Fit – May need development/support
            - Below 50: Poor Fit – Likely not a match
            
            Also identify:
            - Red Flags: Employment gaps, missing required skills, inconsistencies, unprofessional formatting 
            - Bonus Points (1-5 each): Top company experience, leadership roles, extra certifications, portfolio/GitHub, awards
            
            Return a JSON response in the following format:
            {{
                "score": 85,  # Overall score out of 100
                "interpretation": "Excellent Fit – Highly recommended",  # Based on score range
                "details": {{
                    "skills_match": {{
                        "raw_score": 9,  # Score out of 10
                        "weighted_score": 31.5,  # (9/10) * 35%
                        "matching_skills": ["Java", "Spring Boot"],  # List of matching skills
                        "missing_skills": ["Kubernetes"],  # List of required skills not found in resume
                        "analysis": "The candidate has strong Java skills but lacks Kubernetes experience."
                    }},
                    "relevant_experience": {{
                        "raw_score": 8,  # Score out of 10
                        "weighted_score": 20,  # (8/10) * 25%
                        "analysis": "The candidate has 4 years of experience in backend development which is slightly less than the required 5 years."
                    }},
                    "education": {{
                        "raw_score": 9,  # Score out of 10
                        "weighted_score": 9,  # (9/10) * 10%
                        "analysis": "The candidate has a Bachelor's degree in Computer Science which meets the requirements."
                    }},
                    "certifications": {{
                        "raw_score": 7,  # Score out of 10
                        "weighted_score": 7,  # (7/10) * 10%
                        "analysis": "The candidate has relevant certifications but is missing the preferred AWS certification."
                    }},
                    "cultural_fit": {{
                        "raw_score": 8,  # Score out of 10
                        "weighted_score": 8,  # (8/10) * 10%
                        "analysis": "The candidate's previous work environments and described approaches align well with company values."
                    }},
                    "language_proficiency": {{
                        "raw_score": 10,  # Score out of 10
                        "weighted_score": 5,  # (10/10) * 5%
                        "analysis": "The candidate meets all language requirements with professional English proficiency."
                    }},
                    "achievements_projects": {{
                        "raw_score": 9,  # Score out of 10
                        "weighted_score": 4.5,  # (9/10) * 5%
                        "analysis": "The candidate has several notable projects demonstrating relevant skills."
                    }}
                }},
                "red_flags": [
                    "Six-month employment gap between 2022-2023 with no explanation"
                ],
                "bonus_points": [
                    "Experience at top tech company (3 points)",
                    "Leadership role managing team of 5 developers (2 points)"
                ]
            }}
            
            Return ONLY the JSON without any additional text or explanations.
            """
            
            # Generate response from Gemini
            response = self.model.generate_content(prompt)
            
            # Extract JSON from response
            result_text = response.text
            # Clean up the response if needed to ensure valid JSON
            result_text = result_text.strip()
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]
            result_text = result_text.strip()
            
            # Parse JSON
            match_data = json.loads(result_text)
            
            # Convert score to standard 0.0-1.0 format for compatibility with outer API
            if "score" in match_data:
                # Store the original score for reference
                match_data["raw_score"] = match_data["score"]
                # Convert from 0-100 to 0.0-1.0
                match_data["score"] = match_data["score"] / 100.0
            else:
                match_data["score"] = 0.5
            
            return match_data
            
        except Exception as e:
            logger.error(f"Error calculating match score: {e}")
            # Return a default score if matching fails
            return {
                "score": 0.5,
                "raw_score": 50,
                "interpretation": "Moderate Fit – May need development/support",
                "details": {
                    "skills_match": {"raw_score": 5, "weighted_score": 17.5, "matching_skills": [], "missing_skills": [], "analysis": "Error in processing"},
                    "relevant_experience": {"raw_score": 5, "weighted_score": 12.5, "analysis": "Error in processing"},
                    "education": {"raw_score": 5, "weighted_score": 5, "analysis": "Error in processing"},
                    "certifications": {"raw_score": 5, "weighted_score": 5, "analysis": "Error in processing"},
                    "cultural_fit": {"raw_score": 5, "weighted_score": 5, "analysis": "Error in processing"},
                    "language_proficiency": {"raw_score": 5, "weighted_score": 2.5, "analysis": "Error in processing"},
                    "achievements_projects": {"raw_score": 5, "weighted_score": 2.5, "analysis": "Error in processing"}
                },
                "red_flags": ["Error processing candidate data"],
                "bonus_points": []
            }