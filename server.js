const socket = require("socket.io");
const http = require("http");
const https = require("https");
const fs = require("fs");
const app = require("./app");
const MongoHelper = require("./Services/MongoHelper");
const port = process.env.PORT || 4000;

const options = {
  key: fs.existsSync(process.env.SSL_KEY)
    ? fs.readFileSync(process.env.SSL_KEY)
    : null,
  cert: fs.existsSync(process.env.SSL_CRT)
    ? fs.readFileSync(process.env.SSL_CRT)
    : null,
};

const server =
  process.env.MODE == "DEV"
    ? http.createServer(app)
    : https.createServer(options, app);

console.log("Serving on ", port);

// var clients = [];
// var io = require("socket.io")(server);

// //io connection
// io.on("connection", (socket, data) => {
//   socket.on("disconnect", () => {
//     for (var i in clients) {
//       for (var j = 0; j < clients[i].length; j++) {
//         if (clients[i][j].socket == socket.id) {
//           clients[i].splice(j, 1);
//           // TODO: For Future Use
//           // clients[i]['status'] = false;
//           // socket.broadcast.emit('offline',i);
//         }
//       }
//     }
//   });

//   ///======================================>Add user according to the User ID

//   socket.on("addUser", function (data) {
//     if (typeof clients[data.userId] == "undefined") clients[data.userId] = [];
//     for (var j = 0; j < clients[data.userId].length; j++) {
//       if (clients[data.userId][j].socket == socket.id)
//         clients[data.userId].splice(j, 1);
//     }
//     clients[data.userId].push({ socket: socket.id });
//     clients[data.userId]["status"] = true;

//     console.log(
//       "====== User Added. Connected Users List ======\n",
//       getConnectedUsers(clients)
//     );
//     socket.broadcast.emit("broadcast", "hello friends!");
//   });

//   socket.on("sendData", function (obj) {
//     if (obj.socketType == "Message" || obj.socketType == "StatusUpdate") {
//       MongoHelper.saveThreadMessage(obj);
//       if (typeof clients[obj.data.toUser] != "undefined") {
//         for (var i = 0; i < clients[obj.data.toUser].length; i++) {
//           if (clients[obj.data.toUser][i].socket != socket.id) {
//             socket.broadcast
//               .to(clients[obj.data.toUser][i].socket)
//               .emit("receiveData", obj);
//           }
//         }
//       }
//     } else if (obj.socketType == "SomethingElse") {
//       // TODO: Future Block Of Something Great
//     } else {
//       // TODO: Future Block Of Something Great
//     }
//   });
// });

// //==================================> Get the list off all connected users
// function getConnectedUsers(clients) {
//   connectedUsers = [];
//   count = 0;
//   for (var i in clients) {
//     if (clients[i]["status"] === true) {
//       connectedUsers[count] = i;
//       ++count;
//     }
//   }
//   return connectedUsers;
// }

server.listen(port);
