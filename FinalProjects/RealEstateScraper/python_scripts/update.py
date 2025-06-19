import json
from pymongo import MongoClient

# Kết nối tới MongoDB
client = MongoClient('mongodb://localhost:27017/')  # Thay bằng connection string nếu dùng MongoDB Atlas
db = client['real_estate_db']
collection = db['listings']

# Đọc file JSON
with open('hcmc_real_estate.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    listings = data['listings']

# Loại bỏ trùng lặp (tùy chọn)
unique_listings = list({frozenset(item.items()): item for item in listings}.values())

# Upsert từng document
for listing in unique_listings:
    collection.update_one(
        {"Link": listing["Link"]},  # Điều kiện tìm kiếm dựa trên Link
        {"$set": listing},          # Cập nhật toàn bộ document
        upsert=True                 # Thêm mới nếu không tìm thấy
    )

print(f"Đã cập nhật/thêm {len(unique_listings)} document.")
client.close()