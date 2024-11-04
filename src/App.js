import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dots, setDots] = useState(1);
  const messagesEndRef = useRef(null);
  const [isFirstOpen, setIsFirstOpen] = useState(true); // Trạng thái để kiểm tra có phải lần đầu tiên mở không

  const dotImage =
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Location_dot_grey.svg/2048px-Location_dot_grey.svg.png';

  const handleSend = async (text) => {
    const messageToSend = text || message;
    if (messageToSend.trim() === '') return;

    setLoading(true);
    setMessage('');

    // Ghi lại tin nhắn từ người dùng vào chat
    if (!isFirstOpen || messageToSend !== 'xin chào') {
      setChat([...chat, { sender: 'user', text: messageToSend }]);
    }

    try {
      const response = await axios.post(
        'http://localhost:5000/api/dialogflow',
        {
          message: messageToSend,
        }
      );

      setTimeout(() => {
        setChat((prevChat) => [
          ...prevChat,
          {
            sender: 'bot',
            text: response.data.reply,
            suggestions: response.data.suggestions,
          },
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error sending message:', error);
      setLoading(false);
    }
  };

  const handleSuggestionClick = (intent) => {
    handleSend(intent);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  useEffect(() => {
    let interval;

    if (loading) {
      interval = setInterval(() => {
        setDots((prev) => (prev === 3 ? 1 : prev + 1));
      }, 500);
    }

    return () => clearInterval(interval);
  }, [loading]);

  // Gọi intent "xin chào" khi chatbot mở lần đầu
  useEffect(() => {
    if (isOpen && isFirstOpen) {
      const sendGreeting = async () => {
        try {
          // Gửi tin nhắn "xin chào" tự động
          const response = await axios.post(
            'http://localhost:5000/api/dialogflow',
            {
              message: 'xin chào',
            }
          );
          setChat((prevChat) => [
            ...prevChat,
            {
              sender: 'bot',
              text: response.data.reply,
              suggestions: response.data.suggestions,
            },
          ]);
          setIsFirstOpen(false); // Đánh dấu đã gửi tin nhắn chào
        } catch (error) {
          console.error('Error sending greeting message:', error);
        }
      };
      sendGreeting();
    }
  }, [isOpen, isFirstOpen]);

  useEffect(() => {
    if (isOpen) {
      // Khi chatbot được mở, cuộn xuống tin nhắn cuối cùng
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 w-16 h-16 bg-blue-500 rounded-full shadow-lg flex items-center justify-center text-white text-xl focus:outline-none"
        >
          <img
            src="https://static.vecteezy.com/system/resources/thumbnails/007/225/199/small_2x/robot-chat-bot-concept-illustration-vector.jpg"
            alt="Bot Avatar"
            className="h-full w-full rounded-full object-cover"
          />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-4 right-4 w-[375px] bg-white rounded-lg shadow-lg">
          <div>
            <div className="flex items-center mb-4 justify-between bg-blue-300 p-2 rounded-md">
              <div className="flex items-center">
                <img
                  src="https://static.vecteezy.com/system/resources/thumbnails/007/225/199/small_2x/robot-chat-bot-concept-illustration-vector.jpg"
                  alt="Bot Avatar"
                  className="h-10 w-10 rounded-full object-cover mr-2"
                />
                <h2 className="text-lg font-semibold text-white">Chatbot</h2>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 mr-1"
              >
                ✕
              </button>
            </div>

            <div className="chat-container h-64 overflow-y-auto rounded-md p-3">
              {chat.map((msg, index) => {
                // Chỉ ẩn tin nhắn "xin chào" từ phía người dùng
                if (
                  isFirstOpen &&
                  msg.sender === 'user' &&
                  msg.text === 'xin chào'
                ) {
                  return null; // Không hiển thị tin nhắn "xin chào"
                }
                return (
                  <div
                    key={index}
                    className={`mb-2 flex ${
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.sender === 'bot' && (
                      <img
                        src="https://static.vecteezy.com/system/resources/thumbnails/007/225/199/small_2x/robot-chat-bot-concept-illustration-vector.jpg"
                        alt="Bot Avatar"
                        className="mr-2 rounded-full h-10 w-10 object-cover"
                      />
                    )}
                    <div className={`chat-message ${msg.sender}`}>
                      {msg.text}
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="flex flex-col mt-2">
                          {msg.suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              className="bg-blue-300 text-white rounded-md p-2 text-sm mt-1"
                              onClick={() =>
                                handleSuggestionClick(suggestion.intent)
                              }
                            >
                              {suggestion.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {loading && (
                <div className="mb-2 flex items-center">
                  <img
                    src="https://static.vecteezy.com/system/resources/thumbnails/007/225/199/small_2x/robot-chat-bot-concept-illustration-vector.jpg"
                    alt="Bot Avatar"
                    className="h-10 w-10 rounded-full object-cover mr-2"
                  />
                  {Array.from({ length: dots }).map((_, index) => (
                    <img
                      key={index}
                      src={dotImage}
                      alt="Loading"
                      className="ml-1 h-2 w-2"
                    />
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex flex-col p-2">
              <input
                type="text"
                className="flex-1 p-2 border border-gray-200 rounded-md focus:outline-none mb-2"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
