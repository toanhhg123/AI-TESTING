import PageHeader from '../components/PageHeader.jsx';

export default function CheckoutPage() {
  return (
    <div className="container page">
      <PageHeader
        eyebrow="Thanh toán"
        title="Hoàn tất đơn hàng"
        description="Trang nền cho địa chỉ giao hàng, phương thức thanh toán và xác nhận đơn."
      />
      <div className="placeholder-panel">Form checkout sẽ được triển khai ở giai đoạn chức năng.</div>
    </div>
  );
}
