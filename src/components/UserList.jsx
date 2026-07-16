import React from "react";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

function UserList({ users, selectedUser, setSelectedUser }) {
  const togglePin = async (user) => {
    try {
      await updateDoc(doc(db, "users", user.uid), {
        pinned: !user.pinned,
      });
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <div className="user-list">
      {users.map((user) => (
        <div
          key={user.uid}
          className={`user-item ${selectedUser?.uid === user.uid ? "active-user" : ""
            }`}
          onClick={() => setSelectedUser(user)}
        >
          <img
            src={user.photo || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.name)}
            alt={user.name}
            className="avatar"
            onError={(e) => {
              e.target.src =
                "https://ui-avatars.com/api/?name=" +
                encodeURIComponent(user.name);
            }}
          />

          <div>
            <h4>{user.name}</h4>
            {user.pinned && (
              <span className="pin-icon">📌</span>
            )}

            <p>{user.online ? "🟢 Online" : "⚫ Offline"}</p>
            <button
              className="pin-btn"
              onClick={(e) => {
                e.stopPropagation();
                togglePin(user);
              }}
            >
              {user.pinned ? "📌 Unpin" : "📌 Pin"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default UserList;