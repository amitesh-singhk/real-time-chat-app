import React from "react";

function UserList({ users, selectedUser, setSelectedUser }) {
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

            <p>{user.online ? "🟢 Online" : "⚫ Offline"}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default UserList;