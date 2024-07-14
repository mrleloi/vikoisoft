- Các sample test có thể lấy từ folder "sample_test_data"
- Bài giải đã được xử lý theo hướng cho phép hoạt động với file có kích thước lớn.
Kiến trúc là chia luồng ra đọc file theo số lượng worker và chunkSize mỗi lần đọc linh hoạt theo thông số test ban đầu (tuỳ client sẽ có các thông số khác nhau), kết quả được lưu độc lập sau mỗi luồng chạy và được tổng hợp lại sau khi toàn bộ hoàn tất.
Quá trình thử lại đáp ứng cho một số case cơ bản.