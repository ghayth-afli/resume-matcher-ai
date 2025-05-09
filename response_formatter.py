import json
import logging

logger = logging.getLogger(__name__)

class ResponseFormatter:
    """
    Utility class to format the API response according to the required template.
    """
    
    @staticmethod
    def format_response(match_result):
        """
        Format the response to match the required template.
        
        Args:
            match_result: Result from the job matcher
            
        Returns:
            Formatted response in the required template
        """
        try:
            # Create formatted response - ensuring it follows the exact required template structure
            formatted_response = {
                "match_result": match_result
            }
            
            return formatted_response
            
        except Exception as e:
            logger.error(f"Error formatting response: {e}")
            # Return a minimal response if formatting fails
            return {
                "match_score": 0.0
            }
