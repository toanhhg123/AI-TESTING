import PageHeader from '../components/PageHeader.jsx';

export default function OrderHistoryPage() {
  return (
    <div className="container page">
      <PageHeader
        eyebrow="Đơn hàng"
        title="Lịch sử mua hàng"
        description="Trang nền để khách hàng theo dõi đơn hàng và trạng thái xử lý."
      />
      <div className="placeholder-panel">Danh sách đơn hàng sẽ hiển thị tại đây.</div>
    </div>
  );
}
