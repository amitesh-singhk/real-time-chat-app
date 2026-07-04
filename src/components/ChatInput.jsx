import React from "react";

function ChatInput({
    message,
    setMessage,
    setImage,
    sendMessage,
}) {
    return (
        <div className="chat-input">

            <input
                type="text"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        sendMessage();
                    }
                }}
            />

            <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files[0])}
            />

            <button onClick={sendMessage}>
                Send
            </button>

        </div>
    );
}

export default ChatInput;