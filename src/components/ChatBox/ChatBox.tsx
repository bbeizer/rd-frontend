import { useState } from 'react';
import './chat-box.css';
import Message, { MessageProps } from '../Message/Message';

interface ChatBoxProps {
    messages: MessageProps[];
    onSendMessage: (message: MessageProps) => void;
    currentUserName: string;
}

const ChatBox = ({ messages, onSendMessage, currentUserName }: ChatBoxProps) => {
    const [inputMessage, setInputMessage] = useState('');

    const handleSend = () => {
        const trimmedMessage = inputMessage.trim();
        if (trimmedMessage === '') return;

        const newMsg = { author: currentUserName, text: trimmedMessage };
        onSendMessage(newMsg);
        setInputMessage('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="no-messages">No messages yet...</div>
                ) : (
                    messages.map((msg, idx) => (
                        <Message key={idx} author={msg.author} text={msg.text} />
                    ))
                )}
            </div>
            <div className="chat-input">
                <input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                />
                <button onClick={handleSend}>Send</button>
            </div>
        </div>
    );
};

export default ChatBox;
