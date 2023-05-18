import React, { useState, useRef } from 'react'
import './App.css';

import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore'; // DB
import 'firebase/compat/auth'; // user auth

// hooks 
import { useAuthState } from 'react-firebase-hooks/auth'; 
import { useCollectionData } from 'react-firebase-hooks/firestore';

firebase.initializeApp({
    apiKey: "AIzaSyB_HtAKAyS9od-F6z0LyLYCovxGSiVsylI",
    authDomain: "chatapp-c2c60.firebaseapp.com",
    projectId: "chatapp-c2c60",
    storageBucket: "chatapp-c2c60.appspot.com",
    messagingSenderId: "867201479572",
    appId: "1:867201479572:web:136fe4379923bf02991581",
    measurementId: "G-YK9WL3ZLB1"
})

const auth = firebase.auth();
const firestore = firebase.firestore();

function App() {

  const [user] = useAuthState(auth); // hook, creates user objects with userID, email, etc, sets user to null when the user is signed out

  return (
    <div className="App">
      <header>
        <h1>Georgetown Chat App</h1>
        <SignOut />
       
      </header>
      <section>
        {user ? <ChatRoom /> : <SignIn />} 
      </section>
    </div>
  ); // load the ChatRoom if the user is signed in, otherwise prompt them to sign in
}

function SignIn() {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider(); // use Google authentication
    auth.signInWithPopup(provider) // firebase auth library to open up a popup window using google authentication as defined above
    .then(() =>{
      if (auth.currentUser.email.split('@')[1] !== "georgetown.edu")
      {
        console.log("Non-georgetown email used");
        auth.signOut();
        window.alert("Error, non-georgetown email used, please try again")
      }
    });
  }

  return (
    <button onClick = {signInWithGoogle}>Sign in with Google</button>
  )
}

function SignOut() {
  return auth.currentUser && (
    <button onClick={() => auth.signOut()}>Sign Out</button>
  ) // basic signout button from the auth library
}

function ChatRoom() {
  const dummyRef = useRef() // reference to bottom, empty div to scroll down to after sending a msg
  const messagesRef = firestore.collection('messages'); // reference the firestore DB, collection 'messages'
  const query = messagesRef.orderBy('createdAt') // order the collection by most recent msg

  const [messages] = useCollectionData(query, {idField: 'id'}); // use hooks to create an up-to-date state object for messages
  //^ the above will return all the objects in the the collection in an array (can also return errors), always runs on render

  const [formValue, setFormValue] = useState(""); //init state empty state

  //event handler for sending messages to the backend
  const sendMessage = async(e) => {
    e.preventDefault(); // don't refresh everytime something new is sent

    const {uid} = auth.currentUser;
    await messagesRef.add({ // add to the messages collection
      text: formValue,  // text
      createdAt: firebase.firestore.FieldValue.serverTimestamp(), // timestamp
      uid // userID
    });

    setFormValue("") // reset form value
    dummyRef.current.scrollIntoView({behavior:'smooth'}) // scroll to the 'dummyRef', span below the messages
  }

  dummyRef.current.scrollIntoView({behavior:'smooth'}); // make sure to focus on latest message on render
  return ( // map each msg in messages to a ChatMessage object, with msg id and msg as the values
    <>
      <main>
        {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg}/>)} 
        <span ref={dummyRef}></span>
      </main>
      <form onSubmit={sendMessage}>
        <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="Send a message..."/>
        <button type="submit" disabled={!formValue}>🕊️</button>
      </form>
    </>
  ) // listenm to the on change event, and use that to set form value
}

function ChatMessage(props) { // chatMsg child component to display each msg in the chat
  const { text, uid } = props.message; // get the message text
  // need to display sent and received msgs differently
  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';
  return (
    <div className={'message ' + messageClass}>
      <p>{text}</p>
    </div> 
  )
}
export default App;
