// establishes connection with the server through socket.io
//(const io = socketio(server);) code written in index.js at server makes sure we can use io()
//-----------------------------------------------------------------------------
const socket = io();

//Elements 
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button');
//----
const $sendLocation = document.querySelector('#send-location');
//const $sendLocationButton = $sendLocation.querySelector('button');
const $messages = document.querySelector('#messages'); //where we are going to render
const $sidebar = document.querySelector('#sidebar'); //where we are going to render

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;//what we are going to render
const locMsgTemplate = document.querySelector('#location-message-template').innerHTML;//what we are going to render
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options (manipulate query string to fetch values to send them to server for further processing)
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

//auto-scroll to bottom of chat window(latest message) if user is not deliberately viewing the older messages
const autoscroll = () => {
    // new message element (fetch the latest message element)
    const $newMessage = $messages.lastElementChild;
    // Total height of the new message (latest message)
    const newMessageStyles = getComputedStyle($newMessage); //this function is made available to us by the browser
                                                            // to get the computed style of an element
    const newMessageMargin = parseInt(newMessageStyles.marginBottom); // margin of the new message
    const newMessageHeight = $newMessage.offsetHeight; // actual height of the new message
    const newMessageTotHeight = newMessageMargin + newMessageHeight; // total height of the new message

    console.log('$newMessage: ', $newMessage);
    console.log('newMessageStyles: ', newMessageStyles);
    console.log('newMessageMargin: ', newMessageMargin);
    console.log('newMessageHeight: ', newMessageHeight);
    console.log('newMessageTotHeight: ', newMessageTotHeight);

    // Visible height of the chat messages section
    const visibleHeight = $messages.offsetHeight;

    //Height of the message container 
    //(including the section of messages which are not visible and need scrolling up/down to view them)
    const containerHeight = $messages.scrollHeight;

    // distance from the top of the message container to the top of the visible message section
    // for example, if we scroll to the topmost, this distance is 0 and if we scroll to the bottommost
    // this distance is "containerHeight" minus "visibleHeight".
    const topScrollOffset = $messages.scrollTop;

    //How far have I scrolled (distance between top of the message container and bottom of the visible portion of message container(portion I am viewing)
    // for example, if at the topmost, then this is the visible height because container height is same as visible height
    // if at the bottom most position, then it is container height.
    const scrollOffset = topScrollOffset + visibleHeight;

    
    console.log('visibleHeight: ', visibleHeight);
    console.log('containerHeight: ', containerHeight);
    console.log('topScrollOffset: ', topScrollOffset);
    console.log('scrollOffset: ', scrollOffset);

    // if the user was not at the bottom most position of the chat messages container (for example if the user 
    // was scrolling up and viewing older message) when the new message arrived, then do not force scroll 
    // to the bottom upon arrival of a new message, otherwise when a new message arrives, force scroll to the bottom most
    if ((containerHeight - newMessageTotHeight) <= scrollOffset) {
        $messages.scrollTop = containerHeight - visibleHeight;
    }

    console.log('topScrollOffset now: ', $messages.scrollTop);
    console.log('containerHeight now: ', $messages.scrollHeight);
    
}

//this listens to the event emitted by the server, in this case "countUpdated" event
//count is the 2nd arg in event emitter and hence will be the 1st arg in event listener's callback function
// arg name "count" need not match with the event emitter from server but order of args will be important
// For example for server code "socket.emit('countUpdated', count, count1);" 
// and client code "socket.on('countUpdated', (arg1, arg2) => ", count=arg1 and count1=arg2
//-----------------------------------------------------------------------------------------
// socket.on('eCountUpdated', (count) => {
//     console.log('The count has been updated at the server.' + count);
// })
socket.on('srv_msg', (srv_msg_received) => {
    console.log(srv_msg_received.text);

    //final html we will be rendering in the browser
    const html = Mustache.render(messageTemplate, {
        username: srv_msg_received.username,
        message: srv_msg_received.text,
        createdAt: moment(srv_msg_received.createdAt).format('hh:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('locationMessage', (p_url_object) => {
    console.log(p_url_object);

    //final html we will be rendering in the browser
    const html = Mustache.render(locMsgTemplate, {
        username: p_url_object.username,
        url: p_url_object.url,
        createdAt:  moment(p_url_object.createdAt).format('hh:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('roomData', ({ room, users }) => {
     //final html we will be rendering in the browser for left side panel
     const html = Mustache.render(sidebarTemplate, {
        room: room,
        users: users
    });
    $sidebar.innerHTML = html;
});

//Add an event listener to clicking of +1(increment) button
//------------------------------------------------------------
// document.querySelector('#increment').addEventListener('click', () => {
//     console.log('Clicked');

//     //emits an event, this time from client to server
//     socket.emit('eIncrement');
// });

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    //code to disable form input will go here
    $messageFormButton.setAttribute('disabled','disabled');

    const message = e.target.elements.input_msg.value; //document.querySelector('input').value;

    //emits an event, this time from client to server
    // if the last argument is a callback function defined here, 
    // then it can be invoked from server for acknowledgement
    socket.emit('sendMsgToServer', message, (srv_ack_err) => {

        //code to re-enable input form goes here
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = ''; //clear out text item(form input) value
        $messageFormInput.focus(); //refocus cursor to text item

        if(srv_ack_err) {
            return console.log('Error - ' + srv_ack_err);
        }
        console.log('Message delivered.'); 
    });
});


$sendLocation.addEventListener('click', (e) => {
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.');
    }

    //disable send location button
    //$sendLocation.setAttribute(disabled,true);       
    //$sendLocation.disabled = true; 
    document.getElementById("send-location").disabled = true;  

    navigator.geolocation.getCurrentPosition((position) => {
      
        //emits an event, from client to server
        socket.emit('sendLocation', 
                    {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    }, 
                    () => {
                        console.log('Client says - server received the location for this client');

                        //code to re-enable send location button
                        $sendLocation.removeAttribute('disabled');                        
                    }
                    );
    });
    
});

//send join room information(username and room) to server
socket.emit('join', { username, room }, (err) => {
    if(err) {
        alert(err);
        location.href = '/';
    }    
});