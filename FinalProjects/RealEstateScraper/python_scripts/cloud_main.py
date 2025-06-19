#!/usr/bin/env python3
"""
CloudScraper-based Real Estate Property Image Scraper

This script extracts and saves property images from real estate listing URLs in a CSV file
using CloudScraper to bypass Cloudflare protection.
"""

import os
import argparse
import pandas as pd
from time import sleep
from tqdm import tqdm
from cloud_scraper import CloudScraperPropertyScraper
from utils import setup_logging, create_directory, generate_report

# Setup command line arguments
def parse_arguments():
    parser = argparse.ArgumentParser(description='Scrape images from real estate listings using CloudScraper')
    parser.add_argument('--csv', '-c', type=str, default='data_bds.csv',
                        help='Path to CSV file containing property URLs')
    parser.add_argument('--output', '-o', type=str, default='cloud_output',
                        help='Directory to save scraped images')
    parser.add_argument('--limit', '-l', type=int, default=None,
                        help='Limit the number of URLs to scrape')
    parser.add_argument('--delay', '-d', type=float, default=3.0,
                        help='Delay between requests in seconds')
    parser.add_argument('--retries', '-r', type=int, default=4,
                        help='Number of retries for failed requests')
    parser.add_argument('--timeout', '-t', type=int, default=45,
                        help='Timeout for requests in seconds')
    return parser.parse_args()

def main():
    # Parse command line arguments
    args = parse_arguments()
    
    # Setup logging
    logger = setup_logging()
    logger.info(f"Starting CloudScraper-based property image scraper")
    
    # Create output directory
    output_dir = create_directory(args.output)
    logger.info(f"Images will be saved to: {output_dir}")
    
    # Read CSV file
    try:
        df = pd.read_csv(args.csv)
        logger.info(f"Successfully loaded {len(df)} property listings from {args.csv}")
    except Exception as e:
        logger.error(f"Failed to read CSV file: {str(e)}")
        return
    
    # Check if 'Link' column exists
    if 'Link' not in df.columns:
        logger.error("CSV file does not contain a 'Link' column")
        return
    
    # Apply limit if specified
    urls = df['Link'].tolist()
    if args.limit:
        urls = urls[:args.limit]
        logger.info(f"Limiting to {args.limit} URLs")
    
    # Create scraper instance
    scraper = CloudScraperPropertyScraper(
        output_dir=output_dir,
        retry_count=args.retries,
        timeout=args.timeout,
        logger=logger
    )
    
    # Track results
    results = {
        'success': 0,
        'failed': 0,
        'total_images': 0,
        'details': []
    }
    
    # Process each URL
    logger.info(f"Starting to scrape {len(urls)} URLs")
    for index, url in enumerate(tqdm(urls, desc="Scraping properties")):
        try:
            # Try to get property ID from URL
            property_id = url.split('pr')[-1] if 'pr' in url else f"property_{index}"
            
            # Get property title from dataframe
            property_title = df.loc[df['Link'] == url, 'Tiêu đề'].values[0] if 'Tiêu đề' in df.columns else f"Property {property_id}"
            
            # Scrape images for this URL
            result = scraper.scrape_property(url, property_id, property_title)
            
            # Update results
            if result['success']:
                results['success'] += 1
                results['total_images'] += result['image_count']
            else:
                results['failed'] += 1
            results['details'].append(result)
            
            # Sleep to avoid overloading the server
            sleep(args.delay)
        
        except Exception as e:
            logger.error(f"Error processing URL {url}: {str(e)}")
            results['failed'] += 1
            results['details'].append({
                'url': url,
                'property_id': f"property_{index}",
                'success': False,
                'error': str(e),
                'image_count': 0
            })
    
    # Generate report
    generate_report(results, output_dir, logger)
    
    # Print summary
    logger.info(f"Scraping completed: {results['success']} successful, {results['failed']} failed")
    logger.info(f"Total images scraped: {results['total_images']}")
    logger.info(f"Results saved to {output_dir}")

if __name__ == "__main__":
    main()