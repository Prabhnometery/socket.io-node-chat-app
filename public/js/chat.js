const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $shareLocation = document.querySelector('#share-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('locationMessage', (locationMessage) => {
    console.log(locationMessage.url)
    const html = Mustache.render(locationMessageTemplate, {
        username: locationMessage.username,
        url: locationMessage.url,
        createdAt: moment(locationMessage.createdAt).format('H:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})


socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username.charAt(0).toUpperCase() + message.username.slice(1),
        message: message.text,
        createdAt: moment(message.createdAt).format('H:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', (data) => {
    const html = Mustache.render(sidebarTemplate, {
        room: data.room.charAt(0).toUpperCase() + data.room.slice(1),
        users: data.users
    })

    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (event) => {
    event.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = $messageFormInput.value

    socket.emit('sendMessage', message, (error) => {

        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log('Message delivered')
    })
})


$shareLocation.addEventListener('click', () => {

    if (!navigator.geolocation) {
        return alert('Geolocation is not supported')
    }

    $shareLocation.setAttribute('disabled', 'disabled')


    navigator.geolocation.getCurrentPosition((position) =>  {
        $shareLocation.removeAttribute('disabled')
        const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }
        
        socket.emit('sendLocation', location, (notification) => {
            console.log(notification)
        })
    })

    
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }

})



