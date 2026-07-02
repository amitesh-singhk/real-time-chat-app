import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { Navigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

import "../styles/Chat.css";

function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });

    return () => unsubscribe();
  }, []);

  const sendMessage = async () => {
    if (message.trim() === "") return;

    try {
      await addDoc(collection(db, "messages"), {
        text: message,
        uid: auth.currentUser.uid,
        name: auth.currentUser.displayName,
        photo: auth.currentUser.photoURL,
        createdAt: serverTimestamp(),
      });

      setMessage("");
    } catch (error) {
      console.log(error);
    }
  };

  const logout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  return (
    <div className="chat-container">

      <div className="chat-header">

        <div className="header-left">
          <img
            src={auth.currentUser.photoURL}
            alt=""
            className="profile"
          />

          <h3>{auth.currentUser.displayName}</h3>
        </div>

        <button onClick={logout}>
          Logout
        </button>

      </div>

      <div className="messages">

        {messages.map((msg) => (

          <div
            key={msg.id}
            className={
              msg.uid === auth.currentUser.uid
                ? "my-message"
                : "other-message"
            }
          >

            <img
              src={msg.photo}
              alt=""
              className="message-photo"
            />

            <div className="message-box">
              <h4>{msg.name}</h4>
              <p>{msg.text}</p>
            </div>

          </div>

        ))}

      </div>

      <div className="input-box">

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

        <button onClick={sendMessage}>
          Send
        </button>

      </div>

    </div>
  );
}

export default Chat;