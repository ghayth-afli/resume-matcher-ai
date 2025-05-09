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

class RoleEvaluator:
    """
    Handles role-specific evaluation adaptations based on job type/industry.
    """
    
    def __init__(self):
        """Initialize the Role Evaluator with Gemini model."""
        try:
            # Use Gemini Pro model for text processing
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        except Exception as e:
            logger.error(f"Failed to initialize Gemini model: {e}")
            raise
    
    def determine_role_type(self, job_description):
        """
        Determine the role type based on the job description.
        
        Args:
            job_description: Job description data
            
        Returns:
            Role type and relevant adapted criteria
        """
        try:
            # Convert input to JSON string for the prompt
            job_json = json.dumps(job_description)
            
            prompt = f"""
            You are an expert in job classification. Based on the following job description, 
            determine which category the role falls into. Choose ONE of these categories:
            
            1. Engineering/Technical
            2. Marketing/Sales
            3. Design/Creative
            4. Leadership/Management
            5. Healthcare/Medical
            6. Finance/Accounting
            7. Legal
            8. Education/Training
            9. Customer Service/Support
            10. Other (specify)
            
            Job Description:
            ```json
            {job_json}
            ```
            
            Return ONLY a JSON with this format:
            {{
                "role_type": "Engineering/Technical",
                "confidence": 0.95, 
                "justification": "The job focuses on backend engineering, requires technical skills like Java, cloud platforms, and software development."
            }}
            """
            
            response = self.model.generate_content(prompt)
            result_text = response.text.strip()
            
            # Extract and clean JSON
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]
            result_text = result_text.strip()
            
            role_data = json.loads(result_text)
            return role_data
            
        except Exception as e:
            logger.error(f"Error determining role type: {e}")
            return {"role_type": "Other", "confidence": 0.5, "justification": "Error in processing"}
    
    def get_adapted_evaluation_criteria(self, role_type):
        """
        Get adapted evaluation criteria based on role type.
        
        Args:
            role_type: The type of role determined
            
        Returns:
            Adapted evaluation criteria
        """
        # Default criteria
        default_criteria = {
            "criteria": [
                {"name": "Skills Match", "weight": 35},
                {"name": "Relevant Experience", "weight": 25},
                {"name": "Education", "weight": 10},
                {"name": "Certifications", "weight": 10},
                {"name": "Cultural Fit", "weight": 10},
                {"name": "Language Proficiency", "weight": 5},
                {"name": "Achievements/Projects", "weight": 5}
            ]
        }
        
        # Role-specific adaptations
        adaptations = {
            "Engineering/Technical": {
                "criteria": [
                    {"name": "Technical Skills Match", "weight": 40},
                    {"name": "Relevant Experience", "weight": 20},
                    {"name": "Problem Solving Capability", "weight": 10},
                    {"name": "Education", "weight": 10},
                    {"name": "Technical Certifications", "weight": 10},
                    {"name": "Development Tools/Frameworks", "weight": 5},
                    {"name": "Open Source Contributions", "weight": 5}
                ]
            },
            "Marketing/Sales": {
                "criteria": [
                    {"name": "Skills Match", "weight": 30},
                    {"name": "Results & Metrics", "weight": 25},
                    {"name": "Relevant Experience", "weight": 20},
                    {"name": "Communication Skills", "weight": 10},
                    {"name": "Industry Knowledge", "weight": 5},
                    {"name": "Education", "weight": 5},
                    {"name": "CRM/Tool Experience", "weight": 5}
                ]
            },
            "Design/Creative": {
                "criteria": [
                    {"name": "Portfolio Quality", "weight": 35},
                    {"name": "Technical Skills Match", "weight": 25},
                    {"name": "Relevant Experience", "weight": 15},
                    {"name": "Creativity & Innovation", "weight": 10},
                    {"name": "Communication Skills", "weight": 5},
                    {"name": "Tools/Software Mastery", "weight": 5},
                    {"name": "Education", "weight": 5}
                ]
            },
            "Leadership/Management": {
                "criteria": [
                    {"name": "Leadership Experience", "weight": 30},
                    {"name": "Team Management", "weight": 20},
                    {"name": "Strategic Vision", "weight": 15},
                    {"name": "Industry Experience", "weight": 15},
                    {"name": "Skills Match", "weight": 10},
                    {"name": "Education", "weight": 5},
                    {"name": "Communication Skills", "weight": 5}
                ]
            },
            "Healthcare/Medical": {
                "criteria": [
                    {"name": "Certifications & Licenses", "weight": 25},
                    {"name": "Clinical Experience", "weight": 25},
                    {"name": "Skills Match", "weight": 20},
                    {"name": "Education", "weight": 15},
                    {"name": "Compliance Knowledge", "weight": 10},
                    {"name": "Interpersonal Skills", "weight": 5}
                ]
            }
        }
        
        return adaptations.get(role_type, default_criteria)
    
    def adapt_evaluation(self, job_description, standard_evaluation):
        """
        Adapt the standard evaluation based on role type.
        
        Args:
            job_description: Job description data
            standard_evaluation: Standard evaluation result
            
        Returns:
            Adapted evaluation with role-specific insights
        """
        try:
            # Determine role type
            role_info = self.determine_role_type(job_description)
            role_type = role_info["role_type"]
            
            # Get adapted criteria
            adapted_criteria = self.get_adapted_evaluation_criteria(role_type)
            
            # Create adapted evaluation
            adapted_evaluation = standard_evaluation.copy()
            adapted_evaluation["role_type"] = role_type
            adapted_evaluation["role_confidence"] = role_info["confidence"]
            adapted_evaluation["adapted_criteria"] = adapted_criteria["criteria"]
            
            # Add role-specific insights based on the role type
            job_json = json.dumps(job_description)
            evaluation_json = json.dumps(standard_evaluation)
            
            prompt = f"""
            You are an expert in recruitment for {role_type} roles. Review this job description and evaluation:
            
            Job Description:
            ```json
            {job_json}
            ```
            
            Standard Evaluation:
            ```json
            {evaluation_json}
            ```
            
            Provide 3-5 role-specific insights based on the candidate's match for this {role_type} position.
            These should be tailored specifically to this type of role and highlight areas of strength or 
            opportunity for improvement.
            
            For example, for Engineering roles you might comment on their coding experience, problem-solving abilities,
            or technical stack alignment.
            
            Return ONLY a JSON with this format:
            {{
                "role_specific_insights": [
                    "The candidate's experience with Java and Spring Boot aligns perfectly with the backend stack requirements",
                    "While the candidate meets technical requirements, they lack experience with the specific cloud platform (AWS) mentioned in the job description",
                    "The candidate's contributions to open source projects demonstrate initiative and collaborative coding skills"
                ]
            }}
            """
            
            response = self.model.generate_content(prompt)
            result_text = response.text.strip()
            
            # Extract and clean JSON
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]
            result_text = result_text.strip()
            
            insights_data = json.loads(result_text)
            adapted_evaluation["role_specific_insights"] = insights_data.get("role_specific_insights", [])
            
            return adapted_evaluation
            
        except Exception as e:
            logger.error(f"Error adapting evaluation: {e}")
            return standard_evaluation  # Return standard evaluation if adaptation fails