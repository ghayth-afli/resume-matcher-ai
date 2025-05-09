import os
import base64
import json
import logging
import tempfile
from pathlib import Path
import google.generativeai as genai
from PyPDF2 import PdfReader
import docx2txt
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


class ResumeParser:
    def __init__(self):
        """Initialize the Resume Parser with Gemini model."""
        try:
            # Use Gemini Pro model for text processing
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        except Exception as e:
            logger.error(f"Failed to initialize Gemini model: {e}")
            raise

    def extract_text_from_file(self, file_content, file_type):
        """
        Extract plain text from various file formats.

        Args:
            file_content: Base64 encoded file content
            file_type: File type (pdf, docx, txt)

        Returns:
            Plain text extracted from the file
        """
        try:
            # Decode base64 content
            decoded_content = base64.b64decode(file_content)

            # Process based on file type
            if file_type.lower() == 'txt':
                return decoded_content.decode('utf-8')

            # Create temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{file_type}') as temp_file:
                temp_file.write(decoded_content)
                temp_file_path = temp_file.name

            text = ""
            try:
                if file_type.lower() == 'pdf':
                    # Extract text from PDF
                    pdf = PdfReader(temp_file_path)
                    for page in pdf.pages:
                        text += page.extract_text()

                elif file_type.lower() == 'docx':
                    # Extract text from DOCX
                    text = docx2txt.process(temp_file_path)

                else:
                    raise ValueError(f"Unsupported file type: {file_type}")

            finally:
                # Clean up temp file
                os.unlink(temp_file_path)

            return text

        except Exception as e:
            logger.error(f"Error extracting text from {file_type} file: {e}")
            raise

    def parse(self, resume_content, resume_type='txt'):
        """
        Parse resume content using Gemini API.

        Args:
            resume_content: Base64 encoded file or plain text
            resume_type: File type (pdf, docx, txt)

        Returns:
            Structured resume data
        """
        try:
            # Extract text if not already plain text
            if resume_type != 'txt' or (
                    resume_type == 'txt' and resume_content.startswith("data:") or resume_content.startswith("JVBERi")):
                resume_text = self.extract_text_from_file(resume_content, resume_type)
            else:
                resume_text = resume_content

            # Define the prompt for Gemini
            prompt = f"""
            You are an expert resume parser. Analyze the following resume and extract structured information.

            Resume text:
            ```
            {resume_text}
            ```

            Extract the following information in a structured JSON format:
            1. Candidate's personal information (name, email, phone, location, etc.)
            2. Skills (both technical and soft skills)
            3. Work experience (company names, titles, dates, responsibilities)
            4. Education (degrees, institutions, dates)
            5. Certifications and licenses
            6. Languages spoken
            7. Projects (if any)

            Output the structured data in the following JSON format:
            {{
                "candidate_info": {{
                    "name": "",
                    "email": "",
                    "phone": "",
                    "location": {{
                        "city": "",
                        "state": "",
                        "country": ""
                    }},
                    "linkedin": "",
                    "website": ""
                }},
                "skills": {{
                    "technical": [],
                    "soft": []
                }},
                "experience": [
                    {{
                        "company": "",
                        "title": "",
                        "location": "",
                        "start_date": "",
                        "end_date": "",
                        "responsibilities": [],
                        "achievements": []
                    }}
                ],
                "education": [
                    {{
                        "degree": "",
                        "field_of_study": "",
                        "institution": "",
                        "location": "",
                        "start_date": "",
                        "end_date": "",
                    }}
                ],
                "certifications": [
                    {{
                        "name": "",
                        "issuer": "",
                        "date": "",
                        "expires": ""
                    }}
                ],
                "languages": [
                    {{
                        "language": "",
                        "proficiency": ""
                    }}
                ],
                "projects": [
                    {{
                        "name": "",
                        "description": "",
                        "technologies": [],
                        "url": ""
                    }}
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
            parsed_data = json.loads(result_text)
            return parsed_data

        except Exception as e:
            logger.error(f"Error parsing resume: {e}")
            # Return a minimal structure if parsing fails
            return {
                "candidate_info": {"name": "Parsing Error", "email": ""},
                "skills": {"technical": [], "soft": []},
                "experience": [],
                "education": [],
                "certifications": [],
                "languages": [],
                "projects": []
            }