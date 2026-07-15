import { MessageSquare, X, Send, Bot } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const SUGGESTIONS = [
  'Có mã giảm giá nào đang hoạt động không?',
  'Chính sách bảo hành và đổi trả thế nào?',
  'Tôi muốn mua iPhone 17 Pro Max thì có khuyến mãi gì?',
  'Làm sao để thanh toán đơn hàng?'
];

const BOT_RESPONSES = {
  default: 'Xin chào! Tôi là trợ lý AI mô phỏng của Mobile Store. Tôi có thể giúp gì cho bạn hôm nay?',
  coupon: 'Hiện tại hệ thống có một số mã giảm giá đang hoạt động như: \n- **KM10**: Giảm ngay 10% cho tất cả đơn hàng.\n- **GIAM50K**: Giảm ngay 50.000đ cho đơn hàng từ 500.000đ.\nBạn có thể áp dụng mã này ở trang thanh toán nhé!',
  policy: 'Chính sách bảo hành & đổi trả:\n- Bảo hành 12 tháng chính hãng cho tất cả thiết bị di động.\n- 1 đổi 1 trong vòng 30 ngày nếu có lỗi phần cứng từ nhà sản xuất.\n- Hoàn tiền 100% nếu phát hiện hàng giả, hàng nhái.',
  iphone: 'iPhone 17 Pro Max đang là siêu phẩm bán chạy nhất! Khi mua sản phẩm này, bạn sẽ được:\n- Giảm trực tiếp 1.000.000đ vào hóa đơn.\n- Tặng kèm sạc nhanh 25W chính hãng.\n- Hỗ trợ trả góp 0% lãi suất.\nBạn có thể áp dụng mã **KM10** để được giảm thêm tối đa nhé!',
  payment: 'Chúng tôi hỗ trợ nhiều phương thức thanh toán linh hoạt:\n1. Thanh toán khi giao hàng (COD).\n2. Chuyển khoản ngân hàng qua mã QR.\n3. Thanh toán qua ví điện tử MoMo, ZaloPay.\n4. Trả góp qua thẻ tín dụng với lãi suất 0%.'
};

export default function ChatbotBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: BOT_RESPONSES.default, createdAt: new Date() }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = (text) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text,
      createdAt: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      let reply = '';
      const lowercaseText = text.toLowerCase();

      if (lowercaseText.includes('mã') || lowercaseText.includes('coupon') || lowercaseText.includes('giảm giá')) {
        reply = BOT_RESPONSES.coupon;
      } else if (lowercaseText.includes('đổi trả') || lowercaseText.includes('bảo hành') || lowercaseText.includes('chính sách')) {
        reply = BOT_RESPONSES.policy;
      } else if (lowercaseText.includes('iphone') || lowercaseText.includes('17')) {
        reply = BOT_RESPONSES.iphone;
      } else if (lowercaseText.includes('thanh toán') || lowercaseText.includes('chuyển khoản') || lowercaseText.includes('momo')) {
        reply = BOT_RESPONSES.payment;
      } else {
        reply = 'Cảm ơn câu hỏi của bạn. Đây là bản mô phỏng AI tư vấn, bạn có thể thử hỏi về "mã giảm giá", "chính sách đổi trả", hoặc thông tin "iPhone 17" để nhận phản hồi chính xác nhé!';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: reply,
          createdAt: new Date()
        }
      ]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <>
      {/* Floating Chat Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent)',
            color: '#ffffff',
            border: 'none',
            boxShadow: '0 4px 16px rgba(15, 118, 110, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            transition: 'transform 0.2s, background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          title="Tư vấn AI"
        >
          <MessageSquare size={24} />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '380px',
            height: '500px',
            maxHeight: 'calc(100vh - 48px)',
            maxWidth: 'calc(100vw - 48px)',
            borderRadius: '16px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 12px 36px rgba(21, 33, 47, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={20} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>Trợ lý ảo Mobile Store</div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>AI Chatbot tư vấn 24/7</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages list */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: '#f8fafc',
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: msg.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    backgroundColor: msg.sender === 'user' ? 'var(--accent)' : 'var(--surface)',
                    color: msg.sender === 'user' ? '#ffffff' : 'var(--ink)',
                    fontSize: '14px',
                    lineHeight: '1.4',
                    border: msg.sender === 'user' ? 'none' : '1px solid var(--border)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {msg.text}
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    color: 'var(--muted)',
                    marginTop: '4px',
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {isTyping && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  padding: '10px 14px',
                  borderRadius: '12px 12px 12px 2px',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--muted)',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>AI đang soạn câu trả lời</span>
                <span style={{ display: 'inline-flex', gap: '2px' }}>
                  <span className="dot" style={{ animation: 'bounce 1.4s infinite 0.2s', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
                  <span className="dot" style={{ animation: 'bounce 1.4s infinite 0.4s', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
                  <span className="dot" style={{ animation: 'bounce 1.4s infinite 0.6s', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          <div
            style={{
              padding: '8px 12px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              background: '#ffffff',
              scrollbarWidth: 'none',
            }}
          >
            {SUGGESTIONS.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(sug)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                  background: 'var(--soft)',
                  color: 'var(--accent)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Input field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            style={{
              padding: '12px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: '8px',
              background: '#ffffff',
            }}
          >
            <input
              type="text"
              placeholder="Nhập tin nhắn..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                outline: 'none',
                fontSize: '14px',
              }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: inputValue.trim() && !isTyping ? 'var(--accent)' : 'var(--border)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
