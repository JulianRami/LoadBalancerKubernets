const express = require('express');
const app = express();
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const http = require('http');
require('dotenv').config();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true
}));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

function logRequest(message, body, server) {
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();
    console.log(`([Fecha: ${date}, Hora: ${time}] , ${message}, Respuesta: ${JSON.stringify(body)}, Servidor: ${server})`);
}

function logRequestMessage(message) {
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();
    console.log(`([Fecha: ${date}, Hora: ${time}] , ${message})`);
}

const servers = process.env.SERVERS.split(',').map(server => server.trim());
console.log("Servidores: " + servers);

let currentServerIndex = 0;
const TIMEOUT = 5000;
//let img = ''

app.all('/redirect', upload.single('photo'), (req, res) => {
    handler(req, res);
});

const handler = async (req, res) => {

    logRequestMessage(`Solicitud entrante - Método: ${req.method}, Cuerpo: ${JSON.stringify(req.body)}`);

    // Verifica si hay servidores configurados
    if (servers.length === 0) {
        logRequestMessage('No se han configurado servidores');
        return res.status(500).send('No se han configurado servidores');
    }

    // Selecciona el servidor de aplicación actual para reenviar la solicitud
    const server = servers[currentServerIndex];
    console.log("ip server:" + server)

    try {
        logRequestMessage(`Redirigiendo la solicitud a: ${server}`);

        console.log("URL: " + server + " method: " + req.method)

        // Realiza la solicitud al servidor de aplicación 
        const response = await axios({
            url: server,
            method: req.method,
            data: req.method === 'POST' ? createFormData(req.body, req.file) : req.body,
        });

        console.log("Respuesta solicitud: " + JSON.stringify(response.data))
        logRequest('Respuesta del servidor:', http.status, server);
        currentServerIndex = (currentServerIndex + 1) % servers.length;
        // Envía la respuesta al cliente 
        res.send(response.data);

    } catch (err) {
        console.error('Error al redirigir la solicitud:', err.message);

        //Cambia al siguiente servidor en caso de error
        currentServerIndex = (currentServerIndex + 1) % servers.length;
        logRequestMessage(`Redirigiendo nuevamente la solicitud a: ${servers[currentServerIndex]}`);


        // Si ningún servidor responde, envía un mensaje al cliente
        if (currentServerIndex === 0) {
            logRequestMessage('Todos los servidores están fuera de servicio');
            res.status(500).send('Todos los servidores están fuera de servicio');
        } else {
            // Intenta con el siguiente servidor
            handler(req, res);
        }
    }
};

function createFormData(body, file) {
    const { licensePlate, color } = body;

    const formData = new FormData();
    formData.append('licensePlate', licensePlate);
    formData.append('color', color);
    const fileBlob = new Blob([file.buffer], {
        type: file.mimetype
    });

    // Attach the Blob to the FormData with the field name 'photo'
    formData.append('photo', fileBlob);
    console.log(fileBlob)
    console.log("=============================")
    console.log(formData)
    console.log("=============================")

    return formData
}


const PORT = process.env.PORT_BALANCER;
app.listen(PORT, () => {
    console.log(`Servidor en funcionamiento en el puerto ${PORT}`);
});