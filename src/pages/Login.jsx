import { signInWithPopup } from "firebase/auth";
import { auth, provider, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";

function Login() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      // Google Login Popup
      const result = await signInWithPopup(auth, provider);

      // Logged in user
      const user = result.user;

      // Save user in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photo: user.photoURL,
        createdAt: new Date(),
      });

      console.log("User Saved:", user);

      // Redirect to Chat Page
      navigate("/chat");

    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  return (
    <div>
      <h1>Real Time Chat App</h1>

      <button onClick={handleLogin}>
        Login with Google
      </button>
    </div>
  );
}

export default Login;