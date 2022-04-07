const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocMessage } = require('./utils/chatMsgInstance');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname,'../public');
app.use(express.static(publicDirectoryPath));

let count = 0;

//if i have 5 clients connected to the server, below code
//is going to run 5 times, once for each client connecting
io.on('connection', (socket) => {
    console.log('New WebSocket connection');

     //join socket on server
    socket.on('join', ({ username, room }, callback_func) => {
        //instead of destructuring we can also use spread operator
        //socket.on('join', (options, callback_func) => {
        
        // socket.id is the unique id that comes with this specific socket connection which are reusing as user id
        const {error, user} = addUser({ id: socket.id, username, room });
        //instead of destructuring we can also use spread operator
        //const {error, user} = addUser({ id: socket.id, ...options });

        if(error) {
            console.log(error);
            return callback_func(error);
        }

        socket.join(user.room);

        // 3 ways server sends message to client
        // socket.emit - specific client, io.emit - all clients, 
        // socket.broadcast.emit - all clients except the specific client
        // Below are the room restricted variations of above
        // io.to.emit - everyone inside room, 
        // socket.broadcast.to.emit - everyone inside room except the client who has connected this communication socket to this server

        //1st arg is the event name and must match up to the event received by client in client code (chat.js)
        //2nd arg onwards they can be used in the callback function of the client event listener
        // for example count is the 1st arg in the countUpdated event listener's callback function
        // the name "count" need not match with the event listener arg but the order of args is followed
        //---------------------------------------
        //socket.emit('eCountUpdated', count);
        //sending message to the individual connection
        socket.emit('srv_msg', generateMessage('Admin', 'Welcome'));

        //sending message to all client connections except this individual connection
        socket.broadcast.to(user.room).emit('srv_msg', generateMessage('Admin', `${user.username} has joined.`));

        //Send data(updated) for left panel(users in a room) to all clients connected
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });


        // All is well till this point, so send the ack message through callback
        callback_func();
    });

    //listening to eIncrement event from client
    //---------------------------------------
    //socket.on('eIncrement', () => {
        //count++;

        // This emits the updated count back to client(socket) who is holding on to this connection "io.om('connection', "
        //---------------------------------------
        //socket.emit('eCountUpdated', count); 

        // This emits the updated count back to all the clients(sockets) connections holding onto this server io
        //---------------------------------------
        //io.emit('eCountUpdated', count); 
    //});
    //sending message to all client connections which was received from the client form input
    socket.on('sendMsgToServer', (message, ack_msg) => {
        const thisUser = getUser(socket.id);
        const filter = new Filter();

        if(filter.isProfane(message)) {
            return ack_msg('Profanity is not allowed.');
        }

        io.to(thisUser.room).emit('srv_msg', generateMessage(thisUser.username, message));
        // this is a callback function defined at client side
        ack_msg();
    });

    //sending message to all client connections, location    
    socket.on('sendLocation', (coords, loc_ack) => {
        const thisUser = getUser(socket.id);
        //io.emit('srv_msg', `https://google.com/maps?q=${coords.latitude},${coords.longitude}`);
        io.to(thisUser.room).emit('locationMessage', generateLocMessage(thisUser.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`)); 
        loc_ack();
    });    
    
    //sending message to all client connections, this one will not receive because this is the 
    //disconnect event for this client
    socket.on('disconnect', () => {
        const removedUser = removeUser(socket.id);

        if(removedUser) {
            // send message that the specific user has left
            io.to(removedUser.room).emit('srv_msg', generateMessage('Admin', `${removedUser.username} has left.`)); 
            //Send data(updated) for left panel(users in a room) to all clients connected
            io.to(removedUser.room).emit('roomData', {
                room: removedUser.room,
                users: getUsersInRoom(removedUser.room)
            });
        }        
    });
});

server.listen(port, () => {
    console.log(`Server is up on port ${port}`);
})
