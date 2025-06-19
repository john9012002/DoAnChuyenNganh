import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.wait import WebDriverWait
import selenium.webdriver.support.expected_conditions as EC
import undetected_chromedriver as uc
import time
import numpy as np
import pandas as pd
from urllib.parse import urlparse, parse_qs, unquote
import requests
import os
from urllib.parse import urljoin
import hashlib
from selenium.common.exceptions import WebDriverException
import traceback

# Cấu hình Chrome Options
def create_driver():
    options = uc.ChromeOptions()
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.page_load_strategy = 'normal'
    return uc.Chrome(options=options)

# Lấy tất cả href từ các trang
def get_hrefs_from_page(url, driver):
    driver.get(url)
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CLASS_NAME, "js__product-link-for-product-id")))
    elements = driver.find_elements(By.CLASS_NAME, "js__product-link-for-product-id")
    return [element.get_attribute("href") for element in elements]

# Trích xuất thông tin bất động sản từ URL
def extract_property_info(url, driver):
    driver.get(url)
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CLASS_NAME, "re__pr-specs-content-item-value")))
    
    info = {
        'Link': url,
        'Tiêu đề': np.nan,
        'Địa chỉ': np.nan,
        'Loại hình': np.nan,
        'Mức giá': np.nan,
        'Giá/m²': np.nan,
        'Số phòng ngủ': np.nan,
        'Quận': np.nan,
        'Diện tích': np.nan,
        'Mặt tiền': np.nan,
        'Đường vào': np.nan,
        'Hướng nhà': np.nan,
        'Hướng ban công': np.nan,
        'Số tầng': np.nan,
        'Số toilet': np.nan,
        'Pháp lý': np.nan,
        "Latitude": np.nan,
        "Longitude": np.nan,
    }
    
    # Lấy tiêu đề
    try:
        title_element = driver.find_element(By.CLASS_NAME, "re__pr-title")
        info['Tiêu đề'] = title_element.text.strip()
    except:
        pass
    
    # Lấy địa chỉ
    try:
        address_element = driver.find_element(By.CLASS_NAME, "re__pr-short-description")
        info['Địa chỉ'] = address_element.text.strip()
    except:
        pass
    
    # CÁCH 1: Xác định loại hình từ tiêu đề
    try:
        title_text = info['Tiêu đề'].lower()
        property_types = {
            "nhà riêng": "Nhà riêng",
            "biệt thự": "Biệt thự",
            "liền kề": "Nhà liền kề",
            "mặt phố": "Nhà mặt phố",
            "shophouse": "Shophouse",
            "căn hộ": "Căn hộ",
            "chung cư": "Căn hộ chung cư",
            "đất nền": "Đất nền",
            "đất": "Đất"
        }
        
        for key, value in property_types.items():
            if key in title_text:
                info['Loại hình'] = value
                break
    except:
        pass
    
    # CÁCH 2: Xác định từ URL
    if pd.isna(info['Loại hình']):
        url_parts = url.split("/")
        for part in url_parts:
            if "nha-rieng" in part:
                info['Loại hình'] = "Nhà riêng"
                break
            elif "biet-thu" in part or "lien-ke" in part:
                info['Loại hình'] = "Biệt thự/Liền kề"
                break
            elif "can-ho" in part or "chung-cu" in part:
                info['Loại hình'] = "Căn hộ chung cư"
                break
            elif "mat-pho" in part:
                info['Loại hình'] = "Nhà mặt phố"
                break
            elif "shophouse" in part:
                info['Loại hình'] = "Shophouse"
                break
            elif "dat-nen" in part:
                info['Loại hình'] = "Đất nền"
                break
            elif part.startswith("dat-"):
                info['Loại hình'] = "Đất"
                break
    
    # CÁCH 3: Tìm trong phần thông số chi tiết
    if pd.isna(info['Loại hình']):
        specs = driver.find_elements(By.CLASS_NAME, "re__pr-specs-content-item")
        for spec in specs:
            try:
                title = spec.find_element(By.CLASS_NAME, "re__pr-specs-content-item-title").text.strip()
                if "loại" in title.lower():
                    value = spec.find_element(By.CLASS_NAME, "re__pr-specs-content-item-value").text.strip()
                    info['Loại hình'] = value
                    break
            except:
                pass
    
    # CÁCH 4: Từ menu loại nhà đất
    if pd.isna(info['Loại hình']):
        try:
            loai_nha_dat_button = driver.find_element(By.XPATH, "//a[contains(text(), 'Loại nhà đất')]")
            loai_nha_dat_button.click()
            time.sleep(1)
            property_type_options = driver.find_elements(By.CSS_SELECTOR, ".js__search-filter[data-type='nhà đất']")
            for option in property_type_options:
                if "re__search-filter-active" in option.get_attribute("class"):
                    info['Loại hình'] = option.text.strip()
                    break
        except:
            pass
    
    # Lấy các thông tin khác
    try:
        price_element = driver.find_element(By.CSS_SELECTOR, ".re__pr-short-info-item .value")
        info['Mức giá'] = price_element.text.strip()
        price_per_m2_element = driver.find_element(By.CSS_SELECTOR, ".re__pr-short-info-item .ext")
        info['Giá/m²'] = price_per_m2_element.text.strip()
    except:
        pass
    
    try:
        rooms_element = driver.find_element(By.XPATH, "//div[contains(@class, 're__pr-short-info-item') and .//span[contains(text(), 'Phòng ngủ')]]//span[@class='value']")
        info['Số phòng ngủ'] = rooms_element.text.strip()
    except:
        pass
    
    # Lấy thông tin tỉnh/thành và quận/huyện từ breadcrumb
    try:
        breadcrumbs = driver.find_elements(By.CSS_SELECTOR, ".re__breadcrumb a")
        for breadcrumb in breadcrumbs:
            text = breadcrumb.text.strip()
            if "Hồ Chí Minh" in text:
                info['Tỉnh/Thành'] = "Thành phố Hồ Chí Minh"
            elif any(district in text for district in ["Quận", "Bình Thạnh", "Tân Bình", "Phú Nhuận", "Thủ Đức"]):
                info['Quận'] = text
    except:
        pass

    try:
        iframe_element = driver.find_element(By.CSS_SELECTOR, "iframe.lazyload")
        data_src = iframe_element.get_attribute("data-src")
        coords = data_src.split("q=")[1].split(",")
        info['Latitude'] = coords[0].strip()
        info['Longitude'] = coords[1].split("&")[0].strip()
    except:
        pass

    specs = driver.find_elements(By.CLASS_NAME, "re__pr-specs-content-item")
    for spec in specs:
        try:
            title = spec.find_element(By.CLASS_NAME, "re__pr-specs-content-item-title").text.strip()
            value = spec.find_element(By.CLASS_NAME, "re__pr-specs-content-item-value").text.strip()
            if title in info:
                info[title] = value
        except:
            pass
    
    return info

