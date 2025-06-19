"""
Property image scraper module for extracting images from real estate listings
using CloudScraper to bypass Cloudflare protection.
"""

import os
import time
import logging
import random
import cloudscraper
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from utils import save_image, create_directory

class CloudScraperPropertyScraper:
    """
    Class for scraping property images from real estate listing websites
    using CloudScraper to bypass Cloudflare protection
    """
    
    def __init__(self, output_dir, retry_count=3, timeout=30, logger=None):
        """
        Initialize the scraper with configuration parameters
        
        Args:
            output_dir (str): Directory to save images
            retry_count (int): Number of retries for failed requests
            timeout (int): Timeout for requests in seconds
            logger (logging.Logger): Logger instance
        """
        self.output_dir = output_dir
        self.retry_count = retry_count
        self.timeout = timeout
        self.logger = logger or logging.getLogger(__name__)
        
        # Create CloudScraper instance
        self.scraper = cloudscraper.create_scraper(
            browser={
                'browser': 'chrome',
                'platform': 'windows',
                'mobile': False
            },
            delay=5,
            debug=False
        )
        
        # Add additional headers
        self.scraper.headers.update({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://batdongsan.com.vn/',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0',
        })
    
    def fetch_url(self, url, retry_count=None):
        """
        Fetch URL content with retry mechanism
        
        Args:
            url (str): URL to fetch
            retry_count (int, optional): Number of retries. Defaults to class retry_count.
            
        Returns:
            requests.Response: Response object or None if all retries failed
        """
        if retry_count is None:
            retry_count = self.retry_count
            
        for attempt in range(retry_count + 1):
            try:
                self.logger.info(f"Fetching URL (attempt {attempt+1}/{retry_count+1}): {url}")
                
                # Add random delay to avoid detection
                if attempt > 0:
                    delay = random.uniform(2, 5) * (attempt + 1)
                    self.logger.info(f"Waiting for {delay:.2f}s before retry...")
                    time.sleep(delay)
                
                # Generate a somewhat random user agent for each attempt
                user_agents = [
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36",
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:95.0) Gecko/20100101 Firefox/95.0",
                    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"
                ]
                
                self.scraper.headers.update({
                    'User-Agent': random.choice(user_agents)
                })
                
                response = self.scraper.get(url, timeout=self.timeout)
                response.raise_for_status()
                
                # Check if we got a proper response with content
                if len(response.text) < 1000 or "Access denied" in response.text:
                    self.logger.warning(f"Possibly blocked. Content length: {len(response.text)}")
                    if attempt < retry_count:
                        continue
                
                return response
                
            except Exception as e:
                if attempt < retry_count:
                    self.logger.warning(f"Attempt {attempt + 1}/{retry_count + 1} failed for {url}: {str(e)}. Retrying...")
                else:
                    self.logger.error(f"Failed to fetch {url} after {retry_count + 1} attempts: {str(e)}")
                    return None
    
    def extract_images(self, soup, base_url):
        """
        Extract image URLs from the beautiful soup object
        
        Args:
            soup (BeautifulSoup): BeautifulSoup object of the page
            base_url (str): Base URL for resolving relative URLs
            
        Returns:
            list: List of image URLs
        """
        self.logger.info("Extracting images from page")
        image_urls = []
        
        # Look for image galleries (common in real estate sites)
        gallery_containers = soup.select('.re__pr-carousel-wrapper, .image-gallery, .property-images, .carousel-inner, .slider-wrapper, .js__product-detail-slider1, .product-detail-slider1, .pswp__zoom-wrap')
        
        # If specific gallery containers found, extract images from them
        if gallery_containers:
            self.logger.info(f"Found {len(gallery_containers)} gallery containers")
            for container in gallery_containers:
                for img in container.select('img'):
                    img_url = self._get_image_url(img, base_url)
                    if img_url:
                        image_urls.append(img_url)
        
        # If no images found in galleries, try to find any relevant images
        if not image_urls:
            self.logger.info("No images found in galleries, searching for other relevant images")
            # Look for images in the main content
            content_images = soup.select('.re__pr-carousel-item img, .content-area img, .property-detail img, .main-content img, .product-detail img, .pr-image')
            for img in content_images:
                img_url = self._get_image_url(img, base_url)
                if img_url and self._is_property_image(img_url):
                    image_urls.append(img_url)
        
        # If still no images, try to find any images that look like they might be property images
        if not image_urls:
            self.logger.info("Searching for any images that might be property related")
            # Get all images that are large enough to be property images
            for img in soup.select('img'):
                img_url = self._get_image_url(img, base_url)
                if img_url and self._is_property_image(img_url):
                    image_urls.append(img_url)
        
        # Remove duplicates and return
        image_urls = list(dict.fromkeys(image_urls))
        self.logger.info(f"Found {len(image_urls)} unique property images")
        return image_urls
    
    def _get_image_url(self, img_tag, base_url):
        """
        Extract image URL from an img tag, handling various attribute patterns
        
        Args:
            img_tag (BeautifulSoup.element): Image tag
            base_url (str): Base URL for resolving relative URLs
            
        Returns:
            str: Image URL or None if not found
        """
        # Check various image attributes in order of preference
        for attr in ['data-src', 'src', 'data-lazy-src', 'data-original', 'data-lazy']:
            if img_tag.get(attr):
                img_url = img_tag[attr]
                # Skip base64 encoded images
                if img_url and img_url.startswith('data:'):
                    continue
                # Make absolute URL if needed
                if img_url and not img_url.startswith(('http://', 'https://')):
                    img_url = urljoin(base_url, img_url)
                return img_url
        return None
    
    def _is_property_image(self, img_url):
        """
        Check if the image URL likely points to a property image
        
        Args:
            img_url (str): Image URL
            
        Returns:
            bool: True if likely a property image, False otherwise
        """
        if not img_url:
            return False
            
        # Skip common icons, logos, banners
        ignored_patterns = [
            '/icons/', '/logo', 'avatar', 'icon', 'thumb', 'banner', 
            'button', 'pixel.', 'tracking', 'favicon', 'loading.gif'
        ]
        
        for pattern in ignored_patterns:
            if pattern in img_url.lower():
                return False
        
        # Check image file extension
        parsed_url = urlparse(img_url)
        path = parsed_url.path.lower()
        
        # Only accept common image formats
        valid_extensions = ['.jpg', '.jpeg', '.png', '.webp']
        has_valid_ext = any(path.endswith(ext) for ext in valid_extensions)
        
        # If no extension, check if URL contains keywords suggesting it's an image
        if not has_valid_ext:
            img_indicators = ['image', 'photo', 'picture', 'img']
            has_img_indicator = any(indicator in img_url.lower() for indicator in img_indicators)
            return has_img_indicator
        
        return has_valid_ext
    
    def scrape_property(self, url, property_id, property_title):
        """
        Scrape images for a given property listing URL
        
        Args:
            url (str): Property listing URL
            property_id (str): Unique identifier for the property
            property_title (str): Title of the property
            
        Returns:
            dict: Result of the scraping operation
        """
        self.logger.info(f"Scraping property: {property_id} - {url}")
        
        result = {
            'url': url,
            'property_id': property_id,
            'property_title': property_title,
            'success': False,
            'image_count': 0,
            'error': None,
            'images': []
        }
        
        # Create directory for this property
        property_dir = os.path.join(self.output_dir, f"{property_id}")
        create_directory(property_dir)
        
        # Fetch URL
        response = self.fetch_url(url)
        if not response:
            result['error'] = "Failed to fetch URL"
            return result
        
        try:
            # Parse HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract images
            image_urls = self.extract_images(soup, url)
            
            # Save images
            for i, img_url in enumerate(image_urls):
                try:
                    img_filename = f"{property_id}_{i+1}.jpg"
                    img_path = os.path.join(property_dir, img_filename)
                    
                    # Download and save image
                    retry_count = 3
                    
                    # Use cloudscraper for image download too
                    try:
                        # Set referer in the scraper headers for this request
                        self.scraper.headers['Referer'] = url
                        
                        img_response = self.scraper.get(img_url, timeout=self.timeout)
                        img_response.raise_for_status()
                        
                        # Save image directly from response content
                        with open(img_path, 'wb') as f:
                            f.write(img_response.content)
                            
                        result['images'].append({
                            'url': img_url,
                            'saved_path': img_path,
                            'index': i+1
                        })
                        result['image_count'] += 1
                        self.logger.info(f"Saved image {i+1}/{len(image_urls)}: {img_path}")
                        
                    except Exception as img_error:
                        self.logger.warning(f"Failed to download image {img_url}: {str(img_error)}")
                        
                except Exception as e:
                    self.logger.warning(f"Failed to process image {img_url}: {str(e)}")
            
            # Create metadata file
            if result['images']:
                with open(os.path.join(property_dir, 'metadata.txt'), 'w', encoding='utf-8') as f:
                    f.write(f"URL: {url}\n")
                    f.write(f"Property ID: {property_id}\n")
                    f.write(f"Title: {property_title}\n")
                    f.write(f"Image count: {result['image_count']}\n")
                    f.write("\nImages:\n")
                    for img in result['images']:
                        f.write(f"- {img['url']} -> {os.path.basename(img['saved_path'])}\n")
            
            # Set success flag
            result['success'] = result['image_count'] > 0
            if not result['success']:
                result['error'] = "No images found"
                
            return result
            
        except Exception as e:
            self.logger.error(f"Error scraping {url}: {str(e)}")
            result['error'] = str(e)
            return result