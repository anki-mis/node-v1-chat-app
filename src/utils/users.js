// This file keeps track of users in an array
// Operations that we are going to perform on this array:-
// addUser, removeUser, getUser, getUsersInRoom

const users = [];

const addUser = ({id, username, room}) => {
    //Clean the data
    username = username.trim().toLowerCase();
    room = room.trim().toLowerCase();

    //Validate the data
    if (!username || !room) {
        return {
            error: 'Username and room are required.'
        }
    };

    //Check for existing user
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    });

    // Validate username
    if (existingUser) {
        return {
            error: 'Username is in use.'
        }
    };

    // Store user
    const user = { id, username, room };
    users.push(user);
    return { user };
};

const removeUser = (p_id) => {
    const index = users.findIndex((user) => user.id === p_id);

    if(index !== -1) {
        return users.splice(index, 1)[0]
    }
};

const getUser = (p_id) => {
    return users.find((user) => user.id === p_id);
}

const getUsersInRoom = (p_room) => {
    return users.filter((user) => user.room === p_room);
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}
