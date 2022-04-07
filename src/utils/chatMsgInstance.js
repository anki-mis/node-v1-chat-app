const generateMessage = (p_username, msg_text) => {
    return {
        username: p_username,
        text: msg_text,
        createdAt: new Date().getTime()
    }
};

const generateLocMessage = (p_username, url) => {
    return {
        username: p_username,
        url: url,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateMessage,
    generateLocMessage
};