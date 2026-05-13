import PageHeader from '../components/PageHeader.jsx';

export default function CartPage() {
  return (
    <div className="container page">
      <PageHeader
        eyebrow="Giỏ hàng"
        title="Sản phẩm đã chọn"
        description="Trang nền cho chức năng thêm, sửa số lượng và xóa sản phẩm khỏi giỏ hàng."
      />
      <div className="empty-state">Chưa có sản phẩm trong giỏ hàng.</div>
    </div>
  );
}
