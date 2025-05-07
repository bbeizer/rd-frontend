import './message.css';

export interface MessageProps {
    author: string;
    text: string;
}

const Message = ({ author, text }: MessageProps) => {
    return (
        <div className="message">
            <span className="message-author">{author}:</span>
            <span className="message-text">{text}</span>
        </div>
    );
};

export default Message;