# Hàm chính để cào dữ liệu
def scrape_batdongsan(max_page=5):
    driver = create_driver()
    base_url = "https://batdongsan.com.vn/nha-dat-ban-tp-hcm"
    all_hrefs = []
    page = 1

    while page <= max_page:
        url = f"{base_url}/p{page}" if page > 1 else base_url
        print(f"Đang xử lý trang {page}: {url}")
        
        hrefs = get_hrefs_from_page(url, driver)
        all_hrefs.extend(hrefs)
        
        next_page = driver.find_elements(By.CSS_SELECTOR, 'a.re__pagination-icon:not(.re__pagination-icon--no-effect)')
        if not next_page:
            print("Không còn trang tiếp theo")
            break
        
        page += 1
        time.sleep(3)

    print(f"Tổng số href đã lấy được: {len(all_hrefs)}")
    with open("hrefs.txt", "w", encoding="utf-8") as file:
        for href in all_hrefs:
            file.write(href + "\n")

    # Xử lý từng URL để trích xuất thông tin
    csv_filename = "data_bds.csv"
    total_urls = len(all_hrefs)

    for index, url in enumerate(all_hrefs, start=1):
        try:
            print(f"Đang xử lý link thứ {index}/{total_urls}: {url}")
            property_info = extract_property_info(url, driver)
            
            df = pd.DataFrame([property_info])
            if index == 1:
                df.to_csv(csv_filename, mode='w', header=True, index=False, encoding='utf-8-sig')
            else:
                df.to_csv(csv_filename, mode='a', header=False, index=False, encoding='utf-8-sig')
            
            print(f"Đã lưu thông tin của link thứ {index} vào file CSV")
            time.sleep(1)
        except Exception as e:
            print(f"Lỗi khi xử lý link thứ {index}/{total_urls} - {url}: {str(e)}")
            traceback.print_exc()
            driver.quit()
            driver = create_driver()

    driver.quit()
    print("Đã hoàn thành quá trình cào dữ liệu và lưu vào data_bds.csv")

if __name__ == "__main__":
    result = scrape_batdongsan(5)
    print(json.dumps(result))