import React from "react";

const Avatar = ({ username, userId, online }) => {
  const colors = [
    "bg-blue-200",
    "bg-red-200",
    "bg-green-200",
    "bg-purple-200",
    "bg-yellow-200",
    "bg-teal-200",
    "bg-gray-200",
    "bg-emerald-200",
    "bg-orange-200",
    "bg-cyan-200",
    "bg-amber-200",
    "bg-fuchsia-200",
  ];

  const userIdBase10 = parseInt(userId, 16);
  const colorIndex = userIdBase10 % colors.length;
  const color = colors[colorIndex];

  const avatar = username[0].toUpperCase();

  return (
    <div className={"w-8 h-8 rounded-full relative flex items-center " + color}>
      <span className="text-center w-full opacity-70">{avatar}</span>
      {online && (
        <div className="absolute w-3 h-3 bg-green-500 rounded-full bottom-0 right-0 border border-white"></div>
      )}
      {!online && (
        <div className="absolute w-3 h-3 bg-gray-500 rounded-full bottom-0 right-0 border border-white"></div>
      )}
    </div>
  );
};

export default Avatar;
