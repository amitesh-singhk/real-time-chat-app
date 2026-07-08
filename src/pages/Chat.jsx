import { Oval } from "react-loader-spinner";
import UserList from "../components/UserList";
import EmojiPicker from "emoji-picker-react";
import ChatHeader from "../components/ChatHeader";
import { Smile } from "lucide-react";
import ImagePreview from "../components/ImagePreview";
import { useState, useEffect, useRef } from "react";
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
    deleteDoc,
    updateDoc,
    setDoc,
    doc,
    where,
} from "firebase/firestore";

import "../styles/Chat.css";

function Chat() {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [image, setImage] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [loading, setLoading] = useState(false);
    const [chatLoading, setChatLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState(null);
    const [showEmoji, setShowEmoji] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const chatId =
        selectedUser && auth.currentUser
            ? [auth.currentUser.uid, selectedUser.uid].sort().join("_")
            : null;

    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState("");

    const messagesEndRef = useRef(null);
    useEffect(() => {
        if (!auth.currentUser) return;

        const userRef = doc(db, "users", auth.currentUser.uid);

        setDoc(
            userRef,
            {
                uid: auth.currentUser.uid,
                name: auth.currentUser.displayName,
                photo: auth.currentUser.photoURL,
                online: true,
            },
            { merge: true }
        );

        return () => {
            setDoc(
                userRef,
                {
                    online: false,
                    lastSeen: serverTimestamp(),
                },
                { merge: true }
            );
        };
    }, []);

    useEffect(() => {
        if (!chatId) {
            setMessages([]);
            return;
        }

        const q = query(
            collection(db, "chats", chatId, "messages"),
            orderBy("createdAt", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMessages(
                snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }))
            );

            setChatLoading(false);
        });

        return () => unsubscribe();
    }, [chatId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages]);
    useEffect(() => {
        if (!auth.currentUser) return;

        const q = query(
            collection(db, "users"),
            where("uid", "!=", auth.currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const users = snapshot.docs.map((doc) => doc.data());

            const typing = users.find((user) => user.typing);

            if (typing) {
                setTypingUser(typing);
                setIsTyping(true);
            } else {
                setTypingUser(null);
                setIsTyping(false);
            }
        });

        return () => unsubscribe();
    }, []);
    useEffect(() => {
        if (!auth.currentUser) return;

        const q = query(
            collection(db, "users"),
            where("uid", "!=", auth.currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allUsers = snapshot.docs.map((doc) => doc.data());

            setUsers(allUsers);
        });

        return () => unsubscribe();
    }, []);

    if (!auth.currentUser) {
        return <Navigate to="/" />;
    }
    const onEmojiClick = (emojiData) => {
        setMessage((prev) => prev + emojiData.emoji);
        setShowEmoji(false);
    };

    const updateMessage = async () => {
        if (editText.trim() === "") return;

        try {
            await updateDoc(
                doc(db, "chats", chatId, "messages", editingId),
                {
                    text: editText,
                });

            setEditingId(null);
            setEditText("");
        } catch (error) {
            console.error(error);
            alert("Failed to update message.");
        }
    };
    const handleTyping = async (value) => {
        setMessage(value);

        if (!auth.currentUser) return;

        await setDoc(
            doc(db, "users", auth.currentUser.uid),
            {
                typing: value.length > 0,
            },
            { merge: true }
        );
    };
    const sendMessage = async () => {
        if (message.trim() === "" && !image) return;
        if (!selectedUser) {
            alert("Please select a user first.");
            return;
        }
        setLoading(true);

        try {
            let imageUrl = "";

            if (image) {
                const data = new FormData();
                data.append("file", image);
                data.append("upload_preset", "chat_upload");

                const res = await fetch(
                    "https://api.cloudinary.com/v1_1/tdlhklkz/image/upload",
                    {
                        method: "POST",
                        body: data,
                    }
                );

                const file = await res.json();
                imageUrl = file.secure_url;
            }

            await addDoc(collection(db, "chats", chatId, "messages"), {
                text: message,
                image: imageUrl,
                uid: auth.currentUser.uid,
                name: auth.currentUser.displayName,
                photo: auth.currentUser.photoURL,
                senderId: auth.currentUser.uid,
                receiverId: selectedUser.uid,
                createdAt: serverTimestamp(),
            });

            setMessage("");
            setImage(null);
            await setDoc(
                doc(db, "users", auth.currentUser.uid),
                {
                    typing: false,
                },
                { merge: true }
            );
        } catch (error) {
            console.error(error);
            alert("Failed to send message.");
        } finally {
            setLoading(false);
        }
    };
    const deleteMessage = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this message?"
        );

        if (!confirmDelete) return;

        try {
            await deleteDoc(
                doc(db, "chats", chatId, "messages", id)
            );
        } catch (error) {
            console.error(error);
            alert("Failed to delete message.");
        }
    };
    const logout = async () => {
        await setDoc(
            doc(db, "users", auth.currentUser.uid),
            {
                online: false,
                typing: false,
                lastSeen: serverTimestamp(),
            },
            { merge: true }
        );

        await signOut(auth);

    };
    return (
        <div className="chat-container">
            <ChatHeader

                user={auth.currentUser}
                onLogout={logout}
                typingUser={typingUser}
                isTyping={isTyping}
            />

            <div className="chat-body">

                <UserList
                    users={users}
                    selectedUser={selectedUser}
                    setSelectedUser={setSelectedUser}
                />
                <div className="chat-right">

                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="🔍 Search messages..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                    <div className="messages">

                        {chatLoading ? (
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    height: "100%",
                                    fontSize: "20px",
                                    color: "#666",
                                    fontWeight: "600",
                                }}
                            >
                                Loading chat...
                            </div>
                        ) : !selectedUser ? (
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    height: "100%",
                                    color: "#666",
                                    fontSize: "20px",
                                    fontWeight: "600",
                                }}
                            >
                                Select a user to start chatting 💬
                            </div>
                        ) :

                            messages
                                .filter((msg) =>
                                    msg.text?.toLowerCase().includes(searchText.toLowerCase())
                                )
                                .map((msg) => (

                                    <div
                                        key={msg.id}
                                        className={
                                            msg.uid === auth.currentUser.uid
                                                ? "message own"
                                                : "message"
                                        }
                                    >

                                        <img
                                            src={msg.photo}
                                            alt="profile"
                                            className="avatar"
                                        />

                                        <div className="bubble">

                                            <h4>{msg.name}</h4>

                                            {msg.text && (
                                                <p>{msg.text}</p>
                                            )}
                                            <p className="message-time">
                                                {msg.createdAt?.toDate
                                                    ? msg.createdAt.toDate().toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })
                                                    : ""}
                                            </p>

                                            {msg.image && (
                                                <img
                                                    src={msg.image}
                                                    alt="chat"
                                                    className="chat-image"
                                                />
                                            )}
                                            {msg.uid === auth.currentUser.uid && (
                                                <>
                                                    <button
                                                        className="edit-btn"
                                                        onClick={() => {
                                                            setEditingId(msg.id);
                                                            setEditText(msg.text);
                                                        }}
                                                    >
                                                        ✏️ Edit
                                                    </button>

                                                    <button
                                                        className="delete-btn"
                                                        onClick={() => deleteMessage(msg.id)}
                                                    >
                                                        🗑 Delete
                                                    </button>
                                                </>
                                            )}

                                        </div>

                                    </div>

                                ))
                        }
                        <div ref={messagesEndRef}></div>
                    </div> {/* messages */}

                </div> {/* chat-right */}

            </div> {/* chat-body */}

            {
                image && (
                    <ImagePreview
                        image={image}
                        setImage={setImage}
                    />
                )
            }

            <div className="chat-input">

                <input
                    type="text"
                    placeholder="Type a message..."

                    value={editingId ? editText : message}

                    onChange={(e) => {
                        if (editingId) {
                            setEditText(e.target.value);
                        } else {
                            handleTyping(e.target.value);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            sendMessage();
                        }
                    }}
                />

                <div className="emoji-container">
                    <button
                        className="emoji-btn"
                        onClick={() => setShowEmoji(!showEmoji)}
                    >
                        <Smile size={22} />
                    </button>

                    {showEmoji && (
                        <div className="emoji-picker">
                            <EmojiPicker
                                onEmojiClick={onEmojiClick}
                                width={320}
                                height={400}
                            />
                        </div>
                    )}
                </div>

                <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => setImage(e.target.files[0])}
                />

                <label htmlFor="image-upload" className="upload-btn">
                    📎
                </label>

                <button

                    onClick={editingId ? updateMessage : sendMessage}
                    disabled={loading}
                >
                    {editingId
                        ? "Save"
                        : loading
                            ? "Uploading..."
                            : "Send"}
                </button>
                {editingId && (
                    <button
                        className="cancel-btn"
                        onClick={() => {
                            setEditingId(null);
                            setEditText("");
                        }}
                    >
                        Cancel
                    </button>
                )}

            </div>

        </div >
    );
}

export default Chat;