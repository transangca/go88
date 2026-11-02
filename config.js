// Secret dùng để ký JWT. Lấy từ biến môi trường (xem .env.example),
// nếu không có thì dùng giá trị mặc định để phát triển local.
module.exports = {
	secret: process.env.JWT_SECRET || "mWViBiW3CGRGFhoj3WjrelH26Iiz8zIj"
}