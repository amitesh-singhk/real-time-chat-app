import React from "react";

function ChatHeader({ user, onLogout }) {
  return (
    <div className="chat-header">
      <div className="user-info">
        <img
          src={user.photoURL}
          alt={user.displayName}
          className="avatar"
        />

        <div>
          <h2>{user.displayName}</h2>
          <p className="status">🟢 Online</p>
        </div>
      </div>

      <button className="logout-btn" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}

export default ChatHeader;