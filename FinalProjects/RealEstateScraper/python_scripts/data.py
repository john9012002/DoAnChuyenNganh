import json
import pymongo
from pymongo import MongoClient
import logging
from datetime import datetime
import hashlib
import re

# Thiết lập logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def connect_to_mongodb(connection_string="mongodb://localhost:27017/", database_name="project_real_estate", collection_name="listings"):
    """Kết nối tới MongoDB và trả về collection"""
    try:
        client = MongoClient(connection_string)
        client.admin.command('ping')
        logger.info("Kết nối tới MongoDB thành công")
        db = client[database_name]
        collection = db[collection_name]
        return client, collection
    except Exception as e:
        logger.error(f"Lỗi khi kết nối tới MongoDB: {e}")
        raise

def read_json_file(file_path):
    """Đọc dữ liệu từ file JSON"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        logger.info(f"Đã đọc file JSON: {file_path}")
        return data.get('listings', [])
    except Exception as e:
        logger.error(f"Lỗi khi đọc file JSON {file_path}: {e}")
        raise

def generate_unique_id(listing):
    """Tạo unique_id dựa trên Link, Tiêu đề và Địa chỉ"""
    unique_string = f"{listing.get('Link', '')}|{listing.get('Tiêu đề', '')}|{listing.get('Địa chỉ', '')}"
    return hashlib.md5(unique_string.encode('utf-8')).hexdigest()

def parse_price(price_str):
    """Chuyển đổi giá từ chuỗi (e.g., '6,8 tỷ') sang số (VND)"""
    if not price_str or price_str == "Giá thỏa thuận":
        return None
    try:
        price_str = price_str.replace(',', '.').replace(' tỷ', '')
        return float(price_str) * 1_000_000_000  # Convert to VND
    except ValueError:
        logger.warning(f"Không thể parse giá: {price_str}")
        return None

def parse_area(area_str):
    """Chuyển đổi diện tích từ chuỗi (e.g., '·86 m²' hoặc '2.585 m²') sang số"""
    if not area_str:
        return None
    try:
        # Loại bỏ ký tự không mong muốn và thay dấu phẩy thành dấu chấm
        area_str = area_str.replace('·', '').replace(' m²', '').replace(',', '.').strip()
        return float(area_str)
    except ValueError:
        logger.warning(f"Không thể parse diện tích: {area_str}")
        return None

def clean_document(doc):
    """Làm sạch dữ liệu trước khi chèn hoặc cập nhật vào MongoDB"""
    cleaned_doc = {}
    for key, value in doc.items():
        if value is None:
            cleaned_doc[key] = None
        elif isinstance(value, float) and (value == float('inf') or value == float('-inf') or value != value):
            cleaned_doc[key] = None
        else:
            cleaned_doc[key] = value

    # Xử lý các trường đặc biệt
    cleaned_doc['Mức giá (VND)'] = parse_price(cleaned_doc.get('Mức giá'))
    cleaned_doc['Diện tích (m²)'] = parse_area(cleaned_doc.get('Diện tích'))
    cleaned_doc['unique_id'] = generate_unique_id(cleaned_doc)
    cleaned_doc['updated_at'] = datetime.utcnow()  # Thêm trường updated_at

    return cleaned_doc

def insert_to_mongodb(collection, listings):
    """Chèn dữ liệu vào MongoDB"""
    try:
        cleaned_listings = [clean_document(listing) for listing in listings]
        unique_listings = {listing['unique_id']: listing for listing in cleaned_listings}.values()  # Loại bỏ trùng lặp
        if unique_listings:
            result = collection.insert_many(unique_listings, ordered=False)
            logger.info(f"Đã chèn {len(result.inserted_ids)} bản ghi vào MongoDB")
            return len(result.inserted_ids)
        else:
            logger.warning("Không có bản ghi nào để chèn")
            return 0
    except pymongo.errors.BulkWriteError as bwe:
        logger.error(f"Lỗi khi chèn hàng loạt: {bwe.details}")
        return 0
    except Exception as e:
        logger.error(f"Lỗi khi chèn dữ liệu: {e}")
        raise

def update_to_mongodb(collection, listings, unique_key='unique_id'):
    """Cập nhật dữ liệu trong MongoDB bằng bulk_write, nếu không tồn tại thì chèn mới"""
    try:
        updated_count = 0
        inserted_count = 0
        operations = []
        seen_unique_ids = set()  # Theo dõi các unique_id để tránh trùng lặp

        for listing in listings:
            cleaned_doc = clean_document(listing)
            unique_id = cleaned_doc.get(unique_key)

            if unique_id in seen_unique_ids:
                logger.debug(f"Bỏ qua bản ghi trùng lặp với unique_id: {unique_id}")
                continue
            seen_unique_ids.add(unique_id)

            filter_query = {unique_key: unique_id}
            existing_doc = collection.find_one(filter_query)

            if existing_doc:
                operations.append(
                    pymongo.UpdateOne(
                        filter_query,
                        {'$set': cleaned_doc},
                        upsert=False
                    )
                )
            else:
                operations.append(
                    pymongo.InsertOne(cleaned_doc)
                )

        if operations:
            result = collection.bulk_write(operations, ordered=False)
            updated_count = result.modified_count
            inserted_count = result.inserted_count
            logger.info(f"Đã cập nhật {updated_count} bản ghi và chèn mới {inserted_count} bản ghi")
        else:
            logger.warning("Không có bản ghi nào để cập nhật hoặc chèn")

        return updated_count, inserted_count
    except Exception as e:
        logger.error(f"Lỗi khi cập nhật dữ liệu: {e}")
        raise

def main():
    """Hàm chính để chèn hoặc cập nhật dữ liệu từ JSON vào MongoDB"""
    # Cấu hình
    json_file = 'hcmc_real_estate.json'  # Đường dẫn tới file JSON
    connection_string = 'mongodb://localhost:27017/'  # Chuỗi kết nối tới MongoDB
    database_name = 'project_real_estate'  # Tên cơ sở dữ liệu MongoDB
    collection_name = 'listings'
    unique_key = 'unique_id'  # Trường dùng để xác định bản ghi duy nhất

    try:
        # Kết nối tới MongoDB
        client, collection = connect_to_mongodb(connection_string, database_name, collection_name)

        # Tạo chỉ mục cho unique_key
        collection.create_index(unique_key, unique=True)
        logger.info(f"Đã tạo chỉ mục cho trường {unique_key}")

        # Đọc dữ liệu từ file JSON
        listings = read_json_file(json_file)

        # Cập nhật hoặc chèn dữ liệu vào MongoDB
        updated_count, inserted_count = update_to_mongodb(collection, listings, unique_key)

        # Kiểm tra kết quả
        total_documents = collection.count_documents({})
        logger.info(f"Tổng số bản ghi trong collection: {total_documents}")

        print(f"\n=== XỬ LÝ DỮ LIỆU HOÀN TẤT ===")
        print(f"Số bản ghi đã cập nhật: {updated_count}")
        print(f"Số bản ghi đã chèn mới: {inserted_count}")
        print(f"Tổng số bản ghi trong collection: {total_documents}")

        # Lấy một mẫu bản ghi để kiểm tra
        if total_documents > 0:
            sample = collection.find_one()
            print("\nMẫu bản ghi trong MongoDB:")
            for key, value in sample.items():
                if key != '_id':
                    print(f"  {key}: {value}")

    except Exception as e:
        logger.error(f"Quá trình xử lý dữ liệu thất bại: {e}")
        print(f"Quá trình xử lý dữ liệu thất bại: {e}")
    finally:
        if 'client' in locals():
            client.close()
            logger.info("Đã đóng kết nối MongoDB")

if __name__ == "__main__":
    main()