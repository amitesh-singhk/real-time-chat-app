import React from "react";

function UserList({ users, selectedUser, setSelectedUser }) {
  return (
    <div className="user-list">
      {users.map((user) => (
        <div
          key={user.uid}
          className={`user-item ${
            selectedUser?.uid === user.uid ? "active-user" : ""
          }`}
          onClick={() => setSelectedUser(user)}
        >
          <img
            src={user.photo}
            alt={user.name}
            className="avatar"
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