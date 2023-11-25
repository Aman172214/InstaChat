import React, { useContext, useEffect, useState } from "react";
import Avatar from "./Avatar";
import { UserContext } from "../UserContext";
import { uniqBy } from "lodash";

const Chat = () => {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [sentMessage, setSentMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const { loggedInUsername, id } = useContext(UserContext);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:5000");
    setWs(ws);
    ws.addEventListener("message", serverMessageHandler);
  }, []);

  const showOnlinePeople = (peopleArray) => {
    const people = {};
    peopleArray.forEach(({ username, userId }) => {
      people[userId] = username;
    });
    setOnlinePeople(people);
  };

  const serverMessageHandler = (event) => {
    const messageData = JSON.parse(event.data);
    if ("online" in messageData) {
      showOnlinePeople(messageData.online);
    } else if ("text" in messageData) {
      setMessages((prevMessage) => [...prevMessage, { ...messageData }]);
    }
  };

  const sendMessageHandler = (event) => {
    event.preventDefault();
    ws.send(
      JSON.stringify({
        receiverId: selectedPerson,
        text: sentMessage,
      })
    );
    setSentMessage(" ");
    setMessages((prevMessage) => [
      ...prevMessage,
      { text: sentMessage, sender: id, receiver: selectedPerson },
    ]);
  };

  const onlinePeopleExcLoggedInUser = { ...onlinePeople };
  delete onlinePeopleExcLoggedInUser[id];

  const uniqueMessageData = uniqBy(messages, "id");

  return (
    <div className="flex h-screen">
      <div className="bg-white w-1/4 py-3">
        <h1 className="text-indigo-600 font-bold text-3xl flex mb-5 pl-5">
          InstaChat
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-7 h-7"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
          </svg>
        </h1>
        {Object.keys(onlinePeopleExcLoggedInUser).map((userId) => (
          <div
            className={
              "border-b border-gray-100  flex items-center gap-2 text-lg cursor-pointer " +
              (selectedPerson ? "bg-indigo-50" : "")
            }
            key={userId}
            onClick={() => setSelectedPerson(userId)}
          >
            {userId === selectedPerson && (
              <div className="w-1 h-14 rounded-r-md bg-indigo-600"></div>
            )}
            <div className="flex gap-2 py-3 pl-5">
              {" "}
              <Avatar username={onlinePeople[userId]} userId={userId} />
              <span>{onlinePeople[userId]}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col bg-indigo-100 w-3/4 p-2">
        <div className="flex-grow">
          {!selectedPerson && (
            <div className="flex items-center justify-center h-full text-gray-400">
              Select a person from sidebar
            </div>
          )}
          {!!selectedPerson && (
            <div>
              {uniqueMessageData.map((message) => (
                <div key={Math.random()}>{message.text}</div>
              ))}
            </div>
          )}
        </div>
        {!!selectedPerson && (
          <form className="flex gap-2 mx-1" onSubmit={sendMessageHandler}>
            <input
              type="text"
              value={sentMessage}
              placeholder="Type your message here"
              className="bg-white flex-grow rounded-md p-1 border-0"
              onChange={(event) => setSentMessage(event.target.value)}
            />
            <button
              type="submit"
              className="bg-indigo-600 p-2 text-white rounded-md font-semibold hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Chat;
