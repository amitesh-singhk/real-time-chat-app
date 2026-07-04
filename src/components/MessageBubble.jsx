import React from "react";

function MessageBubble({ msg, currentUser, onDelete }) {
    const isOwnMessage = msg.uid === currentUser.uid;

    return (
        <div className={isOwnMessage ? "message own" : "message"}>
            <img
                src={msg.photo}
                alt={msg.name}
                className="avatar"
            />

            <div className="bubble">
                <h4>{msg.name}</h4>

                {msg.text && <p>{msg.text}</p>}

                {msg.image && (
                    <img
                        src={msg.image}
                        alt="chat"
                        className="chat-image"
                    />
                )}

                {isOwnMessage && (
                    <button
                        className="delete-btn"
                        onClick={() => onDelete(msg.id)}
                    >
                        🗑 Delete
                    </button>
                )}
            </div>
        </div>
    );
}

export default MessageBubble;