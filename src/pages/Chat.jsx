
import { Oval } from "react-loader-spinner";
import UserList from "../components/UserList";
import EmojiPicker from "emoji-picker-react";
import ChatHeader from "../components/ChatHeader";
import { Smile } from "lucide-react";
import ImagePreview from "../components/ImagePreview";
import { useState, useEffect, useRef } from "react";
import { db, auth, rtdb } from "../firebase";
import { Navigate } from "react-router-dom";
import { signOut } from "firebase/auth";

import {
    ref,
    onDisconnect,
    onValue,
    set,
} from "firebase/database";

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
    const [audioReady, setAudioReady] = useState(false);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [image, setImage] = useState(null);
    const [recording, setRecording] = useState(false);

    const [mediaRecorder, setMediaRecorder] = useState(null);

    const [audioChunks, setAudioChunks] = useState([]);

    const [audioBlob, setAudioBlob] = useState(null);
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

    const [replyMessage, setReplyMessage] = useState(null);
    const [forwardMessage, setForwardMessage] = useState(null);
    const [showForwardModal, setShowForwardModal] = useState(false);

    const [reactionMessageId, setReactionMessageId] = useState(null);
    const [shouldScroll, setShouldScroll] = useState(false);

    const reactions = ["👍", "❤️", "😂", "😮", "😢"];



    const messagesEndRef = useRef(null);
    useEffect(() => {
        if (!auth.currentUser) return;

        const userRef = doc(db, "users", auth.currentUser.uid);
        const statusRef = ref(rtdb, "status/" + auth.currentUser.uid);

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
        set(statusRef, {
            online: true,
        });

        onDisconnect(statusRef).set({
            online: false,
        });

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

        const unsubscribe = onSnapshot(q, async (snapshot) => {

            const msgs = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            setMessages(msgs);

            // Mark messages as seen
            for (const msg of msgs) {
                if (
                    msg.receiverId === auth.currentUser.uid &&
                    msg.senderId !== auth.currentUser.uid &&
                    msg.seen === false
                ) {
                    await updateDoc(
                        doc(db, "chats", chatId, "messages", msg.id),
                        {
                            seen: true,
                        }
                    );
                }
            }

            setChatLoading(false);
        });

        return () => unsubscribe();
    }, [chatId]);

    useEffect(() => {
        if (shouldScroll) {
            messagesEndRef.current?.scrollIntoView({
                behavior: "smooth",
            });

            setShouldScroll(false);
        }
    }, [messages, shouldScroll]);
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

        const statusRef = ref(rtdb, "status/" + auth.currentUser.uid);

        const unsubscribe = onValue(statusRef, async (snapshot) => {
            const data = snapshot.val();

            await setDoc(
                doc(db, "users", auth.currentUser.uid),
                {
                    online: data?.online || false,
                },
                { merge: true }
            );
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

            allUsers.sort((a, b) => {
                if (a.pinned === b.pinned) return 0;
                return a.pinned ? -1 : 1;
            });

            setUsers(allUsers);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!auth.currentUser) return;

        const uid = auth.currentUser.uid;

        const userStatusRef = ref(rtdb, "status/" + uid);

        // User online
        set(userStatusRef, {
            online: true,
        });

        // Browser close / disconnect
        onDisconnect(userStatusRef).set({
            online: false,
        });

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

    const startRecording = async () => {

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });

            const recorder = new MediaRecorder(stream);

            const chunks = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, {
                    type: "audio/webm",
                });

                setAudioBlob(blob);
                setAudioReady(true);

                console.log("Blob created:", blob);
                console.log("Blob size:", blob.size);
            };

            recorder.start();

            setMediaRecorder(recorder);
            setRecording(true);
        } catch (err) {
            console.error(err);
            alert("Microphone permission denied!");
        }
    };
    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            setRecording(false);
        }
    };
    const sendMessage = async () => {
        if (message.trim() === "" && !image && !audioBlob) return;
        if (!selectedUser) {
            alert("Please select a user first.");
            return;
        }
        setLoading(true);

        try {
            console.log("Chat ID =", chatId);
            let imageUrl = "";
            let audioUrl = "";

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
            console.log("Audio Blob:", audioBlob);
            console.log("Audio Blob Size:", audioBlob?.size);
            if (audioBlob) {
                const data = new FormData();

                data.append("file", audioBlob);
                data.append("upload_preset", "chat_upload");

                const res = await fetch(
                    "https://api.cloudinary.com/v1_1/tdlhklkz/video/upload",
                    {
                        method: "POST",
                        body: data,
                    }
                );

                const file = await res.json();
                audioUrl = file.secure_url;
                console.log("Audio URL:", audioUrl);
            }
            await addDoc(collection(db, "chats", chatId, "messages"), {
                text: message,
                image: imageUrl,
                audio: audioUrl,
                uid: auth.currentUser.uid,
                name: auth.currentUser.displayName,
                photo: auth.currentUser.photoURL,
                senderId: auth.currentUser.uid,
                receiverId: selectedUser.uid,
                createdAt: serverTimestamp(),
                seen: false,
                replyTo: replyMessage
                    ? {
                        text: replyMessage.text,
                        name: replyMessage.name,
                        uid: replyMessage.uid,
                    }
                    : null,

            });
            setReplyMessage(null);
            setShouldScroll(true);
            console.log("Message Saved Successfully");

            setMessage("");
            setImage(null);
            setAudioBlob(null);
            setRecording(false);
            setMediaRecorder(null);
            setAudioReady(false);
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
    const addReaction = async (messageId, emoji) => {
        try {
            await updateDoc(
                doc(db, "chats", chatId, "messages", messageId),
                {
                    reaction: emoji,
                }
            );

            setReactionMessageId(null);
        } catch (error) {
            console.error(error);
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
                                            {msg.replyTo && (
                                                <div className="reply-box">
                                                    <strong>{msg.replyTo.name}</strong>
                                                    <p>{msg.replyTo.text}</p>
                                                </div>
                                            )}

                                            {msg.text && (
                                                <p>{msg.text}</p>
                                            )}
                                            <div className="message-meta">

                                                <span className="message-time">
                                                    {msg.createdAt?.toDate
                                                        ? msg.createdAt.toDate().toLocaleTimeString([], {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })
                                                        : ""}
                                                </span>

                                                {msg.uid === auth.currentUser.uid && (
                                                    <span className="seen-status">
                                                        {msg.seen ? "✓✓ Seen" : "✓ Sent"}
                                                    </span>
                                                )}

                                            </div>

                                            {msg.image && (
                                                <img
                                                    src={msg.image}
                                                    alt="chat"
                                                    className="chat-image"
                                                />
                                            )}
                                            {msg.audio && (
                                                <audio controls className="chat-audio">
                                                    <source src={msg.audio} type="audio/webm" />
                                                    Your browser does not support audio.
                                                </audio>
                                            )}

                                            {msg.reaction && (
                                                <div className="message-reaction">
                                                    {msg.reaction}
                                                </div>
                                            )}

                                            <button
                                                className="reply-btn"
                                                onClick={() => setReplyMessage(msg)}
                                            >
                                                ↩ Reply
                                            </button>

                                            <button
                                                className="reaction-btn"
                                                onClick={() =>
                                                    setReactionMessageId(
                                                        reactionMessageId === msg.id ? null : msg.id
                                                    )
                                                }
                                            >
                                                😀 React
                                            </button>
                                            <button
                                                className="forward-btn"
                                                onClick={() => {
                                                    setForwardMessage(msg);
                                                    setShowForwardModal(true);
                                                }}
                                            >
                                                📤 Forward
                                            </button>

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

                                            {reactionMessageId === msg.id && (
                                                <div className="reaction-picker">
                                                    {["👍", "❤️", "😂", "😮", "😢"].map((emoji) => (
                                                        <span
                                                            key={emoji}
                                                            className="emoji"
                                                            onClick={() => addReaction(msg.id, emoji)}
                                                        >
                                                            {emoji}
                                                        </span>
                                                    ))}
                                                </div>
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
            {replyMessage && (
                <div className="reply-preview">
                    <strong>Replying to {replyMessage.name}</strong>

                    <p>{replyMessage.text}</p>

                    <button
                        className="close-reply"
                        onClick={() => setReplyMessage(null)}
                    >
                        ✖
                    </button>
                </div>
            )}

            {showForwardModal && (
                <div className="forward-modal">
                    <div className="forward-box">
                        <h3>📤 Forward Message</h3>

                        {users.map((user) => (
                            <button
                                key={user.uid}
                                className="forward-user"
                                onClick={() => {
                                    console.log("Forward to:", user.name);
                                }}
                            >
                                {user.name}
                            </button>
                        ))}

                        <button
                            className="close-forward"
                            onClick={() => setShowForwardModal(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

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
                    className="mic-btn"
                    onClick={recording ? stopRecording : startRecording}
                >
                    {recording ? "⏹️" : "🎤"}
                </button>
                {recording && (
                    <div className="recording-status">
                        🔴 Recording...
                    </div>
                )}

                {audioReady && !recording && (
                    <div className="recording-status ready">
                        ✅ Voice Recorded

                        <button
                            className="delete-audio-btn"
                            onClick={() => {
                                setAudioBlob(null);
                                setAudioReady(false);
                            }}
                        >
                            🗑 Delete
                        </button>
                    </div>
                )}
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