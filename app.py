import os
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from resume_parser import ResumeParser
from job_matcher import JobMatcher
from role_evaluator import RoleEvaluator
from response_formatter import ResponseFormatter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for integration with Angular frontend

# Initialize service components
resume_parser = ResumeParser()
job_matcher = JobMatcher()
role_evaluator = RoleEvaluator()
response_formatter = ResponseFormatter()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify the service is running."""
    return jsonify({"status": "healthy", "service": "ai-resume-matcher", "version": "1.0.0"}), 200

@app.route('/api/v1/match', methods=['POST'])
def match_resume():
    """
    Process a resume and job description, then return a match score and parsed data.
    Uses standardized evaluation criteria with role-specific adaptations.
    
    Expected input format:
    {
        "resume": "Base64 encoded resume file or plain text",
        "resume_type": "pdf/docx/txt", 
        "job_description": { ... },  // Full job description object
        "job_id": "J12345678",       // Optional job ID
        "company_info": { ... }      // Optional company info
    }
    """
    try:
        # Validate request
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
        
        data = request.get_json()
        
        # Check for required fields
        if 'resume' not in data:
            return jsonify({"error": "Missing required field: resume"}), 400
        if 'job_description' not in data:
            return jsonify({"error": "Missing required field: job_description"}), 400
        
        # Extract data
        resume_content = data['resume']
        resume_type = data.get('resume_type', 'txt')
        job_description = data['job_description']
        job_id = data.get('job_id', '')
        company_info = data.get('company_info', {})
        
        # Process resume
        logger.info(f"Processing resume of type {resume_type}")
        parsed_resume = resume_parser.parse(resume_content, resume_type)
        
        # Calculate match score using standardized criteria
        logger.info("Calculating match score using standardized criteria")
        match_result = job_matcher.calculate_match(parsed_resume, job_description)
        
        # Apply role-specific adaptations
        logger.info("Applying role-specific adaptations to evaluation")
        adapted_result = role_evaluator.adapt_evaluation(job_description, match_result)
        # Format response according to required template
        logger.info("Formatting final response")
        formatted_response = response_formatter.format_response(adapted_result)
        
        # Add job ID if provided
        if job_id:
            formatted_response["job_info"]["job_id"] = job_id
        
        return jsonify(formatted_response), 200
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return jsonify({"error": "An internal error occurred while processing the request"}), 500

@app.route('/api/v1/parse-resume', methods=['POST'])
def parse_resume_only():
    """
    Parse a resume without matching to a job description.
    
    Expected input format:
    {
        "resume": "Base64 encoded resume file or plain text",
        "resume_type": "pdf/docx/txt"
    }
    """
    try:
        # Validate request
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
        
        data = request.get_json()
        
        # Check for required fields
        if 'resume' not in data:
            return jsonify({"error": "Missing required field: resume"}), 400
        
        # Extract data
        resume_content = data['resume']
        resume_type = data.get('resume_type', 'txt')
        
        # Process resume
        logger.info(f"Processing resume of type {resume_type}")
        parsed_resume = resume_parser.parse(resume_content, resume_type)
        
        return jsonify(parsed_resume), 200
        
    except Exception as e:
        logger.error(f"Error parsing resume: {str(e)}", exc_info=True)
        return jsonify({"error": "An internal error occurred while parsing the resume"}), 500

@app.route('/api/v1/evaluate-role', methods=['POST'])
def evaluate_role():
    """
    Determine the role type and provide adapted evaluation criteria.
    
    Expected input format:
    {
        "job_description": { ... }  // Full job description object
    }
    """
    try:
        # Validate request
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
        
        data = request.get_json()
        
        # Check for required fields
        if 'job_description' not in data:
            return jsonify({"error": "Missing required field: job_description"}), 400
        
        # Extract data
        job_description = data['job_description']
        
        # Determine role type
        role_info = role_evaluator.determine_role_type(job_description)
        
        # Get adapted criteria
        adapted_criteria = role_evaluator.get_adapted_evaluation_criteria(role_info["role_type"])
        
        # Combine results
        result = {
            "role_type": role_info["role_type"],
            "confidence": role_info["confidence"],
            "justification": role_info["justification"],
            "adapted_criteria": adapted_criteria["criteria"]
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error evaluating role: {str(e)}", exc_info=True)
        return jsonify({"error": "An internal error occurred while evaluating the role"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)