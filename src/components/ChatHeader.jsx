import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

function ChatHeader({
  user,
  onLogout,
  typingUser,
  isTyping,
}) {
  const [userStatus, setUserStatus] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = onSnapshot(
      doc(db, "users", user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          setUserStatus(docSnap.data());
        }
      }
    );

    return () => unsubscribe();
  }, [user]);
  return (
    <div className="chat-header">
      <div className="user-info">
        <img
          src={
            user.photoURL ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              user.displayName
            )}`
          }
          alt={user.displayName}
          className="avatar"
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
              user.displayName
            )}`;
          }}
        />
        <div>
          <h2>{user.displayName}</h2>
          <p className="status">
            {isTyping && typingUser ? (
              <>⌨️ {typingUser.name} is typing...</>
            ) : userStatus?.online ? (
              "🟢 Online"
            ) : (
              `⚫ Last seen ${userStatus?.lastSeen?.toDate
                ? userStatus.lastSeen.toDate().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
                : ""
              }`
            )}
          </p>
        </div>
      </div>

      <button className="logout-btn" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}

export default ChatHeader;