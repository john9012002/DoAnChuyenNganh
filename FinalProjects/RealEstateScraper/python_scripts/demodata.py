import requests
from bs4 import BeautifulSoup
import json
import time
import random
from urllib.parse import urljoin
from datetime import datetime
import re
import logging
import pandas as pd
import numpy as np
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderUnavailable

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.common.exceptions import TimeoutException, NoSuchElementException
    SELENIUM_AVAILABLE = True
except ImportError:
    SELENIUM_AVAILABLE = False

class EnhancedBatDongSanScraper:
    def __init__(self, use_selenium=True):
        self.base_url = "https://batdongsan.com.vn/nha-dat-ban-tp-hcm"
        self.listings = []
        self.session = requests.Session()
        self.use_selenium = use_selenium and SELENIUM_AVAILABLE
        self.driver = None
        self.geolocator = Nominatim(user_agent="batdongsan_scraper")
        
        # Setup logging
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
        self.logger = logging.getLogger(__name__)
        
        # Headers for requests
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        self.session.headers.update(self.headers)

        # District mapping for Ho Chi Minh City
        self.districts = {
            'quận 1': 'Quận 1', 'quan 1': 'Quận 1',
            'quận 2': 'Quận 2', 'quan 2': 'Quận 2',
            'quận 3': 'Quận 3', 'quan 3': 'Quận 3',
            'quận 4': 'Quận 4', 'quan 4': 'Quận 4',
            'quận 5': 'Quận 5', 'quan 5': 'Quận 5',
            'quận 6': 'Quận 6', 'quan 6': 'Quận 6',
            'quận 7': 'Quận 7', 'quan 7': 'Quận 7',
            'quận 8': 'Quận 8', 'quan 8': 'Quận 8',
            'quận 9': 'Quận 9', 'quan 9': 'Quận 9',
            'quận 10': 'Quận 10', 'quan 10': 'Quận 10',
            'quận 11': 'Quận 11', 'quan 11': 'Quận 11',
            'quận 12': 'Quận 12', 'quan 12': 'Quận 12',
            'thủ đức': 'Thủ Đức', 'thu duc': 'Thủ Đức',
            'bình thạnh': 'Bình Thạnh', 'binh thanh': 'Bình Thạnh',
            'phú nhuận': 'Phú Nhuận', 'phu nhuan': 'Phú Nhuận',
            'tân bình': 'Tân Bình', 'tan binh': 'Tân Bình',
            'tân phú': 'Tân Phú', 'tan phu': 'Tân Phú',
            'gò vấp': 'Gò Vấp', 'go vap': 'Gò Vấp',
            'bình tân': 'Bình Tân', 'binh tan': 'Bình Tân',
            'hóc môn': 'Hóc Môn', 'hoc mon': 'Hóc Môn',
            'củ chi': 'Củ Chi', 'cu chi': 'Củ Chi',
            'cần giờ': 'Cần Giờ', 'can gio': 'Cần Giờ',
            'nhà bè': 'Nhà Bè', 'nha be': 'Nhà Bè'
        }

    def init_selenium(self):
        """Initialize Selenium WebDriver"""
        if not self.use_selenium:
            return
            
        self.logger.info("Initializing Selenium WebDriver...")
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            self.driver.implicitly_wait(10)
            self.logger.info("Selenium WebDriver initialized successfully")
        except Exception as e:
            self.logger.error(f"Failed to initialize Selenium: {e}")
            self.use_selenium = False

    def get_page_content(self, url, retries=3):
        """Get page content using either Selenium or requests with retries"""
        for attempt in range(retries):
            if self.use_selenium and self.driver:
                try:
                    self.driver.get(url)
                    WebDriverWait(self.driver, 10).until(
                        EC.presence_of_element_located((By.TAG_NAME, "body"))
                    )
                    time.sleep(random.uniform(2, 4))
                    return self.driver.page_source
                except (TimeoutException, NoSuchElementException) as e:
                    self.logger.warning(f"Selenium attempt {attempt + 1} failed for {url}: {e}")
                    if attempt == retries - 1:
                        self.use_selenium = False
            
            try:
                response = self.session.get(url, timeout=30)
                response.raise_for_status()
                time.sleep(random.uniform(1, 3))
                return response.text
            except requests.RequestException as e:
                self.logger.warning(f"Requests attempt {attempt + 1} failed for {url}: {e}")
                if attempt == retries - 1:
                    self.logger.error(f"All attempts failed for {url}")
                    return None
        return None

    def extract_district(self, location_text):
        """Extract district from location text"""
        if not location_text:
            return None
        
        location_lower = location_text.lower()
        for key, value in self.districts.items():
            if key in location_lower:
                return value
        return None

    def infer_property_specs(self, listing, desc_text=None):
        """Infer missing property specifications based on area or description"""
        specs = {
            'Số phòng ngủ': listing.get('Số phòng ngủ'),
            'Số toilet': listing.get('Số toilet'),
            'Số tầng': listing.get('Số tầng'),
            'Mặt tiền': listing.get('Mặt tiền'),
            'Đường vào': listing.get('Đường vào'),
            'Hướng nhà': listing.get('Hướng nhà'),
            'Hướng ban công': listing.get('Hướng ban công'),
            'Pháp lý': listing.get('Pháp lý')
        }
        
        # Infer based on area
        area = self.extract_area_numeric(listing.get('Diện tích', ''))
        if area:
            if pd.isna(specs['Số phòng ngủ']):
                if area < 60:
                    specs['Số phòng ngủ'] = 1
                elif area < 100:
                    specs['Số phòng ngủ'] = 2
                else:
                    specs['Số phòng ngủ'] = 3
            if pd.isna(specs['Số toilet']):
                if area < 60:
                    specs['Số toilet'] = 1
                else:
                    specs['Số toilet'] = 2
            if pd.isna(specs['Số tầng']):
                specs['Số tầng'] = 2 if area < 100 else 3
            if pd.isna(specs['Mặt tiền']):
                specs['Mặt tiền'] = 4.0  # Typical frontage for small houses
            if pd.isna(specs['Đường vào']):
                specs['Đường vào'] = 4.0  # Typical road width
        
        # Infer from description
        if desc_text:
            if pd.isna(specs['Số phòng ngủ']):
                bedroom_match = re.search(r'(\d+)\s*phòng ngủ', desc_text, re.IGNORECASE)
                if bedroom_match:
                    specs['Số phòng ngủ'] = int(bedroom_match.group(1))
            if pd.isna(specs['Số toilet']):
                toilet_match = re.search(r'(\d+)\s*(?:toilet|wc|phòng tắm)', desc_text, re.IGNORECASE)
                if toilet_match:
                    specs['Số toilet'] = int(toilet_match.group(1))
            if pd.isna(specs['Pháp lý']):
                if 'sổ hồng' in desc_text.lower() or 'sổ đỏ' in desc_text.lower():
                    specs['Pháp lý'] = 'Sổ hồng/Sổ đỏ'
                elif 'hợp đồng' in desc_text.lower():
                    specs['Pháp lý'] = 'Hợp đồng mua bán'
        
        # Default values for remaining nulls
        if pd.isna(specs['Hướng nhà']):
            specs['Hướng nhà'] = 'Không xác định'
        if pd.isna(specs['Hướng ban công']):
            specs['Hướng ban công'] = 'Không xác định'
        if pd.isna(specs['Pháp lý']):
            specs['Pháp lý'] = 'Sổ hồng/Sổ đỏ'  # Common default
        
        return specs

    def geocode_address(self, address):
        """Geocode address to get latitude and longitude"""
        if not address:
            return None, None
        
        try:
            location = self.geolocator.geocode(f"{address}, Hồ Chí Minh, Việt Nam", timeout=10)
            if location:
                return location.latitude, location.longitude
            return None, None
        except (GeocoderTimedOut, GeocoderUnavailable) as e:
            self.logger.warning(f"Geocoding failed for {address}: {e}")
            return None, None

    def extract_property_specs(self, soup):
        """Extract detailed property specifications"""
        specs = {
            'Số phòng ngủ': None,
            'Số toilet': None,
            'Số tầng': None,
            'Mặt tiền': None,
            'Đường vào': None,
            'Hướng nhà': None,
            'Hướng ban công': None,
            'Pháp lý': None
        }
        
        spec_elements = soup.select('.re__pr-specs-content-item')
        if not spec_elements:
            spec_elements = soup.select('.js__pr-config-item, .pr-config-item, .re__detail-feature li')
        
        for element in spec_elements:
            text = element.get_text(strip=True).lower()
            
            if re.search(r'phòng ngủ|bedroom', text):
                numbers = re.findall(r'\d+', text)
                if numbers:
                    specs['Số phòng ngủ'] = int(numbers[0])
            
            elif re.search(r'toilet|wc|phòng tắm', text):
                numbers = re.findall(r'\d+', text)
                if numbers:
                    specs['Số toilet'] = int(numbers[0])
            
            elif re.search(r'tầng|lầu|floor', text):
                numbers = re.findall(r'\d+', text)
                if numbers:
                    specs['Số tầng'] = int(numbers[0])
            
            elif re.search(r'mặt tiền|frontage', text):
                numbers = re.findall(r'[\d,\.]+', text)
                if numbers:
                    specs['Mặt tiền'] = float(numbers[0].replace(',', '.'))
            
            elif re.search(r'đường vào|đường|road', text):
                numbers = re.findall(r'[\d,\.]+', text)
                if numbers:
                    specs['Đường vào'] = float(numbers[0].replace(',', '.'))
            
            elif re.search(r'hướng nhà|hướng|direction', text):
                directions = ['đông', 'tây', 'nam', 'bắc', 'đông bắc', 'đông nam', 'tây bắc', 'tây nam']
                for direction in directions:
                    if direction in text:
                        specs['Hướng nhà'] = direction.title()
                        break
            
            elif re.search(r'ban công|balcony', text):
                directions = ['đông', 'tây', 'nam', 'bắc', 'đông bắc', 'đông nam', 'tây bắc', 'tây nam']
                for direction in directions:
                    if direction in text:
                        specs['Hướng ban công'] = direction.title()
                        break
            
            elif re.search(r'pháp lý|sổ hồng|sổ đỏ|legal', text):
                if 'sổ hồng' in text or 'sổ đỏ' in text:
                    specs['Pháp lý'] = 'Sổ hồng/Sổ đỏ'
                elif 'hợp đồng' in text:
                    specs['Pháp lý'] = 'Hợp đồng mua bán'
                else:
                    specs['Pháp lý'] = text[:50]
        
        return specs

    def extract_coordinates(self, soup, address):
        """Extract or geocode latitude and longitude"""
        coords = {'Latitude': None, 'Longitude': None}
        
        scripts = soup.find_all('script')
        for script in scripts:
            if script.string:
                lat_match = re.search(r'lat[itude]*["\']?\s*[:=]\s*["\']*(-?\d+\.?\d*)', script.string, re.IGNORECASE)
                lng_match = re.search(r'lng|lon[gitude]*["\']?\s*[:=]\s*["\']*(-?\d+\.?\d*)', script.string, re.IGNORECASE)
                
                if lat_match and lng_match:
                    try:
                        coords['Latitude'] = float(lat_match.group(1))
                        coords['Longitude'] = float(lng_match.group(1))
                        return coords
                    except ValueError:
                        continue
        
        # Fallback to geocoding
        return dict(zip(['Latitude', 'Longitude'], self.geocode_address(address)))

    def extract_listing_data(self, listing_element):
        """Extract comprehensive listing data"""
        listing = {
            'Link': '',
            'Tiêu đề': None,
            'Địa chỉ': None,
            'Loại hình': None,
            'Mức giá': None,
            'Giá/m²': None,
            'Số phòng ngủ': None,
            'Quận': None,
            'Diện tích': None,
            'Mặt tiền': None,
            'Đường vào': None,
            'Hướng nhà': None,
            'Hướng ban công': None,
            'Số tầng': None,
            'Số toilet': None,
            'Pháp lý': None,
            'Latitude': None,
            'Longitude': None,
        }
        
        try:
            # Title and URL
            title_element = listing_element.select_one('.js__card-title, .re__card-title, h3 a')
            if title_element:
                listing['Tiêu đề'] = title_element.get_text(strip=True)
                listing['Link'] = urljoin(self.base_url, title_element.get('href', ''))
            
            # Price
            price_element = listing_element.select_one('.re__card-config-price, .js__card-price')
            if price_element:
                listing['Mức giá'] = price_element.get_text(strip=True)
            
            # Area
            area_element = listing_element.select_one('.re__card-config-area')
            if area_element:
                listing['Diện tích'] = area_element.get_text(strip=True)
                area_numeric = self.extract_area_numeric(listing['Diện tích'])
                price_numeric = self.extract_price_numeric(listing['Mức giá'])
                if area_numeric and price_numeric and area_numeric > 0:
                    listing['Giá/m²'] = f"{price_numeric / area_numeric:,.0f} VNĐ/m²"
            
            # Location/Address
            location_element = listing_element.select_one('.re__card-location')
            if location_element:
                location_text = location_element.get_text(strip=True)
                listing['Địa chỉ'] = location_text
                listing['Quận'] = self.extract_district(location_text)
            
            # Property type
            type_element = listing_element.select_one('.re__card-config-type')
            if type_element:
                listing['Loại hình'] = type_element.get_text(strip=True)
            elif listing['Tiêu đề']:
                title_lower = listing['Tiêu đề'].lower()
                if 'nhà phố' in title_lower:
                    listing['Loại hình'] = 'Nhà phố'
                elif 'căn hộ' in title_lower:
                    listing['Loại hình'] = 'Căn hộ'
                elif 'biệt thự' in title_lower:
                    listing['Loại hình'] = 'Biệt thự'
            
            return listing
            
        except Exception as e:
            self.logger.error(f"Error extracting listing data: {e}")
            return None

    def scrape_detailed_info(self, listing):
        """Scrape detailed information for a single listing"""
        if not listing.get('Link'):
            return listing
        
        try:
            html_content = self.get_page_content(listing['Link'])
            if not html_content:
                return listing
            
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Extract property specifications
            specs = self.extract_property_specs(soup)
            
            # Extract description for inference
            desc_element = soup.select_one('.re__detail-content, .js__pr-description')
            desc_text = desc_element.get_text(strip=True) if desc_element else ''
            
            # Infer missing specs
            inferred_specs = self.infer_property_specs(listing, desc_text)
            specs.update({k: v for k, v in inferred_specs.items() if pd.isna(specs.get(k))})
            listing.update(specs)
            
            # Extract or geocode coordinates
            coords = self.extract_coordinates(soup, listing.get('Địa chỉ', ''))
            listing.update(coords)
            
        except Exception as e:
            self.logger.error(f"Error getting details for {listing['Link']}: {e}")
        
        return listing

    def extract_price_numeric(self, price_text):
        """Extract numeric price in VND"""
        if not price_text or pd.isna(price_text):
            return None
        
        price_text = str(price_text).lower()
        price_text = re.sub(r'vnđ|vnd|đồng', '', price_text)
        numbers = re.findall(r'[\d,\.]+', price_text)
        if not numbers:
            return None
        
        try:
            number_str = numbers[0].replace(',', '.')
            if number_str.count('.') > 1:
                parts = number_str.split('.')
                number_str = ''.join(parts[:-1]) + '.' + parts[-1]
            
            base_value = float(number_str)
            
            if 'tỷ' in price_text or 'ty' in price_text:
                return base_value * 1_000_000_000
            elif 'triệu' in price_text or 'trieu' in price_text:
                return base_value * 1_000_000
            elif 'nghìn' in price_text or 'nghin' in price_text:
                return base_value * 1_000
            else:
                return base_value
                
        except ValueError:
            return None

    def extract_area_numeric(self, area_text):
        """Extract numeric area in m²"""
        if not area_text or pd.isna(area_text):
            return None
        
        numbers = re.findall(r'[\d,\.]+', str(area_text))
        if numbers:
            try:
                return float(numbers[0].replace(',', '.'))
            except ValueError:
                return None
        return None

    def scrape_listings(self, max_pages=3, max_detailed=30):
        """Scrape listings with detailed information"""
        self.logger.info(f"Starting comprehensive scraping (max {max_pages} pages, {max_detailed} detailed)...")
        
        if self.use_selenium:
            self.init_selenium()
        
        basic_listings = []
        for page_num in range(1, max_pages + 1):
            self.logger.info(f"Scraping page {page_num}...")
            url = self.base_url if page_num == 1 else f"{self.base_url}/p{page_num}"
            
            html_content = self.get_page_content(url)
            if not html_content:
                continue
            
            soup = BeautifulSoup(html_content, 'html.parser')
            listing_elements = soup.select('.js__product-link-for-product-id, .re__card-full')
            
            if not listing_elements:
                self.logger.warning(f"No listings found on page {page_num}")
                continue
            
            for listing_element in listing_elements:
                listing_data = self.extract_listing_data(listing_element)
                if listing_data and listing_data.get('Tiêu đề') and listing_data.get('Link'):
                    basic_listings.append(listing_data)
            
            self.logger.info(f"Page {page_num}: Found {len([l for l in basic_listings if l])} listings")
            time.sleep(random.uniform(2, 5))
        
        # Get detailed information
        self.logger.info(f"Getting detailed info for first {min(max_detailed, len(basic_listings))} listings...")
        detailed_listings = []
        for i, listing in enumerate(basic_listings[:max_detailed]):
            self.logger.info(f"Processing listing {i + 1}/{min(max_detailed, len(basic_listings))}")
            detailed_listing = self.scrape_detailed_info(listing)
            detailed_listings.append(detailed_listing)
        
        detailed_listings.extend(basic_listings[max_detailed:])
        self.listings = detailed_listings
        self.logger.info(f"Total listings collected: {len(self.listings)}")

    def save_to_json(self, filename='hcmc_real_estate.json'):
        """Save listings to JSON file"""
        clean_listings = []
        for listing in self.listings:
            clean_listing = {}
            for key, value in listing.items():
                if pd.isna(value):
                    clean_listing[key] = None
                elif isinstance(value, (np.integer, np.floating)):
                    clean_listing[key] = value.item()
                else:
                    clean_listing[key] = value
            clean_listings.append(clean_listing)
        
        data = {
            'metadata': {
                'scraped_at': datetime.now().isoformat(),
                'total_listings': len(clean_listings),
                'source': 'batdongsan.com.vn',
                'location': 'Ho Chi Minh City, Vietnam',
                'fields': list(clean_listings[0].keys()) if clean_listings else [],
                'scraper_version': 'Enhanced v2.1'
            },
            'listings': clean_listings
        }
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            self.logger.info(f"Data saved to {filename}")
            return filename
        except Exception as e:
            self.logger.error(f"Error saving data: {e}")
            return None

    def close(self):
        """Clean up resources"""
        if self.driver:
            self.driver.quit()

def main():
    """Main execution function"""
    scraper = EnhancedBatDongSanScraper(use_selenium=SELENIUM_AVAILABLE)
    
    try:
        scraper.scrape_listings(max_pages=3, max_detailed=30)
        filename = scraper.save_to_json()
        
        if filename:
            print(f"\n=== SCRAPING COMPLETED ===")
            print(f"Total listings: {len(scraper.listings)}")
            print(f"Data saved to: {filename}")
            
            if scraper.listings:
                sample = scraper.listings[0]
                print(f"\nSample fields captured:")
                for key, value in sample.items():
                    if value is not None and not pd.isna(value):
                        print(f"  {key}: {value}")
        
    except Exception as e:
        print(f"Scraping failed: {e}")
    finally:
        scraper.close()

if __name__ == "__main__":
    main()