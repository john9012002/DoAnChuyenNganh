"""
Utility functions for the property image scraper.
"""

import os
import logging
import requests
import json
from datetime import datetime
from PIL import Image
from io import BytesIO

def setup_logging():
    """
    Set up logging configuration
    
    Returns:
        logging.Logger: Configured logger instance
    """
    # Create logs directory if it doesn't exist
    if not os.path.exists('logs'):
        os.makedirs('logs')
    
    # Configure logger
    logger = logging.getLogger('property_scraper')
    logger.setLevel(logging.INFO)
    
    # Create handlers
    file_handler = logging.FileHandler(
        f"logs/scraper_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
    )
    console_handler = logging.StreamHandler()
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(levelname)s - %(message)s'
    )
    
    # Set formatter for handlers
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    # Add handlers to logger
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger

def create_directory(directory_path):
    """
    Create directory if it doesn't exist
    
    Args:
        directory_path (str): Path to directory
    
    Returns:
        str: Absolute path to created directory
    """
    # Convert to absolute path
    abs_path = os.path.abspath(directory_path)
    
    # Create directory if it doesn't exist
    if not os.path.exists(abs_path):
        os.makedirs(abs_path)
    
    return abs_path

def save_image(image_url, save_path, headers, timeout, retry_count):
    """
    Download and save an image
    
    Args:
        image_url (str): URL of the image
        save_path (str): Path to save the image
        headers (dict): HTTP headers for request
        timeout (int): Request timeout in seconds
        retry_count (int): Number of retries for failed requests
    
    Returns:
        bool: True if image was saved successfully, False otherwise
    """
    for attempt in range(retry_count + 1):
        try:
            response = requests.get(image_url, headers=headers, timeout=timeout)
            response.raise_for_status()
            
            # Process image
            img = Image.open(BytesIO(response.content))
            
            # Save image
            img.save(save_path, quality=95)
            return True
            
        except requests.RequestException as e:
            if attempt < retry_count:
                continue
            # Log error on final attempt
            logging.warning(f"Failed to download image {image_url}: {str(e)}")
        except Exception as e:
            logging.warning(f"Failed to process image {image_url}: {str(e)}")
            
    return False

def generate_report(results, output_dir, logger):
    """
    Generate a report of the scraping results
    
    Args:
        results (dict): Scraping results
        output_dir (str): Output directory
        logger (logging.Logger): Logger instance
    """
    # Create report file
    report_path = os.path.join(output_dir, 'scraping_report.json')
    
    # Add timestamp to results
    results['timestamp'] = datetime.now().isoformat()
    
    # Write report to file
    try:
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Report generated at {report_path}")
        
        # Create a human-readable summary
        summary_path = os.path.join(output_dir, 'summary.txt')
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write("Property Image Scraping Summary\n")
            f.write("==============================\n\n")
            f.write(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Total URLs processed: {results['success'] + results['failed']}\n")
            f.write(f"Successful: {results['success']}\n")
            f.write(f"Failed: {results['failed']}\n")
            f.write(f"Total images downloaded: {results['total_images']}\n\n")
            
            f.write("Successful Properties:\n")
            successful = [p for p in results['details'] if p['success']]
            for prop in successful:
                f.write(f"- {prop['property_id']}: {prop['image_count']} images\n")
            
            f.write("\nFailed Properties:\n")
            failed = [p for p in results['details'] if not p['success']]
            for prop in failed:
                f.write(f"- {prop['property_id']}: {prop['error']}\n")
        
        logger.info(f"Summary generated at {summary_path}")
        
    except Exception as e:
        logger.error(f"Failed to generate report: {str(e)}")
