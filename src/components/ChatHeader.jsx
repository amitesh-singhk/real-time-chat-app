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
              (() => {
                if (!userStatus?.lastSeen?.toDate) {
                  return "⚫ Offline";
                }

                const lastSeen = userStatus.lastSeen.toDate();
                const now = new Date();

                const isToday =
                  lastSeen.toDateString() === now.toDateString();

                const yesterday = new Date();
                yesterday.setDate(now.getDate() - 1);

                const isYesterday =
                  lastSeen.toDateString() === yesterday.toDateString();

                const time = lastSeen.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                if (isToday) {
                  return `⚫ Last seen today at ${time}`;
                }

                if (isYesterday) {
                  return `⚫ Last seen yesterday at ${time}`;
                }

                return `⚫ Last seen ${lastSeen.toLocaleDateString()} ${time}`;
              })()
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