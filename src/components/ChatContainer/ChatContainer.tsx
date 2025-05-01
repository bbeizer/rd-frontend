const ChatContainer = () => {
    return (
        <div className="chat-container">
            <div className="chat-messages">
                <p><em>No messages yet...</em></p>
            </div>
            <div className="chat-input">
                <input type="text" placeholder="Type a message..." disabled />
                <button disabled>Send</button>
            </div>
        </div>
    );
};

export default ChatContainer;
